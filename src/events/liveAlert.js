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

  const twitchUsername = process.env.TWITCH_USERNAME || 'reoxitof';

  // Cherche un salon avec live, annonce, stream dans le nom
  const liveChannel = guild.channels.cache.find(
    c => c.isTextBased && c.isTextBased() && (
      c.name.includes('live') ||
      c.name.includes('stream') ||
      c.name.includes('annonce') ||
      c.name.includes('announce')
    )
  );
  if (!liveChannel) {
    console.log('❌ Salon live introuvable. Salons disponibles:', guild.channels.cache.filter(c => c.isTextBased && c.isTextBased()).map(c => c.name).join(', '));
    return;
  }

  const embed = new EmbedBuilder()
    .setColor(0x9B59B6)
    .setTitle(`🔴  ${twitchUsername.toUpperCase()} EST EN LIVE !`)
    .setURL(`https://twitch.tv/${twitchUsername}`)
    .setDescription(
      `**${streamData.title || 'Stream en cours'}**\n\n` +
      `🎮 **Jeu :** ${streamData.game_name || 'Non renseigné'}\n` +
      `👀 **Viewers :** ${streamData.viewer_count}\n\n` +
      `👉 [Rejoindre le stream](https://twitch.tv/${twitchUsername})`
    )
    .setImage(`https://static-cdn.jtvnw.net/previews-ttv/live_user_${twitchUsername}-1280x720.jpg?t=${Date.now()}`)
    .setFooter({ text: `${twitchUsername} • Twitch`, iconURL: guild.iconURL() })
    .setTimestamp();

  await liveChannel.send({
    content: `@everyone 🔴 **${twitchUsername} est en live !**`,
    embeds: [embed],
  }).catch(e => console.log('❌ Erreur envoi alerte live:', e.message));

  console.log('🔴 Alerte live envoyée dans #' + liveChannel.name);
}

async function sendEndAlert(client) {
  const guild = client.guilds.cache.get(process.env.GUILD_ID);
  if (!guild) return;

  const twitchUsername = process.env.TWITCH_USERNAME || 'reoxitof';

  const liveChannel = guild.channels.cache.find(
    c => c.isTextBased && c.isTextBased() && (
      c.name.includes('live') ||
      c.name.includes('stream') ||
      c.name.includes('annonce') ||
      c.name.includes('announce')
    )
  );
  if (!liveChannel) return;

  const embed = new EmbedBuilder()
    .setColor(0x95A5A6)
    .setTitle('⚫  Stream terminé')
    .setDescription(
      `Le stream de **${twitchUsername}** est terminé.\n\n` +
      'Merci à tous d\'avoir été là ! 🙏\n' +
      `👉 [Voir les VODs](https://twitch.tv/${twitchUsername}/videos)`
    )
    .setFooter({ text: `${twitchUsername} • Twitch`, iconURL: guild.iconURL() })
    .setTimestamp();

  await liveChannel.send({ embeds: [embed] }).catch(() => {});
  console.log('⚫ Alerte fin de stream envoyée.');
}

module.exports = { start };
