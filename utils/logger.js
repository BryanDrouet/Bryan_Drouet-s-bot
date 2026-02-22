/**
 * utils/logger.js
 * ---------------
 * Log toutes les commandes exécutées dans un fichier local
 * et dans le salon de logs Discord (configuré par serveur via /config).
 *
 * Chaque log contient :
 *   - Qui a exécuté la commande (tag + ID)
 *   - Quelle commande (avec sous-commande et options)
 *   - Dans quel serveur et quel salon
 *   - À quelle date/heure précise
 *
 * Les logs sont aussi écrits dans /data/logs/YYYY-MM-DD.log (fichier texte).
 */

const { EmbedBuilder, MessageFlags } = require('discord.js');
const fs   = require('fs');
const path = require('path');
const config = require('./config.js');

const LOG_DIR = path.join(__dirname, '..', 'data', 'logs');
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

/**
 * Formate les options d'une interaction slash en texte lisible.
 */
function formatOptions(interaction) {
    const parts = [];
    const sub = interaction.options?.getSubcommand?.(false);
    if (sub) parts.push(`sous-commande: \`${sub}\``);

    for (const opt of (interaction.options?.data ?? [])) {
        if (opt.options) {
            for (const subOpt of opt.options) {
                // Masque les valeurs sensibles (token, etc.)
                const val = subOpt.name === 'confirmer'
                    ? subOpt.value
                    : `\`${String(subOpt.value).slice(0, 80)}\``;
                parts.push(`${subOpt.name}: ${val}`);
            }
        } else {
            const val = `\`${String(opt.value).slice(0, 80)}\``;
            parts.push(`${opt.name}: ${val}`);
        }
    }
    return parts.length ? parts.join(', ') : '*aucune option*';
}

/**
 * Log une interaction dans un fichier et dans le salon de logs du serveur.
 * @param {import('discord.js').Client} client
 * @param {import('discord.js').Interaction} interaction
 * @param {'success'|'error'|'denied'} status
 * @param {string} [detail] - Message optionnel additionnel
 * @param {string} [commandLabel] - Libellé de la commande (si interaction n'est pas un slash)
 * @param {boolean} [visual=false] - Si true, c'est une commande purement visuelle (pas d'action)
 * @param {string}  [category]     - Catégorie de log : 'roles', 'rgpd', 'admin' (null = toujours loggé)
 */
async function logCommand(client, interaction, status = 'success', detail = null, commandLabel = null, visual = false, category = null) {
    const cfg          = config.load(interaction.guildId);
    const logChannelId = cfg.logChannelId;
    const now = new Date();

    const nowStr = now.toLocaleString('fr-FR', {
        timeZone  : 'Europe/Paris',
        dateStyle : 'short',
        timeStyle : 'medium',
    });

    const colors = { success: 0x57F287, error: 0xED4245, denied: 0xFEE75C };
    const icons  = { success: '✅', error: '❌', denied: '🔒' };
    const titles = { success: 'Commande exécutée', error: 'Erreur commande', denied: 'Accès refusé' };

    // Pour les slash commands: commandName + sous-commande
    // Pour les composants (boutons/selects): commandLabel fourni manuellement
    let fullCmd;
    if (commandLabel) {
        fullCmd = commandLabel;
    } else {
        const cmdName = interaction.commandName;
        const sub     = interaction.options?.getSubcommand?.(false);
        fullCmd = sub ? `/${cmdName} ${sub}` : `/${cmdName}`;
    }

    // ── Log fichier ───────────────────────────────────────────────────────────
    const dateKey  = now.toISOString().slice(0, 10);
    const logLine  = `[${now.toISOString()}] [${status.toUpperCase()}] `
        + `User: ${interaction.user.tag} (${interaction.user.id}) | `
        + `Cmd: ${fullCmd} | `
        + `Guild: ${interaction.guild?.name} (${interaction.guildId}) | `
        + `Channel: ${interaction.channelId}`
        + (detail ? ` | Detail: ${detail}` : '')
        + '\n';

    fs.appendFileSync(path.join(LOG_DIR, `${dateKey}.log`), logLine, 'utf8');

    // ── Log Discord ───────────────────────────────────────────────────────────
    if (!logChannelId) return;

    // Vérification par catégorie
    if (category === 'roles' && cfg.logRoles === false) return;
    if (category === 'rgpd'  && cfg.logRgpd  === false) return;
    if (category === 'admin' && cfg.logAdmin  === false) return;

    // Si c'est une commande visuelle et que logVisual est désactivé, on skip le log Discord
    if (visual && cfg.logVisual === false) return;

    try {
        const channel = await client.channels.fetch(logChannelId);
        if (!channel) return;

        const optionsValue = commandLabel ? '*—*' : formatOptions(interaction);

        const embed = new EmbedBuilder()
            .setColor(colors[status])
            .setTitle(`${icons[status]} ${titles[status]}`)
            .addFields(
                { name: '👤 Utilisateur', value: `${interaction.user.tag}\n\`${interaction.user.id}\``, inline: true },
                { name: '⌨️ Commande',    value: `\`${fullCmd}\``,                                      inline: true },
                { name: '📂 Salon',        value: `<#${interaction.channelId}>`,                         inline: true },
                { name: '⚙️ Options',      value: optionsValue },
            )
            .setFooter({ text: `Serveur : ${interaction.guild?.name} • ${nowStr}` });

        if (detail) embed.addFields({ name: '📝 Détail', value: detail });

        await channel.send({ embeds: [embed] });
    } catch (err) {
        console.error('[logger] Impossible d\'envoyer le log Discord :', err.message);
    }
}

module.exports = { logCommand };