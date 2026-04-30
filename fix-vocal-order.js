require('dotenv').config();
const { Client, GatewayIntentBits, ChannelType } = require('discord.js');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('clientReady', async () => {
  console.log(`✅ Connecté en tant que ${client.user.tag}`);

  const guild = client.guilds.cache.get(process.env.GUILD_ID);
  if (!guild) { console.error('❌ Serveur introuvable'); process.exit(1); }

  await guild.channels.fetch();

  // Trouver la catégorie VOCAL
  const vocalCategory = guild.channels.cache.find(
    c => c.type === ChannelType.GuildCategory && c.name.toLowerCase().includes('vocal')
  );
  if (!vocalCategory) { console.error('❌ Catégorie VOCAL non trouvée'); process.exit(1); }

  // Récupérer tous les salons vocaux de la catégorie
  const vocalChannels = guild.channels.cache
    .filter(c => c.type === ChannelType.GuildVoice && c.parentId === vocalCategory.id)
    .sort((a, b) => a.position - b.position);

  console.log('\n📋 Ordre actuel :');
  vocalChannels.forEach(c => console.log(`  ${c.position} — ${c.name}`));

  // Ordre souhaité : Stream en premier, AFK en dernier
  const ordered = [];
  const streamChannel = vocalChannels.find(c => c.name.toLowerCase().includes('stream'));
  const afkChannel    = vocalChannels.find(c => c.name.toLowerCase().includes('afk'));
  const others        = vocalChannels.filter(c => c.id !== streamChannel?.id && c.id !== afkChannel?.id);

  if (streamChannel) ordered.push(streamChannel);
  others.forEach(c => ordered.push(c));
  if (afkChannel) ordered.push(afkChannel);

  // Appliquer le nouvel ordre
  const positions = ordered.map((c, i) => ({ channel: c.id, position: i }));
  await guild.channels.setPositions(positions).catch(err => {
    console.error('❌ Erreur setPositions :', err.message);
  });

  console.log('\n✅ Nouvel ordre :');
  ordered.forEach((c, i) => console.log(`  ${i} — ${c.name}`));

  client.destroy();
  process.exit(0);
});

client.login(process.env.BOT_TOKEN);
