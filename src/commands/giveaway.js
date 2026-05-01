const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../database');

const GIVEAWAY_EMOJI = '🎁';

module.exports = {
  name: 'gstart',
  description: 'Lancer un giveaway',
  async execute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return message.reply('❌ Tu n\'as pas la permission de faire ça.');
    }

    // !gstart <durée> <gagnants> <prix>
    // Ex: !gstart 1h 1 Abonnement Twitch
    const [durationStr, winnersStr, ...prizeArr] = args;
    if (!durationStr || !winnersStr || !prizeArr.length) {
      return message.reply(
        '❌ Usage : `!gstart <durée> <gagnants> <prix>`\n' +
        'Ex: `!gstart 1h 1 Abonnement Twitch`'
      );
    }

    const duration = parseDuration(durationStr);
    if (!duration) return message.reply('❌ Durée invalide. Ex: `10m`, `1h`, `1d`');

    const winners = parseInt(winnersStr);
    if (isNaN(winners) || winners < 1) return message.reply('❌ Nombre de gagnants invalide.');

    const prize = prizeArr.join(' ');
    const endTime = Date.now() + duration;

    const embed = new EmbedBuilder()
      .setColor(0xFFD700)
      .setTitle(`🎁 GIVEAWAY — ${prize}`)
      .setDescription(
        `Réagis avec ${GIVEAWAY_EMOJI} pour participer !\n\n` +
        `🏆 **Gagnant(s) :** ${winners}\n` +
        `⏱️ **Fin :** <t:${Math.floor(endTime / 1000)}:R>\n` +
        `🎟️ **Organisé par :** ${message.author}`
      )
      .setFooter({ text: `Se termine le ${new Date(endTime).toLocaleString('fr-FR')}` })
      .setTimestamp();

    const gMsg = await message.channel.send({ embeds: [embed] });
    await gMsg.react(GIVEAWAY_EMOJI);

    await db.prepare(
      'INSERT INTO giveaways (message_id, channel_id, guild_id, prize, winners, end_time, host_id) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(gMsg.id, message.channel.id, message.guild.id, prize, winners, endTime, message.author.id);

    await message.delete().catch(() => {});

    // Timer pour terminer le giveaway
    setTimeout(() => endGiveaway(gMsg, winners, prize, message.client), duration);
  },
};

async function endGiveaway(gMsg, winnersCount, prize, client) {
  try {
    const msg = await gMsg.fetch();
    const reaction = msg.reactions.cache.get(GIVEAWAY_EMOJI);
    if (!reaction) return;

    const users = await reaction.users.fetch();
    const participants = users.filter(u => !u.bot);

    if (!participants.size) {
      gMsg.edit({
        embeds: [
          new EmbedBuilder()
            .setColor(0x95A5A6)
            .setTitle(`🎁 GIVEAWAY TERMINÉ — ${prize}`)
            .setDescription('Aucun participant. Pas de gagnant.')
            .setTimestamp()
        ]
      });
      return;
    }

    const shuffled = participants.random(Math.min(winnersCount, participants.size));
    const winnersList = Array.isArray(shuffled) ? shuffled : [shuffled];
    const mentions = winnersList.map(u => `<@${u.id}>`).join(', ');

    const embed = new EmbedBuilder()
      .setColor(0x2ECC71)
      .setTitle(`🎁 GIVEAWAY TERMINÉ — ${prize}`)
      .setDescription(`🏆 **Gagnant(s) :** ${mentions}\nFélicitations !`)
      .setTimestamp();

    await gMsg.edit({ embeds: [embed] });
    gMsg.channel.send(`🎉 Félicitations ${mentions} ! Vous avez gagné **${prize}** !`);

    await db.prepare('UPDATE giveaways SET ended = 1 WHERE message_id = ?').run(gMsg.id);
  } catch (err) {
    console.error('Erreur fin giveaway :', err.message);
  }
}

function parseDuration(str) {
  const match = str.match(/^(\d+)(s|m|h|d)$/);
  if (!match) return null;
  const value = parseInt(match[1]);
  const unit = match[2];
  const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return value * multipliers[unit];
}
