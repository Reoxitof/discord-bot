const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'help',
  description: 'Affiche toutes les commandes disponibles',
  async execute(message, args, client) {
    const embed = new EmbedBuilder()
      .setColor(0xFF4500)
      .setTitle('🤖 Reoxitof Bot — Commandes')
      .setThumbnail(client.user.displayAvatarURL())
      .addFields(
        {
          name: '🎮 Stream',
          value: [
            '`!uptime` — Temps depuis le début du stream',
            '`!jeu` — Jeu en cours sur le stream',
            '`!social` — Réseaux sociaux de Reoxitof',
            '`!clip` — Lien pour créer un clip Twitch',
          ].join('\n'),
        },
        {
          name: '📊 Stats & Niveaux',
          value: [
            '`!rank` — Ton niveau et XP',
            '`!top` — Classement des membres',
          ].join('\n'),
        },
        {
          name: '🎁 Giveaway',
          value: [
            '`!gstart <durée> <gagnants> <prix>` — Lancer un giveaway',
            '`!gend <message_id>` — Terminer un giveaway',
            '`!greroll <message_id>` — Retirer un gagnant',
          ].join('\n'),
        },
        {
          name: '🛡️ Modération',
          value: [
            '`!warn <@user> <raison>` — Avertir un membre',
            '`!warns <@user>` — Voir les avertissements',
            '`!mute <@user> <durée>` — Muter un membre',
            '`!kick <@user> <raison>` — Expulser un membre',
            '`!ban <@user> <raison>` — Bannir un membre',
            '`!clear <nombre>` — Supprimer des messages',
          ].join('\n'),
        },
        {
          name: '🎭 Rôles',
          value: [
            '`!reactionrole <msg_id> <emoji> <@role>` — Créer un reaction-role',
          ].join('\n'),
        },
      )
      .setFooter({ text: 'Reoxitof Gaming • Préfixe : !' })
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};
