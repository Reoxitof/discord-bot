require('dotenv').config();
const { Client, GatewayIntentBits, ChannelType } = require('discord.js');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('clientReady', async () => {
  console.log(`✅ Connecté en tant que ${client.user.tag}`);

  const guild = client.guilds.cache.get(process.env.GUILD_ID);
  if (!guild) { console.error('❌ Serveur introuvable'); process.exit(1); }

  await guild.channels.fetch();

  // Supprimer Stream Room
  const streamRoom = guild.channels.cache.find(
    c => c.type === ChannelType.GuildVoice && c.name.toLowerCase().includes('stream room')
  );

  if (streamRoom) {
    await streamRoom.delete('Fusion avec Stream de Reoxitof').catch(() => {});
    console.log('🗑️ Stream Room supprimé');
  } else {
    console.log('⚠️ Stream Room non trouvé');
  }

  console.log('✅ Terminé — seul 🔴 Stream de Reoxitof reste\n');

  client.destroy();
  process.exit(0);
});

client.login(process.env.BOT_TOKEN);
