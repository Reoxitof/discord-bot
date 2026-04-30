const { sendLog } = require('../logger');

module.exports = {
  name: 'messageDelete',
  async execute(message, client) {
    if (!message.guild) return;
    if (message.author?.bot) return;

    await sendLog(client, 'messageDelete', {
      author: message.author || '*Inconnu*',
      channel: message.channel,
      content: message.content?.slice(0, 1024) || '*Contenu indisponible*',
    });
  },
};
