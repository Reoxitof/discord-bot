const db = require('../database');
const { sendLog } = require('../logger');

module.exports = {
  name: 'messageReactionAdd',
  async execute(reaction, user, client) {
    if (user.bot) return;
    if (reaction.partial) {
      try { await reaction.fetch(); } catch { return; }
    }

    const guild = reaction.message.guild;
    if (!guild) return;

    // ── Validation du règlement ───────────────────
    if (
      reaction.message.id === client.rulesMessageId &&
      reaction.emoji.name === '✅'
    ) {
      const member = await guild.members.fetch(user.id).catch(() => null);
      if (!member) return;

      const viewerRole = guild.roles.cache.find(
        r => r.name.includes('Viewer') || r.name.includes('viewer')
      );
      if (viewerRole && !member.roles.cache.has(viewerRole.id)) {
        await member.roles.add(viewerRole).catch(() => {});
        console.log(`✅ Règlement accepté par ${user.tag} → rôle Viewer attribué`);

        // Log
        await sendLog(client, 'ruleAccepted', { user });

        // MP de bienvenue
        user.send(
          `✅ Tu as accepté le règlement de **${guild.name}** !\n` +
          `Tu as maintenant accès à tous les salons. Bienvenue ! 🎮`
        ).catch(() => {});
      }
      return;
    }

    // ── Reaction roles classiques ─────────────────
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

    await member.roles.add(role).catch(() => {});
  },
};
