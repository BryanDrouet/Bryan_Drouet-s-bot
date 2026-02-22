/**
 * index.js
 * --------
 * Point d'entrée principal du bot.
 */

require('dotenv').config();

const { Client, GatewayIntentBits, Collection, EmbedBuilder, MessageFlags } = require('discord.js');
const fs         = require('fs');
const path       = require('path');
const config     = require('./utils/config.js');
const { logCommand } = require('./utils/logger.js');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// ── Chargement dynamique des commandes ────────────────────────────────────────

client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter((f) => f.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    if (!command.data || !command.execute) {
        console.warn(`[⚠️] La commande ${file} est malformée et sera ignorée.`);
        continue;
    }
    client.commands.set(command.data.name, command);
    console.log(`[✅] Commande chargée : /${command.data.name}`);
}

// ── Événements ────────────────────────────────────────────────────────────────

const updateActivity = () => {
    const getActivities = () => [
        `Gestion de serveurs`,
        `${client.guilds.cache.size} serveur(s)`,
        `${client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0)} utilisateur(s)`,
        `En ligne depuis ${Math.floor(process.uptime() / 60)} minute(s)`,
        `Besoin d'aide ? Utilisez /help`,
        `Surveille ${client.guilds.cache.size} communauté(s)`
    ];

    let i = 0;
    setInterval(() => {
        const activities = getActivities();
        client.user.setActivity(activities[i % activities.length]);
        i++;
    }, 10000); // Change activity every 10 seconds
};

client.on('guildCreate', () => {
    updateActivity(); // Update activities when the bot joins a new server
});

client.once('clientReady', async () => {
    console.log(`\n🤖 Bot connecté : ${client.user.tag}`);
    console.log(`📡 Présent sur ${client.guilds.cache.size} serveur(s) :`);
    client.guilds.cache.forEach((g) => console.log(`   • ${g.name} (${g.id})`));
    console.log('');
    updateActivity();

    // Récupère les commandes globales pour avoir les vrais IDs cliquables
    let appCommands;
    try {
        appCommands = await client.application.commands.fetch();
    } catch {
        appCommands = new Collection();
    }

    // Mentions cliquables </nom:id>
    const mentions = [...client.commands.keys()].map((name) => {
        const appCmd = appCommands.find((c) => c.name === name);
        return appCmd ? `</${name}:${appCmd.id}>` : `\`/${name}\``;
    });

    const now = new Date().toLocaleString('fr-FR', {
        timeZone  : 'Europe/Paris',
        dateStyle : 'short',
        timeStyle : 'medium',
    });

    // Envoie l'embed de connexion dans chaque salon de logs configuré
    for (const guild of client.guilds.cache.values()) {
        const cfg = config.load(guild.id);
        if (!cfg.logChannelId) continue;

        try {
            const channel = await client.channels.fetch(cfg.logChannelId);
            if (!channel) continue;

            const embed = new EmbedBuilder()
                .setColor(0x57F287)
                .setAuthor({
                    name    : client.user.tag,
                    iconURL : client.user.displayAvatarURL(),
                })
                .setTitle('✅ Bot connecté')
                .setDescription(`En ligne sur **${client.guilds.cache.size}** serveur(s).`)
                .addFields({ name: '📋 Commandes disponibles', value: mentions.join('\n') })
                .setFooter({ text: `Démarré le ${now}` });

            await channel.send({ embeds: [embed] });
        } catch (err) {
            console.error(`[⚠️] Impossible d'envoyer le log de démarrage sur ${guild.name} :`, err.message);
        }
    }
});

client.on('guildDelete', (guild) => {
    if (config.exists(guild.id)) {
        config.erase(guild.id);
        console.log(`[🗑️] Config supprimée pour le serveur : ${guild.name} (${guild.id})`);
    }
});

client.on('interactionCreate', async (interaction) => {

    // ── Commandes slash ───────────────────────────────────────────────────────
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) {
            return interaction.reply({ content: '❌ Commande inconnue.', flags: MessageFlags.Ephemeral });
        }
        try {
            await command.execute(interaction, client);
        } catch (err) {
            // Ignore silencieusement les erreurs "interaction déjà traitée" (ex: double instance)
            if (err.code === 40060) return;

            console.error(`[❌] Erreur dans /${interaction.commandName}:`, err);
            logCommand(client, interaction, 'error', err.message).catch(() => {});
            const msg = { content: '❌ Une erreur est survenue.', flags: MessageFlags.Ephemeral };
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(msg).catch(() => {});
            } else {
                await interaction.reply(msg).catch(() => {});
            }
        }
        return;
    }

    // ── Boutons de rôles (message déployé) ────────────────────────────────────
    if (interaction.isButton() && interaction.customId.startsWith('role:')) {
        const roleId = interaction.customId.split(':')[1];
        const member = interaction.member;
        const guild  = interaction.guild;

        const cfg   = config.load(guild.id);
        const entry = cfg.entries.find((e) => e.roleId === roleId);

        if (!entry) {
            return interaction.reply({
                content  : '❌ Ce rôle n\'est plus configuré sur ce serveur.',
                flags    : MessageFlags.Ephemeral,
            });
        }

        try {
            const role    = await guild.roles.fetch(roleId);
            const hasRole = member.roles.cache.has(roleId);

            if (hasRole) {
                await member.roles.remove(role);
                return interaction.reply({ content: `✅ Rôle **${entry.label}** retiré.`, flags: MessageFlags.Ephemeral });
            } else {
                await member.roles.add(role);
                return interaction.reply({ content: `✅ Rôle **${entry.label}** attribué.`, flags: MessageFlags.Ephemeral });
            }
        } catch (err) {
            console.error('[❌] Erreur attribution de rôle:', err);
            return interaction.reply({
                content : `❌ Impossible d'attribuer le rôle. Vérifiez que le bot a la permission \`Gérer les rôles\` et que son rôle est au-dessus du rôle cible dans la hiérarchie.`,
                flags   : MessageFlags.Ephemeral,
            });
        }
    }

    // ── Composants génériques (boutons & menus de sélection) ──────────────────
    if (interaction.isButton() || interaction.isAnySelectMenu()) {
        const prefix  = interaction.customId.split(':')[0];
        const command = client.commands.get(prefix);

        if (command?.handleComponent) {
            try {
                return await command.handleComponent(interaction, client);
            } catch (err) {
                if (err.code === 40060) return;

                console.error(`[❌] Erreur composant ${prefix}:`, err);
                const msg = { content: '❌ Une erreur est survenue.', flags: MessageFlags.Ephemeral };
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(msg).catch(() => {});
                } else {
                    await interaction.reply(msg).catch(() => {});
                }
            }
        }
    }

    // ── Modals ─────────────────────────────────────────────────────────────────
    if (interaction.isModalSubmit()) {
        const prefix  = interaction.customId.split(':')[0];
        const command = client.commands.get(prefix);

        if (command?.handleModal) {
            try {
                return await command.handleModal(interaction, client);
            } catch (err) {
                if (err.code === 40060) return;

                console.error(`[❌] Erreur modal ${prefix}:`, err);
                const msg = { content: '❌ Une erreur est survenue.', flags: MessageFlags.Ephemeral };
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(msg).catch(() => {});
                } else {
                    await interaction.reply(msg).catch(() => {});
                }
            }
        }
    }
});

// ── Connexion ─────────────────────────────────────────────────────────────────

client.login(process.env.DISCORD_TOKEN).catch((err) => {
    console.error('[❌] Impossible de se connecter à Discord :', err.message);
    process.exit(1);
});