/**
 * interimThread.js
 *
 * Surveille le salon Forum intérimaire.
 * Deux déclencheurs :
 *   1. threadCreate  — nouveau post créé dans le forum → parse le message initial
 *   2. messageCreate — nouveau message dans un thread du forum → enrichit le profil existant
 *
 * Anti-doublon : ON CONFLICT (message_id) dans la DB + vérification par message_id côté dashboard.
 *
 * Champs parsés depuis le screenshot :
 *   Nom RP, Entreprise, Société (Elite Corp.), ID Employé, Perso, Compte, Photo
 *   + tous les champs standards (poste, date_debut, date_fin, salaire, etc.)
 */

const { EmbedBuilder, ChannelType } = require('discord.js');
const { parseContractMessage } = require('../contractParser');
const { upsertProfile, getProfileByThread, getProfileByMessage } = require('../interimManager');
const { syncProfile } = require('../dashboardSync');

// ID du salon Forum intérimaire (catégorie Intérimaire > forum ali-baba)
const INTERIM_FORUM_ID = process.env.INTERIM_FORUM_ID || '1498709065558134875';

// ── Événement 1 : Nouveau post dans le forum ──────────────────────────────────
module.exports = [
  {
    name: 'threadCreate',
    async execute(thread, newlyCreated, client) {
      if (!newlyCreated) return;
      if (!thread.parentId) return;
      if (thread.parentId !== INTERIM_FORUM_ID) return;

      console.log(`[INTERIM] Nouveau post forum : "${thread.name}" (${thread.id})`);

      try {
        // Récupérer le message initial du post (starter message)
        const starterMessage = await thread.fetchStarterMessage().catch(() => null);
        if (!starterMessage) {
          console.log('[INTERIM] Pas de message initial trouvé');
          return;
        }

        await processForumPost(thread, starterMessage, client);
      } catch (err) {
        console.error('[INTERIM] Erreur threadCreate :', err.message);
      }
    }
  },

  // ── Événement 2 : Message dans un thread du forum ─────────────────────────
  {
    name: 'messageCreate',
    async execute(message, client) {
      if (message.author.bot) return;
      if (!message.guild) return;

      // Vérifier que c'est un thread dont le parent est le forum intérimaire
      const channel = message.channel;
      if (!channel.isThread()) return;
      if (channel.parentId !== INTERIM_FORUM_ID) return;

      // Ignorer le message initial (déjà traité par threadCreate)
      if (channel.id === message.id) return;

      const content = message.content.trim();
      if (content.length < 5) return;

      try {
        // Chercher le profil existant pour ce thread
        const existingProfile = await getProfileByThread(channel.id);
        if (!existingProfile) return; // Thread pas encore indexé

        // Parser le nouveau message pour enrichir le profil
        const newData = parseContractMessage(content, channel.name);
        if (!newData) return;

        // Récupérer la photo si présente
        const photoUrl = extractPhotoUrl(message);

        // Mettre à jour le profil (COALESCE dans le SQL préserve les valeurs existantes)
        await upsertProfile({
          discordUserId:   message.author.id,
          discordUsername: message.author.tag,
          guildId:         message.guild.id,
          channelId:       channel.parentId,
          channelName:     channel.name,
          messageId:       existingProfile.message_id, // Garder le message_id original
          threadId:        channel.id,
          profile:         newData,
          rawContent:      content.substring(0, 2000),
          photoUrl
        });

        // Sync dashboard
        await syncProfile(buildSyncPayload(existingProfile.message_id, channel.id, message, newData, photoUrl));

        console.log(`[INTERIM] Profil enrichi depuis thread "${channel.name}"`);
      } catch (err) {
        console.error('[INTERIM] Erreur messageCreate thread :', err.message);
      }
    }
  }
];

