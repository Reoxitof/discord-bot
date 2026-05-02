const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

// Stockage en mémoire du jeu en cours (peut être remplacé par DB)
let currentGame = 'Aucun jeu en cours';

module.exports = {
  name: 'jeu',
  description: 'Affiche ou modifie le jeu en cours sur le stream',
  async execute(message, args) {
    // Si args fournis et que c'est le staff → modifier le jeu
    if (args.length > 0 && message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      currentGame = args.join(' ');
      return message.reply(`✅ Jeu mis à jour : **${currentGame}**`);
    }

    const embed = new EmbedBuilder()
      .setColor(0x9B59B6)
      .setTitle('🎮 Jeu en cours')
      .setDescription(`Reoxitof joue actuellement à **${currentGame}**`)
      .addFields(
        { name: '📺 Stream', value: '[twitch.tv/reoxitof](https://twitch.tv/reoxitof)', inline: true }
      )
      .setFooter({ text: 'Reoxitof Gaming' })
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};
