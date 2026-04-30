const { ChannelType, PermissionFlagsBits } = require('discord.js');

const UPDATE_INTERVAL = 5 * 60 * 1000; // Toutes les 5 minutes

async function setupCounters(client) {
  const guild = client.guilds.cache.get(process.env.GUILD_ID);
  if (!guild) return;

  await guild.roles.fetch();
  await guild.channels.fetch();

  const everyoneRole = guild.roles.everyone;
  const gamerRole    = guild.roles.cache.find(r => r.name.includes('Gamer'));
  const subRole      = guild.roles.cache.find(r => r.name.includes('Abonné'));

  // Trouver ou créer la catégorie STATS
  let statsCategory = guild.channels.cache.find(
    c => c.type === ChannelType.GuildCategory && c.name.toLowerCase().includes('stats')
  );

  if (!statsCategory) {
    statsCategory = await guild.channels.create({
      name: '📊 ─ STATS',
      type: ChannelType.GuildCategory,
      permissionOverwrites: [
        { id: everyoneRole.id, deny: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.Connect], allow: [PermissionFlagsBits.ViewChannel] },
      ],
      reason: 'Catégorie stats serveur',
    });
    console.log('✅ Catégorie STATS créée');
  }

  // Créer ou récupérer les salons compteurs
  const counters = [
    { key: 'members',   emoji: '👥', label: 'Membres' },
    { key: 'online',    emoji: '🟢', label: 'En ligne' },
    { key: 'gamers',    emoji: '🎮', label: 'Gamers' },
    { key: 'subs',      emoji: '🎖️', label: 'Abonnés' },
  ];

  const channelMap = {};

  for (const counter of counters) {
    let ch = guild.channels.cache.find(
      c => c.parentId === statsCategory.id && c.name.includes(counter.label)
    );

    if (!ch) {
      ch = await guild.channels.create({
        name: `${counter.emoji} ${counter.label} : 0`,
        type: ChannelType.GuildVoice,
        parent: statsCategory.id,
        permissionOverwrites: [
          { id: everyoneRole.id, deny: [PermissionFlagsBits.Connect], allow: [PermissionFlagsBits.ViewChannel] },
        ],
        reason: 'Compteur stats',
      });
      console.log(`✅ Compteur créé : ${ch.name}`);
    }

    channelMap[counter.key] = ch;
  }

  // Fonction de mise à jour
  async function updateCounters() {
    try {
      await guild.members.fetch();

      const totalMembers = guild.memberCount;
      const onlineMembers = guild.members.cache.filter(
        m => m.presence?.status === 'online' || m.presence?.status === 'dnd' || m.presence?.status === 'idle'
      ).size;
      const gamers = gamerRole ? guild.members.cache.filter(m => m.roles.cache.has(gamerRole.id)).size : 0;
      const subs   = subRole   ? guild.members.cache.filter(m => m.roles.cache.has(subRole.id)).size   : 0;

      await channelMap.members?.setName(`👥 Membres : ${totalMembers}`).catch(() => {});
      await channelMap.online?.setName(`🟢 En ligne : ${onlineMembers}`).catch(() => {});
      await channelMap.gamers?.setName(`🎮 Gamers : ${gamers}`).catch(() => {});
      await channelMap.subs?.setName(`🎖️ Abonnés : ${subs}`).catch(() => {});

      console.log(`📊 Compteurs mis à jour — ${totalMembers} membres, ${onlineMembers} en ligne`);
    } catch (err) {
      console.error('❌ Erreur mise à jour compteurs :', err.message);
    }
  }

  // Mise à jour immédiate puis toutes les 5 minutes
  await updateCounters();
  setInterval(updateCounters, UPDATE_INTERVAL);
}

module.exports = { setupCounters };
