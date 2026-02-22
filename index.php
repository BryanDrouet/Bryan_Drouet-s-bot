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

    <script src="https://unpkg.com/lucide@latest"></script>

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

        .nav-links {
            display: flex;
            align-items: center;
        }

        .nav-links a {
            color: var(--text-white);
            text-decoration: none;
            margin-left: 20px;
            transition: color 0.3s;
            display: flex;
            align-items: center;
            gap: 5px;
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

        h2 { color: var(--secondary-green); margin-top: 0; display: flex; align-items: center; gap: 10px; }
        h3 { color: var(--secondary-blue); }

        .faq-item {
            margin-bottom: 15px;
            background: rgba(0,0,0,0.1);
            padding: 15px;
            border-radius: 5px;
        }

        .faq-question {
            cursor: pointer;
            font-weight: bold;
            color: var(--secondary-blue);
            display: flex;
            justify-content: space-between;
        }

        .faq-answer {
            display: none;
            margin-top: 10px;
            color: var(--text-gray);
            border-top: 1px solid #444;
            padding-top: 10px;
        }

        .faq-item.open .faq-answer { display: block; }

        code {
            background: #1e1f22;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: monospace;
        }

        .lucide { width: 20px; height: 20px; vertical-align: middle; }

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
            <i data-lucide="bot"></i>
            Bryan_Drouet's Bot
        </div>
        <div class="nav-links">
            <a href="#doc"><i data-lucide="book"></i> Documentation</a>
            <a href="#faq"><i data-lucide="help-circle"></i> FAQ</a>
            <a href="https://github.com/BryanDrouet/Bryan_Drouet-s-bot" target="_blank"><i data-lucide="github"></i> GitHub</a>
            <a href="#" style="opacity: 0.5; cursor: not-allowed;"><i data-lucide="layout-dashboard"></i> Dashboard</a>
        </div>
    </nav>

    <header>
        <img src="https://bryan.ovh/bot/icon.ico" alt="Bot Large" style="width: 120px; border-radius: 50%; border: 3px solid var(--primary); margin-bottom: 20px;">
        <h1>Un bot polyvalent pour votre communauté</h1>
        <p style="color: var(--text-gray); max-width: 600px; margin: 0 auto 30px;">
            Simplifiez la gestion de votre serveur Discord avec des outils puissants et une configuration intuitive.
        </p>
        <div>
            <a href="https://discord.com/oauth2/authorize?client_id=1474821138357031035&permissions=2416004096&integration_type=0&scope=bot+applications.commands" class="btn btn-primary">Ajouter au serveur</a>
            <a href="#doc" class="btn btn-secondary">Voir la documentation</a>
        </div>
    </header>

    <div class="main-container">
        <div class="content">
            <section id="doc">
                <h2><i data-lucide="book-open"></i> Documentation</h2>
                <h3>Premiers pas</h3>
                <p>Assurez-vous que le bot possède les permissions <code>GÉRER LES MESSAGES</code> et <code>ENVOYER DES MESSAGES</code>. Le système utilise exclusivement les <b>Slash Commands</b>.</p>
                
                <h3>Commandes principales</h3>
                <ul>
                    <li><code>/aide</code> : Affiche la liste complète des commandes.</li>
                    <li><code>/info</code> : Donne des détails sur le serveur.</li>
                    <li><code>/config</code> : (Bientôt) Paramétrage via le dashboard.</li>
                </ul>
            </section>

            <section id="faq">
                <h2><i data-lucide="message-circle"></i> FAQ</h2>
                <div class="faq-item">
                    <div class="faq-question">Le bot est-il gratuit ? <i data-lucide="chevron-down"></i></div>
                    <div class="faq-answer">Oui, toutes les fonctionnalités actuelles sont gratuites pour tous les serveurs.</div>
                </div>
                <div class="faq-item">
                    <div class="faq-question">Comment signaler un bug ? <i data-lucide="chevron-down"></i></div>
                    <div class="faq-answer">Ouvrez une "Issue" sur GitHub ou rejoignez notre serveur de support via le widget Discord.</div>
                </div>
            </section>

            <section id="source">
                <h2><i data-lucide="code-2"></i> Code Source</h2>
                <p>Le projet est Open Source sous licence MIT. Vous pouvez consulter le code sur GitHub.</p>
                <a href="https://github.com/BryanDrouet/Bryan_Drouet-s-bot" target="_blank" style="color: var(--secondary-blue); font-weight: bold;">Accéder au dépôt GitHub →</a>
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
        <p style="font-size: 0.8rem;">Projet BTS CIEL IR - Campus Saint Gabriel</p>
    </footer>

    <script>
        // Année dynamique
        document.getElementById('currentYear').textContent = new Date().getFullYear();

        // FAQ Interactive
        document.querySelectorAll('.faq-question').forEach(question => {
            question.addEventListener('click', () => {
                const item = question.parentElement;
                item.classList.toggle('open');
            });
        });

        // Initialisation des icônes Lucide
        lucide.createIcons();
    </script>
</body>
</html>