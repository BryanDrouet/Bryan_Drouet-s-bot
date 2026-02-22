/**
 * utils/builder.js
 * ----------------
 * Construit le message Display Components à partir de la config du serveur.
 *
 * Layouts supportés :
 *   • column  — Un bouton par ligne avec sa description (défaut)
 *   • row     — Boutons groupés par lignes de 5, descriptions au-dessus
 *   • section — Description et bouton côte à côte
 */

const {
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize,
    SectionBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    MessageFlags,
} = require('discord.js');

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Crée un ButtonBuilder prêt à l'emploi pour une entrée de rôle.
 */
function makeButton(entry) {
    const button = new ButtonBuilder()
        .setCustomId(`role:${entry.roleId}`)
        .setLabel(entry.label)
        .setStyle(ButtonStyle.Secondary);

    if (entry.emoji) {
        const customMatch = entry.emoji.match(/^<a?:(\w+):(\d+)>$/);
        if (customMatch) {
            button.setEmoji({ name: customMatch[1], id: customMatch[2] });
        } else {
            button.setEmoji(entry.emoji);
        }
    }

    return button;
}

// ── Layout : Column (défaut) ───────────────────────────────────────────────────

function buildColumn(container, entries, dividers) {
    container.addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Large),
    );

    entries.forEach((entry, index) => {
        if (index > 0) {
            container.addSeparatorComponents(
                new SeparatorBuilder().setDivider(dividers).setSpacing(SeparatorSpacingSize.Small),
            );
        }

        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(entry.description),
        );

        container.addActionRowComponents(
            new ActionRowBuilder().addComponents(makeButton(entry)),
        );
    });
}

// ── Layout : Row (compact) ─────────────────────────────────────────────────────

function buildRow(container, entries, dividers) {
    container.addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Large),
    );

    // Descriptions regroupées
    const descLines = entries.map((e) => {
        const emoji = e.emoji ? `${e.emoji} ` : '';
        return `${emoji}**${e.label}** — ${e.description}`;
    });

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(descLines.join('\n')),
    );

    container.addSeparatorComponents(
        new SeparatorBuilder().setDivider(false).setSpacing(SeparatorSpacingSize.Small),
    );

    // Boutons groupés par 5
    for (let i = 0; i < entries.length; i += 5) {
        const chunk  = entries.slice(i, i + 5);
        const buttons = chunk.map((e) => makeButton(e));
        container.addActionRowComponents(
            new ActionRowBuilder().addComponents(...buttons),
        );
    }
}

// ── Layout : Section (côte à côte) ─────────────────────────────────────────────

function buildSection(container, entries, dividers) {
    container.addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Large),
    );

    entries.forEach((entry, index) => {
        if (index > 0) {
            container.addSeparatorComponents(
                new SeparatorBuilder().setDivider(dividers).setSpacing(SeparatorSpacingSize.Small),
            );
        }

        container.addSectionComponents(
            new SectionBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(entry.description),
                )
                .setButtonAccessory(makeButton(entry)),
        );
    });
}

// ── Build principal ────────────────────────────────────────────────────────────

const LAYOUT_BUILDERS = {
    column  : buildColumn,
    row     : buildRow,
    section : buildSection,
};

/**
 * Construit le payload complet du message à partir d'une config de serveur.
 * @param {object} config - Config chargée via utils/config.js
 * @returns {{ components: ContainerBuilder[], flags: number }}
 */
function buildMessage(config) {
    const container = new ContainerBuilder();
    const layout    = config.layout || 'column';
    const dividers  = config.dividers !== false;

    if (config.accentColor !== null) {
        container.setAccentColor(config.accentColor);
    }

    // Titre
    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`## ${config.title}`),
    );

    if (config.entries.length === 0) {
        container.addSeparatorComponents(
            new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Large),
        );
        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                '-# Aucun rôle configuré. Utilisez `/config` pour en ajouter.',
            ),
        );
    } else {
        const build = LAYOUT_BUILDERS[layout] || buildColumn;
        build(container, config.entries, dividers);
    }

    // Footer
    container.addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Large),
    );
    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`-# ${config.footer}`),
    );

    return {
        components : [container],
        flags      : MessageFlags.IsComponentsV2,
    };
}

module.exports = { buildMessage };
