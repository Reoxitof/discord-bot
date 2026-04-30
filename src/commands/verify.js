const https = require('https');
const { EmbedBuilder } = require('discord.js');

const TWITCH_CLIENT_ID     = process.env.TWITCH_CLIENT_ID;
const TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;
const TWITCH_BROADCASTER_ID = process.env.TWITCH_BROADCASTER_ID; // ID numérique de reoxitof018

let appToken = null;
let tokenExpiry = 0;

async function getAppToken() {
  if (appToken && Date.now() < tokenExpiry) return appToken;
  return new Promise((resolve, reject) => {
    const postData = `client_id=${TWITCH_CLIENT_ID}&client_secret=${TWITCH_CLIENT_SECRET}&grant_type=client_credentials`;
    const req = https.request({
      hostname: 'id.twitch.tv',
      path: '/oauth2/token',
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        const json = JSON.parse(data);
        appToken = json.access_token;
        tokenExpiry = Date.now() + (json.expires_in - 60) * 1000;
        resolve(appToken);
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// Récupérer l'ID Twitch d'un username
async function getTwitchUserId(username) {
  const token = await getAppToken();
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.twitch.tv',
      path: `/helix/users?login=${username}`,
      method: 'GET',
      headers: {
        'Client-ID': TWITCH_CLIENT_ID,
        'Authorization': `Bearer ${token}`,
      },
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        const json = JSON.parse(data);
        resolve(json.data?.[0]?.id || null);
      });
    });
    req.on('error', reject);
    req.end();
  });
}

// Vérifier si un user Twitch follow le broadcaster
async function isFollowing(userId) {
  const token = await getAppToken();
  const broadcasterId = process.env.TWITCH_BROADCASTER_ID;
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.twitch.tv',
      path: `/helix/channels/followers?broadcaster_id=${broadcasterId}&user_id=${userId}`,
      method: 'GET',
      headers: {
        'Client-ID': TWITCH_CLIENT_ID,
        'Authorization': `Bearer ${token}`,
      },
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        const json = JSON.parse(data);
        resolve(json.total > 0);
      });
    });
    req.on('error', reject);
    req.end();
  });
}

module.exports = {
  name: 'verify',
  description: 'Vérifie si tu follow Reoxitof sur Twitch pour obtenir le rôle Follower',
  async execute(message) {
    // Récupérer les connexions Discord du membre
    const connections = await message.client.rest.get(
      `/users/${message.author.id}/connections`
    ).catch(() => null);

    // Chercher la connexion Twitch
    const twitchConnection = connections?.find?.(c => c.type === 'twitch');

    if (!twitchConnection) {
      const embed = new EmbedBuilder()
        .setColor(0xED4245)
        .setTitle('❌  Compte Twitch non lié')
        .setDescription(
          'Tu n\'as pas lié ton compte Twitch à Discord.\n\n' +
          '**Comment faire :**\n' +
          '1. Paramètres Discord → **Connexions**\n' +
          '2. Clique sur **Twitch**\n' +
          '3. Connecte-toi avec ton compte Twitch\n' +
          '4. Reviens et retape `!verify`'
        )
        .setFooter({ text: 'Reoxitof Gaming' });
      return message.reply({ embeds: [embed] });
    }

    const twitchUsername = twitchConnection.name;
    await message.reply(`🔍 Vérification du compte Twitch **${twitchUsername}**...`);

    try {
      // Récupérer l'ID Twitch
      const twitchUserId = await getTwitchUserId(twitchUsername);
      if (!twitchUserId) {
        return message.reply('❌ Impossible de trouver ton compte Twitch.');
      }

      // Vérifier si follow
      const following = await isFollowing(twitchUserId);

      if (!following) {
        const embed = new EmbedBuilder()
          .setColor(0xFFA500)
          .setTitle('❌  Tu ne follow pas Reoxitof')
          .setDescription(
            `Ton compte Twitch **${twitchUsername}** ne follow pas encore **reoxitof018**.\n\n` +
            `👉 [Follow sur Twitch](https://twitch.tv/reoxitof018) puis retape \`!verify\``
          )
          .setFooter({ text: 'Reoxitof Gaming' });
        return message.reply({ embeds: [embed] });
      }

      // Attribuer le rôle Follower
      const followerRole = message.guild.roles.cache.find(
        r => r.name.includes('Follower') || r.name.includes('follower')
      );

      if (!followerRole) {
        return message.reply('❌ Rôle Follower introuvable — contacte un admin.');
      }

      if (message.member.roles.cache.has(followerRole.id)) {
        return message.reply(`✅ Tu as déjà le rôle **${followerRole.name}** !`);
      }

      await message.member.roles.add(followerRole);

      const embed = new EmbedBuilder()
        .setColor(0x57F287)
        .setTitle('✅  Vérification réussie !')
        .setDescription(
          `Ton compte Twitch **${twitchUsername}** follow bien **reoxitof018** !\n\n` +
          `Tu as reçu le rôle **${followerRole}** 🎉`
        )
        .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: 'Reoxitof Gaming' })
        .setTimestamp();

      message.reply({ embeds: [embed] });

    } catch (err) {
      console.error('Erreur verify :', err.message);
      message.reply('❌ Une erreur est survenue. Réessaie plus tard.');
    }
  },
};
