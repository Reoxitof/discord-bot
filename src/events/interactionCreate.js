const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    if (!interaction.isButton()) return;

    // ── Fermeture de ticket ───────────────────────
    if (interaction.customId === 'close_ticket') {
      const channel = interaction.channel;
      if (!channel.name.startsWith('ticket-')) return;

      const isMod = interaction.member.permissions.has(PermissionFlagsBits.ManageMessages);
      const isOwner = channel.topic?.includes(interaction.user.tag);

      if (!isMod && !isOwner) {
        return interaction.reply({ content: '❌ Seul le staff ou le créateur peut fermer ce ticket.', ephemeral: true });
      }

      const embed = new EmbedBuilder()
        .setColor(0x95A5A6)
        .setTitle('🔒  Ticket fermé')
        .setDescription(`Ticket fermé par ${interaction.user}.\nSuppression dans 5 secondes...`)
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
      setTimeout(() => channel.delete('Ticket fermé').catch(() => {}), 5000);
    }
  },
};
