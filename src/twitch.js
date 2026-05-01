const https = require('https');

const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;
const TWITCH_USERNAME = process.env.TWITCH_USERNAME || 'reoxitof';

let accessToken = null;
let tokenExpiry = 0;

async function getAccessToken() {
  if (accessToken && Date.now() < tokenExpiry) return accessToken;

  // Si pas de client secret, utilise l'app token hardcodé (généré manuellement)
  if (!TWITCH_CLIENT_SECRET) {
    accessToken = process.env.TWITCH_APP_TOKEN || '3d9gup04ollvbbpuzem1hu8iy1n2dj';
    tokenExpiry = Date.now() + 60 * 24 * 3600 * 1000; // 60 jours
    return accessToken;
  }

  return new Promise((resolve, reject) => {
    const postData = `client_id=${TWITCH_CLIENT_ID}&client_secret=${TWITCH_CLIENT_SECRET}&grant_type=client_credentials`;
    const options = {
      hostname: 'id.twitch.tv',
      path: '/oauth2/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const json = JSON.parse(data);
        accessToken = json.access_token;
        tokenExpiry = Date.now() + (json.expires_in - 60) * 1000;
        resolve(accessToken);
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function isLive() {
  const token = await getAccessToken();

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.twitch.tv',
      path: `/helix/streams?user_login=${TWITCH_USERNAME}`,
      method: 'GET',
      headers: {
        'Client-ID': TWITCH_CLIENT_ID,
        'Authorization': `Bearer ${token}`,
      },
    };

    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const json = JSON.parse(data);
        resolve(json.data && json.data.length > 0 ? json.data[0] : null);
      });
    });
    req.on('error', reject);
    req.end();
  });
}

module.exports = { isLive };
