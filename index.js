require('dotenv').config();
const { Client, GatewayIntentBits, Partials, Collection, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const http = require('http');
const db = require('./src/database');

// Serveur HTTP minimal pour Sliplane healthcheck
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.writeHead(200);
  res.end('OK');
}).listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Healthcheck server listening on 0.0.0.0:${PORT}`);
});

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
    partials: [Partials.Message, Partials.Channel, Partials.Reaction, Partials.ThreadMember],
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
    const eventExport = require(path.join(eventsPath, file));

    // Supporte les fichiers qui exportent un tableau d'événements (ex: interimThread.js)
    const events = Array.isArray(eventExport) ? eventExport : [eventExport];

    for (const event of events) {
      if (!event.name) continue;
      if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
      } else {
        client.on(event.name, (...args) => event.execute(...args, client));
      }
      console.log(`  ✅ Événement chargé : ${event.name} (${file})`);
    }
  }

  // ── Connexion ──────────────────────────────────
  await client.login(process.env.BOT_TOKEN);
}

main().catch(err => {
  console.error('❌ Erreur fatale :', err.message);
  process.exit(1);
});
