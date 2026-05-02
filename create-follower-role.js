require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const https = require('https');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

async function getTwitchBroadcasterId() {
  return new Promise((resolve, reject) => {
    const postData = `client_id=${process.env.TWITCH_CLIENT_ID}&client_secret=${process.env.TWITCH_CLIENT_SECRET}&grant_type=client_credentials`;
    const tokenReq = https.request({
      hostname: 'id.twitch.tv',
      path: '/oauth2/token',
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', async () => {
        const { access_token } = JSON.parse(data);
        // Récupérer l'ID de reoxitof
        const userReq = https.request({
          hostname: 'api.twitch.tv',
          path: `/helix/users?login=reoxitof`,
          method: 'GET',
          headers: {
            'Client-ID': process.env.TWITCH_CLIENT_ID,
            'Authorization': `Bearer ${access_token}`,
          },
        }, res2 => {
          let d = '';
          res2.on('data', c => d += c);
          res2.on('end', () => {
            const json = JSON.parse(d);
            resolve(json.data?.[0]?.id || null);
          });
        });
        userReq.on('error', reject);
        userReq.end();
      });
    });
    tokenReq.on('error', reject);
    tokenReq.write(postData);
    tokenReq.end();
  });
}

client.once('clientReady', async () => {
  console.log(`✅ Connecté en tant que ${client.user.tag}`);

  const guild = client.guilds.cache.get(process.env.GUILD_ID);
  if (!guild) { console.error('❌ Serveur introuvable'); process.exit(1); }

  await guild.roles.fetch();

  // Récupérer l'ID broadcaster Twitch
  const broadcasterId = await getTwitchBroadcasterId();
  console.log(`📺 Broadcaster ID Twitch : ${broadcasterId}`);
  console.log(`👉 Ajoute cette variable dans Railway : TWITCH_BROADCASTER_ID=${broadcasterId}`);

  // Créer le rôle Follower s'il n'existe pas
  const existing = guild.roles.cache.find(r => r.name.includes('Follower'));
  if (existing) {
    console.log(`✅ Rôle Follower existe déjà : ${existing.name}`);
  } else {
    const role = await guild.roles.create({
      name: '📺 Follower',
      color: 0x9146FF, // Violet Twitch
      hoist: false,
      mentionable: false,
      reason: 'Rôle Follower Twitch',
    });
    console.log(`✅ Rôle créé : ${role.name}`);
  }

  client.destroy();
  process.exit(0);
});

client.login(process.env.BOT_TOKEN);
