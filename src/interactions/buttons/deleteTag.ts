import { ButtonInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Colors } from 'discord.js';
import { getUserTag } from '../../services/deleteTagService';
import { CUSTOM_IDS } from '../../types';
import { logger } from '../../utils/logger';

export async function handleDeleteTagButton(interaction: ButtonInteraction): Promise<void> {
  try {
    // Look up user's current tag
    const user = await getUserTag(interaction.user.id);

    if (!user) {
      await interaction.reply({
        content: '⚠️ **No Darkweb Tag**\n\nYou do not currently have a Darkweb tag linked to your account.',
        ephemeral: true,
      });
      return;
    }

    // Show confirmation
    const confirmButton = new ButtonBuilder()
      .setCustomId(CUSTOM_IDS.DELETE_TAG_CONFIRM)
      .setLabel('Confirm Delete')
      .setEmoji('🗑️')
      .setStyle(ButtonStyle.Danger);

    const cancelButton = new ButtonBuilder()
      .setCustomId(CUSTOM_IDS.DELETE_TAG_CANCEL)
      .setLabel('Cancel')
      .setEmoji('❌')
      .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(confirmButton, cancelButton);

    const embed = new EmbedBuilder()
      .setTitle('⚠️ DELETE DARKWEB TAG')
      .setColor(Colors.Red)
      .setDescription('You are about to unlink your Darkweb identity.')
      .addFields(
        { name: 'Tag', value: `#${user.darkwebTag}` },
        {
          name: 'What happens:',
          value: '• Your tag will be unlinked from your Discord account\n• Your tag and messages will NOT be deleted\n• You can create a new Darkweb tag afterward',
        }
      );

    await interaction.reply({
      embeds: [embed],
      components: [row],
      ephemeral: true,
    });
  } catch (error) {
    logger.error('Error handling delete tag button', {
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
