const https = require('https');
const { EmbedBuilder } = require('discord.js');

const YOUTUBE_API_KEY  = process.env.YOUTUBE_API_KEY;
const YOUTUBE_CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID;
const CHECK_INTERVAL   = 10 * 60 * 1000; // Vérifier toutes les 10 minutes

let lastVideoId = null;

async function getLatestVideo() {
  return new Promise((resolve, reject) => {
    const url = `/youtube/v3/search?part=snippet&channelId=${YOUTUBE_CHANNEL_ID}&maxResults=1&order=date&type=video&key=${YOUTUBE_API_KEY}`;

    const options = {
      hostname: 'www.googleapis.com',
      path: url,
      method: 'GET',
    };

    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.items && json.items.length > 0) {
            const video = json.items[0];
            resolve({
              id: video.id.videoId,
              title: video.snippet.title,
              description: video.snippet.description?.slice(0, 200) || '',
              thumbnail: video.snippet.thumbnails?.high?.url || video.snippet.thumbnails?.default?.url,
              publishedAt: video.snippet.publishedAt,
              channelTitle: video.snippet.channelTitle,
            });
          } else {
            resolve(null);
          }
        } catch (err) {
          reject(err);
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function start(client) {
  if (!YOUTUBE_API_KEY || !YOUTUBE_CHANNEL_ID) {
    console.log('⚠️ YouTube API non configurée — alertes désactivées');
    return;
  }

  console.log('📺 Surveillance YouTube démarrée (vérification toutes les 10 min)...');

  // Récupérer la dernière vidéo au démarrage sans alerter
  try {
    const video = await getLatestVideo();
    if (video) {
      lastVideoId = video.id;
      console.log(`📺 Dernière vidéo connue : ${video.title}`);
    }
  } catch (err) {
    console.error('❌ Erreur YouTube init :', err.message);
  }

  // Vérifier toutes les 10 minutes
  setInterval(async () => {
    try {
      const video = await getLatestVideo();
      if (!video) return;

      if (video.id !== lastVideoId) {
        lastVideoId = video.id;
        await sendYouTubeAlert(client, video);
      }
    } catch (err) {
      console.error('❌ Erreur vérification YouTube :', err.message);
    }
  }, CHECK_INTERVAL);
}

async function sendYouTubeAlert(client, video) {
  const guild = client.guilds.cache.get(process.env.GUILD_ID);
  if (!guild) return;

  // Envoyer dans le salon annonces
  const announceChannel = guild.channels.cache.find(
    c => c.name.includes('annonces') || c.name.includes('announce')
  );
  if (!announceChannel) return;

  const embed = new EmbedBuilder()
    .setColor(0xFF0000)
    .setTitle('🎬  Nouvelle vidéo YouTube !')
    .setURL(`https://www.youtube.com/watch?v=${video.id}`)
    .setDescription(
      `**${video.title}**\n\n` +
      `${video.description ? video.description + '\n\n' : ''}` +
      `👉 [Regarder la vidéo](https://www.youtube.com/watch?v=${video.id})`
    )
    .setImage(video.thumbnail)
    .setFooter({ text: `${video.channelTitle} • YouTube`, iconURL: guild.iconURL() })
    .setTimestamp(new Date(video.publishedAt));

  await announceChannel.send({
    content: `@everyone 🎬 **Nouvelle vidéo de Reoxitof !**`,
    embeds: [embed],
  }).catch(() => {});

  console.log(`📺 Alerte YouTube envoyée : ${video.title}`);
}

module.exports = { start };
