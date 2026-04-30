const { PermissionFlagsBits } = require('discord.js');

const GIVEAWAY_EMOJI = '🎁';

module.exports = {
  name: 'greroll',
  description: 'Retirer un nouveau gagnant pour un giveaway',
  async execute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return message.reply('❌ Tu n\'as pas la permission de faire ça.');
    }

    const msgId = args[0];
    if (!msgId) return message.reply('❌ Usage : `!greroll <message_id>`');

    const gMsg = await message.channel.messages.fetch(msgId).catch(() => null);
    if (!gMsg) return message.reply('❌ Message introuvable.');

    const reaction = gMsg.reactions.cache.get(GIVEAWAY_EMOJI);
    if (!reaction) return message.reply('❌ Aucune réaction trouvée sur ce message.');

    const users = await reaction.users.fetch();
    const participants = users.filter(u => !u.bot);

    if (!participants.size) return message.reply('❌ Aucun participant.');

    const winner = participants.random();
    message.channel.send(`🎉 Nouveau gagnant : <@${winner.id}> ! Félicitations !`);
  },
};
