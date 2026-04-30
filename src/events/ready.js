const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'clientReady',
  once: true,
  async execute(client) {
    console.log(`\n✅ Connecté en tant que ${client.user.tag}`);
    client.user.setPresence({
      activities: [{ name: '🔴 reoxitof018 | !help', type: 0 }],
      status: 'online',
    });

    // ── Envoyer le règlement dans 📌・règles ──────
    const guild = client.guilds.cache.get(process.env.GUILD_ID);
    if (!guild) return;

    const rulesChannel = guild.channels.cache.find(
      c => c.name.includes('règles') || c.name.includes('regles') || c.name.includes('rules')
    );
    if (!rulesChannel) return;

    // Vider les anciens messages du bot dans ce salon
    const messages = await rulesChannel.messages.fetch({ limit: 10 }).catch(() => null);
    if (messages) {
      const botMessages = messages.filter(m => m.author.id === client.user.id);
      for (const msg of botMessages.values()) {
        await msg.delete().catch(() => {});
      }
    }

    // ── Embed 1 : Bannière d'intro ──────────────
    const embedIntro = new EmbedBuilder()
      .setColor(0xFF4500)
      .setTitle('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      .setDescription(
        '## 📜  RÈGLEMENT OFFICIEL\n' +
        '### Reoxitof Gaming\n\n' +
        '> Bienvenue sur le serveur ! En rejoignant et en restant ici,\n' +
        '> tu acceptes l\'ensemble des règles ci-dessous.\n' +
        '> Le non-respect entraîne des sanctions immédiates.'
      )
      .setThumbnail(guild.iconURL({ dynamic: true, size: 256 }))
      .setImage('https://i.imgur.com/8Km9tLL.gif');

    // ── Embed 2 : Règles ─────────────────────────
    const embedRules = new EmbedBuilder()
      .setColor(0x2B2D31)
      .addFields(
        {
          name: '🤝  Respect & Comportement',
          value:
            '╔══════════════════════════╗\n' +
            '▸ Respecte tous les membres sans exception\n' +
            '▸ Zéro insulte, harcèlement ou discrimination\n' +
            '▸ Pas de drama ni de beef public\n' +
            '▸ Les conflits → en privé ou via le staff\n' +
            '╚══════════════════════════╝',
        },
        {
          name: '💬  Langage & Contenu',
          value:
            '╔══════════════════════════╗\n' +
            '▸ Aucun contenu NSFW (images, liens, texte)\n' +
            '▸ Pas de spam, flood ou copier-coller répétitif\n' +
            '▸ Pas de majuscules abusives\n' +
            '▸ Langue principale : 🇫🇷 Français\n' +
            '╚══════════════════════════╝',
        },
        {
          name: '📢  Publicité & Self-Promo',
          value:
            '╔══════════════════════════╗\n' +
            '▸ Aucune pub sans autorisation du staff\n' +
            '▸ Pas de lien vers d\'autres serveurs Discord\n' +
            '▸ Self-promo uniquement dans le salon dédié\n' +
            '╚══════════════════════════╝',
        },
        {
          name: '📁  Salons & Catégories',
          value:
            '╔══════════════════════════╗\n' +
            '▸ Utilise les bons salons pour les bons sujets\n' +
            '▸ 📸 médias = clips & screenshots uniquement\n' +
            '▸ 🔍 recherche-joueurs = LFG, pas de chat\n' +
            '╚══════════════════════════╝',
        },
        {
          name: '🔊  Vocal',
          value:
            '╔══════════════════════════╗\n' +
            '▸ Pas de micro saturé ou bruit de fond excessif\n' +
            '▸ Pas d\'enregistrement sans consentement\n' +
            '▸ Respecte les personnes en vocal\n' +
            '╚══════════════════════════╝',
        },
        {
          name: '⚙️  Staff & Modération',
          value:
            '╔══════════════════════════╗\n' +
            '▸ Les décisions du staff sont **finales**\n' +
            '▸ Contestation uniquement en MP avec un modo\n' +
            '▸ Usurper l\'identité du staff = ban immédiat\n' +
            '╚══════════════════════════╝',
        },
      );

    // ── Embed 3 : Sanctions ──────────────────────
    const embedSanctions = new EmbedBuilder()
      .setColor(0xFF4500)
      .setTitle('⚖️  Système de Sanctions')
      .setDescription(
        '```\n' +
        '1re infraction   →   ⚠️  Avertissement\n' +
        'Récidive         →   🔇  Mute temporaire\n' +
        'Infraction grave →   👢  Kick du serveur\n' +
        'Très grave       →   🔨  Ban permanent\n' +
        '```\n' +
        '> 🔨 **NSFW · Harcèlement · Discrimination = Ban immédiat**'
      )
      .setFooter({
        text: '— 👑 Reoxitof  •  Reoxitof Gaming',
        iconURL: guild.iconURL(),
      })
      .setTimestamp();

    await rulesChannel.send({ embeds: [embedIntro] }).catch(() => {});
    await rulesChannel.send({ embeds: [embedRules] }).catch(() => {});
    await rulesChannel.send({ embeds: [embedSanctions] }).catch(() => {});

    // ── Embed 4 : Validation ─────────────────────
    const embedValidation = new EmbedBuilder()
      .setColor(0x57F287)
      .setTitle('✅  Valider le règlement')
      .setDescription(
        '> Réagis avec ✅ ci-dessous pour **accepter le règlement**\n' +
        '> et accéder au reste du serveur.\n\n' +
        '> ⚠️ Sans validation, tu n\'auras accès à aucun salon.'
      );

    const validationMsg = await rulesChannel.send({ embeds: [embedValidation] }).catch(() => null);
    if (validationMsg) {
      await validationMsg.react('✅').catch(() => {});
      // Sauvegarder l'ID du message de validation pour l'event reaction
      client.rulesMessageId = validationMsg.id;
      console.log(`✅ Message de validation créé : ${validationMsg.id}`);
    }

    console.log('✅ Règlement envoyé dans #règles');

    // ── Salon staff-commandes ─────────────────────
    const { sendStaffCommands } = require('../staffCommands');
    await sendStaffCommands(client);

    // ── Compteurs stats ───────────────────────────
    const { setupCounters } = require('../counters');
    await setupCounters(client);

    // ── Surveillance Twitch ───────────────────────
    if (process.env.TWITCH_CLIENT_ID && process.env.TWITCH_CLIENT_SECRET) {
      const liveAlert = require('./liveAlert');
      liveAlert.start(client);
    }

    // ── Surveillance YouTube ──────────────────────
    if (process.env.YOUTUBE_API_KEY && process.env.YOUTUBE_CHANNEL_ID) {
      const youtube = require('../youtube');
      youtube.start(client);
    }
  },
};
