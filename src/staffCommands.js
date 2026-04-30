const { EmbedBuilder } = require('discord.js');

async function sendStaffCommands(client) {
  const guild = client.guilds.cache.get(process.env.GUILD_ID);
  if (!guild) return;

  // Trouver ou créer le salon staff-commandes
  let staffChannel = guild.channels.cache.find(
    c => c.name.includes('staff-commandes') || c.name.includes('staff-commands')
  );

  if (!staffChannel) {
    // Trouver la catégorie STAFF
    const staffCategory = guild.channels.cache.find(
      c => c.type === 4 && c.name.toLowerCase().includes('staff')
    );

    const { ChannelType, PermissionFlagsBits } = require('discord.js');
    const modRole = guild.roles.cache.find(r => r.name.includes('Modérateur'));
    const staffRole = guild.roles.cache.find(r => r.name.includes('Staff'));

    staffChannel = await guild.channels.create({
      name: '📋・staff-commandes',
      type: ChannelType.GuildText,
      parent: staffCategory?.id,
      topic: 'Toutes les commandes du bot Reoxitof',
      permissionOverwrites: [
        { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
        { id: modRole?.id, allow: [PermissionFlagsBits.ViewChannel] },
        { id: staffRole?.id, allow: [PermissionFlagsBits.ViewChannel] },
      ].filter(p => p.id),
      reason: 'Salon commandes staff',
    });

    console.log('✅ Salon staff-commandes créé');
  }

  // Vider les anciens messages du bot
  const messages = await staffChannel.messages.fetch({ limit: 20 }).catch(() => null);
  if (messages) {
    const botMsgs = messages.filter(m => m.author.id === client.user.id);
    for (const msg of botMsgs.values()) await msg.delete().catch(() => {});
  }

  // ── Embed 1 : Header ─────────────────────────
  const embedHeader = new EmbedBuilder()
    .setColor(0xFF4500)
    .setTitle('📋  COMMANDES — Reoxitof Bot')
    .setDescription(
      '> Ce salon répertorie toutes les commandes disponibles.\n' +
      '> Préfixe : **`!`** — Réservé au staff sauf mention contraire.'
    )
    .setThumbnail(client.user.displayAvatarURL())
    .setTimestamp();

  // ── Embed 2 : Stream ─────────────────────────
  const embedStream = new EmbedBuilder()
    .setColor(0xFF0000)
    .setTitle('🔴  Commandes Stream')
    .addFields(
      {
        name: '`!jeu [nom]`',
        value: '▸ Affiche le jeu en cours\n▸ Staff : `!jeu Fortnite` pour le modifier',
        inline: false,
      },
      {
        name: '`!clip`',
        value: '▸ Envoie le lien pour créer un clip Twitch',
        inline: false,
      },
      {
        name: '`!social`',
        value: '▸ Affiche tous les réseaux sociaux de Reoxitof',
        inline: false,
      },
      {
        name: '`!uptime`',
        value: '▸ Affiche depuis combien de temps le bot tourne',
        inline: false,
      },
    );

  // ── Embed 3 : Modération ─────────────────────
  const embedMod = new EmbedBuilder()
    .setColor(0xE74C3C)
    .setTitle('🛡️  Commandes Modération')
    .addFields(
      {
        name: '`!warn @user <raison>`',
        value: '▸ Avertit un membre\n▸ 3 warns = mute automatique 10 min\n▸ Permission : Gérer les messages',
        inline: false,
      },
      {
        name: '`!warns @user`',
        value: '▸ Affiche tous les avertissements d\'un membre\n▸ Permission : Gérer les messages',
        inline: false,
      },
      {
        name: '`!mute @user <durée> [raison]`',
        value: '▸ Mute un membre\n▸ Durées : `10s` `5m` `1h` `1d`\n▸ Ex : `!mute @user 10m spam`\n▸ Permission : Modérer les membres',
        inline: false,
      },
      {
        name: '`!kick @user [raison]`',
        value: '▸ Expulse un membre du serveur\n▸ Permission : Expulser des membres',
        inline: false,
      },
      {
        name: '`!ban @user [raison]`',
        value: '▸ Bannit un membre définitivement\n▸ Supprime ses messages des dernières 24h\n▸ Permission : Bannir des membres',
        inline: false,
      },
      {
        name: '`!clear <nombre>`',
        value: '▸ Supprime entre 1 et 100 messages\n▸ Ex : `!clear 20`\n▸ Permission : Gérer les messages',
        inline: false,
      },
    );

  // ── Embed 4 : Niveaux & Stats ────────────────
  const embedLevels = new EmbedBuilder()
    .setColor(0xFFD700)
    .setTitle('📊  Commandes Niveaux & Stats')
    .addFields(
      {
        name: '`!rank [@user]`',
        value: '▸ Affiche ton niveau, XP et classement\n▸ Mentionne quelqu\'un pour voir son rang\n▸ Disponible pour tous',
        inline: false,
      },
      {
        name: '`!top`',
        value: '▸ Affiche le top 10 des membres les plus actifs\n▸ Disponible pour tous',
        inline: false,
      },
    );

  // ── Embed 5 : Giveaway ───────────────────────
  const embedGiveaway = new EmbedBuilder()
    .setColor(0x9B59B6)
    .setTitle('🎁  Commandes Giveaway')
    .addFields(
      {
        name: '`!gstart <durée> <gagnants> <prix>`',
        value: '▸ Lance un giveaway\n▸ Ex : `!gstart 1h 1 Abonnement Twitch`\n▸ Durées : `10m` `1h` `1d`\n▸ Permission : Gérer le serveur',
        inline: false,
      },
      {
        name: '`!greroll <message_id>`',
        value: '▸ Retire un nouveau gagnant pour un giveaway terminé\n▸ Permission : Gérer le serveur',
        inline: false,
      },
    );

  // ── Embed 6 : Rôles ──────────────────────────
  const embedRoles = new EmbedBuilder()
    .setColor(0x1ABC9C)
    .setTitle('🎭  Commandes Rôles')
    .addFields(
      {
        name: '`!reactionrole <message_id> <emoji> <@role>`',
        value: '▸ Crée un reaction-role sur un message\n▸ Ex : `!reactionrole 123456 🎮 @Gamer`\n▸ Permission : Gérer les rôles',
        inline: false,
      },
    );

  // ── Embed 7 : Automatismes ───────────────────
  const embedAuto = new EmbedBuilder()
    .setColor(0x3498DB)
    .setTitle('⚙️  Automatismes du bot')
    .addFields(
      {
        name: '✅ Validation règlement',
        value: '▸ Nouveau membre → voit uniquement 📌・règles\n▸ Réagit ✅ → reçoit le rôle 👀 Viewer',
        inline: false,
      },
      {
        name: '🔴 Alertes live Twitch',
        value: '▸ Vérification toutes les 2 minutes\n▸ Alerte dans 🔴・live-alert au démarrage du stream\n▸ Message de fin quand le stream se termine',
        inline: false,
      },
      {
        name: '🛡️ Anti-spam',
        value: '▸ 5 messages en 5 secondes → mute 30 secondes automatique',
        inline: false,
      },
      {
        name: '🔗 Anti-lien',
        value: '▸ Liens non autorisés supprimés automatiquement\n▸ Whitelist : twitch.tv, youtube.com, discord.gg/reoxitof',
        inline: false,
      },
      {
        name: '⭐ Système XP',
        value: '▸ +15 à +25 XP par message (cooldown 1 min)\n▸ Level up annoncé dans le salon',
        inline: false,
      },
      {
        name: '👋 Bienvenue',
        value: '▸ MP automatique aux nouveaux membres avec instructions\n▸ Message dans le salon bienvenue',
        inline: false,
      },
    )
    .setFooter({ text: 'Reoxitof Gaming Bot • !help pour la version publique', iconURL: client.user.displayAvatarURL() })
    .setTimestamp();

  // Envoyer tous les embeds
  await staffChannel.send({ embeds: [embedHeader] }).catch(() => {});
  await staffChannel.send({ embeds: [embedStream] }).catch(() => {});
  await staffChannel.send({ embeds: [embedMod] }).catch(() => {});
  await staffChannel.send({ embeds: [embedLevels] }).catch(() => {});
  await staffChannel.send({ embeds: [embedGiveaway] }).catch(() => {});
  await staffChannel.send({ embeds: [embedRoles] }).catch(() => {});
  await staffChannel.send({ embeds: [embedAuto] }).catch(() => {});

  console.log('✅ Commandes staff envoyées dans #staff-commandes');
}

module.exports = { sendStaffCommands };
