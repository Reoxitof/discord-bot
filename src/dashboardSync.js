/**
 * dashboardSync.js
 * Envoie les profils intérimaires vers l'API du dashboard.
 * Anti-doublon : vérifie d'abord si le profil existe (par message_id) avant d'envoyer.
 */

const DASHBOARD_URL = (process.env.DASHBOARD_URL || 'https://sitegestion.sliplane.app').replace(/\/$/, '');
const DASHBOARD_API_TOKEN = process.env.DASHBOARD_API_TOKEN || '';

/**
 * Envoie ou met à jour un profil intérimaire sur le dashboard.
 * Utilise message_id comme clé d'unicité pour éviter les doublons.
 */
async function syncProfile(profileData) {
  if (!DASHBOARD_URL) {
    console.log('[SYNC] DASHBOARD_URL non configuré — sync ignorée');
    return null;
  }

  try {
    const headers = {
      'Content-Type': 'application/json',
    };
    if (DASHBOARD_API_TOKEN) {
      headers['x-bot-token'] = DASHBOARD_API_TOKEN;
    }

    // 1. Vérifier si le profil existe déjà (anti-doublon)
    const checkRes = await fetch(
      `${DASHBOARD_URL}/interim/profiles/by-message/${encodeURIComponent(profileData.messageId)}`,
      { headers, signal: AbortSignal.timeout(8000) }
    ).catch(() => null);

    if (checkRes && checkRes.ok) {
      const existing = await checkRes.json().catch(() => null);
      if (existing?.profile) {
        // Profil existe → PATCH pour mettre à jour
        const patchRes = await fetch(
          `${DASHBOARD_URL}/interim/profiles/${existing.profile.id}`,
          {
            method: 'PATCH',
            headers,
            body: JSON.stringify(profileData),
            signal: AbortSignal.timeout(8000)
          }
        ).catch(() => null);

        if (patchRes?.ok) {
          console.log(`[SYNC] Profil mis à jour sur le dashboard — message_id: ${profileData.messageId}`);
          return await patchRes.json().catch(() => ({ success: true }));
        }
        return null;
      }
    }

    // 2. Profil n'existe pas → POST pour créer
    const postRes = await fetch(`${DASHBOARD_URL}/interim/profiles`, {
      method: 'POST',
      headers,
      body: JSON.stringify(profileData),
      signal: AbortSignal.timeout(8000)
    }).catch(() => null);

    if (postRes?.ok) {
      console.log(`[SYNC] Profil créé sur le dashboard — ${profileData.nom || profileData.prenom || profileData.messageId}`);
      return await postRes.json().catch(() => ({ success: true }));
    }

    if (postRes) {
      const err = await postRes.text().catch(() => '');
      console.log(`[SYNC] Erreur dashboard ${postRes.status}: ${err.substring(0, 200)}`);
    }

    return null;
  } catch (err) {
    console.log('[SYNC] Erreur sync dashboard :', err.message);
    return null;
  }
}

module.exports = { syncProfile };
