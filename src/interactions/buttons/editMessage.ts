import {
  ButtonInteraction,
  ModalBuilder,
  ActionRowBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';
import { getUserByDiscordId } from '../../services/registrationService';
import { getUserLatestMessage } from '../../services/messageService';
import { config } from '../../config/config';
import { CUSTOM_IDS } from '../../types';
import { logger } from '../../utils/logger';

export async function handleEditMessageButton(interaction: ButtonInteraction): Promise<void> {
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

    // Get user's most recent message
    const latestMessage = await getUserLatestMessage(interaction.user.id);

    if (!latestMessage) {
      await interaction.reply({
        content: `❌ **No Messages**\n\nYou haven't sent any Darkweb messages yet.`,
        ephemeral: true,
      });
      return;
    }

    if (!latestMessage.discordMessageId) {
      await interaction.reply({
        content: `❌ **Cannot Edit**\n\nYour message cannot be edited. Please try again later.`,
        ephemeral: true,
      });
      return;
    }

    // Show modal with current content
    const modal = new ModalBuilder()
      .setCustomId(CUSTOM_IDS.EDIT_MESSAGE_MODAL)
      .setTitle('Edit Your Darkweb Message');

    const contentInput = new TextInputBuilder()
      .setCustomId(CUSTOM_IDS.EDIT_MESSAGE_INPUT)
      .setLabel('Message Content')
      .setPlaceholder('Type your updated message here...')
      .setValue(latestMessage.content)
      .setMinLength(1)
      .setMaxLength(config.darkweb.messageMaxLength)
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    const row = new ActionRowBuilder<TextInputBuilder>().addComponents(contentInput);
    modal.addComponents(row);

    // Store the message ID in the interaction for the modal handler
    await interaction.showModal(modal);
  } catch (error) {
    logger.error('Error handling edit message button', {
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
