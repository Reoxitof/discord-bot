require('dotenv').config();
const { Client, GatewayIntentBits, ChannelType, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('clientReady', async () => {
  console.log(`✅ Connecté en tant que ${client.user.tag}`);

  const guild = client.guilds.cache.get(process.env.GUILD_ID);
  if (!guild) { console.error('❌ Serveur introuvable'); process.exit(1); }

  await guild.roles.fetch();
  await guild.channels.fetch();

  const everyoneRole = guild.roles.everyone;
  const modRole      = guild.roles.cache.find(r => r.name.includes('Modérateur'));
  const staffRole    = guild.roles.cache.find(r => r.name.includes('Staff'));
  const reoxitofRole = guild.roles.cache.find(r => r.name.includes('Reoxitof'));

  const staffCategory = guild.channels.cache.find(
    c => c.type === ChannelType.GuildCategory && c.name.toLowerCase().includes('staff')
  );

  // Supprimer si déjà existant
  const existing = guild.channels.cache.find(c => c.name.includes('staff-commandes'));
  if (existing) { await existing.delete().catch(() => {}); }

  // Créer le salon
  const channel = await guild.channels.create({
    name: '📋・staff-commandes',
    type: ChannelType.GuildText,
    parent: staffCategory?.id,
    topic: 'Toutes les commandes du bot Reoxitof',
    permissionOverwrites: [
      { id: everyoneRole.id, deny: [PermissionFlagsBits.ViewChannel] },
      { id: modRole?.id,     allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
      { id: staffRole?.id,   allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
      { id: reoxitofRole?.id,allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
    ].filter(p => p.id),
    reason: 'Salon commandes staff',
  });

  console.log(`✅ Salon créé : ${channel.name}`);

  // Envoyer les embeds
  const embedHeader = new EmbedBuilder()
    .setColor(0xFF4500)
    .setTitle('📋  COMMANDES — Reoxitof Bot')
    .setDescription('> Préfixe : **`!`** — Réservé au staff sauf mention contraire.')
    .setThumbnail(client.user.displayAvatarURL())
    .setTimestamp();

  const embedStream = new EmbedBuilder()
    .setColor(0xFF0000)
    .setTitle('🔴  Commandes Stream')
    .addFields(
      { name: '`!jeu [nom]`', value: '▸ Affiche le jeu en cours\n▸ Staff : `!jeu Fortnite` pour modifier' },
      { name: '`!clip`', value: '▸ Lien pour créer un clip Twitch' },
      { name: '`!social`', value: '▸ Réseaux sociaux de Reoxitof' },
      { name: '`!uptime`', value: '▸ Temps de fonctionnement du bot' },
    );

  const embedMod = new EmbedBuilder()
    .setColor(0xE74C3C)
    .setTitle('🛡️  Commandes Modération')
    .addFields(
      { name: '`!warn @user <raison>`', value: '▸ Avertit un membre\n▸ 3 warns = mute 10 min auto' },
      { name: '`!warns @user`', value: '▸ Voir les avertissements d\'un membre' },
      { name: '`!mute @user <durée> [raison]`', value: '▸ Mute — Ex: `!mute @user 10m spam`\n▸ Durées: `10s` `5m` `1h` `1d`' },
      { name: '`!kick @user [raison]`', value: '▸ Expulse un membre' },
      { name: '`!ban @user [raison]`', value: '▸ Bannit un membre définitivement' },
      { name: '`!clear <nombre>`', value: '▸ Supprime 1 à 100 messages' },
    );

  const embedLevels = new EmbedBuilder()
    .setColor(0xFFD700)
    .setTitle('📊  Niveaux & Giveaway')
    .addFields(
      { name: '`!rank [@user]`', value: '▸ Niveau et XP d\'un membre' },
      { name: '`!top`', value: '▸ Top 10 membres les plus actifs' },
      { name: '`!gstart <durée> <gagnants> <prix>`', value: '▸ Lance un giveaway\n▸ Ex: `!gstart 1h 1 Abonnement Twitch`' },
      { name: '`!greroll <message_id>`', value: '▸ Nouveau gagnant pour un giveaway' },
      { name: '`!reactionrole <msg_id> <emoji> <@role>`', value: '▸ Crée un reaction-role' },
    );

  const embedAuto = new EmbedBuilder()
    .setColor(0x3498DB)
    .setTitle('⚙️  Automatismes')
    .addFields(
      { name: '✅ Validation règlement', value: '▸ Nouveau membre → réagit ✅ → rôle Viewer' },
      { name: '🔴 Alertes live Twitch', value: '▸ Détection auto toutes les 2 min → alerte dans 🔴・live-alert' },
      { name: '🛡️ Anti-spam', value: '▸ 5 messages en 5s → mute 30s auto' },
      { name: '🔗 Anti-lien', value: '▸ Liens non autorisés supprimés auto' },
      { name: '⭐ XP', value: '▸ +15 à +25 XP/message (cooldown 1 min)' },
      { name: '📝 Logs', value: '▸ Joins, leaves, bans, kicks, warns, messages supprimés/modifiés, rôles' },
    )
    .setFooter({ text: 'Reoxitof Gaming Bot • !help pour la version publique' })
    .setTimestamp();

  await channel.send({ embeds: [embedHeader] });
  await channel.send({ embeds: [embedStream] });
  await channel.send({ embeds: [embedMod] });
  await channel.send({ embeds: [embedLevels] });
  await channel.send({ embeds: [embedAuto] });

  console.log('✅ Commandes envoyées dans #staff-commandes\n');

  client.destroy();
  process.exit(0);
});

client.login(process.env.BOT_TOKEN);
