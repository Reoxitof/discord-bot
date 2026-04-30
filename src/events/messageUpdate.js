const { sendLog } = require('../logger');

module.exports = {
  name: 'messageUpdate',
  async execute(oldMessage, newMessage, client) {
    if (!newMessage.guild) return;
    if (newMessage.author?.bot) return;
    if (oldMessage.content === newMessage.content) return;

    await sendLog(client, 'messageUpdate', {
      author: newMessage.author,
      channel: newMessage.channel,
      oldContent: oldMessage.content?.slice(0, 512) || '*Indisponible*',
      newContent: newMessage.content?.slice(0, 512) || '*Indisponible*',
      url: newMessage.url,
    });
  },
};
