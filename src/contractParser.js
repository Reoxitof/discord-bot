/**
 * contractParser.js
 * Parse le contenu d'un message Discord pour extraire les infos d'un profil intérimaire.
 * Supporte plusieurs formats : clé: valeur, bullet points, texte libre.
 * Champs RP supportés : nom, prénom, poste, entreprise, id_employe, perso, compte,
 *   date_debut, date_fin, salaire, adresse, telephone, email, notes
 */

// Mots-clés qui identifient un salon comme "contrat"
const CONTRACT_CHANNEL_KEYWORDS = [
  'contrat', 'contract', 'interim', 'intérim', 'interimaire', 'intérimaire',
  'mission', 'embauche', 'recrutement', 'emploi', 'poste', 'candidat',
  'profil', 'dossier', 'fiche', 'cv', 'worker', 'staff'
];

/**
 * Vérifie si un nom de salon est lié aux contrats
 */
function isContractChannel(channelName) {
  const name = String(channelName || '').toLowerCase().replace(/[-_]/g, ' ');
  return CONTRACT_CHANNEL_KEYWORDS.some(kw => name.includes(kw));
}

/**
 * Extrait une valeur depuis le texte selon plusieurs patterns possibles
 */
function extract(text, patterns) {
  for (const pattern of patterns) {
    const regex = new RegExp(pattern, 'im');
    const match = text.match(regex);
    if (match && match[1]) {
      return match[1].trim().replace(/\*\*/g, '').replace(/`/g, '').trim();
    }
  }
  return null;
}

/**
 * Parse le contenu d'un message et retourne un objet profil.
 * @param {string} content - Contenu du message
 * @param {string} [threadTitle] - Titre du thread/post forum (utilisé comme poste si non trouvé dans le contenu)
 */
function parseContractMessage(content, threadTitle = null) {
  const text = content || '';

  const profile = {
    nom:        extract(text, [
                  'nom\\s*[:\\-]\\s*(.+)',
                  'last.?name\\s*[:\\-]\\s*(.+)',
                  'surname\\s*[:\\-]\\s*(.+)'
                ]),
    prenom:     extract(text, [
                  'pr[eé]nom\\s*[:\\-]\\s*(.+)',
                  'first.?name\\s*[:\\-]\\s*(.+)',
                  'given.?name\\s*[:\\-]\\s*(.+)'
                ]),
    poste:      extract(text, [
                  'poste\\s*[:\\-]\\s*(.+)',
                  'fonction\\s*[:\\-]\\s*(.+)',
                  'job\\s*[:\\-]\\s*(.+)',
                  'titre\\s*[:\\-]\\s*(.+)',
                  'position\\s*[:\\-]\\s*(.+)',
                  'mission\\s*[:\\-]\\s*(.+)'
                ]),
    entreprise: extract(text, [
                  'entreprise\\s*[:\\-]\\s*(.+)',
                  'soci[eé]t[eé]\\s*[:\\-]\\s*(.+)',
                  'company\\s*[:\\-]\\s*(.+)',
                  'employeur\\s*[:\\-]\\s*(.+)',
                  'client\\s*[:\\-]\\s*(.+)'
                ]),
    date_debut: extract(text, [
                  'd[eé]but\\s*[:\\-]\\s*(.+)',
                  'date.?d[eé]but\\s*[:\\-]\\s*(.+)',
                  'start\\s*[:\\-]\\s*(.+)',
                  'depuis\\s*[:\\-]\\s*(.+)',
                  'arriv[eé]e?\\s*[:\\-]\\s*(.+)'
                ]),
    date_fin:   extract(text, [
                  'fin\\s*[:\\-]\\s*(.+)',
                  'date.?fin\\s*[:\\-]\\s*(.+)',
                  'end\\s*[:\\-]\\s*(.+)',
                  'jusqu[\'au]+\\s*[:\\-]\\s*(.+)',
                  'expiration\\s*[:\\-]\\s*(.+)'
                ]),
    salaire:    extract(text, [
                  'salaire\\s*[:\\-]\\s*(.+)',
                  'r[eé]mun[eé]ration\\s*[:\\-]\\s*(.+)',
                  'taux\\s*[:\\-]\\s*(.+)',
                  'salary\\s*[:\\-]\\s*(.+)',
                  'pay\\s*[:\\-]\\s*(.+)',
                  'wage\\s*[:\\-]\\s*(.+)'
                ]),
    adresse:    extract(text, [
                  'adresse\\s*[:\\-]\\s*(.+)',
                  'address\\s*[:\\-]\\s*(.+)',
                  'lieu\\s*[:\\-]\\s*(.+)',
                  'localisation\\s*[:\\-]\\s*(.+)',
                  'ville\\s*[:\\-]\\s*(.+)'
                ]),
    telephone:  extract(text, [
                  't[eé]l[eé]phone?\\s*[:\\-]\\s*(.+)',
                  'tel\\s*[:\\-]\\s*(.+)',
                  'phone\\s*[:\\-]\\s*(.+)',
                  'mobile\\s*[:\\-]\\s*(.+)',
                  'portable\\s*[:\\-]\\s*(.+)',
                  'num[eé]ro\\s*[:\\-]\\s*(.+)'
                ]),
    email:      extract(text, [
                  'e.?mail\\s*[:\\-]\\s*(.+)',
                  'mail\\s*[:\\-]\\s*(.+)',
                  'courriel\\s*[:\\-]\\s*(.+)',
                  '([a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,})'
                ]),
    notes:      extract(text, [
                  'notes?\\s*[:\\-]\\s*(.+)',
                  'remarques?\\s*[:\\-]\\s*(.+)',
                  'commentaires?\\s*[:\\-]\\s*(.+)',
                  'infos?\\s*[:\\-]\\s*(.+)',
                  'observations?\\s*[:\\-]\\s*(.+)'
                ]),
    // Champs spécifiques RP
    id_employe: extract(text, [
                  'id\\s*employ[eé]\\s*[:\\-]\\s*(.+)',
                  'id\\s*[:\\-]\\s*(\\d+)',
                  'employ[eé]\\s*[:\\-]\\s*(.+)',
                  'matricule\\s*[:\\-]\\s*(.+)',
                  'num[eé]ro\\s*employ[eé]\\s*[:\\-]\\s*(.+)'
                ]),
    perso:      extract(text, [
                  'perso\\s*[:\\-]\\s*(.+)',
                  'personnage\\s*[:\\-]\\s*(.+)',
                  'num[eé]ro\\s*perso\\s*[:\\-]\\s*(.+)',
                  'perso\\s*[:\\-]\\s*([\\d\\-]+)'
                ]),
    compte:     extract(text, [
                  'compte\\s*[:\\-]\\s*(.+)',
                  'num[eé]ro\\s*compte\\s*[:\\-]\\s*(.+)',
                  'account\\s*[:\\-]\\s*(.+)',
                  '#\\s*(\\d+)'
                ])
  };

  // Nettoyer les valeurs trop longues (max 200 chars par champ)
  for (const key of Object.keys(profile)) {
    if (profile[key] && profile[key].length > 200) {
      profile[key] = profile[key].substring(0, 200);
    }
  }

  // Si le poste n'est pas dans le contenu mais qu'on a le titre du thread forum → l'utiliser
  if (!profile.poste && threadTitle) {
    profile.poste = threadTitle.substring(0, 200);
  }

  // Vérifier qu'on a au moins 2 champs remplis pour considérer ça comme un vrai profil
  const filledFields = Object.values(profile).filter(v => v !== null).length;
  if (filledFields < 2) return null;

  return profile;
}

/**
 * Génère un embed Discord pour afficher un profil intérimaire
 */
function buildProfileEmbed(profile, discordUsername, channelName) {
  const { EmbedBuilder } = require('discord.js');

  const fields = [];

  if (profile.nom || profile.prenom) {
    fields.push({
      name: '👤 Identité',
      value: [profile.prenom, profile.nom].filter(Boolean).join(' ') || '—',
      inline: true
    });
  }
  if (profile.poste) {
    fields.push({ name: '💼 Poste', value: profile.poste, inline: true });
  }
  if (profile.entreprise) {
    fields.push({ name: '🏢 Entreprise', value: profile.entreprise, inline: true });
  }
  if (profile.date_debut || profile.date_fin) {
    const period = [
      profile.date_debut ? `Début : ${profile.date_debut}` : null,
      profile.date_fin   ? `Fin : ${profile.date_fin}`     : null
    ].filter(Boolean).join('\n');
    fields.push({ name: '📅 Période', value: period, inline: true });
  }
  if (profile.salaire) {
    fields.push({ name: '💰 Salaire', value: profile.salaire, inline: true });
  }
  if (profile.adresse) {
    fields.push({ name: '📍 Adresse', value: profile.adresse, inline: true });
  }
  if (profile.telephone) {
    fields.push({ name: '📞 Téléphone', value: profile.telephone, inline: true });
  }
  if (profile.email) {
    fields.push({ name: '📧 Email', value: profile.email, inline: true });
  }
  if (profile.notes) {
    fields.push({ name: '📝 Notes', value: profile.notes, inline: false });
  }

  return new EmbedBuilder()
    .setColor(0x9b59b6)
    .setTitle('📋 Profil Intérimaire Enregistré')
    .setDescription(`Profil créé depuis **#${channelName}** par **${discordUsername}**`)
    .addFields(fields)
    .setFooter({ text: 'Reoxitof Dashboard — Gestion Intérimaires' })
    .setTimestamp();
}

module.exports = { isContractChannel, parseContractMessage, buildProfileEmbed, CONTRACT_CHANNEL_KEYWORDS };
