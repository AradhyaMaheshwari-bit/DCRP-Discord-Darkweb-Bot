import { ButtonInteraction, ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import { getUserByDiscordId } from '../../services/registrationService';
import { config } from '../../config/config';
import { CUSTOM_IDS } from '../../types';
import { logger } from '../../utils/logger';

export async function handleReplyMessageButton(interaction: ButtonInteraction): Promise<void> {
  try {
    // Check if user is registered
    const user = await getUserByDiscordId(interaction.user.id);

    if (!user) {
      await interaction.reply({
        content: [
          `⚠️ **Not Registered**`,
          ``,
          `You don't have a Darkweb identity.`,
          ``,
          `Please register in <#${config.channels.registrationChannelId}> first.`,
        ].join('\n'),
        ephemeral: true,
      });
      return;
    }

    // Check user status
    if (user.status !== 'ACTIVE') {
      await interaction.reply({
        content: `❌ **Access Denied**\n\nYour Darkweb identity is currently inactive.`,
        ephemeral: true,
      });
      return;
    }

    // Show combined modal with target ID and reply content
    const modal = new ModalBuilder()
      .setCustomId(CUSTOM_IDS.REPLY_CONTENT_MODAL)
      .setTitle('Reply to Darkweb Message');

    const targetInput = new TextInputBuilder()
      .setCustomId(CUSTOM_IDS.REPLY_TARGET_INPUT)
      .setLabel('Message ID to reply to')
      .setPlaceholder('Paste the message ID from the Darkweb feed...')
      .setMinLength(1)
      .setMaxLength(100)
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const contentInput = new TextInputBuilder()
      .setCustomId(CUSTOM_IDS.REPLY_CONTENT_INPUT)
      .setLabel('Your Reply')
      .setPlaceholder('Type your reply here...')
      .setMinLength(1)
      .setMaxLength(config.darkweb.messageMaxLength)
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    const row1 = new ActionRowBuilder<TextInputBuilder>().addComponents(targetInput);
    const row2 = new ActionRowBuilder<TextInputBuilder>().addComponents(contentInput);
    modal.addComponents(row1, row2);

    await interaction.showModal(modal);
  } catch (error) {
    logger.error('Error handling reply message button', {
      userId: interaction.user.id,
      error: error instanceof Error ? error.message : String(error),
    });

    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: '❌ An error occurred. Please try again later.',
        ephemeral: true,
      });
    }
  }
}
