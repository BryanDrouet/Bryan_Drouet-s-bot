const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('infos')
        .setDescription('Affiche les informations du bot (commande réservée à un serveur spécifique).'),

    async execute(interaction) {
        if (!interaction.guild) {
            return interaction.reply({
                content: '❌ Cette commande doit être utilisée dans un serveur.',
                flags: MessageFlags.Ephemeral,
            });
        }

        const allowedServerId = '1474820217627480080';
        const targetChannelId = '1474924508480667709';

        if (interaction.guild.id !== allowedServerId) {
            return interaction.reply({
                content: '❌ Cette commande est réservée à un serveur spécifique.',
                flags: MessageFlags.Ephemeral,
            });
        }

        const channel = interaction.guild.channels.cache.get(targetChannelId);
        if (!channel) {
            return interaction.reply({
                content: '❌ Le salon cible pour cette commande est introuvable.',
                flags: MessageFlags.Ephemeral,
            });
        }

        try {
            const embed = new EmbedBuilder()
                .setColor(0x5865F2)
                .setTitle('ℹ️ Informations du bot')
                .setDescription(
                    'Voici les informations importantes concernant le bot :\n\n' +
                    '• **Ajouter le bot sur votre serveur** : [Cliquez ici](https://bryan.ovh/bot)\n' +
                    '• **Lien du serveur support** : [Rejoindre](https://discord.gg/Ma7Gn4ez7M)\n' +
                    '• **Gestion RGPD** : Utilisez les commandes `/rgpd` pour consulter ou supprimer vos données.'
                )
                .setFooter({ text: 'Merci d\'utiliser mon bot !' });

            await channel.send({ embeds: [embed] });
            await interaction.reply({
                content: '✅ Les informations du bot ont été publiées dans le salon cible.',
                flags: MessageFlags.Ephemeral,
            });
        } catch (error) {
            console.error('[❌] Erreur dans la commande /infos:', error);
            return interaction.reply({
                content: '❌ Une erreur est survenue lors de l\'exécution de cette commande.',
                flags: MessageFlags.Ephemeral,
            });
        }
    },
};