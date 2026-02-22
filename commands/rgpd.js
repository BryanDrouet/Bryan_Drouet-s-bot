/**
 * commands/rgpd.js
 * ----------------
 * Gestion des données conformément au RGPD.
 *
 * Affiche un menu interactif avec :
 *   • Voir les données stockées
 *   • Effacer des données (granulaire ou total)
 */

const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    MessageFlags,
} = require('discord.js');
const config = require('../utils/config.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rgpd')
        .setDescription('Consulter ou supprimer vos données RGPD.'),

    async execute(interaction) {
        if (!interaction.guild) {
            return interaction.reply({
                content: '❌ Cette commande doit être utilisée dans un serveur.',
                flags: MessageFlags.Ephemeral,
            });
        }

        const userId = interaction.user.id;
        const guildId = interaction.guild.id;
        const guildConfig = config.load(guildId);

        const embed = new EmbedBuilder()
            .setTitle('🔒 RGPD — Protection des données')
            .setDescription(
                'Conformément au Règlement Général sur la Protection des Données, vous pouvez :\n' +
                '• **Voir vos données stockées**\n' +
                '• **Supprimer vos données**\n\n' +
                'Utilisez les boutons ci-dessous pour effectuer une action.'
            )
            .setColor(0x5865F2);

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('rgpd:view')
                .setLabel('Voir mes données')
                .setStyle(ButtonStyle.Primary),

            new ButtonBuilder()
                .setCustomId('rgpd:delete')
                .setLabel('Supprimer mes données')
                .setStyle(ButtonStyle.Danger)
        );

        await interaction.reply({ embeds: [embed], components: [row], flags: MessageFlags.Ephemeral });
    },

    async handleComponent(interaction) {
        if (!interaction.guild) {
            return interaction.reply({
                content: '❌ Cette commande doit être utilisée dans un serveur.',
                flags: MessageFlags.Ephemeral,
            });
        }

        const userId = interaction.user.id;
        const guildId = interaction.guild.id;
        const guildConfig = config.load(guildId);

        try {
            if (interaction.customId === 'rgpd:view') {
                const userData = guildConfig.entries.find((entry) => entry.userId === userId);

                if (!userData) {
                    return interaction.reply({
                        content: 'Aucune donnée trouvée vous concernant.',
                        flags: MessageFlags.Ephemeral,
                    });
                }

                const embed = new EmbedBuilder()
                    .setTitle('📊 Vos données RGPD')
                    .setDescription(`Voici les données stockées vous concernant :\n\n${JSON.stringify(userData, null, 2)}`)
                    .setColor(0x5865F2);

                return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
            }

            if (interaction.customId === 'rgpd:delete') {
                if (interaction.user.id === interaction.guild.ownerId) {
                    guildConfig.entries = [];
                    config.save(guildId, guildConfig);
                    return interaction.reply('Toutes les données ont été supprimées par le propriétaire du serveur.');
                }

                const userIndex = guildConfig.entries.findIndex((entry) => entry.userId === userId);

                if (userIndex === -1) {
                    return interaction.reply({
                        content: 'Aucune donnée trouvée à supprimer.',
                        flags: MessageFlags.Ephemeral,
                    });
                }

                guildConfig.entries.splice(userIndex, 1);
                config.save(guildId, guildConfig);

                return interaction.reply({
                    content: 'Vos données ont été supprimées avec succès.',
                    flags: MessageFlags.Ephemeral,
                });
            }
        } catch (error) {
            console.error('[❌] Erreur dans la commande /rgpd:', error);
            return interaction.reply({
                content: '❌ Une erreur est survenue lors du traitement de votre demande.',
                flags: MessageFlags.Ephemeral,
            });
        }
    },
};
