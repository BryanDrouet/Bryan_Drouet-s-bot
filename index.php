<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Ajouter Bryan_Drouet's bot</title>
    <link rel="icon" type="image/x-icon" href="https://bryan.ovh/bot/icon.ico">
    
    <meta property="og:title" content="Invitez Bryan_Drouet's bot sur votre serveur Discord">
    <meta property="og:description" content="Cliquez ici pour ajouter le bot à votre serveur Discord !">
    <meta property="og:image" content="https://bryan.ovh/bot/icon.ico"> 
    <meta name="theme-color" content="#FF5252">

    <style>
        body {
            background-color: #36393f;
            color: white;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
        }
        .container {
            background: #2f3136;
            padding: 30px;
            border-radius: 12px;
            border: 2px solid #FF5252;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            max-width: 500px;
        }
        .bot-icon {
            width: 100px;
            height: 100px;
            border-radius: 50%;
            border: 3px solid #52FFA9;
            margin-bottom: 20px;
        }
        a {
            color: #52A9FF;
            text-decoration: none;
            font-weight: bold;
        }
        a:hover {
            text-decoration: underline;
        }
        code {
            background: #202225;
            padding: 10px;
            display: block;
            margin: 15px 0;
            border-radius: 5px;
            word-break: break-all;
            border: 1px solid #444;
            font-size: 0.9em;
        }
        .debug-badge {
            background: #FF5252;
            color: white;
            padding: 5px 10px;
            border-radius: 5px;
            font-size: 0.8em;
            text-transform: uppercase;
            margin-bottom: 10px;
            display: inline-block;
        }
    </style>

    <script>
        const urlParams = new URLSearchParams(window.location.search);
        const inviteUrl = "https://discord.com/oauth2/authorize?client_id=1474821138357031035&permissions=2416004096&integration_type=0&scope=bot+applications.commands";

        // Redirection automatique si pas de debug
        if (urlParams.get('debug') !== 'true') {
            window.location.href = inviteUrl;
        }
    </script>
</head>
<body>

    <div class="container" id="content">
        <img src="https://bryan.ovh/bot/icon.ico" alt="Bot Icon" class="bot-icon">
        <div id="status-message">
            <h2 style="color: #52FFA9;">Redirection en cours...</h2>
            <p>Nous vous envoyons vers l'invitation Discord.</p>
            <p><a href="https://discord.com/oauth2/authorize?client_id=1474821138357031035&permissions=2416004096&integration_type=0&scope=bot+applications.commands">Cliquez ici si la page ne s'ouvre pas</a></p>
        </div>
    </div>

    <script>
        // Modification de l'interface si debug=true
        if (urlParams.get('debug') === 'true') {
            document.getElementById('status-message').innerHTML = `
                <span class="debug-badge">Mode Debug Activé</span>
                <h2 style="color: #FF5252;">Lien d'invitation bloqué</h2>
                <p>La redirection automatique a été désactivée pour vos tests.</p>
                <code>${inviteUrl}</code>
                <p><a href="?" style="color: #52FFA9;">Relancer sans le mode debug</a></p>
            `;
        }
    </script>
</body>
</html>