/**
 * commands/config.js
 * ------------------
 * Configure les paramètres du bot pour ce serveur.
 *
 * Affiche un menu interactif (embed + boutons) au lieu de sous-commandes.
 *   • Salon de logs
 *   • Voir la configuration
 *   • Ajouter admin        (propriétaire uniquement)
 *   • Retirer admin         (propriétaire uniquement)
 *   • Liste des admins
 */

const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    MessageFlags,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChannelSelectMenuBuilder,
    ChannelType,
    UserSelectMenuBuilder,
    RoleSelectMenuBuilder,
    StringSelectMenuBuilder,
    EmbedBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    InteractionContextType,
} = require('discord.js');
const { isOwner, hasAccess, denyAccess } = require('../utils/ownerOnly.js');
const { logCommand } = require('../utils/logger.js');
const config  = require('../utils/config.js');
const builder = require('../utils/builder.js');

// ── Auto-delete après 5min d'inactivité ────────────────────────────────────────
const TIMEOUT_MS    = 5 * 60 * 1000; // 5 minutes
const activeTimers  = new Map();     // messageId → { timeout, interaction }

/**
 * Réinitialise le timer d'inactivité pour un message de config.
 * Après 5 min sans interaction, le message est supprimé.
 */
function resetTimer(interaction) {
    const msgId = interaction.message?.id;
    if (!msgId) return;

    const existing = activeTimers.get(msgId);
    if (existing) clearTimeout(existing.timeout);

    const timeout = setTimeout(async () => {
        activeTimers.delete(msgId);
        try {
            const expiredEmbed = new EmbedBuilder()
                .setTitle('⏰ Session expirée')
                .setDescription('Ce panneau de configuration a expiré après 5 minutes d\'inactivité.\nUtilisez `/config` pour en ouvrir un nouveau.')
                .setColor(0x95A5A6);
            await interaction.editReply({ embeds: [expiredEmbed], components: [] }).catch(() => {});
        } catch { /* message déjà supprimé */ }
    }, TIMEOUT_MS);

    activeTimers.set(msgId, { timeout, interaction });
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function mainMenu() {
    const embed = new EmbedBuilder()
        .setTitle('⚙️ Configuration du bot')
        .setDescription('Sélectionnez une action ci-dessous.')
        .setColor(0x5865F2);

    const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('config:role-menu').setLabel('Rôle Réaction').setEmoji('🎭').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('config:logs').setLabel('Salon de logs').setEmoji('📋').setStyle(ButtonStyle.Primary),
    );

    const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('config:admin-menu').setLabel('Admins bot').setEmoji('🔑').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('config:close').setLabel('Fermer').setEmoji('✖️').setStyle(ButtonStyle.Danger),
    );

    return { embeds: [embed], components: [row1, row2] };
}

function backRow() {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('config:back').setLabel('← Retour').setStyle(ButtonStyle.Secondary),
    );
}

const ADMINS_PER_PAGE = 15;

function adminMenu(cfg, page = 0) {
    const users = cfg.adminUsers.map((uid) => `  👤 <@${uid}>`);
    const roles = cfg.adminRoles.map((rid) => `  🎭 <@&${rid}>`);
    const all   = [...users, ...roles];

    const totalPages = Math.max(1, Math.ceil(all.length / ADMINS_PER_PAGE));
    page = Math.max(0, Math.min(page, totalPages - 1));

    let description = 'Gérez les administrateurs du bot sur ce serveur.\n';

    if (all.length === 0) {
        description += '\n*Aucun admin configuré.*\nSeul le **propriétaire du serveur** peut configurer le bot.';
    } else {
        const start      = page * ADMINS_PER_PAGE;
        const pageAdmins = all.slice(start, start + ADMINS_PER_PAGE);
        description += `\n${pageAdmins.join('\n')}\n\n-# + le propriétaire du serveur (toujours)`;
        if (totalPages > 1) description += `\n-# Page ${page + 1}/${totalPages}`;
    }

    const embed = new EmbedBuilder()
        .setTitle('🔑 Admins du bot')
        .setDescription(description)
        .setColor(0x5865F2);

    const noAdmins = cfg.adminUsers.length === 0 && cfg.adminRoles.length === 0;

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('config:admin-add').setLabel('Ajouter').setEmoji('➕').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('config:admin-remove').setLabel('Retirer').setEmoji('➖').setStyle(ButtonStyle.Danger).setDisabled(noAdmins),
        new ButtonBuilder().setCustomId('config:back').setLabel('← Retour').setStyle(ButtonStyle.Secondary),
    );

    const components = [row];

    if (totalPages > 1) {
        components.push(new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`config:admin-page:${page - 1}`).setLabel('◀ Précédent').setStyle(ButtonStyle.Secondary).setDisabled(page === 0),
            new ButtonBuilder().setCustomId(`config:admin-page:${page + 1}`).setLabel('Suivant ▶').setStyle(ButtonStyle.Secondary).setDisabled(page >= totalPages - 1),
        ));
    }

    return { embeds: [embed], components };
}

function adminBackRow() {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('config:admin-back').setLabel('← Retour').setStyle(ButtonStyle.Secondary),
    );
}

const ROLES_PER_PAGE = 8;

function roleMenu(cfg, page = 0) {
    const entries    = cfg.entries;
    const totalPages = Math.max(1, Math.ceil(entries.length / ROLES_PER_PAGE));
    page = Math.max(0, Math.min(page, totalPages - 1));

    let description = 'Gérez le sélecteur de rôles de ce serveur.\n';

    if (entries.length === 0) {
        description += '\n*Aucun rôle configuré.*';
    } else {
        const start       = page * ROLES_PER_PAGE;
        const pageEntries = entries.slice(start, start + ROLES_PER_PAGE);
        const lines = pageEntries.map((e, i) => {
            const emoji = e.emoji ? `${e.emoji} ` : '';
            return `**${start + i + 1}.** ${emoji}**${e.label}** (<@&${e.roleId}>)\n   └ *${e.description}*`;
        });
        description += `\n${lines.join('\n\n')}`;
        if (totalPages > 1) description += `\n\n-# Page ${page + 1}/${totalPages}`;
    }

    const embed = new EmbedBuilder()
        .setTitle(`🎭 Rôle Réaction (${entries.length}/25)`)
        .setDescription(description)
        .setColor(0x5865F2);

    const components = [];

    // Select menu des rôles (seulement s'il y en a)
    if (entries.length > 0) {
        const options = entries.map((e, i) => ({
            label       : `${i + 1}. ${e.label}`.substring(0, 100),
            description : e.description.substring(0, 100),
            value       : e.id,
            emoji       : e.emoji ? { name: e.emoji } : undefined,
        }));

        // Si > 25 options, tronquer (limite Discord)
        components.push(new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('config:role-select')
                .setPlaceholder('Sélectionner un rôle pour le modifier…')
                .addOptions(options.slice(0, 25)),
        ));
    }

    const btnRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('config:role-add').setLabel('Ajouter').setEmoji('➕').setStyle(ButtonStyle.Success).setDisabled(entries.length >= 25),
        new ButtonBuilder().setCustomId('config:role-perso').setLabel('Personnaliser').setEmoji('🎨').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('config:role-deploy').setLabel('Déployer').setEmoji('🚀').setStyle(ButtonStyle.Success).setDisabled(entries.length === 0),
        new ButtonBuilder().setCustomId('config:back').setLabel('← Retour').setStyle(ButtonStyle.Secondary),
    );
    components.push(btnRow);

    if (totalPages > 1) {
        components.push(new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`config:role-page:${page - 1}`).setLabel('◀ Précédent').setStyle(ButtonStyle.Secondary).setDisabled(page === 0),
            new ButtonBuilder().setCustomId(`config:role-page:${page + 1}`).setLabel('Suivant ▶').setStyle(ButtonStyle.Secondary).setDisabled(page >= totalPages - 1),
        ));
    }

    return { embeds: [embed], components };
}

