import { ModalSubmitInteraction, TextChannel } from 'discord.js';
import { getUserByDiscordId } from '../../services/registrationService';
import { getUserLatestMessage, editMessage, getMessageById } from '../../services/messageService';
import { config } from '../../config/config';
import { CUSTOM_IDS } from '../../types';
import { formatDarkwebMessage } from '../../utils/formatting';
import { logger } from '../../utils/logger';

export async function handleEditMessageModal(interaction: ModalSubmitInteraction): Promise<void> {
  try {
    const newContent = interaction.fields.getTextInputValue(CUSTOM_IDS.EDIT_MESSAGE_INPUT);

    await interaction.deferReply({ ephemeral: true });

    // Look up the user's Darkweb identity
    const user = await getUserByDiscordId(interaction.user.id);

    if (!user) {
      await interaction.editReply({
        content: `⚠️ **Not Registered**\n\nYou don't have a Darkweb identity.`,
      });
      return;
    }

    if (user.status !== 'ACTIVE') {
      await interaction.editReply({
        content: `❌ **Access Denied**\n\nYour Darkweb identity is currently inactive.`,
      });
      return;
    }

    // Get user's most recent message
    const latestMessage = await getUserLatestMessage(interaction.user.id);

    if (!latestMessage) {
      await interaction.editReply({
        content: `❌ **No Messages**\n\nYou haven't sent any Darkweb messages yet.`,
      });
      return;
    }

    if (!latestMessage.discordMessageId) {
      await interaction.editReply({
        content: `❌ **Cannot Edit**\n\nYour message cannot be edited. Please try again later.`,
      });
      return;
    }

    // Edit the message in the database
    const result = await editMessage(latestMessage.id, newContent);

    if (!result.success) {
      await interaction.editReply({
        content: `❌ **Edit Failed**\n\n${result.error}`,
      });
      return;
    }

    // Get the message channel and edit the Discord message
    const messageChannel = interaction.client.channels.cache.get(
      config.channels.messageChannelId
    ) as TextChannel | undefined;

    if (!messageChannel) {
      logger.error('Darkweb message channel not found', {
        channelId: config.channels.messageChannelId,
      });
      await interaction.editReply({
        content: '❌ Message channel not available. Please contact staff.',
      });
      return;
    }

    try {
      const discordMessage = await messageChannel.messages.fetch(latestMessage.discordMessageId);

      const now = new Date(latestMessage.createdAt);
      const publicContent = formatDarkwebMessage(user.darkwebTag, newContent, now);

      // Add edit indicator
      const editedContent = `${publicContent}\n\n*edited*`;

      await discordMessage.edit(editedContent);

      await interaction.editReply({
        content: `✅ **Message Edited**\n\nYour Darkweb message has been updated.`,
      });

      logger.info('Darkweb message edited', {
        messageId: latestMessage.id,
        tag: user.darkwebTag,
        discordMessageId: latestMessage.discordMessageId,
      });
    } catch (fetchError) {
      logger.error('Failed to edit Discord message', {
        discordMessageId: latestMessage.discordMessageId,
        error: fetchError instanceof Error ? fetchError.message : String(fetchError),
      });
      await interaction.editReply({
        content: '❌ Failed to update message on Discord. Please try again later.',
      });
    }
  } catch (error) {
    logger.error('Error handling edit message modal', {
      userId: interaction.user.id,
      error: error instanceof Error ? error.message : String(error),
    });

    const content = '❌ An error occurred. Please try again later.';
    if (interaction.deferred) {
      await interaction.editReply({ content });
    } else if (!interaction.replied) {
      await interaction.reply({ content, ephemeral: true });
    }
  }
}
