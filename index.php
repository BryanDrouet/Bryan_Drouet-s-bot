<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bryan_Drouet's Bot - Documentation</title>
    <link rel="icon" type="image/x-icon" href="https://bryan.ovh/bot/icon.ico">
    
    <meta property="og:title" content="Bryan_Drouet's Bot">
    <meta property="og:description" content="Découvrez la documentation et les fonctionnalités du bot de Bryan_Drouet.">
    <meta property="og:image" content="https://bryan.ovh/bot/icon.ico"> 
    <meta name="theme-color" content="#FF5252">

    <style>
        :root {
            --primary: #FF5252;
            --secondary-green: #52FFA9;
            --secondary-blue: #52A9FF;
            --bg-dark: #36393f;
            --bg-card: #2f3136;
            --bg-nav: #202225;
            --text-white: #ffffff;
            --text-gray: #b9bbbe;
        }

        body {
            background-color: var(--bg-dark);
            color: var(--text-white);
            font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            margin: 0;
            line-height: 1.6;
            scroll-behavior: smooth;
        }

        /* Navigation */
        nav {
            background: var(--bg-nav);
            padding: 1rem 2rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            position: sticky;
            top: 0;
            z-index: 1000;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        }

        .nav-logo {
            display: flex;
            align-items: center;
            gap: 10px;
            font-weight: bold;
            color: var(--primary);
        }

        .nav-logo img {
            width: 32px;
            height: 32px;
            border-radius: 50%;
        }

        .nav-links a {
            color: var(--text-white);
            text-decoration: none;
            margin-left: 20px;
            transition: color 0.3s;
        }

        .nav-links a:hover {
            color: var(--secondary-blue);
        }

        /* Hero Section */
        header {
            padding: 80px 20px;
            text-align: center;
            background: linear-gradient(180deg, var(--bg-nav) 0%, var(--bg-dark) 100%);
        }

        .btn {
            display: inline-block;
            padding: 12px 24px;
            border-radius: 5px;
            text-decoration: none;
            font-weight: bold;
            transition: transform 0.2s, opacity 0.8s;
            margin: 10px;
        }

        .btn-primary { background: var(--primary); color: white; }
        .btn-secondary { background: var(--secondary-blue); color: white; }
        .btn:hover { transform: translateY(-2px); opacity: 0.9; }

        /* Content Layout */
        .main-container {
            max-width: 1100px;
            margin: 0 auto;
            padding: 20px;
            display: grid;
            grid-template-columns: 1fr 350px;
            gap: 30px;
        }

        @media (max-width: 900px) {
            .main-container { grid-template-columns: 1fr; }
            .sidebar { display: flex; justify-content: center; }
        }

        section {
            background: var(--bg-card);
            padding: 30px;
            border-radius: 8px;
            margin-bottom: 30px;
            border-left: 4px solid var(--primary);
        }

        h2 { color: var(--secondary-green); margin-top: 0; }
        h3 { color: var(--secondary-blue); }

        .faq-item {
            margin-bottom: 20px;
            border-bottom: 1px solid #444;
            padding-bottom: 10px;
        }

        .faq-item:last-child {
            border-bottom: none;
        }

        .faq-item .faq-question {
            cursor: pointer;
            font-weight: bold;
            color: var(--secondary-blue);
        }

        .faq-item .faq-answer {
            display: none;
            margin-top: 10px;
            color: var(--text-gray);
        }

        .faq-item.open .faq-answer {
            display: block;
        }

        code {
            background: #1e1f22;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: monospace;
        }

        /* Footer */
        footer {
            background: var(--bg-nav);
            text-align: center;
            padding: 40px 20px;
            margin-top: 50px;
            color: var(--text-gray);
        }
    </style>
