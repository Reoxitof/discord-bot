const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../database');

module.exports = {
  name: 'warns',
  description: 'Voir les avertissements d\'un membre',
  async execute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return message.reply('❌ Tu n\'as pas la permission de faire ça.');
    }

    const target = message.mentions.users.first();
    if (!target) return message.reply('❌ Mentionne un membre. Ex: `!warns @user`');

    const rows = await db.prepare(
      'SELECT * FROM warns WHERE user_id = ? AND guild_id = ? ORDER BY timestamp DESC'
    ).all(target.id, message.guild.id);

    if (!rows.length) {
      return message.reply(`✅ ${target.username} n'a aucun avertissement.`);
    }

    const lines = rows.map((w, i) => {
      const date = new Date(w.timestamp).toLocaleDateString('fr-FR');
      return `**${i + 1}.** ${w.reason} — <@${w.moderator_id}> (${date})`;
    });

    const embed = new EmbedBuilder()
      .setColor(0xFFA500)
      .setTitle(`⚠️ Avertissements de ${target.username}`)
      .setDescription(lines.join('\n'))
      .setFooter({ text: `Total : ${rows.length} avertissement(s)` })
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};
