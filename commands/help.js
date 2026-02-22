const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    MessageFlags,
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Affiche les informations utiles pour utiliser le bot.'),

    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle('🤖 Aide - Commandes disponibles')
            .setDescription(
                'Voici les commandes principales et leur utilisation :\n\n' +
                '• **/config** : Panneau de configuration complet (rôles, logs, admins).\n' +
                '• **/rgpd** : Consulter ou supprimer les données du serveur.\n' +
                '• **🎭 Rôle "Réaction"** : Ajouter, modifier, retirer, lister, ordonner, personnaliser, déployer.\n' +
                '• **📋 Salon de logs** : Choisir un salon, activer/désactiver les logs, toggle logs visuels.\n' +
                '• **🔑 Admins bot** : Ajouter/retirer des utilisateurs ou rôles autorisés à configurer le bot.'
            );

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel('Rejoindre le serveur de support')
                .setStyle(ButtonStyle.Link)
                .setURL('https://discord.gg/Ma7Gn4ez7M')
        );

        await interaction.reply({ embeds: [embed], components: [row], flags: MessageFlags.Ephemeral });
    },
};