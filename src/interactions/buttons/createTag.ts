import {
  ButtonInteraction,
  ModalBuilder,
  ActionRowBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';
import { getUserByDiscordId } from '../../services/registrationService';
import { CUSTOM_IDS } from '../../types';
import { formatTag } from '../../utils/formatting';
import { logger } from '../../utils/logger';

export async function handleCreateTagButton(interaction: ButtonInteraction): Promise<void> {
  try {
    // Check if already registered
    const existingUser = await getUserByDiscordId(interaction.user.id);

    if (existingUser) {
      await interaction.reply({
        content: [
          `⚠️ **Already Registered**`,
          ``,
          `You already have the Darkweb identity:`,
          ``,
          `**${formatTag(existingUser.darkwebTag)}**`,
        ].join('\n'),
        ephemeral: true,
      });
      return;
    }

    // Show the tag creation modal
    const modal = new ModalBuilder()
      .setCustomId(CUSTOM_IDS.CREATE_TAG_MODAL)
      .setTitle('Create Your Anonymous Tag');

    const tagInput = new TextInputBuilder()
      .setCustomId(CUSTOM_IDS.CREATE_TAG_INPUT)
      .setLabel('Enter your numeric tag (4 digits)')
      .setPlaceholder('3699')
      .setMinLength(4)
      .setMaxLength(4)
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const row = new ActionRowBuilder<TextInputBuilder>().addComponents(tagInput);
    modal.addComponents(row);

    await interaction.showModal(modal);
  } catch (error) {
    logger.error('Error handling create tag button', {
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
