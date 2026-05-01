const { EmbedBuilder } = require('discord.js');
const db = require('../database');

module.exports = {
  name: 'top',
  description: 'Classement des membres les plus actifs',
  async execute(message) {
    const rows = await db.prepare(
      'SELECT user_id, xp, level FROM levels WHERE guild_id = ? ORDER BY xp DESC LIMIT 10'
    ).all(message.guild.id);

    if (!rows.length) {
      return message.reply('Aucun membre dans le classement pour l\'instant.');
    }

    const medals = ['🥇', '🥈', '🥉'];
    const lines = await Promise.all(rows.map(async (row, i) => {
      const user = await message.client.users.fetch(row.user_id).catch(() => null);
      const name = user ? user.username : 'Inconnu';
      const medal = medals[i] || `**${i + 1}.**`;
      return `${medal} **${name}** — Niveau ${row.level} (${row.xp} XP)`;
    }));

    const embed = new EmbedBuilder()
      .setColor(0xFFD700)
      .setTitle('🏆 Top 10 — Reoxitof Gaming')
      .setDescription(lines.join('\n'))
      .setFooter({ text: 'Reoxitof Gaming' })
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};
