const { PermissionFlagsBits } = require('discord.js');
const db = require('../database');

module.exports = {
  name: 'reactionrole',
  description: 'Créer un reaction-role',
  async execute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
      return message.reply('❌ Tu n\'as pas la permission de faire ça.');
    }

    // !reactionrole <message_id> <emoji> <@role>
    const [msgId, emoji, ...rest] = args;
    const role = message.mentions.roles.first();

    if (!msgId || !emoji || !role) {
      return message.reply(
        '❌ Usage : `!reactionrole <message_id> <emoji> <@role>`\n' +
        'Ex: `!reactionrole 123456789 🎮 @Gamer`'
      );
    }

    // Vérifier que le message existe
    const targetMsg = await message.channel.messages.fetch(msgId).catch(() => null);
    if (!targetMsg) {
      return message.reply('❌ Message introuvable dans ce salon.');
    }

    // Enregistrer en base
    db.prepare(
      'INSERT OR REPLACE INTO reaction_roles (message_id, emoji, role_id) VALUES (?, ?, ?)'
    ).run(msgId, emoji, role.id);

    // Ajouter la réaction au message
    await targetMsg.react(emoji).catch(() => {});

    message.reply(`✅ Reaction-role créé ! Réagir avec ${emoji} donnera le rôle ${role}.`);
  },
};
