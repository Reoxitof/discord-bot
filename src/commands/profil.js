/**
 * !profil [@user] — Affiche le profil intérimaire d'un utilisateur
 */
const { EmbedBuilder } = require('discord.js');
const { getProfileByUser, getProfiles, searchProfiles } = require('../interimManager');

module.exports = {
  name: 'profil',
  description: 'Affiche le profil intérimaire d\'un utilisateur',

  async execute(message, args, client) {
    // !profil @user  ou  !profil (soi-même)  ou  !profil search <terme>
    if (args[0] === 'search' || args[0] === 'recherche') {
      return handleSearch(message, args.slice(1).join(' '));
    }

    let targetUser = message.mentions.users.first();

    if (!targetUser) {
      // Pas de mention → profil de l'auteur
      targetUser = message.author;
    }

    const profile = await getProfileByUser(targetUser.id, message.guild.id);

    if (!profile) {
      return message.reply(`❌ Aucun profil intérimaire trouvé pour **${targetUser.tag}**.\nLes profils sont créés automatiquement quand un message est posté dans un salon contrat.`);
    }

    const embed = buildEmbed(profile, targetUser.tag);
    return message.reply({ embeds: [embed] });
  }
};

async function handleSearch(message, query) {
  if (!query || query.length < 2) {
    return message.reply('❌ Précise un terme de recherche. Ex: `!profil search Dupont`');
  }

  const results = await searchProfiles(message.guild.id, query);

  if (!results.length) {
    return message.reply(`❌ Aucun profil trouvé pour **"${query}"**.`);
  }

  const embed = new EmbedBuilder()
    .setColor(0x9b59b6)
    .setTitle(`🔍 Résultats pour "${query}"`)
    .setDescription(
      results.map((p, i) => {
        const name = [p.prenom, p.nom].filter(Boolean).join(' ') || p.discord_username;
        const poste = p.poste ? ` — ${p.poste}` : '';
        const entreprise = p.entreprise ? ` @ ${p.entreprise}` : '';
        return `**${i + 1}.** ${name}${poste}${entreprise}`;
      }).join('\n')
    )
    .setFooter({ text: `${results.length} résultat(s) — !profil @user pour voir le détail` })
    .setTimestamp();

  return message.reply({ embeds: [embed] });
}

function buildEmbed(profile, discordTag) {
  const embed = new EmbedBuilder()
    .setColor(0x9b59b6)
    .setTitle('📋 Profil Intérimaire')
    .setFooter({ text: `Reoxitof Dashboard • ${discordTag}` })
    .setTimestamp(new Date(profile.updated_at));

  const fields = [];

  if (profile.nom || profile.prenom) {
    fields.push({
      name: '👤 Identité',
      value: [profile.prenom, profile.nom].filter(Boolean).join(' '),
      inline: true
    });
  }
  if (profile.poste)      fields.push({ name: '💼 Poste',      value: profile.poste,      inline: true });
  if (profile.entreprise) fields.push({ name: '🏢 Entreprise', value: profile.entreprise, inline: true });

  if (profile.date_debut || profile.date_fin) {
    fields.push({
      name: '📅 Période',
      value: [
        profile.date_debut ? `Début : ${profile.date_debut}` : null,
        profile.date_fin   ? `Fin : ${profile.date_fin}`     : null
      ].filter(Boolean).join('\n'),
      inline: true
    });
  }

  if (profile.salaire)   fields.push({ name: '💰 Salaire',   value: profile.salaire,   inline: true });
  if (profile.adresse)   fields.push({ name: '📍 Adresse',   value: profile.adresse,   inline: true });
  if (profile.telephone) fields.push({ name: '📞 Téléphone', value: profile.telephone, inline: true });
  if (profile.email)     fields.push({ name: '📧 Email',     value: profile.email,     inline: true });
  if (profile.notes)     fields.push({ name: '📝 Notes',     value: profile.notes,     inline: false });

  // Statut badge
  const statutEmoji = { actif: '🟢', inactif: '🔴', en_attente: '🟡' };
  fields.push({
    name: '📊 Statut',
    value: `${statutEmoji[profile.statut] || '⚪'} ${profile.statut}`,
    inline: true
  });

  // Salon source
  fields.push({
    name: '📁 Source',
    value: `#${profile.channel_name}`,
    inline: true
  });

  embed.addFields(fields);
  return embed;
}
