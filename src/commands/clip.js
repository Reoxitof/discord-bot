const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'clip',
  description: 'Donne le lien pour créer un clip Twitch',
  async execute(message) {
    const embed = new EmbedBuilder()
      .setColor(0x9B59B6)
      .setTitle('🎬 Créer un clip')
      .setDescription(
        'Tu as vu un moment épique ? Crée un clip !\n\n' +
        '👉 [Cliquer ici pour clipper](https://www.twitch.tv/reoxitof/clip)\n\n' +
        'Partage-le ensuite dans <#' +
        (message.guild.channels.cache.find(c => c.name.includes('clips'))?.id || 'clips') +
        '> !'
      )
      .setFooter({ text: 'Reoxitof Gaming' })
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};
