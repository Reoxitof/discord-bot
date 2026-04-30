const { PermissionFlagsBits, ChannelType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  name: 'ticket',
  description: 'Ouvre un ticket avec le staff',
  async execute(message, args) {
    const guild = message.guild;

    // Vérifier si l'utilisateur a déjà un ticket ouvert
    const existing = guild.channels.cache.find(
      c => c.name === `ticket-${message.author.username.toLowerCase().replace(/[^a-z0-9]/g, '')}`
    );
    if (existing) {
      return message.reply(`❌ Tu as déjà un ticket ouvert : ${existing}`);
    }

    const everyoneRole = guild.roles.everyone;
    const modRole      = guild.roles.cache.find(r => r.name.includes('Modérateur'));
    const staffRole    = guild.roles.cache.find(r => r.name.includes('Staff'));
    const reoxitofRole = guild.roles.cache.find(r => r.name.includes('Reoxitof'));

    // Trouver ou créer la catégorie TICKETS
    let ticketCategory = guild.channels.cache.find(
      c => c.type === ChannelType.GuildCategory && c.name.toLowerCase().includes('ticket')
    );

    if (!ticketCategory) {
      ticketCategory = await guild.channels.create({
        name: '🎫 ─ TICKETS',
        type: ChannelType.GuildCategory,
        permissionOverwrites: [
          { id: everyoneRole.id, deny: [PermissionFlagsBits.ViewChannel] },
        ],
        reason: 'Catégorie tickets',
      });
    }

    // Créer le salon ticket
    const ticketChannel = await guild.channels.create({
      name: `ticket-${message.author.username.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      type: ChannelType.GuildText,
      parent: ticketCategory.id,
      topic: `Ticket de ${message.author.tag}`,
      permissionOverwrites: [
        { id: everyoneRole.id,    deny: [PermissionFlagsBits.ViewChannel] },
        { id: message.author.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
        { id: modRole?.id,       allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages] },
        { id: staffRole?.id,     allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
        { id: reoxitofRole?.id,  allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
      ].filter(p => p.id),
      reason: `Ticket créé par ${message.author.tag}`,
    });

    const raison = args.join(' ') || 'Aucune raison précisée';

    const embed = new EmbedBuilder()
      .setColor(0xFF4500)
      .setTitle('🎫  Nouveau Ticket')
      .setDescription(
        `Bienvenue ${message.author} !\n\n` +
        `**Raison :** ${raison}\n\n` +
        `Le staff va te répondre dès que possible.\n` +
        `Clique sur **Fermer** pour fermer ce ticket.`
      )
      .setFooter({ text: 'Reoxitof Gaming • Support' })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('close_ticket')
        .setLabel('🔒 Fermer le ticket')
        .setStyle(ButtonStyle.Danger)
    );

    await ticketChannel.send({ content: `${message.author} ${modRole || ''}`, embeds: [embed], components: [row] });
    message.reply(`✅ Ton ticket a été créé : ${ticketChannel}`);
  },
};
