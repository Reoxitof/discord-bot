/**
 * interimManager.js
 * Gestion des profils intérimaires en base de données.
 */

const db = require('./database');

/**
 * Sauvegarde ou met à jour un profil intérimaire
 */
async function upsertProfile({ discordUserId, discordUsername, guildId, channelId, channelName, messageId, profile, rawContent }) {
  const { pool } = db;

  await pool.query(`
    INSERT INTO interim_profiles (
      discord_user_id, discord_username, guild_id, channel_id, channel_name, message_id,
      nom, prenom, poste, entreprise, date_debut, date_fin, salaire, adresse, telephone, email, notes,
      raw_content, statut, updated_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,'actif',NOW())
    ON CONFLICT (message_id) DO UPDATE SET
      discord_username = EXCLUDED.discord_username,
      nom              = EXCLUDED.nom,
      prenom           = EXCLUDED.prenom,
      poste            = EXCLUDED.poste,
      entreprise       = EXCLUDED.entreprise,
      date_debut       = EXCLUDED.date_debut,
      date_fin         = EXCLUDED.date_fin,
      salaire          = EXCLUDED.salaire,
      adresse          = EXCLUDED.adresse,
      telephone        = EXCLUDED.telephone,
      email            = EXCLUDED.email,
      notes            = EXCLUDED.notes,
      raw_content      = EXCLUDED.raw_content,
      updated_at       = NOW()
  `, [
    discordUserId, discordUsername, guildId, channelId, channelName, messageId,
    profile.nom, profile.prenom, profile.poste, profile.entreprise,
    profile.date_debut, profile.date_fin, profile.salaire, profile.adresse,
    profile.telephone, profile.email, profile.notes,
    rawContent
  ]);
}

/**
 * Récupère tous les profils d'un serveur
 */
async function getProfiles(guildId, { statut = null, limit = 50, offset = 0 } = {}) {
  const { pool } = db;
  let query = `SELECT * FROM interim_profiles WHERE guild_id = $1`;
  const params = [guildId];

  if (statut) {
    params.push(statut);
    query += ` AND statut = $${params.length}`;
  }

  query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, offset);

  const res = await pool.query(query, params);
  return res.rows;
}

/**
 * Récupère un profil par ID Discord user
 */
async function getProfileByUser(discordUserId, guildId) {
  const { pool } = db;
  const res = await pool.query(
    `SELECT * FROM interim_profiles WHERE discord_user_id = $1 AND guild_id = $2 ORDER BY updated_at DESC LIMIT 1`,
    [discordUserId, guildId]
  );
  return res.rows[0] || null;
}

/**
 * Récupère un profil par message_id
 */
async function getProfileByMessage(messageId) {
  const { pool } = db;
  const res = await pool.query(
    `SELECT * FROM interim_profiles WHERE message_id = $1`,
    [messageId]
  );
  return res.rows[0] || null;
}

/**
 * Met à jour le statut d'un profil
 */
async function updateStatus(messageId, statut) {
  const { pool } = db;
  await pool.query(
    `UPDATE interim_profiles SET statut = $1, updated_at = NOW() WHERE message_id = $2`,
    [statut, messageId]
  );
}

/**
 * Supprime un profil
 */
async function deleteProfile(messageId) {
  const { pool } = db;
  await pool.query(`DELETE FROM interim_profiles WHERE message_id = $1`, [messageId]);
}

/**
 * Compte les profils
 */
async function countProfiles(guildId, statut = null) {
  const { pool } = db;
  let query = `SELECT COUNT(*) as c FROM interim_profiles WHERE guild_id = $1`;
  const params = [guildId];
  if (statut) {
    params.push(statut);
    query += ` AND statut = $2`;
  }
  const res = await pool.query(query, params);
  return parseInt(res.rows[0]?.c || 0);
}

/**
 * Recherche dans les profils
 */
async function searchProfiles(guildId, query) {
  const { pool } = db;
  const q = `%${query}%`;
  const res = await pool.query(`
    SELECT * FROM interim_profiles
    WHERE guild_id = $1
      AND (nom ILIKE $2 OR prenom ILIKE $2 OR poste ILIKE $2 OR entreprise ILIKE $2 OR email ILIKE $2)
    ORDER BY updated_at DESC
    LIMIT 20
  `, [guildId, q]);
  return res.rows;
}

module.exports = {
  upsertProfile,
  getProfiles,
  getProfileByUser,
  getProfileByMessage,
  updateStatus,
  deleteProfile,
  countProfiles,
  searchProfiles
};
