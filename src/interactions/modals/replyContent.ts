import { ModalSubmitInteraction, TextChannel } from 'discord.js';
import { getUserByDiscordId } from '../../services/registrationService';
import { createReply, getMessageById, updateDiscordMessageId } from '../../services/messageService';
import { config } from '../../config/config';
import { CUSTOM_IDS } from '../../types';
import { formatDarkwebMessage } from '../../utils/formatting';
import { logger } from '../../utils/logger';

export async function handleReplyContentModal(interaction: ModalSubmitInteraction): Promise<void> {
  try {
    const targetId = interaction.fields.getTextInputValue(CUSTOM_IDS.REPLY_TARGET_INPUT).trim();
    const content = interaction.fields.getTextInputValue(CUSTOM_IDS.REPLY_CONTENT_INPUT);

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

    // Verify the target message exists
    const targetMessage = await getMessageById(targetId);

    if (!targetMessage || targetMessage.deleted) {
      await interaction.editReply({
        content: `❌ **Message Not Found**\n\nCould not find that Darkweb message. Make sure the ID is correct.`,
      });
      return;
    }

    // Create the reply in the database
    const result = await createReply(interaction.user.id, user.darkwebTag, content, targetId);

    if (!result.success) {
      if (result.error?.includes('wait')) {
        await interaction.editReply({
          content: `⏳ **Slow Down**\n\n${result.error}`,
        });
      } else {
        await interaction.editReply({
          content: `❌ **Reply Failed**\n\n${result.error}`,
        });
      }
      return;
    }

    // Get the target message Discord message ID
    if (!targetMessage.discordMessageId) {
      await interaction.editReply({
        content: `❌ **Cannot Post Reply**\n\nThe target message is no longer available. Please try again.`,
      });
      return;
    }

    // Post the reply in the darkweb channel, referencing the original message
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
      const sentMessage = await messageChannel.send({
        content: publicContent,
        reply: {
          messageReference: targetMessage.discordMessageId,
          failIfNotExists: false,
        },
      });

      // Update the database record with the Discord message ID
      if (result.messageId) {
        await updateDiscordMessageId(result.messageId, sentMessage.id);
      }

      await interaction.editReply({
        content: `✅ **Reply Sent**\n\nYour reply has been published in the Darkweb.`,
      });

      logger.info('Darkweb reply published', {
        tag: user.darkwebTag,
        discordMessageId: sentMessage.id,
        replyToId: targetId,
      });
    } catch (sendError) {
      logger.error('Failed to send reply message', {
        error: sendError instanceof Error ? sendError.message : String(sendError),
      });
      await interaction.editReply({
        content: '❌ Failed to publish reply. Please try again later.',
      });
    }
  } catch (error) {
    logger.error('Error handling reply content modal', {
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
