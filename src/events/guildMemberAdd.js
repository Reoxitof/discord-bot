const { EmbedBuilder } = require('discord.js');
const { sendLog } = require('../logger');

module.exports = {
  name: 'guildMemberAdd',
  async execute(member, client) {
    // Log
    await sendLog(client, 'memberJoin', {
      user: member.user,
      memberCount: member.guild.memberCount,
    });
    // ── PAS de rôle automatique ici ───────────────
    // Le rôle Viewer est donné UNIQUEMENT après validation du règlement
    // via la réaction ✅ sur le message de règlement

    // ── MP de bienvenue avec instructions ─────────
    const embed = new EmbedBuilder()
      .setColor(0xFF4500)
      .setTitle(`👋 Bienvenue sur Reoxitof Gaming !`)
      .setDescription(
        `Salut **${member.user.username}** !\n\n` +
        `Pour accéder au serveur, tu dois **accepter le règlement** :\n\n` +
        `1️⃣ Va dans le salon 📌・règles\n` +
        `2️⃣ Lis le règlement\n` +
        `3️⃣ Réagis avec ✅ sur le dernier message\n\n` +
        `Tu auras accès à tout le serveur dès que tu auras validé. 🎮`
      )
      .setThumbnail(member.guild.iconURL({ dynamic: true }))
      .setFooter({ text: 'Reoxitof Gaming' });

    member.send({ embeds: [embed] }).catch(() => {});

    // ── Log dans le salon bienvenue ────────────────
    const welcomeChannelId = process.env.WELCOME_CHANNEL_ID;
    if (!welcomeChannelId) return;
    const channel = member.guild.channels.cache.get(welcomeChannelId);
    if (!channel) return;

    const welcomeEmbed = new EmbedBuilder()
      .setColor(0xFF4500)
      .setTitle('👋 Nouveau membre !')
      .setDescription(
        `${member} vient de rejoindre le serveur !\n\n` +
        `Il doit valider le règlement pour accéder aux salons.\n` +
        `**Membres :** ${member.guild.memberCount}`
      )
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
      .setFooter({ text: 'Reoxitof Gaming', iconURL: member.guild.iconURL() })
      .setTimestamp();

    channel.send({ embeds: [welcomeEmbed] }).catch(() => {});
  },
};
