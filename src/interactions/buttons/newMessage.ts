import {
  ButtonInteraction,
  ModalBuilder,
  ActionRowBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';
import { getUserByDiscordId } from '../../services/registrationService';
import { config } from '../../config/config';
import { CUSTOM_IDS } from '../../types';
import { logger } from '../../utils/logger';

export async function handleNewMessageButton(interaction: ButtonInteraction): Promise<void> {
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

    // Show message modal
    const modal = new ModalBuilder()
      .setCustomId(CUSTOM_IDS.NEW_MESSAGE_MODAL)
      .setTitle('Send Darkweb Message');

    const messageInput = new TextInputBuilder()
      .setCustomId(CUSTOM_IDS.NEW_MESSAGE_INPUT)
      .setLabel('Message')
      .setPlaceholder('Type your message here...')
      .setMinLength(1)
      .setMaxLength(config.darkweb.messageMaxLength)
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    const row = new ActionRowBuilder<TextInputBuilder>().addComponents(messageInput);
    modal.addComponents(row);

    await interaction.showModal(modal);
  } catch (error) {
    logger.error('Error handling new message button', {
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
