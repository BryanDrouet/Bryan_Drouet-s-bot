# 🤖 Bot Discord — Sélecteur de rôles (Display Components V2)

Bot Discord permettant de créer des messages de sélection de rôles dynamiques
utilisant les **Display Components** (Components V2) de Discord.
Configurable par serveur, conforme au **RGPD**.

---

## ⚙️ Installation

```bash
# 1. Installer les dépendances
npm install

# 2. Configurer les variables d'environnement
cp .env.example .env
# → Édite .env et remplis les 2 valeurs (voir section Configuration)
```

---

## 🔧 Configuration (.env)

```env
DISCORD_TOKEN=      # Token du bot — Portail Développeur → Bot → Reset Token
BOT_ID=             # ID de l'application — Portail Développeur → General Information
```

> ⚠️ **Important** : remplis **toutes** les valeurs avant de lancer quoi que ce soit.
> Le salon de logs se configure ensuite par serveur via `/config` → 📋 Salon de logs.

---

## 🚀 Lancement

### Première fois (ou après modification d'une commande)

```bash
# Déploie les commandes ET lance le bot en une seule ligne :
node deploy-commands.js && node index.js
```

> `deploy-commands.js` enregistre les commandes slash auprès de Discord (propagation ~1h pour les commandes globales).
> Pour supprimer toutes les commandes : `node deploy-commands.js --clear`

### Les fois suivantes (redémarrage normal)

```bash
# deploy-commands.js n'est PAS nécessaire, lance juste :
node index.js
```

> **Règle simple** : `deploy-commands.js` seulement si tu as ajouté ou modifié une commande.
> Sinon, `node index.js` suffit.

---

## 🎮 Commandes disponibles

| Commande | Description |
|---|---|
| `/config` | Panneau de configuration complet (rôles, logs, admins) |
| `/rgpd` | Consulter ou supprimer les données du serveur |

### Sous-menus de `/config`

| Bouton | Contenu |
|---|---|
| 🎭 **Rôle Réaction** | Ajouter, modifier, retirer, lister, ordonner, personnaliser, déployer |
| 📋 **Salon de logs** | Choisir un salon, activer/désactiver les logs, toggle logs visuels |
| 🔑 **Admins bot** | Ajouter/retirer des utilisateurs ou rôles autorisés à configurer le bot |
| ✖️ **Fermer** | Ferme le panneau de configuration |

> Le panneau `/config` se ferme automatiquement après 5 minutes d'inactivité.

---

## 📋 Workflow typique

```
1. /config  →  🎭 Rôle Réaction  →  ➕ Ajouter   (rôle, label, description, emoji)
2.                                →  ➕ Ajouter   (un second rôle…)
3.                                →  🎨 Personnaliser (titre, footer, couleur)
4.                                →  🚀 Déployer  (choisir le salon)
```

Chaque modification nécessite un 🚀 **Déployer** pour appliquer les changements dans le salon.

---

## 🔒 RGPD

Ce bot ne stocke **aucune donnée personnelle**.
Seule la configuration du serveur (titre, footer, liste des rôles) est conservée localement.

Voir [PRIVACY.md](./PRIVACY.md) pour la politique de confidentialité complète.

---

## 🛠️ Permissions requises pour le bot

- `applications.commands` — pour les slash commands
- `bot` avec les permissions :
  - **Voir les salons** — pour accéder aux salons
  - **Envoyer des messages** — pour publier le message
  - **Gérer les messages** — pour éditer le message déployé
  - **Gérer les rôles** — pour attribuer/retirer des rôles aux membres