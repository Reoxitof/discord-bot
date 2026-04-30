const { EmbedBuilder } = require('discord.js');
const { isLive } = require('../twitch');

const CHECK_INTERVAL = 2 * 60 * 1000; // Vérifier toutes les 2 minutes
let wasLive = false;

async function start(client) {
  console.log('📡 Surveillance Twitch démarrée (vérification toutes les 2 min)...');

  // Vérification immédiate au démarrage
  await check(client);

  // Puis toutes les 2 minutes
  setInterval(() => check(client), CHECK_INTERVAL);
}

async function check(client) {
  try {
    const streamData = await isLive();

    if (streamData && !wasLive) {
      wasLive = true;
      await sendLiveAlert(client, streamData);
    } else if (!streamData && wasLive) {
      wasLive = false;
      await sendEndAlert(client);
    }
  } catch (err) {
    console.error('❌ Erreur vérification Twitch :', err.message);
  }
}

async function sendLiveAlert(client, streamData) {
  const guild = client.guilds.cache.get(process.env.GUILD_ID);
  if (!guild) return;

  const liveChannel = guild.channels.cache.find(
    c => c.name.includes('live-alert') || c.name.includes('live')
  );
  if (!liveChannel) return;

  const embed = new EmbedBuilder()
    .setColor(0xFF0000)
    .setTitle('🔴  REOXITOF EST EN LIVE !')
    .setURL('https://twitch.tv/reoxitof018')
    .setDescription(
      `**${streamData.title || 'Stream en cours'}**\n\n` +
      `🎮 **Jeu :** ${streamData.game_name || 'Non renseigné'}\n` +
      `👀 **Viewers :** ${streamData.viewer_count}\n\n` +
      `👉 [Rejoindre le stream](https://twitch.tv/reoxitof018)`
    )
    .setImage(`https://static-cdn.jtvnw.net/previews-ttv/live_user_reoxitof018-1280x720.jpg?t=${Date.now()}`)
    .setFooter({ text: 'Reoxitof Gaming • Twitch', iconURL: guild.iconURL() })
    .setTimestamp();

  await liveChannel.send({
    content: `@everyone 🔴 **Reoxitof est en live !**`,
    embeds: [embed],
  }).catch(() => {});

  console.log('🔴 Alerte live envoyée !');
}

async function sendEndAlert(client) {
  const guild = client.guilds.cache.get(process.env.GUILD_ID);
  if (!guild) return;

  const liveChannel = guild.channels.cache.find(
    c => c.name.includes('live-alert') || c.name.includes('live')
  );
  if (!liveChannel) return;

  const embed = new EmbedBuilder()
    .setColor(0x95A5A6)
    .setTitle('⚫  Stream terminé')
    .setDescription(
      'Le stream de **Reoxitof** est terminé.\n\n' +
      'Merci à tous d\'avoir été là ! 🙏\n' +
      '👉 [Voir les VODs](https://twitch.tv/reoxitof018/videos)'
    )
    .setFooter({ text: 'Reoxitof Gaming • Twitch', iconURL: guild.iconURL() })
    .setTimestamp();

  await liveChannel.send({ embeds: [embed] }).catch(() => {});
  console.log('⚫ Alerte fin de stream envoyée.');
}

module.exports = { start };
