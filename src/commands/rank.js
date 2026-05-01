const { EmbedBuilder } = require('discord.js');
const db = require('../database');

function getXpForLevel(level) {
  return 100 * level * level;
}

module.exports = {
  name: 'rank',
  description: 'Affiche ton niveau et ton XP',
  async execute(message, args) {
    const target = message.mentions.users.first() || message.author;
    const row = await db.prepare(
      'SELECT * FROM levels WHERE user_id = ? AND guild_id = ?'
    ).get(target.id, message.guild.id);

    if (!row) {
      return message.reply(`${target.username} n'a pas encore de XP. Commence à chatter !`);
    }

    const xpNeeded = getXpForLevel(row.level + 1);
    const progress = Math.floor((row.xp / xpNeeded) * 20);
    const bar = '█'.repeat(progress) + '░'.repeat(20 - progress);

    const allRows = await db.prepare(
      'SELECT user_id FROM levels WHERE guild_id = ? ORDER BY xp DESC'
    ).all(message.guild.id);
    const rank = allRows.findIndex(r => r.user_id === target.id) + 1;

    const embed = new EmbedBuilder()
      .setColor(0xFFD700)
      .setTitle(`📊 Rang de ${target.username}`)
      .setThumbnail(target.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: '🏆 Classement', value: `#${rank}`, inline: true },
        { name: '⭐ Niveau', value: `${row.level}`, inline: true },
        { name: '💬 Messages', value: `${row.messages}`, inline: true },
        { name: `XP — ${row.xp} / ${xpNeeded}`, value: `\`${bar}\`` },
      )
      .setFooter({ text: 'Reoxitof Gaming' })
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};