/**
 * Panel d'actions pour un rôle sélectionné.
 * Affiche les détails + boutons : Modifier, Retirer, Monter, Descendre, Retour.
 */
function roleActionPanel(cfg, entryId) {
    const entry = cfg.entries.find((e) => e.id === entryId);
    if (!entry) return roleMenu(cfg);

    const idx = cfg.entries.findIndex((e) => e.id === entryId);

    const embed = new EmbedBuilder()
        .setTitle(`🎭 ${entry.emoji || ''} ${entry.label}`)
        .setDescription(
            `**Rôle :** <@&${entry.roleId}>\n` +
            `**Description :** ${entry.description}\n` +
            `**Emoji :** ${entry.emoji || '*Aucun*'}\n` +
            `**Position :** ${idx + 1}/${cfg.entries.length}\n` +
            `**ID :** \`${entry.id}\``
        )
        .setColor(0x5865F2);

    const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`config:role-action-edit:${entryId}`).setLabel('Modifier').setEmoji('✏️').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId(`config:role-action-remove:${entryId}`).setLabel('Retirer').setEmoji('➖').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId(`config:role-action-up:${entryId}`).setLabel('Monter').setEmoji('⬆️').setStyle(ButtonStyle.Secondary).setDisabled(idx <= 0),
        new ButtonBuilder().setCustomId(`config:role-action-down:${entryId}`).setLabel('Descendre').setEmoji('⬇️').setStyle(ButtonStyle.Secondary).setDisabled(idx >= cfg.entries.length - 1),
        new ButtonBuilder().setCustomId('config:role-back').setLabel('← Retour').setStyle(ButtonStyle.Secondary),
    );

    return { embeds: [embed], components: [row1] };
}

function roleBackRow() {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('config:role-back').setLabel('← Retour').setStyle(ButtonStyle.Secondary),
    );
}

/** Construit le panel « Salon de logs » avec l'état actuel de la config. */
function logsPanel(cfg) {
    const current    = cfg.logChannelId ? `Salon : <#${cfg.logChannelId}>` : 'Aucun salon configuré';
    const rIcon      = cfg.logRoles !== false ? '✅' : '❌';
    const gIcon      = cfg.logRgpd  !== false ? '✅' : '❌';
    const aIcon      = cfg.logAdmin !== false ? '✅' : '❌';
    const vIcon      = cfg.logVisual !== false ? '✅' : '❌';
    const allOn      = cfg.logRoles !== false && cfg.logRgpd !== false && cfg.logAdmin !== false;

    const embed = new EmbedBuilder()
        .setTitle('📋 Salon de logs')
        .setDescription(
            `${current}\n\n` +
            `${rIcon} **Rôle Réaction**\n` +
            `${gIcon} **RGPD**\n` +
            `${aIcon} **Admins Bot**\n` +
            `${vIcon} **Logs visuels** *(ouverture menus, consultations)*\n\n` +
            'Sélectionnez un salon et activez / désactivez chaque catégorie.',
        )
        .setColor(0x5865F2);

    const channelRow = new ActionRowBuilder().addComponents(
        new ChannelSelectMenuBuilder()
            .setCustomId('config:logs-channel')
            .setPlaceholder('Choisir un salon…')
            .setChannelTypes(ChannelType.GuildText),
    );

    const catRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('config:logs-cat-roles')
            .setLabel(`Rôle Réaction : ${rIcon}`)
            .setStyle(cfg.logRoles !== false ? ButtonStyle.Success : ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('config:logs-cat-rgpd')
            .setLabel(`RGPD : ${gIcon}`)
            .setStyle(cfg.logRgpd !== false ? ButtonStyle.Success : ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('config:logs-cat-admin')
            .setLabel(`Admins : ${aIcon}`)
            .setStyle(cfg.logAdmin !== false ? ButtonStyle.Success : ButtonStyle.Secondary),
    );

    const toggleRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('config:logs-visual-toggle')
            .setLabel(`Logs visuels : ${vIcon}`)
            .setStyle(cfg.logVisual !== false ? ButtonStyle.Success : ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('config:logs-toggle-all')
            .setLabel(allOn ? 'Tout désactiver' : 'Tout activer')
            .setEmoji(allOn ? '🚫' : '✅')
            .setStyle(allOn ? ButtonStyle.Danger : ButtonStyle.Success),
    );

    const btnRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('config:back').setLabel('← Retour').setStyle(ButtonStyle.Secondary),
    );

    return { embeds: [embed], components: [channelRow, catRow, toggleRow, btnRow] };
}

// ── Module ─────────────────────────────────────────────────────────────────────