// ── Traitement d'un nouveau post forum ────────────────────────────────────────
async function processForumPost(thread, starterMessage, client) {
  const content = starterMessage.content.trim();
  const threadTitle = thread.name; // Ex: "Agent de sécurité"

  // Parser le contenu + utiliser le titre comme poste si non trouvé
  const profile = parseContractMessage(content, threadTitle);

  // Même si le contenu est vide/insuffisant, on crée quand même le profil
  // avec au minimum le poste (titre du post)
  const finalProfile = profile || { poste: threadTitle };

  // Récupérer la photo si présente dans le message initial
  const photoUrl = extractPhotoUrl(starterMessage);

  // Sauvegarder en DB (anti-doublon via ON CONFLICT message_id)
  await upsertProfile({
    discordUserId:   starterMessage.author.id,
    discordUsername: starterMessage.author.tag,
    guildId:         thread.guild.id,
    channelId:       thread.parentId,
    channelName:     thread.name,
    messageId:       starterMessage.id,
    threadId:        thread.id,
    profile:         finalProfile,
    rawContent:      content.substring(0, 2000),
    photoUrl
  });

  // Sync vers le dashboard
  await syncProfile(buildSyncPayload(starterMessage.id, thread.id, starterMessage, finalProfile, photoUrl));

  // Envoyer un embed de confirmation dans le thread
  const embed = buildConfirmEmbed(finalProfile, starterMessage.author, thread.name, photoUrl);
  await thread.send({ embeds: [embed] }).catch(() => {});

  console.log(`[INTERIM] Post forum indexé : "${thread.name}" — ${starterMessage.author.tag}`);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Extrait l'URL de la première image attachée à un message
 */
function extractPhotoUrl(message) {
  if (!message) return null;

  // Pièces jointes image
  const imageAttachment = message.attachments?.find(a =>
    a.contentType?.startsWith('image/') || /\.(png|jpg|jpeg|gif|webp)$/i.test(a.name || '')
  );
  if (imageAttachment) return imageAttachment.url;

  // Embeds avec image
  const embedImage = message.embeds?.find(e => e.image || e.thumbnail);
  if (embedImage) return embedImage.image?.url || embedImage.thumbnail?.url || null;

  return null;
}

/**
 * Construit le payload pour la sync dashboard
 */
function buildSyncPayload(messageId, threadId, message, profile, photoUrl) {
  return {
    messageId,
    threadId,
    discordUserId:   message.author.id,
    discordUsername: message.author.tag,
    guildId:         message.guild?.id || message.guildId,
    channelId:       message.channel?.parentId || message.channelId,
    channelName:     message.channel?.name || '',
    ...profile,
    photoUrl,
    rawContent: message.content?.substring(0, 2000) || ''
  };
}

/**
 * Construit l'embed de confirmation dans le thread
 */
function buildConfirmEmbed(profile, author, threadName, photoUrl) {
  const embed = new EmbedBuilder()
    .setColor(0x9b59b6)
    .setTitle('✅ Fiche intérimaire enregistrée')
    .setAuthor({
      name: author.tag,
      iconURL: author.displayAvatarURL({ dynamic: true })
    })
    .setTimestamp();

  if (photoUrl) embed.setThumbnail(photoUrl);

  const fields = [];

  if (profile.prenom || profile.nom) {
    fields.push({
      name: '👤 Identité RP',
      value: [profile.prenom, profile.nom].filter(Boolean).join(' '),
      inline: true
    });
  }
  if (profile.poste)      fields.push({ name: '💼 Poste',       value: profile.poste,      inline: true });
  if (profile.entreprise) fields.push({ name: '🏢 Entreprise',  value: profile.entreprise, inline: true });
  if (profile.id_employe) fields.push({ name: '🪪 ID Employé',  value: profile.id_employe, inline: true });
  if (profile.perso)      fields.push({ name: '📱 Perso',       value: profile.perso,      inline: true });
  if (profile.compte)     fields.push({ name: '🏦 Compte',      value: profile.compte,     inline: true });

  if (fields.length === 0) {
    fields.push({ name: '📋 Post', value: threadName, inline: false });
  }

  embed.addFields(fields);
  embed.setFooter({ text: 'Fiche synchronisée avec le dashboard • Reoxitof' });

  return embed;
}