</head>
<body>

    <nav>
        <div class="nav-logo">
            <svg class="lucide lucide-bot"><use xlink:href="#bot"></use></svg>
            Bryan_Drouet's Bot
        </div>
        <div class="nav-links">
            <a href="#doc">
                <svg class="lucide lucide-book"><use xlink:href="#book"></use></svg>
                Documentation
            </a>
            <a href="#faq">
                <svg class="lucide lucide-help-circle"><use xlink:href="#help-circle"></use></svg>
                FAQ
            </a>
            <a href="https://github.com/BryanDrouet/Bryan_Drouet-s-bot" target="_blank">
                <svg class="lucide lucide-github"><use xlink:href="#github"></use></svg>
                GitHub
            </a>
            <a href="#" style="opacity: 0.5; cursor: not-allowed;">
                <svg class="lucide lucide-dashboard"><use xlink:href="#dashboard"></use></svg>
                Dashboard (Bientôt)
            </a>
        </div>
    </nav>

    <header>
        <img src="https://bryan.ovh/bot/icon.ico" alt="Bot Large" style="width: 120px; border-radius: 50%; border: 3px solid var(--primary); margin-bottom: 20px;">
        <h1>Un bot polyvalent pour votre communauté</h1>
        <p style="color: var(--text-gray); max-width: 600px; margin: 0 auto 30px;">
            Simplifiez la gestion de votre serveur Discord avec des outils puissants et une configuration intuitive.
        </p>
        <h2>📚 Documentation</h2>
        <h3>Premiers pas</h3>
        <p>Pour commencer à utiliser le bot, assurez-vous qu'il possède les permissions nécessaires (Gérer les messages, Envoyer des messages). Le préfixe par défaut est <code>/</code> (Slash Commands).</p>
        <h3>Commandes principales</h3>
        <ul>
            <li><code>/aide</code> : Affiche la liste complète des commandes.</li>
            <li><code>/info</code> : Donne des détails sur le serveur.</li>
            <li><code>/config</code> : (Bientôt) Permettra de lier votre serveur au dashboard.</li>
        </ul>
        <p><i>Note : La documentation complète est en cours de rédaction.</i></p>
        <h2>🤔 FAQ</h2>
        <div class="faq-item">
            <strong>Le bot est-il gratuit ?</strong>
            <p>Oui, toutes les fonctionnalités actuelles sont gratuites.</p>
        </div>
        <div class="faq-item">
            <strong>Comment signaler un bug ?</strong>
            <p>Vous pouvez ouvrir une <i>issue</i> sur le GitHub ou rejoindre le serveur de support via le widget ci-contre.</p>
        </div>
        <h2>💻 Code Source</h2>
        <p>Le projet est Open Source. Vous pouvez consulter, contribuer ou héberger votre propre version du bot.</p>
        <a href="https://github.com/BryanDrouet/Bryan_Drouet-s-bot" target="_blank" style="color: var(--secondary-blue);">Accéder au dépôt GitHub →</a>
    </header>

    <div class="main-container">
        <div class="content">
            <section id="doc">
                <h2>ðŸ“š Documentation</h2>
                <h3>Premiers pas</h3>
                <p>Pour commencer à utiliser le bot, assurez-vous qu'il possède les permissions nécessaires (GÉRER LES MESSAGES, ENVOYER DES MESSAGES). Le préfixe est <code>/</code> (Slash Commands).</p>
                
                <h3>Commandes principales</h3>
                <ul>
                    <li><code>/aide</code> : Affiche la liste complète des commandes.</li>
                    <li><code>/info</code> : Donne des détails sur le serveur.</li>
                    <li><code>/config</code> : (Bientôt) Permettra de lier votre serveur au dashboard.</li>
                </ul>
                <p><i>Note : La documentation complète est en cours de rédaction.</i></p>
            </section>

            <section id="faq">
                <h2>ðŸ¤” FAQ</h2>
                <div class="faq-item">
                    <strong>Le bot est-il gratuit ?</strong>
                    <p>Oui, toutes les fonctionnalitÃ©s actuelles sont gratuites.</p>
                </div>
                <div class="faq-item">
                    <strong>Comment signaler un bug ?</strong>
                    <p>Vous pouvez ouvrir une <i>issue</i> sur le GitHub ou rejoindre le serveur de support via le widget ci-contre.</p>
                </div>
            </section>

            <section id="source">
                <h2>💻 Code Source</h2>
                <p>Le projet est Open Source. Vous pouvez consulter, contribuer ou héberger votre propre version du bot.</p>
                <a href="https://github.com/BryanDrouet/Bryan_Drouet-s-bot" target="_blank" style="color: var(--secondary-blue);">Accéder au dépôt GitHub →</a>
            </section>
        </div>

        <aside class="sidebar">
            <div style="position: sticky; top: 100px;">
                <iframe src="https://discord.com/widget?id=1474820217627480080&theme=dark" width="350" height="500" allowtransparency="true" frameborder="0" sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"></iframe>
            </div>
        </aside>
    </div>

    <footer>
        <p>&copy; 2026-<span id="currentYear"></span> Bryan_Drouet. Tous droits réservés.</p>
        <p style="font-size: 0.8rem;">Réalisé pour le projet BTS CIEL IR.</p>
    </footer>

    <script>
        // Gestion dynamique de l'année pour le footer
        const yearSpan = document.getElementById('currentYear');
        const year = new Date().getFullYear();
        yearSpan.textContent = year;

        // FAQ collapsible functionality
        document.querySelectorAll('.faq-item .faq-question').forEach(question => {
            question.addEventListener('click', () => {
                const faqItem = question.parentElement;
                faqItem.classList.toggle('open');
            });
        });

        // Lucide icons
        import { createIcons, icons } from 'https://cdn.jsdelivr.net/npm/lucide@latest/dist/esm/lucide.js';
        
        document.addEventListener('DOMContentLoaded', () => {
            createIcons();
        });
    </script>

    <style>
        .lucide {
            width: 24px;
            height: 24px;
            stroke-width: 2;
            stroke: var(--text-white);
            fill: none;
        }
    </style>
</body>
</html>