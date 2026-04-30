// Liste de mots bannis — ajoute/retire selon tes besoins
const BANNED_WORDS = [
  'nword', 'nigger', 'nigga', 'pédé', 'pede', 'fdp', 'enculé', 'encule',
  'connard', 'connasse', 'salope', 'pute', 'batard', 'bâtard', 'fils de pute',
  'ta gueule', 'va te faire', 'suicide', 'kys',
];

// Normalise le texte pour détecter les variantes (l33tspeak etc.)
function normalize(text) {
  return text
    .toLowerCase()
    .replace(/[àáâã]/g, 'a')
    .replace(/[éèêë]/g, 'e')
    .replace(/[îï]/g, 'i')
    .replace(/[ôö]/g, 'o')
    .replace(/[ùûü]/g, 'u')
    .replace(/[ç]/g, 'c')
    .replace(/0/g, 'o')
    .replace(/1/g, 'i')
    .replace(/3/g, 'e')
    .replace(/4/g, 'a')
    .replace(/5/g, 's')
    .replace(/\$/g, 's')
    .replace(/@/g, 'a')
    .replace(/[^a-z0-9\s]/g, '');
}

function containsBannedWord(text) {
  const normalized = normalize(text);
  return BANNED_WORDS.some(word => normalized.includes(normalize(word)));
}

async function checkMessage(message, client) {
  if (!message.guild) return false;
  if (message.author.bot) return false;
  if (message.member?.permissions.has('ManageMessages')) return false; // Staff exempt

  if (!containsBannedWord(message.content)) return false;

  // Supprimer le message
  await message.delete().catch(() => {});

  // Avertir dans le salon
  const warn = await message.channel.send(
    `${message.author} ⛔ Ton message a été supprimé car il contient un mot interdit.`
  ).catch(() => null);
  if (warn) setTimeout(() => warn.delete().catch(() => {}), 5000);

  // Log dans #logs
  const logChannel = message.guild.channels.cache.find(
    c => c.name.includes('logs') && !c.name.includes('staff')
  );
  if (logChannel) {
    const { EmbedBuilder } = require('discord.js');
    const embed = new EmbedBuilder()
      .setColor(0xFF0000)
      .setTitle('⛔  Mot interdit détecté')
      .addFields(
        { name: 'Membre', value: `${message.author}`, inline: true },
        { name: 'Salon', value: `${message.channel}`, inline: true },
        { name: 'Message', value: `||${message.content.slice(0, 500)}||`, inline: false },
      )
      .setFooter({ text: 'Reoxitof Gaming • AutoMod' })
      .setTimestamp();
    await logChannel.send({ embeds: [embed] }).catch(() => {});
  }

  return true;
}

module.exports = { checkMessage, BANNED_WORDS };
