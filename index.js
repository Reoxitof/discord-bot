require('dotenv').config();
const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
const http = require('http');
const db = require('./src/database');

// Healthcheck IMMÉDIAT — répond avant même que la DB soit prête
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('OK');
}).listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Healthcheck sur 0.0.0.0:${PORT}`);
});

async function main() {
  // Init DB avec retry
  let dbOk = false;
  for (let i = 0; i < 5; i++) {
    try {
      await db.init();
      dbOk = true;
      console.log('✅ Base de données initialisée');
      break;
    } catch (e) {
      console.log(`[DB] Tentative ${i+1}/5 échouée : ${e.message}`);
      await new Promise(r => setTimeout(r, 3000));
    }
  }
  if (!dbOk) console.log('[DB] ⚠️ DB non disponible — le bot continue sans DB');

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
    partials: [Partials.Message, Partials.Channel, Partials.ThreadMember],
  });

  client.commands = new Collection();

  // Charger les commandes
  const commandsPath = path.join(__dirname, 'src', 'commands');
  for (const file of fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'))) {
    const cmd = require(path.join(commandsPath, file));
    if (cmd.name) {
      client.commands.set(cmd.name, cmd);
      console.log(`  ✅ Commande : !${cmd.name}`);
    }
  }

  // Charger les événements (supporte export tableau ou objet)
  const eventsPath = path.join(__dirname, 'src', 'events');
  for (const file of fs.readdirSync(eventsPath).filter(f => f.endsWith('.js'))) {
    const exported = require(path.join(eventsPath, file));
    const events = Array.isArray(exported) ? exported : [exported];
    for (const event of events) {
      if (!event.name) continue;
      if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
      } else {
        client.on(event.name, (...args) => event.execute(...args, client));
      }
      console.log(`  ✅ Événement : ${event.name} (${file})`);
    }
  }

  await client.login(process.env.BOT_TOKEN);
  console.log('✅ Bot connecté');
}

main().catch(err => {
  console.error('❌ Erreur fatale :', err.message);
  process.exit(1);
});
