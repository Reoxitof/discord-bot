const { PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'clear',
  description: 'Supprimer des messages',
  async execute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return message.reply('❌ Tu n\'as pas la permission de faire ça.');
    }

    const amount = parseInt(args[0]);
    if (isNaN(amount) || amount < 1 || amount > 100) {
      return message.reply('❌ Précise un nombre entre 1 et 100. Ex: `!clear 10`');
    }

    await message.delete().catch(() => {});
    const deleted = await message.channel.bulkDelete(amount, true).catch(err => {
      message.channel.send(`❌ Erreur : ${err.message}`);
    });

    if (deleted) {
      const confirm = await message.channel.send(
        `🗑️ **${deleted.size}** message(s) supprimé(s).`
      );
      setTimeout(() => confirm.delete().catch(() => {}), 3000);
    }
  },
};
