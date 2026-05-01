const db = require('../database');
const { EmbedBuilder } = require('discord.js');
const { checkMessage } = require('../automod');

const PREFIX = '!';
const XP_COOLDOWN = 60000;
const XP_MIN = 15;
const XP_MAX = 25;
// Liens autorisés (domaines whitelist)
const ALLOWED_DOMAINS = ['twitch.tv', 'youtube.com', 'youtu.be', 'discord.gg/reoxitof'];

module.exports = {
  name: 'messageCreate',
  async execute(message, client) {
    if (message.author.bot) return;
    if (!message.guild) return;

    // ── AutoMod insultes ──────────────────────────
    const blocked = await checkMessage(message, client);
    if (blocked) return;

    // ── Anti-lien ─────────────────────────────
    const hasLink = /(https?:\/\/|discord\.gg\/)/i.test(message.content);
    if (hasLink) {
      const isAllowed = ALLOWED_DOMAINS.some(d => message.content.includes(d));
      const isMod = message.member.permissions.has('ManageMessages');
      if (!isAllowed && !isMod) {
        await message.delete().catch(() => {});
        const warn = await message.channel.send(
          `${message.author} ❌ Les liens ne sont pas autorisés ici.`
        );
        setTimeout(() => warn.delete().catch(() => {}), 5000);
        return;
      }
    }

    // ── Anti-spam (5 messages en 5 secondes) ──
    if (!client.spamMap) client.spamMap = new Map();
    const key = `${message.author.id}-${message.guild.id}`;
    const now = Date.now();
    const userData = client.spamMap.get(key) || { count: 0, firstMsg: now };

    if (now - userData.firstMsg < 5000) {
      userData.count++;
      if (userData.count >= 5) {
        const isMod = message.member.permissions.has('ManageMessages');
        if (!isMod) {
          await message.member.timeout(30000, 'Spam détecté').catch(() => {});
          const warn = await message.channel.send(
            `${message.author} ⏱️ Tu as été mute 30 secondes pour spam.`
          );
          setTimeout(() => warn.delete().catch(() => {}), 5000);
          client.spamMap.delete(key);
          return;
        }
      }
    } else {
      userData.count = 1;
      userData.firstMsg = now;
    }
    client.spamMap.set(key, userData);

    // ── Système XP ────────────────────────────
    const row = await db.prepare(
      'SELECT * FROM levels WHERE user_id = ? AND guild_id = ?'
    ).get(message.author.id, message.guild.id);

    const lastXp = row?.last_xp || 0;
    if (now - lastXp > XP_COOLDOWN) {
      const xpGain = Math.floor(Math.random() * (XP_MAX - XP_MIN + 1)) + XP_MIN;
      const currentXp = (row?.xp || 0) + xpGain;
      const currentLevel = row?.level || 0;
      const xpNeeded = getXpForLevel(currentLevel + 1);
      const messages = (row?.messages || 0) + 1;

      let newLevel = currentLevel;
      if (currentXp >= xpNeeded) {
        newLevel = currentLevel + 1;
        const embed = new EmbedBuilder()
          .setColor(0xFFD700)
          .setDescription(`🎉 ${message.author} vient de passer au **niveau ${newLevel}** !`)
          .setFooter({ text: 'Reoxitof Gaming' });
        message.channel.send({ embeds: [embed] }).catch(() => {});
      }

      await db.prepare(`
        INSERT INTO levels (user_id, guild_id, xp, level, messages, last_xp)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(user_id, guild_id) DO UPDATE SET
          xp = excluded.xp, level = excluded.level, messages = excluded.messages, last_xp = excluded.last_xp
      `).run(
        message.author.id, message.guild.id, currentXp, newLevel, messages, now
      );
    }

    // ── Commandes ─────────────────────────────
    if (!message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    const command = client.commands.get(commandName);
    if (!command) return;

    try {
      await command.execute(message, args, client);
    } catch (err) {
      console.error(`Erreur commande !${commandName} :`, err);
      message.reply('❌ Une erreur est survenue.').catch(() => {});
    }
  },
};

function getXpForLevel(level) {
  return 100 * level * level;
}
