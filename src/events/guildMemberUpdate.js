const { sendLog } = require('../logger');
const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'guildMemberUpdate',
  async execute(oldMember, newMember, client) {
    // ── Changements de rôles ──────────────────────
    const addedRoles   = newMember.roles.cache.filter(r => !oldMember.roles.cache.has(r.id));
    const removedRoles = oldMember.roles.cache.filter(r => !newMember.roles.cache.has(r.id));

    for (const [, role] of addedRoles) {
      await sendLog(client, 'roleAdd', { member: newMember, role });
    }
    for (const [, role] of removedRoles) {
      await sendLog(client, 'roleRemove', { member: newMember, role });
    }

    // ── Boost serveur ─────────────────────────────
    const wasBooster = oldMember.premiumSince;
    const isBooster  = newMember.premiumSince;

    if (!wasBooster && isBooster) {
      const guild = newMember.guild;
      const logChannel = guild.channels.cache.find(
        c => c.name.includes('logs') && !c.name.includes('staff')
      );
      const generalChannel = guild.channels.cache.find(
        c => c.name.includes('général') && !c.name.includes('staff') && !c.name.includes('gaming')
      );

      const embed = new EmbedBuilder()
        .setColor(0xFF73FA)
        .setTitle('🚀  Nouveau Boost !')
        .setDescription(
          `${newMember} vient de **booster le serveur** ! 🎉\n\n` +
          `Merci pour ton soutien ! Tu reçois le rôle **Booster** 💎\n` +
          `Le serveur est maintenant au niveau **${guild.premiumTier}** avec **${guild.premiumSubscriptionCount}** boost(s).`
        )
        .setThumbnail(newMember.user.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: 'Reoxitof Gaming' })
        .setTimestamp();

      if (generalChannel) await generalChannel.send({ embeds: [embed] }).catch(() => {});
      if (logChannel) await logChannel.send({ embeds: [embed] }).catch(() => {});
    }
  },
};
