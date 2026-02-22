/**
 * deploy-commands.js
 * ------------------
 * Déploie les commandes slash globalement auprès de Discord.
 *
 * Modes :
 *   node deploy-commands.js          → déploiement global (propagation ~1h)
 *   node deploy-commands.js --clear  → supprime toutes les commandes globales
 */

require('dotenv').config();

const { REST, Routes } = require('discord.js');
const fs   = require('fs');
const path = require('path');

const clearMode = process.argv.slice(2).includes('--clear');

const commands = [];

if (!clearMode) {
    const commandsPath = path.join(__dirname, 'commands');
    fs.readdirSync(commandsPath)
        .filter((f) => f.endsWith('.js'))
        .forEach((file) => {
            const command = require(path.join(commandsPath, file));
            if (command.data) commands.push(command.data.toJSON());
        });
}

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        if (clearMode) {
            console.log('🗑️  Suppression des commandes globales...');
            await rest.put(Routes.applicationCommands(process.env.BOT_ID), { body: [] });
            console.log('✅ Commandes globales supprimées.');
            return;
        }

        console.log(`🔄 Déploiement global de ${commands.length} commande(s)...`);
        const data = await rest.put(
            Routes.applicationCommands(process.env.BOT_ID),
            { body: commands }
        );
        console.log(`✅ ${data.length} commande(s) déployée(s) globalement.`);
        console.log('⏳ Propagation Discord : jusqu\'à 1 heure.');
    } catch (err) {
        console.error('❌ Erreur lors du déploiement :', err);
    }
})();
