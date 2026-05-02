const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'social',
  description: 'Affiche les réseaux sociaux de Reoxitof',
  async execute(message) {
    const embed = new EmbedBuilder()
      .setColor(0xFF4500)
      .setTitle('🌐 Reoxitof — Réseaux Sociaux')
      .addFields(
        { name: '🟣 Twitch', value: '[twitch.tv/reoxitof](https://twitch.tv/reoxitof)', inline: true },
        { name: '🔴 YouTube', value: 'Bientôt disponible', inline: true },
        { name: '🐦 Twitter/X', value: 'Bientôt disponible', inline: true },
        { name: '💬 Discord', value: '[Rejoindre le serveur](https://discord.gg/reoxitof)', inline: true },
      )
      .setFooter({ text: 'Reoxitof Gaming' })
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};
