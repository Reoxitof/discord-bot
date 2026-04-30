require('dotenv').config();
const { Client, GatewayIntentBits, ChannelType, PermissionFlagsBits } = require('discord.js');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('clientReady', async () => {
  console.log(`✅ Connecté en tant que ${client.user.tag}`);

  const guild = client.guilds.cache.get(process.env.GUILD_ID);
  if (!guild) { console.error('❌ Serveur introuvable'); process.exit(1); }

  await guild.roles.fetch();
  await guild.channels.fetch();

  const everyoneRole = guild.roles.everyone;
  const viewerRole   = guild.roles.cache.find(r => r.name.includes('Viewer'));
  const reoxitofRole = guild.roles.cache.find(r => r.name.includes('Reoxitof'));
  const modRole      = guild.roles.cache.find(r => r.name.includes('Modérateur'));

  // Supprimer l'ancien salon s'il existe
  const existing = guild.channels.cache.find(c => c.name.includes('Stream de Reoxitof'));
  if (existing) {
    await existing.delete().catch(() => {});
    console.log('🗑️ Ancien salon supprimé');
  }

  const vocalCategory = guild.channels.cache.find(
    c => c.type === ChannelType.GuildCategory && c.name.toLowerCase().includes('vocal')
  );

  const permissionOverwrites = [
    // @everyone : ne voit pas, ne rejoint pas
    {
      id: everyoneRole.id,
      deny: [
        PermissionFlagsBits.Connect,
        PermissionFlagsBits.Speak,
        PermissionFlagsBits.Stream,
        PermissionFlagsBits.ViewChannel,
      ],
    },
  ];

  // Viewer : voit + écoute uniquement, ne rejoint PAS
  if (viewerRole) {
    permissionOverwrites.push({
      id: viewerRole.id,
      deny: [PermissionFlagsBits.Connect, PermissionFlagsBits.Speak, PermissionFlagsBits.Stream],
      allow: [PermissionFlagsBits.ViewChannel],
    });
  }

  // 👑 Reoxitof : accès total
  if (reoxitofRole) {
    permissionOverwrites.push({
      id: reoxitofRole.id,
      allow: [
        PermissionFlagsBits.Connect,
        PermissionFlagsBits.Speak,
        PermissionFlagsBits.Stream,
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.MuteMembers,
        PermissionFlagsBits.DeafenMembers,
      ],
    });
  }

  // 🛡️ Modérateur : accès total
  if (modRole) {
    permissionOverwrites.push({
      id: modRole.id,
      allow: [
        PermissionFlagsBits.Connect,
        PermissionFlagsBits.Speak,
        PermissionFlagsBits.Stream,
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.MuteMembers,
        PermissionFlagsBits.DeafenMembers,
      ],
    });
  }

  const streamVocal = await guild.channels.create({
    name: '🔴 Stream de Reoxitof',
    type: ChannelType.GuildVoice,
    parent: vocalCategory?.id,
    userLimit: 0,
    permissionOverwrites,
    reason: 'Salon vocal stream privé',
  });

  // Remettre en première position dans la catégorie
  const vocalChannels = guild.channels.cache
    .filter(c => c.type === ChannelType.GuildVoice && c.parentId === vocalCategory?.id && c.id !== streamVocal.id)
    .sort((a, b) => a.position - b.position);

  const afk    = vocalChannels.find(c => c.name.toLowerCase().includes('afk'));
  const others = vocalChannels.filter(c => c.id !== afk?.id);

  const ordered = [streamVocal, ...others];
  if (afk) ordered.push(afk);

  await guild.channels.setPositions(ordered.map((c, i) => ({ channel: c.id, position: i }))).catch(() => {});

  console.log('\n✅ Salon créé avec les bonnes permissions :');
  console.log('   👑 Reoxitof    → peut rejoindre, parler, streamer');
  console.log('   🛡️ Modérateur  → peut rejoindre, parler, streamer');
  console.log('   👀 Viewer      → voit le salon, écoute uniquement');
  console.log('   @everyone     → ne voit pas le salon');
  console.log('\n✅ Ordre vocal mis à jour (Stream en premier, AFK en dernier)\n');

  client.destroy();
  process.exit(0);
});

client.login(process.env.BOT_TOKEN);
