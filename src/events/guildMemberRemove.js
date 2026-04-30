const { sendLog } = require('../logger');

module.exports = {
  name: 'guildMemberRemove',
  async execute(member, client) {
    const roles = member.roles.cache
      .filter(r => r.name !== '@everyone')
      .map(r => r.name)
      .join(', ') || 'Aucun';

    await sendLog(client, 'memberLeave', {
      user: member.user,
      joinedTimestamp: member.joinedTimestamp || Date.now(),
      roles,
    });
  },
};
