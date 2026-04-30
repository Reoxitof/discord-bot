const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'uptime',
  description: 'Affiche le temps de fonctionnement du bot',
  async execute(message, args, client) {
    const totalSeconds = Math.floor(client.uptime / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const embed = new EmbedBuilder()
      .setColor(0x1ABC9C)
      .setTitle('⏱️ Uptime du bot')
      .setDescription(`Le bot tourne depuis **${hours}h ${minutes}m ${seconds}s**`)
      .setFooter({ text: 'Reoxitof Gaming' })
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};
