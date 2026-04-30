const { PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'mute',
  description: 'Muter un membre',
  async execute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return message.reply('❌ Tu n\'as pas la permission de faire ça.');
    }

    const target = message.mentions.members.first();
    if (!target) return message.reply('❌ Mentionne un membre. Ex: `!mute @user 10m raison`');

    const durationStr = args[1];
    if (!durationStr) return message.reply('❌ Précise une durée. Ex: `!mute @user 10m spam`');

    const duration = parseDuration(durationStr);
    if (!duration) return message.reply('❌ Durée invalide. Utilise : `10s`, `5m`, `1h`, `1d`');

    const reason = args.slice(2).join(' ') || 'Aucune raison fournie';

    await target.timeout(duration, reason).catch(err => {
      return message.reply(`❌ Impossible de muter : ${err.message}`);
    });

    message.reply(`🔇 **${target.user.username}** a été mute pendant **${durationStr}**. Raison : ${reason}`);

    target.send(
      `🔇 Tu as été mute sur **${message.guild.name}** pendant **${durationStr}**.\n**Raison :** ${reason}`
    ).catch(() => {});
  },
};

function parseDuration(str) {
  const match = str.match(/^(\d+)(s|m|h|d)$/);
  if (!match) return null;
  const value = parseInt(match[1]);
  const unit = match[2];
  const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return value * multipliers[unit];
}
