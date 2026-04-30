const { PermissionFlagsBits } = require('discord.js');
const { sendLog } = require('../logger');

module.exports = {
  name: 'kick',
  description: 'Expulser un membre',
  async execute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.KickMembers)) {
      return message.reply('❌ Tu n\'as pas la permission de faire ça.');
    }

    const target = message.mentions.members.first();
    if (!target) return message.reply('❌ Mentionne un membre. Ex: `!kick @user raison`');
    if (!target.kickable) return message.reply('❌ Je ne peux pas expulser ce membre.');

    const reason = args.slice(1).join(' ') || 'Aucune raison fournie';

    target.send(
      `👢 Tu as été expulsé de **${message.guild.name}**.\n**Raison :** ${reason}`
    ).catch(() => {});

    await target.kick(reason).catch(err => {
      return message.reply(`❌ Impossible d'expulser : ${err.message}`);
    });

    await sendLog(message.client, 'kick', {
      target: target.user,
      moderator: message.author,
      reason,
    });

    message.reply(`👢 **${target.user.username}** a été expulsé. Raison : ${reason}`);
  },
};
