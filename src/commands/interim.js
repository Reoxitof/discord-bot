/**
 * !interim <sous-commande> — Gestion des profils intérimaires (admin/mod)
 * 
 * Sous-commandes :
 *   !interim list [statut]       — Liste les profils (actif/inactif/en_attente)
 *   !interim stats               — Statistiques globales
 *   !interim statut <id> <statut> — Change le statut d'un profil
 *   !interim supprimer <id>      — Supprime un profil
 *   !interim canaux              — Liste les salons surveillés
 */
const { EmbedBuilder } = require('discord.js');
const { getProfiles, countProfiles, updateStatus, deleteProfile } = require('../interimManager');
const { CONTRACT_CHANNEL_KEYWORDS } = require('../contractParser');

module.exports = {
  name: 'interim',
  description: 'Gestion des profils intérimaires (admin/mod)',

  async execute(message, args, client) {
    // Vérification permissions
    const isMod = message.member.permissions.has('ManageMessages');
    if (!isMod) {
      return message.reply('❌ Commande réservée aux modérateurs et administrateurs.');
    }

    const sub = (args[0] || 'list').toLowerCase();

    switch (sub) {
      case 'list':
      case 'liste':
        return handleList(message, args[1]);

      case 'stats':
      case 'statistiques':
        return handleStats(message);

      case 'statut':
      case 'status':
        return handleStatus(message, args[1], args[2]);

      case 'supprimer':
      case 'delete':
      case 'remove':
        return handleDelete(message, args[1]);

      case 'canaux':
      case 'channels':
        return handleChannels(message, client);

      default:
        return message.reply(
          '❓ Sous-commandes disponibles :\n' +
          '`!interim list [actif|inactif|en_attente]` — Liste les profils\n' +
          '`!interim stats` — Statistiques\n' +
          '`!interim statut <id> <actif|inactif|en_attente>` — Changer le statut\n' +
          '`!interim supprimer <id>` — Supprimer un profil\n' +
          '`!interim canaux` — Salons surveillés'
        );
    }
  }
};

async function handleList(message, statutFilter) {
  const validStatuts = ['actif', 'inactif', 'en_attente'];
  const statut = validStatuts.includes(statutFilter) ? statutFilter : null;

  const profiles = await getProfiles(message.guild.id, { statut, limit: 15 });

  if (!profiles.length) {
    return message.reply(`📭 Aucun profil intérimaire${statut ? ` avec le statut **${statut}**` : ''}.`);
  }

  const statutEmoji = { actif: '🟢', inactif: '🔴', en_attente: '🟡' };

  const embed = new EmbedBuilder()
    .setColor(0x9b59b6)
    .setTitle(`📋 Profils Intérimaires${statut ? ` — ${statut}` : ''}`)
    .setDescription(
      profiles.map((p, i) => {
        const name = [p.prenom, p.nom].filter(Boolean).join(' ') || p.discord_username;
        const poste = p.poste ? ` — ${p.poste}` : '';
        const entreprise = p.entreprise ? ` @ ${p.entreprise}` : '';
        const emoji = statutEmoji[p.statut] || '⚪';
        const date = new Date(p.created_at).toLocaleDateString('fr-FR');
        return `${emoji} **${i + 1}.** ${name}${poste}${entreprise} *(#${p.channel_name} — ${date})*`;
      }).join('\n')
    )
    .setFooter({ text: `${profiles.length} profil(s) affiché(s) • !profil @user pour le détail` })
    .setTimestamp();

  return message.reply({ embeds: [embed] });
}

async function handleStats(message) {
  const [total, actifs, inactifs, enAttente] = await Promise.all([
    countProfiles(message.guild.id),
    countProfiles(message.guild.id, 'actif'),
    countProfiles(message.guild.id, 'inactif'),
    countProfiles(message.guild.id, 'en_attente')
  ]);

  const embed = new EmbedBuilder()
    .setColor(0x9b59b6)
    .setTitle('📊 Statistiques Intérimaires')
    .addFields(
      { name: '📁 Total',       value: String(total),     inline: true },
      { name: '🟢 Actifs',      value: String(actifs),    inline: true },
      { name: '🔴 Inactifs',    value: String(inactifs),  inline: true },
      { name: '🟡 En attente',  value: String(enAttente), inline: true }
    )
    .setFooter({ text: 'Reoxitof Dashboard' })
    .setTimestamp();

  return message.reply({ embeds: [embed] });
}

async function handleStatus(message, profileId, newStatut) {
  if (!profileId || !newStatut) {
    return message.reply('❌ Usage : `!interim statut <id_message> <actif|inactif|en_attente>`');
  }

  const validStatuts = ['actif', 'inactif', 'en_attente'];
  if (!validStatuts.includes(newStatut.toLowerCase())) {
    return message.reply(`❌ Statut invalide. Valeurs acceptées : ${validStatuts.join(', ')}`);
  }

  try {
    await updateStatus(profileId, newStatut.toLowerCase());
    return message.reply(`✅ Statut mis à jour → **${newStatut}** pour le profil \`${profileId}\``);
  } catch (err) {
    console.error('[INTERIM] updateStatus error:', err.message);
    return message.reply('❌ Erreur lors de la mise à jour du statut.');
  }
}

async function handleDelete(message, profileId) {
  if (!profileId) {
    return message.reply('❌ Usage : `!interim supprimer <id_message>`');
  }

  // Confirmation requise
  const confirmMsg = await message.reply(
    `⚠️ Confirme la suppression du profil \`${profileId}\` en répondant **oui** dans les 15 secondes.`
  );

  const filter = m => m.author.id === message.author.id && m.content.toLowerCase() === 'oui';
  const collector = message.channel.createMessageCollector({ filter, time: 15000, max: 1 });

  collector.on('collect', async () => {
    try {
      await deleteProfile(profileId);
      await message.reply(`✅ Profil \`${profileId}\` supprimé.`);
    } catch (err) {
      await message.reply('❌ Erreur lors de la suppression.');
    }
  });

  collector.on('end', (collected) => {
    if (collected.size === 0) {
      confirmMsg.edit('❌ Suppression annulée (timeout).').catch(() => {});
    }
  });
}

async function handleChannels(message, client) {
  const guild = message.guild;
  const channels = guild.channels.cache.filter(c => c.isTextBased());

  const { isContractChannel } = require('../contractParser');
  const contractChannels = channels.filter(c => isContractChannel(c.name));

  if (!contractChannels.size) {
    return message.reply(
      `📭 Aucun salon avec un nom lié aux contrats détecté.\n` +
      `Les mots-clés surveillés : \`${CONTRACT_CHANNEL_KEYWORDS.join(', ')}\``
    );
  }

  const embed = new EmbedBuilder()
    .setColor(0x9b59b6)
    .setTitle('📡 Salons Contrats Surveillés')
    .setDescription(contractChannels.map(c => `• <#${c.id}> — \`${c.name}\``).join('\n'))
    .setFooter({ text: `${contractChannels.size} salon(s) actif(s)` })
    .setTimestamp();

  return message.reply({ embeds: [embed] });
}
