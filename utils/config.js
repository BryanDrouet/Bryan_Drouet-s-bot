/**
 * utils/config.js
 * ---------------
 * Gestionnaire de configuration par serveur.
 *
 * RGPD :
 *   - Seules les données de configuration du SERVEUR sont stockées (aucune donnée personnelle).
 *   - Les données utilisateur (qui a cliqué, quand, etc.) ne sont JAMAIS enregistrées.
 *   - Chaque serveur peut supprimer intégralement ses données via /rgpd effacer.
 *   - Les fichiers de config sont stockés localement dans /data/configs/<guildId>.json
 */

const fs     = require('fs');
const path   = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, '..', 'data', 'configs');

// S'assure que le dossier de stockage existe
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

/**
 * Structure d'une configuration de serveur :
 * {
 *   guildId     : string,
 *   title       : string,       // Titre du message
 *   footer      : string,       // Message de bas de page
 *   accentColor : number|null,  // Couleur de bordure du container (hex)
 *   entries     : [
 *     {
 *       id          : string,   // Clé primaire unique (8 caractères hex)
 *       roleId      : string,   // ID du rôle Discord
 *       label       : string,   // Texte du bouton
 *       description : string,   // Texte au-dessus du bouton
 *       emoji       : string,   // Emoji Unicode ou <:name:id>
 *     }
 *   ],
 *   messageId      : string|null,  // ID du dernier message déployé (pour édition)
 *   channelId      : string|null,  // Salon où le message a été déployé
 *   logChannelId   : string|null,  // Salon de logs (configuré via /config)
 *   adminUsers     : string[],     // IDs des utilisateurs autorisés à configurer le bot
 *   adminRoles     : string[],     // IDs des rôles autorisés à configurer le bot
 *   createdAt      : string,       // ISO 8601 — date de création de la config
 *   updatedAt      : string,       // ISO 8601 — dernière modification
 * }
 */

const DEFAULT_CONFIG = (guildId) => ({
    guildId,
    title        : 'Attribuez / retirez vous des rôles de notifications',
    footer       : 'Nous vous souhaitons un excellent séjour sur le serveur !',
    accentColor  : null,
    entries      : [],
    messageId    : null,
    channelId    : null,
    logChannelId : null,
    layout       : 'column',
    dividers     : true,
    logRoles     : true,
    logRgpd      : true,
    logAdmin     : true,
    logVisual    : true,
    adminUsers   : [],
    adminRoles   : [],
    createdAt    : new Date().toISOString(),
    updatedAt    : new Date().toISOString(),
});

function filePath(guildId) {
    return path.join(DATA_DIR, `${guildId}.json`);
}

/** Génère un identifiant unique court (8 hex). */
function generateId() {
    return crypto.randomBytes(4).toString('hex');
}

/** Charge la config d'un serveur (crée une config vide si inexistante). */
function load(guildId) {
    const fp = filePath(guildId);
    if (!fs.existsSync(fp)) return DEFAULT_CONFIG(guildId);
    try {
        const cfg = JSON.parse(fs.readFileSync(fp, 'utf8'));

        // Migration : ajoute un id aux entries qui n'en ont pas
        let migrated = false;
        for (const entry of cfg.entries ?? []) {
            if (!entry.id) {
                entry.id = generateId();
                migrated = true;
            }
        }

        // Migration : ajoute logChannelId si absent
        if (!('logChannelId' in cfg)) {
            cfg.logChannelId = null;
            migrated = true;
        }

        // Migration : logEnabled → logRoles, logRgpd, logAdmin
        if ('logEnabled' in cfg) {
            const val = cfg.logEnabled !== false;
            cfg.logRoles = val;
            cfg.logRgpd  = val;
            cfg.logAdmin = val;
            delete cfg.logEnabled;
            migrated = true;
        }
        if (!('logRoles' in cfg)) { cfg.logRoles = true; migrated = true; }
        if (!('logRgpd'  in cfg)) { cfg.logRgpd  = true; migrated = true; }
        if (!('logAdmin' in cfg)) { cfg.logAdmin = true; migrated = true; }

        // Migration : ajoute logVisual si absent
        if (!('logVisual' in cfg)) {
            cfg.logVisual = true;
            migrated = true;
        }

        // Migration : ajoute layout si absent
        if (!('layout' in cfg)) {
            cfg.layout = 'column';
            migrated = true;
        }

        // Migration : ajoute dividers si absent
        if (!('dividers' in cfg)) {
            cfg.dividers = true;
            migrated = true;
        }

        // Migration : ajoute adminUsers/adminRoles si absents
        if (!('adminUsers' in cfg)) {
            cfg.adminUsers = [];
            migrated = true;
        }
        if (!('adminRoles' in cfg)) {
            cfg.adminRoles = [];
            migrated = true;
        }

        if (migrated) save(guildId, cfg);

        return cfg;
    } catch {
        return DEFAULT_CONFIG(guildId);
    }
}

/** Sauvegarde la config d'un serveur. */
function save(guildId, config) {
    config.updatedAt = new Date().toISOString();
    fs.writeFileSync(filePath(guildId), JSON.stringify(config, null, 2), 'utf8');
}

/** Supprime intégralement la config d'un serveur (droit à l'effacement RGPD). */
function erase(guildId) {
    const fp = filePath(guildId);
    if (fs.existsSync(fp)) fs.unlinkSync(fp);
}

/** Vérifie si une config existe pour ce serveur. */
function exists(guildId) {
    return fs.existsSync(filePath(guildId));
}

/**
 * Purge toutes les données d'un utilisateur dans TOUTES les configs de serveur.
 * Retire l'utilisateur de adminUsers sur chaque serveur.
 * @param {string} userId
 * @returns {{ guildsAffected: number }} nombre de serveurs modifiés
 */
function purgeUser(userId) {
    let guildsAffected = 0;

    if (!fs.existsSync(DATA_DIR)) return { guildsAffected };

    const files = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith('.json'));

    for (const file of files) {
        const guildId = file.replace('.json', '');
        try {
            const cfg = load(guildId);
            const before = cfg.adminUsers.length;
            cfg.adminUsers = cfg.adminUsers.filter((u) => u !== userId);

            if (cfg.adminUsers.length !== before) {
                save(guildId, cfg);
                guildsAffected++;
            }
        } catch { /* config corrompue, on skip */ }
    }

    return { guildsAffected };
}

module.exports = { load, save, erase, exists, generateId, DEFAULT_CONFIG, purgeUser };
