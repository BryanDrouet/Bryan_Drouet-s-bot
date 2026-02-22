/**
 * utils/ownerOnly.js
 * ------------------
 * Middleware de vérification des permissions de configuration du bot.
 *
 * Accès accordé si l'utilisateur est :
 *   1. Le propriétaire du serveur, OU
 *   2. Listé dans adminUsers de la config, OU
 *   3. Possède un rôle listé dans adminRoles de la config.
 *
 * Utilisation dans une commande :
 *   const { hasAccess, denyAccess } = require('../utils/ownerOnly.js');
 *   if (!hasAccess(interaction)) return denyAccess(interaction);
 */

const { MessageFlags } = require('discord.js');
const config = require('./config.js');

/**
 * Vérifie si l'utilisateur est le propriétaire du serveur.
 * @param {import('discord.js').Interaction} interaction
 * @returns {boolean}
 */
function isOwner(interaction) {
    return interaction.guild?.ownerId === interaction.user.id;
}

/**
 * Vérifie si l'utilisateur a accès à la configuration du bot.
 * (propriétaire OU admin utilisateur OU admin rôle)
 * @param {import('discord.js').Interaction} interaction
 * @returns {boolean}
 */
function hasAccess(interaction) {
    if (isOwner(interaction)) return true;

    const cfg = config.load(interaction.guildId);

    // Vérifie si l'utilisateur est dans la liste des admins
    if (cfg.adminUsers.includes(interaction.user.id)) return true;

    // Vérifie si l'utilisateur possède un rôle admin
    const memberRoles = interaction.member?.roles?.cache;
    if (memberRoles && cfg.adminRoles.some((roleId) => memberRoles.has(roleId))) return true;

    return false;
}

/**
 * Répond avec un message d'erreur éphémère si l'utilisateur n'a pas accès.
 * @param {import('discord.js').Interaction} interaction
 */
async function denyAccess(interaction) {
    return interaction.reply({
        content : '🔒 Cette commande est réservée au **propriétaire du serveur** ou aux **administrateurs du bot**.',
        flags   : MessageFlags.Ephemeral,
    });
}

module.exports = { isOwner, hasAccess, denyAccess };