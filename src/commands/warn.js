const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../database');
const { sendLog } = require('../logger');

module.exports = {
  name: 'warn',
  description: 'Avertir un membre',
  async execute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return message.reply('❌ Tu n\'as pas la permission de faire ça.');
    }

    const target = message.mentions.members.first();
    if (!target) return message.reply('❌ Mentionne un membre. Ex: `!warn @user raison`');

    const reason = args.slice(1).join(' ') || 'Aucune raison fournie';

    await db.prepare(
      'INSERT INTO warns (user_id, guild_id, reason, moderator_id, timestamp) VALUES (?, ?, ?, ?, ?)'
    ).run(target.id, message.guild.id, reason, message.author.id, Date.now());

    const warnRow = await db.prepare(
      'SELECT COUNT(*) as count FROM warns WHERE user_id = ? AND guild_id = ?'
    ).get(target.id, message.guild.id);
    const warnCount = warnRow.count;

    const embed = new EmbedBuilder()
      .setColor(0xFFA500)
      .setTitle('⚠️ Avertissement')
      .addFields(
        { name: 'Membre', value: `${target}`, inline: true },
        { name: 'Modérateur', value: `${message.author}`, inline: true },
        { name: 'Raison', value: reason },
        { name: 'Total avertissements', value: `${warnCount}` },
      )
      .setTimestamp();

    message.channel.send({ embeds: [embed] });

    // Log
    await sendLog(message.client, 'warn', {
      target: target.user,
      moderator: message.author,
      reason,
      warnCount,
    });

    target.send(
      `⚠️ Tu as reçu un avertissement sur **${message.guild.name}**.\n**Raison :** ${reason}`
    ).catch(() => {});

    if (warnCount >= 3) {
      await target.timeout(600000, 'Trop d\'avertissements').catch(() => {});
      message.channel.send(`🔇 ${target} a été mute 10 minutes (3 avertissements).`);
    }
  },
};
