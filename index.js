require('dotenv').config();
const { Client, GatewayIntentBits, Partials, Collection, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const http = require('http');
const db = require('./src/database');
const { isLive } = require('./src/twitch');

// Serveur HTTP minimal pour Sliplane healthcheck
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.writeHead(200);
  res.end('OK');
}).listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Healthcheck server listening on 0.0.0.0:${PORT}`);
});

// ── Notification Live Twitch ──────────────────────
let wasLive = false;
let liveMessageId = null;

async function checkLiveStatus(client) {
  try {
    const CHANNEL_ID = process.env.LIVE_ALERT_CHANNEL_ID;
    if (!CHANNEL_ID) return;

    const stream = await isLive();
    const nowLive = !!stream;

    if (nowLive && !wasLive) {
      // Vient de passer en live → envoyer la notif
      wasLive = true;
      const channel = await client.channels.fetch(CHANNEL_ID).catch(() => null);
      if (!channel) return;

      const embed = new EmbedBuilder()
        .setColor(0x9b59b6)
        .setTitle(`🔴 ${stream.user_name} est en LIVE !`)
        .setDescription(`**${stream.title || 'Stream en cours'}**`)
        .addFields(
          { name: '🎮 Jeu', value: stream.game_name || 'Non renseigné', inline: true },
          { name: '👥 Viewers', value: String(stream.viewer_count || 0), inline: true }
        )
        .setThumbnail(`https://static-cdn.jtvnw.net/previews-ttv/live_user_${stream.user_login}-320x180.jpg`)
        .setURL(`https://twitch.tv/${stream.user_login}`)
        .setTimestamp()
        .setFooter({ text: 'Twitch Live' });

      const msg = await channel.send({
        content: `@everyone 🔴 **${stream.user_name}** est en live sur Twitch !`,
        embeds: [embed]
      });
      liveMessageId = msg.id;
      console.log(`[LIVE] Notification envoyée pour ${stream.user_name}`);

    } else if (!nowLive && wasLive) {
      // Vient de terminer le live
      wasLive = false;
      liveMessageId = null;
      console.log('[LIVE] Stream terminé');
    }
  } catch (e) {
    console.log('[LIVE] Erreur check live :', e.message);
  }
}

async function main() {
  await db.init();
  console.log('✅ Base de données initialisée');

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildMessageReactions,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildVoiceStates,
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction],
  });

  client.commands = new Collection();

  // ── Charger les commandes ──────────────────────
  const commandsPath = path.join(__dirname, 'src', 'commands');
  const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));
  for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    if (command.name) {
      client.commands.set(command.name, command);
      console.log(`  ✅ Commande chargée : !${command.name}`);
    }
  }

  // ── Charger les événements ─────────────────────
  const eventsPath = path.join(__dirname, 'src', 'events');
  const eventFiles = fs.readdirSync(eventsPath).filter(f => f.endsWith('.js'));
  for (const file of eventFiles) {
    const event = require(path.join(eventsPath, file));
    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args, client));
    } else {
      client.on(event.name, (...args) => event.execute(...args, client));
    }
    console.log(`  ✅ Événement chargé : ${event.name}`);
  }

  // ── Connexion ──────────────────────────────────
  await client.login(process.env.BOT_TOKEN);

  // ── Démarrer le check live toutes les 2 minutes ──
  client.once('ready', () => {
    console.log(`✅ Bot connecté : ${client.user.tag}`);
    // Premier check après 30s, puis toutes les 2 min
    setTimeout(() => checkLiveStatus(client), 30000);
    setInterval(() => checkLiveStatus(client), 2 * 60 * 1000);
  });
}

main().catch(err => {
  console.error('❌ Erreur fatale :', err.message);
  process.exit(1);
});
