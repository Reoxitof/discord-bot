const { EmbedBuilder } = require('discord.js');

async function sendLog(client, type, data) {
  const guild = client.guilds.cache.get(process.env.GUILD_ID);
  if (!guild) return;

  const logChannel = guild.channels.cache.find(
    c => c.name.includes('logs') && !c.name.includes('staff-général')
  );
  if (!logChannel) return;

  const embed = buildEmbed(type, data);
  if (!embed) return;

  await logChannel.send({ embeds: [embed] }).catch(() => {});
}

function buildEmbed(type, data) {
  const now = new Date();

  switch (type) {

    // ── MEMBRES ──────────────────────────────────
    case 'memberJoin':
      return new EmbedBuilder()
        .setColor(0x57F287)
        .setTitle('📥  Nouveau membre')
        .setThumbnail(data.user.displayAvatarURL({ dynamic: true }))
        .addFields(
          { name: 'Membre', value: `${data.user} (${data.user.tag})`, inline: true },
          { name: 'ID', value: data.user.id, inline: true },
          { name: 'Compte créé', value: `<t:${Math.floor(data.user.createdTimestamp / 1000)}:R>`, inline: true },
          { name: 'Total membres', value: `${data.memberCount}`, inline: true },
        )
        .setFooter({ text: 'Reoxitof Gaming • Logs' })
        .setTimestamp();

    case 'memberLeave':
      return new EmbedBuilder()
        .setColor(0xED4245)
        .setTitle('📤  Membre parti')
        .setThumbnail(data.user.displayAvatarURL({ dynamic: true }))
        .addFields(
          { name: 'Membre', value: `${data.user.tag}`, inline: true },
          { name: 'ID', value: data.user.id, inline: true },
          { name: 'Était sur le serveur depuis', value: `<t:${Math.floor(data.joinedTimestamp / 1000)}:R>`, inline: true },
          { name: 'Rôles', value: data.roles || 'Aucun', inline: false },
        )
        .setFooter({ text: 'Reoxitof Gaming • Logs' })
        .setTimestamp();

    // ── MODÉRATION ───────────────────────────────
    case 'warn':
      return new EmbedBuilder()
        .setColor(0xFFA500)
        .setTitle('⚠️  Avertissement')
        .addFields(
          { name: 'Membre', value: `${data.target} (${data.target.tag})`, inline: true },
          { name: 'Modérateur', value: `${data.moderator}`, inline: true },
          { name: 'Raison', value: data.reason, inline: false },
          { name: 'Total warns', value: `${data.warnCount}`, inline: true },
        )
        .setFooter({ text: 'Reoxitof Gaming • Logs' })
        .setTimestamp();

    case 'mute':
      return new EmbedBuilder()
        .setColor(0xFFA500)
        .setTitle('🔇  Mute')
        .addFields(
          { name: 'Membre', value: `${data.target}`, inline: true },
          { name: 'Modérateur', value: `${data.moderator}`, inline: true },
          { name: 'Durée', value: data.duration, inline: true },
          { name: 'Raison', value: data.reason, inline: false },
        )
        .setFooter({ text: 'Reoxitof Gaming • Logs' })
        .setTimestamp();

    case 'kick':
      return new EmbedBuilder()
        .setColor(0xFF6B35)
        .setTitle('👢  Kick')
        .addFields(
          { name: 'Membre', value: `${data.target.tag}`, inline: true },
          { name: 'Modérateur', value: `${data.moderator}`, inline: true },
          { name: 'Raison', value: data.reason, inline: false },
        )
        .setFooter({ text: 'Reoxitof Gaming • Logs' })
        .setTimestamp();

    case 'ban':
      return new EmbedBuilder()
        .setColor(0xED4245)
        .setTitle('🔨  Ban')
        .addFields(
          { name: 'Membre', value: `${data.target.tag}`, inline: true },
          { name: 'Modérateur', value: `${data.moderator}`, inline: true },
          { name: 'Raison', value: data.reason, inline: false },
        )
        .setFooter({ text: 'Reoxitof Gaming • Logs' })
        .setTimestamp();

    // ── MESSAGES ─────────────────────────────────
    case 'messageDelete':
      return new EmbedBuilder()
        .setColor(0xFF4500)
        .setTitle('🗑️  Message supprimé')
        .addFields(
          { name: 'Auteur', value: `${data.author}`, inline: true },
          { name: 'Salon', value: `${data.channel}`, inline: true },
          { name: 'Contenu', value: data.content || '*Contenu indisponible*', inline: false },
        )
        .setFooter({ text: 'Reoxitof Gaming • Logs' })
        .setTimestamp();

    case 'messageUpdate':
      return new EmbedBuilder()
        .setColor(0x3498DB)
        .setTitle('✏️  Message modifié')
        .setURL(data.url)
        .addFields(
          { name: 'Auteur', value: `${data.author}`, inline: true },
          { name: 'Salon', value: `${data.channel}`, inline: true },
          { name: 'Avant', value: data.oldContent || '*Indisponible*', inline: false },
          { name: 'Après', value: data.newContent || '*Indisponible*', inline: false },
        )
        .setFooter({ text: 'Reoxitof Gaming • Logs' })
        .setTimestamp();

    // ── RÔLES ────────────────────────────────────
    case 'roleAdd':
      return new EmbedBuilder()
        .setColor(0x9B59B6)
        .setTitle('🎭  Rôle ajouté')
        .addFields(
          { name: 'Membre', value: `${data.member}`, inline: true },
          { name: 'Rôle', value: `${data.role}`, inline: true },
        )
        .setFooter({ text: 'Reoxitof Gaming • Logs' })
        .setTimestamp();

    case 'roleRemove':
      return new EmbedBuilder()
        .setColor(0x95A5A6)
        .setTitle('🎭  Rôle retiré')
        .addFields(
          { name: 'Membre', value: `${data.member}`, inline: true },
          { name: 'Rôle', value: `${data.role}`, inline: true },
        )
        .setFooter({ text: 'Reoxitof Gaming • Logs' })
        .setTimestamp();

    // ── RÈGLEMENT ────────────────────────────────
    case 'ruleAccepted':
      return new EmbedBuilder()
        .setColor(0x57F287)
        .setTitle('✅  Règlement accepté')
        .addFields(
          { name: 'Membre', value: `${data.user}`, inline: true },
          { name: 'ID', value: data.user.id, inline: true },
        )
        .setFooter({ text: 'Reoxitof Gaming • Logs' })
        .setTimestamp();

    default:
      return null;
  }
}

module.exports = { sendLog };