module.exports = {
    data: new SlashCommandBuilder()
        .setName('config')
        .setDescription('Configure les paramètres du bot pour ce serveur.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .setContexts(InteractionContextType.Guild),

    /* ── Commande slash (/config) ──────────────────────────────────────────── */
    async execute(interaction, client) {
        if (!hasAccess(interaction)) {
            await logCommand(client, interaction, 'denied', 'Pas admin du bot', null, false, 'admin');
            return denyAccess(interaction);
        }
        await interaction.reply({ ...mainMenu(), flags: MessageFlags.Ephemeral });
        logCommand(client, interaction, 'success', 'Menu config ouvert', null, true, 'roles').catch(() => {});

        // Démarre le timer d'inactivité (utilise l'interaction initiale pour editReply)
        const reply = await interaction.fetchReply();
        if (reply) {
            activeTimers.set(reply.id, {
                timeout: setTimeout(async () => {
                    activeTimers.delete(reply.id);
                    try {
                        const expiredEmbed = new EmbedBuilder()
                            .setTitle('⏰ Session expirée')
                            .setDescription('Ce panneau de configuration a expiré après 5 minutes d\'inactivité.\nUtilisez `/config` pour en ouvrir un nouveau.')
                            .setColor(0x95A5A6);
                        await interaction.editReply({ embeds: [expiredEmbed], components: [] }).catch(() => {});
                    } catch { /* ignoré */ }
                }, TIMEOUT_MS),
                interaction,
            });
        }
    },

    /* ── Composants (boutons & menus de sélection) ─────────────────────────── */
    async handleComponent(interaction, client) {
        const id      = interaction.customId;
        const guildId = interaction.guildId;

        // Réinitialise le timer d'inactivité
        resetTimer(interaction);

        // ── Fermer le panneau ────────────────────────────────────────────────
        if (id === 'config:close') {
            const msgId = interaction.message?.id;
            if (msgId) {
                const existing = activeTimers.get(msgId);
                if (existing) clearTimeout(existing.timeout);
                activeTimers.delete(msgId);
            }
            const embed = new EmbedBuilder()
                .setTitle('✖️ Panneau fermé')
                .setDescription('Utilisez `/config` pour en ouvrir un nouveau.')
                .setColor(0x95A5A6);
            return interaction.update({ embeds: [embed], components: [] });
        }

        // ── Retour au menu principal ─────────────────────────────────────────
        if (id === 'config:back') {
            return interaction.update(mainMenu());
        }

        // ── Sous-menu Rôle Réaction ─────────────────────────────────────────
        if (id === 'config:role-menu') {
            return interaction.update(roleMenu(config.load(guildId)));
        }

        // ── Sous-menu Admins bot ────────────────────────────────────────────
        if (id === 'config:admin-menu') {
            return interaction.update(adminMenu(config.load(guildId)));
        }

        if (id === 'config:admin-back') {
            return interaction.update(adminMenu(config.load(guildId)));
        }

        if (id === 'config:role-back') {
            return interaction.update(roleMenu(config.load(guildId)));
        }

        // ── Sélection d'un rôle dans le StringSelect ────────────────────────
        if (id === 'config:role-select') {
            const entryId = interaction.values[0];
            return interaction.update(roleActionPanel(config.load(guildId), entryId));
        }

        // ── Action : Modifier (depuis panel action) ─────────────────────────
        if (id.startsWith('config:role-action-edit:')) {
            const entryId = id.slice('config:role-action-edit:'.length);
            const cfg     = config.load(guildId);
            const entry   = cfg.entries.find((e) => e.id === entryId);

            if (!entry) {
                const embed = new EmbedBuilder()
                    .setTitle('❌ Entrée introuvable')
                    .setDescription(`L'entrée \`${entryId}\` n'existe plus.`)
                    .setColor(0xED4245);
                return interaction.update({ embeds: [embed], components: [roleBackRow()] });
            }

            const embed = new EmbedBuilder()
                .setTitle(`✏️ Modifier : ${entry.label}`)
                .setDescription(
                    `**Rôle :** <@&${entry.roleId}>\n` +
                    `**Description :** ${entry.description}\n` +
                    `**Label :** ${entry.label}\n` +
                    `**Emoji :** ${entry.emoji || '*Aucun*'}\n` +
                    `**ID :** \`${entry.id}\`\n\n` +
                    `Changez le rôle ci-dessous ou cliquez sur **Modifier les textes**.`
                )
                .setColor(0x5865F2);

            const roleRow = new ActionRowBuilder().addComponents(
                new RoleSelectMenuBuilder()
                    .setCustomId(`config:role-edit-role:${entryId}`)
                    .setPlaceholder('Changer le rôle…'),
            );

            const btnRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`config:role-edit-texts:${entryId}`)
                    .setLabel('Modifier les textes')
                    .setEmoji('✏️')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('config:role-back')
                    .setLabel('← Retour')
                    .setStyle(ButtonStyle.Secondary),
            );

            return interaction.update({ embeds: [embed], components: [roleRow, btnRow] });
        }

        // ── Action : Retirer (depuis panel action) ──────────────────────────
        if (id.startsWith('config:role-action-remove:')) {
            const entryId = id.slice('config:role-action-remove:'.length);
            const cfg     = config.load(guildId);
            const entry   = cfg.entries.find((e) => e.id === entryId);

            if (!entry) {
                const embed = new EmbedBuilder()
                    .setTitle('❌ Entrée introuvable')
                    .setColor(0xED4245);
                return interaction.update({ embeds: [embed], components: [roleBackRow()] });
            }

            const embed = new EmbedBuilder()
                .setTitle('➖ Confirmer la suppression')
                .setDescription(
                    `Voulez-vous vraiment retirer **${entry.label}** (<@&${entry.roleId}>) du sélecteur ?`
                )
                .setColor(0xED4245);

            const btnRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`config:role-remove-confirm:${entryId}`)
                    .setLabel('Confirmer')
                    .setEmoji('🗑️')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('config:role-back')
                    .setLabel('← Annuler')
                    .setStyle(ButtonStyle.Secondary),
            );

            return interaction.update({ embeds: [embed], components: [btnRow] });
        }

        // ── Action : Monter (depuis panel action) ───────────────────────────
        if (id.startsWith('config:role-action-up:')) {
            const entryId = id.slice('config:role-action-up:'.length);
            const cfg     = config.load(guildId);
            const idx     = cfg.entries.findIndex((e) => e.id === entryId);

            if (idx > 0) {
                [cfg.entries[idx - 1], cfg.entries[idx]] = [cfg.entries[idx], cfg.entries[idx - 1]];
                config.save(guildId, cfg);
            }

            return interaction.update(roleActionPanel(config.load(guildId), entryId));
        }

        // ── Action : Descendre (depuis panel action) ────────────────────────
        if (id.startsWith('config:role-action-down:')) {
            const entryId = id.slice('config:role-action-down:'.length);
            const cfg     = config.load(guildId);
            const idx     = cfg.entries.findIndex((e) => e.id === entryId);

            if (idx !== -1 && idx < cfg.entries.length - 1) {
                [cfg.entries[idx], cfg.entries[idx + 1]] = [cfg.entries[idx + 1], cfg.entries[idx]];
                config.save(guildId, cfg);
            }

            return interaction.update(roleActionPanel(config.load(guildId), entryId));
        }

        // ── Pagination rôles ────────────────────────────────────────────────
        if (id.startsWith('config:role-page:')) {
            const page = parseInt(id.split(':')[2], 10);
            return interaction.update(roleMenu(config.load(guildId), page));
        }

        // ── Pagination admins ───────────────────────────────────────────────
        if (id.startsWith('config:admin-page:')) {
            const page = parseInt(id.split(':')[2], 10);
            return interaction.update(adminMenu(config.load(guildId), page));
        }

        // ══════════════════════════════════════════════════════════════════════
        //  RÔLE RÉACTION
        // ══════════════════════════════════════════════════════════════════════

        // ── Ajouter : panel avec RoleSelectMenu ─────────────────────────────
        if (id === 'config:role-add') {
            const cfg = config.load(guildId);
            if (cfg.entries.length >= 25) {
                const embed = new EmbedBuilder()
                    .setTitle('❌ Limite atteinte')
                    .setDescription('Maximum **25 rôles** par sélecteur.')
                    .setColor(0xED4245);
                return interaction.update({ embeds: [embed], components: [roleBackRow()] });
            }

            const embed = new EmbedBuilder()
                .setTitle('➕ Ajouter un rôle')
                .setDescription('Sélectionnez le rôle à ajouter au sélecteur.')
                .setColor(0x57F287);

            const roleRow = new ActionRowBuilder().addComponents(
                new RoleSelectMenuBuilder().setCustomId('config:role-add-select').setPlaceholder('Choisir un rôle…'),
            );

            return interaction.update({ embeds: [embed], components: [roleRow, roleBackRow()] });
        }

        // ── Ajouter : rôle sélectionné → ouvre Modal ────────────────────────
        if (id === 'config:role-add-select') {
            const roleId = interaction.values[0];
            const cfg    = config.load(guildId);

            if (cfg.entries.some((e) => e.roleId === roleId)) {
                const embed = new EmbedBuilder()
                    .setTitle('⚠️ Rôle déjà présent')
                    .setDescription(`<@&${roleId}> est déjà dans le sélecteur.`)
                    .setColor(0xFEE75C);
                return interaction.update({ embeds: [embed], components: [roleBackRow()] });
            }

            const role     = interaction.guild.roles.cache.get(roleId);
            const roleName = role ? role.name : 'Rôle';

            const modal = new ModalBuilder()
                .setCustomId(`config:role-add-modal:${roleId}`)
                .setTitle('Ajouter un rôle')
                .addComponents(
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('description')
                            .setLabel('Description (texte au-dessus du bouton)')
                            .setStyle(TextInputStyle.Short)
                            .setRequired(true)
                            .setMaxLength(200),
                    ),
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('label')
                            .setLabel('Texte du bouton (défaut : nom du rôle)')
                            .setStyle(TextInputStyle.Short)
                            .setRequired(false)
                            .setMaxLength(80)
                            .setValue(roleName),
                    ),
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('emoji')
                            .setLabel('Emoji (optionnel)')
                            .setStyle(TextInputStyle.Short)
                            .setRequired(false)
                            .setMaxLength(50),
                    ),
                );

            return interaction.showModal(modal);
        }

        // ── Modifier : changer le rôle ──────────────────────────────────────
        if (id.startsWith('config:role-edit-role:')) {
            const entryId   = id.slice('config:role-edit-role:'.length);
            const newRoleId = interaction.values[0];
            const cfg       = config.load(guildId);
            const entry     = cfg.entries.find((e) => e.id === entryId);

            if (!entry) {
                const embed = new EmbedBuilder()
                    .setTitle('❌ Entrée introuvable')
                    .setColor(0xED4245);
                return interaction.update({ embeds: [embed], components: [roleBackRow()] });
            }

            if (newRoleId !== entry.roleId && cfg.entries.some((e) => e.roleId === newRoleId)) {
                const embed = new EmbedBuilder()
                    .setTitle('⚠️ Rôle déjà utilisé')
                    .setDescription(`<@&${newRoleId}> est déjà utilisé par une autre entrée.`)
                    .setColor(0xFEE75C);
                return interaction.update({ embeds: [embed], components: [roleBackRow()] });
            }

            entry.roleId = newRoleId;
            config.save(guildId, cfg);

            const embed = new EmbedBuilder()
                .setTitle('✅ Rôle mis à jour')
                .setDescription(`L'entrée **${entry.label}** utilise maintenant <@&${newRoleId}>.`)
                .setColor(0x57F287);

            logCommand(client, interaction, 'success', `Rôle modifié [${entryId}] → ${newRoleId}`, '/config rôle modifier', false, 'roles').catch(() => {});
            return interaction.update({ embeds: [embed], components: [roleBackRow()] });
        }

        // ── Modifier : ouvre le Modal textes ────────────────────────────────
        if (id.startsWith('config:role-edit-texts:')) {
            const entryId = id.slice('config:role-edit-texts:'.length);
            const cfg     = config.load(guildId);
            const entry   = cfg.entries.find((e) => e.id === entryId);

            if (!entry) {
                return interaction.reply({ content: '❌ Entrée introuvable.', flags: MessageFlags.Ephemeral });
            }

            const modal = new ModalBuilder()
                .setCustomId(`config:role-edit-modal:${entryId}`)
                .setTitle('Modifier les textes')
                .addComponents(
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('description')
                            .setLabel('Description')
                            .setStyle(TextInputStyle.Short)
                            .setRequired(true)
                            .setMaxLength(200)
                            .setValue(entry.description),
                    ),
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('label')
                            .setLabel('Texte du bouton')
                            .setStyle(TextInputStyle.Short)
                            .setRequired(true)
                            .setMaxLength(80)
                            .setValue(entry.label),
                    ),
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('emoji')
                            .setLabel('Emoji (vide pour retirer)')
                            .setStyle(TextInputStyle.Short)
                            .setRequired(false)
                            .setMaxLength(50)
                            .setValue(entry.emoji || ''),
                    ),
                );

            return interaction.showModal(modal);
        }

        // ── Retirer : confirmer ─────────────────────────────────────────────
        if (id.startsWith('config:role-remove-confirm:')) {
            const entryId = id.slice('config:role-remove-confirm:'.length);
            const cfg     = config.load(guildId);
            const index   = cfg.entries.findIndex((e) => e.id === entryId);

            if (index === -1) {
                const embed = new EmbedBuilder()
                    .setTitle('❌ Entrée introuvable')
                    .setColor(0xED4245);
                return interaction.update({ embeds: [embed], components: [roleBackRow()] });
            }

            const removed = cfg.entries.splice(index, 1)[0];
            config.save(guildId, cfg);

            const embed = new EmbedBuilder()
                .setTitle('✅ Rôle retiré')
                .setDescription(`**${removed.label}** a été retiré du sélecteur.`)
                .setColor(0x57F287);

            logCommand(client, interaction, 'success', `Rôle retiré : ${removed.label} [${entryId}]`, '/config rôle retirer', false, 'roles').catch(() => {});
            return interaction.update({ embeds: [embed], components: [roleBackRow()] });
        }

        // ── Personnaliser : panel ───────────────────────────────────────────
        if (id === 'config:role-perso') {
            const cfg = config.load(guildId);

            const layoutLabels = { column: '📐 Colonne', row: '📏 Ligne', section: '📑 Section' };
            const current  = layoutLabels[cfg.layout] || layoutLabels.column;
            const dividers = cfg.dividers !== false;
            const divIcon  = dividers ? '✅' : '❌';

            const embed = new EmbedBuilder()
                .setTitle('🎨 Personnaliser le message')
                .setDescription(
                    `**Disposition actuelle :** ${current}\n` +
                    `**Séparateurs :** ${divIcon} ${dividers ? 'Activés' : 'Désactivés'}\n` +
                    `**Titre :** ${cfg.title}\n` +
                    `**Footer :** ${cfg.footer}\n` +
                    `**Couleur :** \`${cfg.accentColor !== null ? '#' + cfg.accentColor.toString(16).padStart(6, '0').toUpperCase() : 'Aucune'}\`\n\n` +
                    'Changez la disposition ci-dessous ou modifiez les textes.',
                )
                .setColor(0x5865F2);

            const layoutRow = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('config:role-perso-layout')
                    .setPlaceholder('Choisir une disposition…')
                    .addOptions(
                        { label: 'Colonne', description: 'Un bouton par ligne avec sa description (défaut)', value: 'column', emoji: '📐', default: (cfg.layout || 'column') === 'column' },
                        { label: 'Ligne', description: 'Boutons groupés par lignes de 5, descriptions au-dessus', value: 'row', emoji: '📏', default: cfg.layout === 'row' },
                        { label: 'Section', description: 'Description et bouton côte à côte', value: 'section', emoji: '📑', default: cfg.layout === 'section' },
                    ),
            );

            const toggleRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('config:role-perso-dividers')
                    .setLabel(`Séparateurs : ${divIcon}`)
                    .setStyle(dividers ? ButtonStyle.Success : ButtonStyle.Secondary),
            );

            const btnRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('config:role-perso-texts').setLabel('Modifier les textes').setEmoji('✏️').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('config:role-back').setLabel('← Retour').setStyle(ButtonStyle.Secondary),
            );

            return interaction.update({ embeds: [embed], components: [layoutRow, toggleRow, btnRow] });
        }

        // ── Personnaliser : changement de disposition ───────────────────────
        if (id === 'config:role-perso-layout') {
            const layout = interaction.values[0];
            const cfg    = config.load(guildId);

            cfg.layout = layout;
            config.save(guildId, cfg);

            // Auto-mise à jour du message déployé
            if (cfg.messageId && cfg.channelId) {
                try {
                    const ch  = await interaction.guild.channels.fetch(cfg.channelId);
                    const msg = await ch.messages.fetch(cfg.messageId);
                    await msg.edit(builder.buildMessage(cfg));
                } catch { /* silencieux */ }
            }

            const layoutLabels = { column: '📐 Colonne', row: '📏 Ligne', section: '📑 Section' };

            const embed = new EmbedBuilder()
                .setTitle('✅ Disposition mise à jour')
                .setDescription(`Le sélecteur utilisera maintenant la disposition **${layoutLabels[layout]}**.`)
                .setColor(0x57F287);

            logCommand(client, interaction, 'success', `Disposition → ${layout}`, '/config rôle personnaliser', false, 'roles').catch(() => {});
            return interaction.update({ embeds: [embed], components: [roleBackRow()] });
        }

        // ── Personnaliser : toggle séparateurs ──────────────────────────────
        if (id === 'config:role-perso-dividers') {
            const cfg = config.load(guildId);
            cfg.dividers = cfg.dividers === false; // toggle
            config.save(guildId, cfg);

            // Auto-mise à jour du message déployé
            if (cfg.messageId && cfg.channelId) {
                try {
                    const ch  = await interaction.guild.channels.fetch(cfg.channelId);
                    const msg = await ch.messages.fetch(cfg.messageId);
                    await msg.edit(builder.buildMessage(cfg));
                } catch { /* silencieux */ }
            }

            const stateLabel = cfg.dividers ? 'activés' : 'désactivés';
            logCommand(client, interaction, 'success', `Séparateurs ${stateLabel}`, '/config rôle personnaliser', false, 'roles').catch(() => {});

            // Revient au panel perso pour voir le changement
            // On simule un retour au panel en ré-affichant le même panel
            const layoutLabels = { column: '📐 Colonne', row: '📏 Ligne', section: '📑 Section' };
            const current  = layoutLabels[cfg.layout] || layoutLabels.column;
            const dividers = cfg.dividers !== false;
            const divIcon  = dividers ? '✅' : '❌';

            const embed = new EmbedBuilder()
                .setTitle('🎨 Personnaliser le message')
                .setDescription(
                    `**Disposition actuelle :** ${current}\n` +
                    `**Séparateurs :** ${divIcon} ${dividers ? 'Activés' : 'Désactivés'}\n` +
                    `**Titre :** ${cfg.title}\n` +
                    `**Footer :** ${cfg.footer}\n` +
                    `**Couleur :** \`${cfg.accentColor !== null ? '#' + cfg.accentColor.toString(16).padStart(6, '0').toUpperCase() : 'Aucune'}\`\n\n` +
                    'Changez la disposition ci-dessous ou modifiez les textes.',
                )
                .setColor(0x5865F2);

            const layoutRow = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('config:role-perso-layout')
                    .setPlaceholder('Choisir une disposition…')
                    .addOptions(
                        { label: 'Colonne', description: 'Un bouton par ligne avec sa description (défaut)', value: 'column', emoji: '📐', default: (cfg.layout || 'column') === 'column' },
                        { label: 'Ligne', description: 'Boutons groupés par lignes de 5, descriptions au-dessus', value: 'row', emoji: '📏', default: cfg.layout === 'row' },
                        { label: 'Section', description: 'Description et bouton côte à côte', value: 'section', emoji: '📑', default: cfg.layout === 'section' },
                    ),
            );

            const toggleRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('config:role-perso-dividers')
                    .setLabel(`Séparateurs : ${divIcon}`)
                    .setStyle(dividers ? ButtonStyle.Success : ButtonStyle.Secondary),
            );

            const btnRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('config:role-perso-texts').setLabel('Modifier les textes').setEmoji('✏️').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('config:role-back').setLabel('← Retour').setStyle(ButtonStyle.Secondary),
            );

            return interaction.update({ embeds: [embed], components: [layoutRow, toggleRow, btnRow] });
        }

        // ── Personnaliser : ouvre le Modal textes ───────────────────────────
        if (id === 'config:role-perso-texts') {
            const cfg = config.load(guildId);

            const modal = new ModalBuilder()
                .setCustomId('config:role-perso-modal')
                .setTitle('Personnaliser le message')
                .addComponents(
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('titre')
                            .setLabel('Titre du message')
                            .setStyle(TextInputStyle.Short)
                            .setRequired(false)
                            .setMaxLength(200)
                            .setValue(cfg.title),
                    ),
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('footer')
                            .setLabel('Footer du message')
                            .setStyle(TextInputStyle.Short)
                            .setRequired(false)
                            .setMaxLength(200)
                            .setValue(cfg.footer),
                    ),
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('couleur')
                            .setLabel('Couleur hex (ex: #FF5733) ou "aucune"')
                            .setStyle(TextInputStyle.Short)
                            .setRequired(false)
                            .setMaxLength(20)
                            .setValue(cfg.accentColor ? `#${cfg.accentColor.toString(16).padStart(6, '0').toUpperCase()}` : ''),
                    ),
                );

            return interaction.showModal(modal);
        }

        // ── Déployer : panel ────────────────────────────────────────────────
        if (id === 'config:role-deploy') {
            const cfg        = config.load(guildId);
            const hasMessage = cfg.messageId && cfg.channelId;
            const status     = hasMessage ? `Message déployé dans <#${cfg.channelId}>` : 'Aucun message déployé';

            const embed = new EmbedBuilder()
                .setTitle('🚀 Déployer le sélecteur')
                .setDescription(`${status}\n\nSélectionnez un salon pour déployer ou redéployer le message.`)
                .setColor(0x5865F2);

            const channelRow = new ActionRowBuilder().addComponents(
                new ChannelSelectMenuBuilder()
                    .setCustomId('config:role-deploy-channel')
                    .setPlaceholder('Choisir un salon…')
                    .setChannelTypes(ChannelType.GuildText),
            );

            const btnComponents = [];
            if (hasMessage) {
                btnComponents.push(
                    new ButtonBuilder()
                        .setCustomId('config:role-deploy-update')
                        .setLabel('Mettre à jour')
                        .setEmoji('🔄')
                        .setStyle(ButtonStyle.Primary),
                );
            }
            btnComponents.push(
                new ButtonBuilder()
                    .setCustomId('config:role-back')
                    .setLabel('← Retour')
                    .setStyle(ButtonStyle.Secondary),
            );

            const btnRow = new ActionRowBuilder().addComponents(...btnComponents);

            return interaction.update({ embeds: [embed], components: [channelRow, btnRow] });
        }

        // ── Déployer : salon sélectionné ────────────────────────────────────
        if (id === 'config:role-deploy-channel') {
            await interaction.deferUpdate();
            const channelId = interaction.values[0];
            const cfg       = config.load(guildId);
            const payload   = builder.buildMessage(cfg);

            try {
                const channel = await interaction.guild.channels.fetch(channelId);
                const msg     = await channel.send(payload);

                if (cfg.messageId && cfg.channelId && cfg.channelId !== channelId) {
                    try {
                        const oldChannel = await interaction.guild.channels.fetch(cfg.channelId);
                        const oldMsg     = await oldChannel.messages.fetch(cfg.messageId);
                        await oldMsg.delete();
                    } catch { /* déjà supprimé */ }
                }

                cfg.messageId = msg.id;
                cfg.channelId = channelId;
                config.save(guildId, cfg);

                const embed = new EmbedBuilder()
                    .setTitle('✅ Message déployé')
                    .setDescription(`Le sélecteur a été déployé dans <#${channelId}>.`)
                    .setColor(0x57F287);

                await logCommand(client, interaction, 'success', `Déployé dans <#${channelId}>`, '/config rôle déployer', false, 'roles');
                return interaction.editReply({ embeds: [embed], components: [roleBackRow()] });
            } catch (err) {
                const embed = new EmbedBuilder()
                    .setTitle('❌ Erreur de déploiement')
                    .setDescription(`\`${err.message}\`\nVérifiez les permissions du bot.`)
                    .setColor(0xED4245);

                await logCommand(client, interaction, 'error', err.message, '/config rôle déployer', false, 'roles');
                return interaction.editReply({ embeds: [embed], components: [roleBackRow()] });
            }
        }

        // ── Déployer : mettre à jour le message existant ────────────────────
        if (id === 'config:role-deploy-update') {
            await interaction.deferUpdate();
            const cfg = config.load(guildId);

            if (!cfg.messageId || !cfg.channelId) {
                const embed = new EmbedBuilder()
                    .setTitle('❌ Aucun message existant')
                    .setDescription('Déployez d\'abord le message dans un salon.')
                    .setColor(0xED4245);
                return interaction.editReply({ embeds: [embed], components: [roleBackRow()] });
            }

            try {
                const channel = await interaction.guild.channels.fetch(cfg.channelId);
                const msg     = await channel.messages.fetch(cfg.messageId);
                await msg.edit(builder.buildMessage(cfg));

                const embed = new EmbedBuilder()
                    .setTitle('✅ Message mis à jour')
                    .setDescription(`Le sélecteur dans <#${cfg.channelId}> a été mis à jour.`)
                    .setColor(0x57F287);

                await logCommand(client, interaction, 'success', `Mis à jour dans <#${cfg.channelId}>`, '/config rôle déployer', false, 'roles');
                return interaction.editReply({ embeds: [embed], components: [roleBackRow()] });
            } catch (err) {
                const embed = new EmbedBuilder()
                    .setTitle('❌ Erreur de mise à jour')
                    .setDescription(`\`${err.message}\`\nRedéployez dans un salon.`)
                    .setColor(0xED4245);

                await logCommand(client, interaction, 'error', err.message, '/config rôle déployer', false, 'roles');
                return interaction.editReply({ embeds: [embed], components: [roleBackRow()] });
            }
        }

        // ── Salon de logs : panel de sélection ──────────────────────────────
        if (id === 'config:logs') {
            return interaction.update(logsPanel(config.load(guildId)));
        }

        // ── Salon de logs : salon sélectionné ───────────────────────────────
        if (id === 'config:logs-channel') {
            const channelId = interaction.values[0];
            const cfg       = config.load(guildId);
            cfg.logChannelId = channelId;
            config.save(guildId, cfg);

            const embed = new EmbedBuilder()
                .setTitle('✅ Salon de logs mis à jour')
                .setDescription(`Les logs seront envoyés dans <#${channelId}>.`)
                .setColor(0x57F287);

            await logCommand(client, interaction, 'success', `Salon de logs défini : <#${channelId}>`, '/config logs');
            return interaction.update({ embeds: [embed], components: [backRow()] });
        }

        // ── Logs : toggle catégorie (roles / rgpd / admin) ──────────────────
        if (id === 'config:logs-cat-roles' || id === 'config:logs-cat-rgpd' || id === 'config:logs-cat-admin') {
            const cfg = config.load(guildId);
            const catMap = {
                'config:logs-cat-roles': 'logRoles',
                'config:logs-cat-rgpd' : 'logRgpd',
                'config:logs-cat-admin': 'logAdmin',
            };
            const key   = catMap[id];
            cfg[key]    = cfg[key] === false; // toggle
            config.save(guildId, cfg);

            const labels    = { logRoles: 'Rôle Réaction', logRgpd: 'RGPD', logAdmin: 'Admins' };
            const stateLabel = cfg[key] ? 'activés' : 'désactivés';
            await logCommand(client, interaction, 'success', `Logs ${labels[key]} ${stateLabel}`, '/config logs');
            return interaction.update(logsPanel(cfg));
        }

        // ── Logs : tout activer / tout désactiver ────────────────────────────
        if (id === 'config:logs-toggle-all') {
            const cfg   = config.load(guildId);
            const allOn = cfg.logRoles !== false && cfg.logRgpd !== false && cfg.logAdmin !== false;
            const val   = !allOn;
            cfg.logRoles = val;
            cfg.logRgpd  = val;
            cfg.logAdmin = val;
            config.save(guildId, cfg);

            const stateLabel = val ? 'activés' : 'désactivés';
            await logCommand(client, interaction, 'success', `Tous les logs ${stateLabel}`, '/config logs');
            return interaction.update(logsPanel(cfg));
        }

        // ── Logs visuels : toggle on/off ─────────────────────────────────────
        if (id === 'config:logs-visual-toggle') {
            const cfg = config.load(guildId);
            cfg.logVisual = cfg.logVisual === false; // toggle
            config.save(guildId, cfg);

            const stateLabel = cfg.logVisual ? 'activés' : 'désactivés';
            await logCommand(client, interaction, 'success', `Logs visuels ${stateLabel}`, '/config logs');
            return interaction.update(logsPanel(cfg));
        }

        // ── Ajouter admin : panel (propriétaire uniquement) ─────────────────
        if (id === 'config:admin-add') {
            if (!isOwner(interaction)) {
                return interaction.reply({
                    content: '🔒 Seul le **propriétaire du serveur** peut gérer les admins du bot.',
                    flags: MessageFlags.Ephemeral,
                });
            }

            const embed = new EmbedBuilder()
                .setTitle('➕ Ajouter un admin')
                .setDescription('Sélectionnez un utilisateur ou un rôle à ajouter aux admins du bot.')
                .setColor(0x57F287);

            const userRow = new ActionRowBuilder().addComponents(
                new UserSelectMenuBuilder().setCustomId('config:admin-add-user').setPlaceholder('Choisir un utilisateur…'),
            );
            const roleRow = new ActionRowBuilder().addComponents(
                new RoleSelectMenuBuilder().setCustomId('config:admin-add-role').setPlaceholder('Choisir un rôle…'),
            );

            return interaction.update({ embeds: [embed], components: [userRow, roleRow, adminBackRow()] });
        }

        // ── Ajouter admin : utilisateur sélectionné ─────────────────────────
        if (id === 'config:admin-add-user') {
            if (!isOwner(interaction)) {
                return interaction.reply({ content: '🔒 Réservé au propriétaire du serveur.', flags: MessageFlags.Ephemeral });
            }

            const userId = interaction.values[0];
            const cfg    = config.load(guildId);

            if (cfg.adminUsers.includes(userId)) {
                const embed = new EmbedBuilder()
                    .setTitle('⚠️ Déjà admin')
                    .setDescription(`<@${userId}> est déjà admin du bot.`)
                    .setColor(0xFEE75C);
                return interaction.update({ embeds: [embed], components: [adminBackRow()] });
            }

            cfg.adminUsers.push(userId);
            config.save(guildId, cfg);

            const embed = new EmbedBuilder()
                .setTitle('✅ Admin ajouté')
                .setDescription(`👤 <@${userId}> a été ajouté aux admins du bot.`)
                .setColor(0x57F287);

            await logCommand(client, interaction, 'success', `Admin ajouté : utilisateur ${userId}`, '/config admin-ajouter', false, 'admin');
            return interaction.update({ embeds: [embed], components: [adminBackRow()] });
        }

        // ── Ajouter admin : rôle sélectionné ────────────────────────────────
        if (id === 'config:admin-add-role') {
            if (!isOwner(interaction)) {
                return interaction.reply({ content: '🔒 Réservé au propriétaire du serveur.', flags: MessageFlags.Ephemeral });
            }

            const roleId = interaction.values[0];
            const cfg    = config.load(guildId);

            if (cfg.adminRoles.includes(roleId)) {
                const embed = new EmbedBuilder()
                    .setTitle('⚠️ Déjà admin')
                    .setDescription(`<@&${roleId}> est déjà admin du bot.`)
                    .setColor(0xFEE75C);
                return interaction.update({ embeds: [embed], components: [adminBackRow()] });
            }

            cfg.adminRoles.push(roleId);
            config.save(guildId, cfg);

            const embed = new EmbedBuilder()
                .setTitle('✅ Admin ajouté')
                .setDescription(`🎭 <@&${roleId}> a été ajouté aux admins du bot.`)
                .setColor(0x57F287);

            await logCommand(client, interaction, 'success', `Admin ajouté : rôle ${roleId}`, '/config admin-ajouter', false, 'admin');
            return interaction.update({ embeds: [embed], components: [adminBackRow()] });
        }

        // ── Retirer admin : panel (propriétaire uniquement) ─────────────────
        if (id === 'config:admin-remove') {
            if (!isOwner(interaction)) {
                return interaction.reply({
                    content: '🔒 Seul le **propriétaire du serveur** peut gérer les admins du bot.',
                    flags: MessageFlags.Ephemeral,
                });
            }

            const cfg     = config.load(guildId);
            const options = [];

            for (const uid of cfg.adminUsers) {
                const member = interaction.guild.members.cache.get(uid);
                options.push({
                    label : member ? member.user.tag : `Utilisateur (${uid})`,
                    value : `user:${uid}`,
                    emoji : '👤',
                });
            }

            for (const rid of cfg.adminRoles) {
                const role = interaction.guild.roles.cache.get(rid);
                options.push({
                    label : role ? role.name : `Rôle (${rid})`,
                    value : `role:${rid}`,
                    emoji : '🎭',
                });
            }

            if (options.length === 0) {
                const embed = new EmbedBuilder()
                    .setTitle('➖ Retirer un admin')
                    .setDescription('Aucun admin configuré. Il n\'y a rien à retirer.')
                    .setColor(0xFEE75C);
                return interaction.update({ embeds: [embed], components: [adminBackRow()] });
            }

            const embed = new EmbedBuilder()
                .setTitle('➖ Retirer un admin')
                .setDescription('Sélectionnez l\'admin à retirer.')
                .setColor(0xED4245);

            const selectRow = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('config:admin-remove-select')
                    .setPlaceholder('Choisir un admin à retirer…')
                    .addOptions(options),
            );

            return interaction.update({ embeds: [embed], components: [selectRow, adminBackRow()] });
        }

        // ── Retirer admin : sélection effectuée ─────────────────────────────
        if (id === 'config:admin-remove-select') {
            if (!isOwner(interaction)) {
                return interaction.reply({ content: '🔒 Réservé au propriétaire du serveur.', flags: MessageFlags.Ephemeral });
            }

            const [type, targetId] = interaction.values[0].split(':');
            const cfg = config.load(guildId);
            let description;

            if (type === 'user') {
                const idx = cfg.adminUsers.indexOf(targetId);
                if (idx !== -1) cfg.adminUsers.splice(idx, 1);
                description = `👤 <@${targetId}> a été retiré des admins du bot.`;
            } else {
                const idx = cfg.adminRoles.indexOf(targetId);
                if (idx !== -1) cfg.adminRoles.splice(idx, 1);
                description = `🎭 <@&${targetId}> a été retiré des admins du bot.`;
            }

            config.save(guildId, cfg);

            const embed = new EmbedBuilder()
                .setTitle('✅ Admin retiré')
                .setDescription(description)
                .setColor(0x57F287);

            await logCommand(client, interaction, 'success', `Admin retiré : ${type}:${targetId}`, '/config admin-retirer', false, 'admin');
            return interaction.update({ embeds: [embed], components: [adminBackRow()] });
        }
    },

    /* ── Modals ─────────────────────────────────────────────────────────────── */
    async handleModal(interaction, client) {
        const id      = interaction.customId;
        const guildId = interaction.guildId;

        // Réinitialise le timer (interaction.message existe si le modal vient d'un composant)
        if (interaction.message) resetTimer(interaction);

        // ── Ajouter un rôle : Modal soumis ──────────────────────────────────
        if (id.startsWith('config:role-add-modal:')) {
            const roleId      = id.slice('config:role-add-modal:'.length);
            const description = interaction.fields.getTextInputValue('description');
            const label       = interaction.fields.getTextInputValue('label') || null;
            const emoji       = interaction.fields.getTextInputValue('emoji') || null;

            const cfg  = config.load(guildId);
            const role = interaction.guild.roles.cache.get(roleId);
            const finalLabel = label || (role ? role.name : 'Rôle');

            if (cfg.entries.some((e) => e.roleId === roleId)) {
                await interaction.deferUpdate();
                const embed = new EmbedBuilder()
                    .setTitle('⚠️ Rôle déjà présent')
                    .setDescription(`<@&${roleId}> est déjà dans le sélecteur.`)
                    .setColor(0xFEE75C);
                return interaction.editReply({ embeds: [embed], components: [roleBackRow()] });
            }

            const entryId = config.generateId();
            cfg.entries.push({ id: entryId, roleId, label: finalLabel, description, emoji });
            config.save(guildId, cfg);

            const embed = new EmbedBuilder()
                .setTitle('✅ Rôle ajouté')
                .setDescription(
                    `**${finalLabel}** (<@&${roleId}>) a été ajouté au sélecteur.\nID : \`${entryId}\``
                )
                .setColor(0x57F287);

            await interaction.deferUpdate();
            logCommand(client, interaction, 'success', `Rôle ajouté : ${finalLabel} (${roleId}) [${entryId}]`, '/config rôle ajouter', false, 'roles').catch(() => {});
            return interaction.editReply({ embeds: [embed], components: [roleBackRow()] });
        }

        // ── Modifier les textes : Modal soumis ──────────────────────────────
        if (id.startsWith('config:role-edit-modal:')) {
            const entryId     = id.slice('config:role-edit-modal:'.length);
            const description = interaction.fields.getTextInputValue('description');
            const label       = interaction.fields.getTextInputValue('label');
            const emoji       = interaction.fields.getTextInputValue('emoji') || null;

            const cfg   = config.load(guildId);
            const entry = cfg.entries.find((e) => e.id === entryId);

            await interaction.deferUpdate();

            if (!entry) {
                const embed = new EmbedBuilder()
                    .setTitle('❌ Entrée introuvable')
                    .setColor(0xED4245);
                return interaction.editReply({ embeds: [embed], components: [roleBackRow()] });
            }

            const changes = [];
            if (description && description !== entry.description) {
                entry.description = description;
                changes.push(`description → ${description}`);
            }
            if (label && label !== entry.label) {
                entry.label = label;
                changes.push(`label → ${label}`);
            }
            if (emoji !== entry.emoji) {
                entry.emoji = emoji;
                changes.push(`emoji → ${emoji || '*(retiré)*'}`);
            }

            if (changes.length === 0) {
                const embed = new EmbedBuilder()
                    .setTitle('ℹ️ Aucune modification')
                    .setDescription('Les valeurs sont identiques.')
                    .setColor(0x5865F2);
                return interaction.editReply({ embeds: [embed], components: [roleBackRow()] });
            }

            config.save(guildId, cfg);

            const embed = new EmbedBuilder()
                .setTitle('✅ Textes mis à jour')
                .setDescription(
                    `Entrée **${entry.label}** modifiée :\n` +
                    changes.map((c) => `  • ${c}`).join('\n')
                )
                .setColor(0x57F287);

            logCommand(client, interaction, 'success', `Textes modifiés [${entryId}] : ${changes.join(', ')}`, '/config rôle modifier', false, 'roles').catch(() => {});
            return interaction.editReply({ embeds: [embed], components: [roleBackRow()] });
        }

        // ── Personnaliser : Modal soumis ─────────────────────────────────────
        if (id === 'config:role-perso-modal') {
            const titre   = interaction.fields.getTextInputValue('titre');
            const footer  = interaction.fields.getTextInputValue('footer');
            const couleur = interaction.fields.getTextInputValue('couleur');

            const cfg     = config.load(guildId);
            const changes = [];

            if (titre && titre !== cfg.title) {
                cfg.title = titre;
                changes.push('Titre mis à jour.');
            }
            if (footer && footer !== cfg.footer) {
                cfg.footer = footer;
                changes.push('Footer mis à jour.');
            }

            if (couleur) {
                if (couleur.toLowerCase() === 'aucune') {
                    if (cfg.accentColor !== null) {
                        cfg.accentColor = null;
                        changes.push('Couleur retirée.');
                    }
                } else {
                    const hex = couleur.replace('#', '');
                    if (!/^[0-9A-Fa-f]{6}$/.test(hex)) {
                        await interaction.deferUpdate();
                        const embed = new EmbedBuilder()
                            .setTitle('❌ Couleur invalide')
                            .setDescription(`Format invalide : \`${couleur}\`. Utilisez un code hex comme \`#FF5733\`.`)
                            .setColor(0xED4245);
                        return interaction.editReply({ embeds: [embed], components: [roleBackRow()] });
                    }
                    const value = parseInt(hex, 16);
                    if (value !== cfg.accentColor) {
                        cfg.accentColor = value;
                        changes.push(`Couleur mise à jour : \`#${hex.toUpperCase()}\`.`);
                    }
                }
            }

            await interaction.deferUpdate();

            if (changes.length === 0) {
                const embed = new EmbedBuilder()
                    .setTitle('ℹ️ Aucune modification')
                    .setDescription('Les valeurs sont identiques.')
                    .setColor(0x5865F2);
                return interaction.editReply({ embeds: [embed], components: [roleBackRow()] });
            }

            config.save(guildId, cfg);

            const embed = new EmbedBuilder()
                .setTitle('✅ Apparence mise à jour')
                .setDescription(changes.join('\n'))
                .setColor(0x57F287);

            logCommand(client, interaction, 'success', changes.join(' | '), '/config rôle personnaliser', false, 'roles').catch(() => {});
            return interaction.editReply({ embeds: [embed], components: [roleBackRow()] });
        }
    },
};
