import { ModalSubmitInteraction, TextChannel } from 'discord.js';
import { getUserByDiscordId } from '../../services/registrationService';
import { createMessage, updateDiscordMessageId } from '../../services/messageService';
import { config } from '../../config/config';
import { CUSTOM_IDS } from '../../types';
import { formatDarkwebMessage } from '../../utils/formatting';
import { logger } from '../../utils/logger';

export async function handleNewMessageModal(interaction: ModalSubmitInteraction): Promise<void> {
  try {
    const content = interaction.fields.getTextInputValue(CUSTOM_IDS.NEW_MESSAGE_INPUT);

    await interaction.deferReply({ ephemeral: true });

    // Look up the user's Darkweb identity
    const user = await getUserByDiscordId(interaction.user.id);

    if (!user) {
      await interaction.editReply({
        content: `⚠️ **Not Registered**\n\nYou don't have a Darkweb identity. Please register first.`,
      });
      return;
    }

    if (user.status !== 'ACTIVE') {
      await interaction.editReply({
        content: `❌ **Access Denied**\n\nYour Darkweb identity is currently inactive.`,
      });
      return;
    }

    // Create the message record
    const result = await createMessage(interaction.user.id, user.darkwebTag, content);

    if (!result.success) {
      if (result.error?.includes('wait')) {
        await interaction.editReply({
          content: `⏳ **Slow Down**\n\n${result.error}`,
        });
      } else {
        await interaction.editReply({
          content: `❌ **Message Failed**\n\n${result.error}`,
        });
      }
      return;
    }

    // Post the public message in the darkweb channel
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

    const now = new Date();
    const publicContent = formatDarkwebMessage(user.darkwebTag, content, now);

    try {
      const sentMessage = await messageChannel.send(publicContent);

      // Update the database record with the Discord message ID
      if (result.messageId) {
        await updateDiscordMessageId(result.messageId, sentMessage.id);
      }

      await interaction.editReply({
        content: `✅ **Message Sent**\n\nYour Darkweb message has been published.`,
      });

      logger.info('Darkweb message published', {
        tag: user.darkwebTag,
        discordMessageId: sentMessage.id,
      });
    } catch (sendError) {
      logger.error('Failed to send public message', {
        error: sendError instanceof Error ? sendError.message : String(sendError),
      });
      await interaction.editReply({
        content: '❌ Failed to publish message. Please try again later.',
      });
    }
  } catch (error) {
    logger.error('Error handling new message modal', {
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
