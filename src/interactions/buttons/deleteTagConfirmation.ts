import { ButtonInteraction } from 'discord.js';
import { unlinkUserTag, getUserTag } from '../../services/deleteTagService';
import { logger } from '../../utils/logger';

export async function handleDeleteTagConfirm(interaction: ButtonInteraction): Promise<void> {
  try {
    // Verify the user who clicked confirm is the same user who initiated deletion
    // (The button was already ephemeral, so only the original user can interact with it)

    const result = await unlinkUserTag(interaction.user.id);

    if (!result.success) {
      await interaction.reply({
        content: `❌ ${result.error}`,
        ephemeral: true,
      });
      return;
    }

    await interaction.reply({
      content: `✅ **Tag Unlinked**\n\nYour Darkweb tag #${result.tag} has been successfully unlinked from your Discord account.\n\nYou can now create a new Darkweb tag using the **Create Tag** button.`,
      ephemeral: true,
    });

    logger.info('User unlinked darkweb tag', { tag: result.tag });
  } catch (error) {
    logger.error('Error confirming tag deletion', {
      userId: interaction.user.id,
      error: error instanceof Error ? error.message : String(error),
    });

    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: '❌ An error occurred while unlinking your tag. Please try again later.',
        ephemeral: true,
      });
    }
  }
}

export async function handleDeleteTagCancel(interaction: ButtonInteraction): Promise<void> {
  try {
    await interaction.reply({
      content: '❌ **Cancelled**\n\nYour Darkweb tag has NOT been deleted.',
      ephemeral: true,
    });
  } catch (error) {
    logger.error('Error cancelling tag deletion', {
      userId: interaction.user.id,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
