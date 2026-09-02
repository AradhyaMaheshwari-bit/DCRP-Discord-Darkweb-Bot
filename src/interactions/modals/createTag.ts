import { ModalSubmitInteraction } from 'discord.js';
import { registerUser } from '../../services/registrationService';
import { CUSTOM_IDS } from '../../types';
import { formatTag } from '../../utils/formatting';
import { logger } from '../../utils/logger';

export async function handleCreateTagModal(interaction: ModalSubmitInteraction): Promise<void> {
  try {
    const tag = interaction.fields.getTextInputValue(CUSTOM_IDS.CREATE_TAG_INPUT);

    await interaction.deferReply({ ephemeral: true });

    const result = await registerUser(interaction.user.id, tag);

    if (!result.success) {
      if (result.alreadyRegistered && result.existingTag) {
        await interaction.editReply({
          content: [
            `⚠️ **Already Registered**`,
            ``,
            `You already have the Darkweb identity:`,
            ``,
            `**${formatTag(result.existingTag)}**`,
          ].join('\n'),
        });
      } else {
        await interaction.editReply({
          content: `❌ **Registration Failed**\n\n${result.error}`,
        });
      }
      return;
    }

    await interaction.editReply({
      content: [
        `✅ **Darkweb Registration Successful**`,
        ``,
        `Your anonymous identity is:`,
        ``,
        `**${formatTag(result.tag!)}**`,
        ``,
        `You can now use the Darkweb messaging system.`,
      ].join('\n'),
    });
  } catch (error) {
    logger.error('Error handling create tag modal', {
      userId: interaction.user.id,
      error: error instanceof Error ? error.message : String(error),
    });

    const content = '❌ An error occurred during registration. Please try again later.';
    if (interaction.deferred) {
      await interaction.editReply({ content });
    } else if (!interaction.replied) {
      await interaction.reply({ content, ephemeral: true });
    }
  }
}
