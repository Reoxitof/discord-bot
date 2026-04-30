const { PermissionFlagsBits } = require('discord.js');
const { sendLog } = require('../logger');

module.exports = {
  name: 'ban',
  description: 'Bannir un membre',
  async execute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) {
      return message.reply('❌ Tu n\'as pas la permission de faire ça.');
    }

    const target = message.mentions.members.first();
    if (!target) return message.reply('❌ Mentionne un membre. Ex: `!ban @user raison`');
    if (!target.bannable) return message.reply('❌ Je ne peux pas bannir ce membre.');

    const reason = args.slice(1).join(' ') || 'Aucune raison fournie';

    target.send(
      `🔨 Tu as été banni de **${message.guild.name}**.\n**Raison :** ${reason}`
    ).catch(() => {});

    await target.ban({ reason, deleteMessageSeconds: 86400 }).catch(err => {
      return message.reply(`❌ Impossible de bannir : ${err.message}`);
    });

    await sendLog(message.client, 'ban', {
      target: target.user,
      moderator: message.author,
      reason,
    });

    message.reply(`🔨 **${target.user.username}** a été banni. Raison : ${reason}`);
  },
};
