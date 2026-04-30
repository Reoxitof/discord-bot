const { sendLog } = require('../logger');
const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'voiceStateUpdate',
  async execute(oldState, newState, client) {
    const guild = newState.guild || oldState.guild;
    if (!guild) return;

    const member = newState.member || oldState.member;
    if (!member || member.user.bot) return;

    const logChannel = guild.channels.cache.find(
      c => c.name.includes('logs') && !c.name.includes('staff')
    );
    if (!logChannel) return;

    // Rejoint un salon
    if (!oldState.channelId && newState.channelId) {
      const embed = new EmbedBuilder()
        .setColor(0x57F287)
        .setTitle('🔊  Vocal — Connexion')
        .addFields(
          { name: 'Membre', value: `${member}`, inline: true },
          { name: 'Salon', value: `${newState.channel}`, inline: true },
        )
        .setFooter({ text: 'Reoxitof Gaming • Logs' })
        .setTimestamp();
      await logChannel.send({ embeds: [embed] }).catch(() => {});
    }

    // Quitte un salon
    else if (oldState.channelId && !newState.channelId) {
      const embed = new EmbedBuilder()
        .setColor(0xED4245)
        .setTitle('🔇  Vocal — Déconnexion')
        .addFields(
          { name: 'Membre', value: `${member}`, inline: true },
          { name: 'Salon quitté', value: `${oldState.channel}`, inline: true },
        )
        .setFooter({ text: 'Reoxitof Gaming • Logs' })
        .setTimestamp();
      await logChannel.send({ embeds: [embed] }).catch(() => {});
    }

    // Change de salon
    else if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
      const embed = new EmbedBuilder()
        .setColor(0x3498DB)
        .setTitle('🔀  Vocal — Changement de salon')
        .addFields(
          { name: 'Membre', value: `${member}`, inline: true },
          { name: 'Avant', value: `${oldState.channel}`, inline: true },
          { name: 'Après', value: `${newState.channel}`, inline: true },
        )
        .setFooter({ text: 'Reoxitof Gaming • Logs' })
        .setTimestamp();
      await logChannel.send({ embeds: [embed] }).catch(() => {});
    }
  },
};
