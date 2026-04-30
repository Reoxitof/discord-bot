const db = require('../database');

module.exports = {
  name: 'messageReactionRemove',
  async execute(reaction, user, client) {
    if (user.bot) return;
    if (reaction.partial) {
      try { await reaction.fetch(); } catch { return; }
    }

    const guild = reaction.message.guild;
    if (!guild) return;

    const emoji = reaction.emoji.id
      ? `<:${reaction.emoji.name}:${reaction.emoji.id}>`
      : reaction.emoji.name;

    const row = db.prepare(
      'SELECT role_id FROM reaction_roles WHERE message_id = ? AND emoji = ?'
    ).get(reaction.message.id, emoji);

    if (!row) return;

    const member = await guild.members.fetch(user.id).catch(() => null);
    if (!member) return;

    const role = guild.roles.cache.get(row.role_id);
    if (!role) return;

    await member.roles.remove(role).catch(() => {});
  },
};
