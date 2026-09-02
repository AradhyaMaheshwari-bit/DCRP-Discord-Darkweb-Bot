import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { config } from '../config/config';
import { logger } from '../utils/logger';

function isStaff(interaction: ChatInputCommandInteraction): boolean {
  if (!config.staff.roleId) {
    return false;
  }
  return (interaction.member?.roles as any)?.has?.(config.staff.roleId) || false;
}

export const setup = {
  data: new SlashCommandBuilder()
    .setName('darkweb')
    .setDescription('Darkweb bot setup and management')
    .addSubcommand((sub) =>
      sub
        .setName('setup')
        .setDescription('Initialize the Darkweb system')
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    try {
      // Staff permission check
      if (!isStaff(interaction)) {
        await interaction.reply({
          content: '❌ You do not have permission to use this command.',
          ephemeral: true,
        });
        return;
      }

      await interaction.deferReply({ ephemeral: true });

      const guild = interaction.guild;
      if (!guild) {
        await interaction.editReply({
          content: '❌ This command can only be used in a server.',
        });
        return;
      }

      const botMember = guild.members.me;
      if (!botMember) {
        await interaction.editReply({
          content: '❌ Bot member not found.',
        });
        return;
      }

      // Check permissions
      const registrationChannel = guild.channels.cache.get(
        config.channels.registrationChannelId
      );
      const messageChannel = guild.channels.cache.get(config.channels.messageChannelId);

      const issues: string[] = [];

      if (!registrationChannel) {
        issues.push('Registration channel not found or not configured.');
      }
      if (!messageChannel) {
        issues.push('Message channel not found or not configured.');
      }

      if (!botMember.permissions.has('SendMessages')) {
        issues.push('Bot lacks Send Messages permission.');
      }
      if (!botMember.permissions.has('EmbedLinks')) {
        issues.push('Bot lacks Embed Links permission.');
      }
      if (!botMember.permissions.has('ManageMessages')) {
        issues.push('Bot lacks Manage Messages permission.');
      }

      if (issues.length > 0) {
        await interaction.editReply({
          content: [
            `⚠️ **Setup Issues Detected**`,
            ``,
            `Please resolve these issues:`,
            ``,
            issues.map((issue) => `• ${issue}`).join('\n'),
          ].join('\n'),
        });
        return;
      }

      await interaction.editReply({
        content: [
          `✅ **Setup Verified**`,
          ``,
          `All permissions and channels are correctly configured.`,
          ``,
          `The Darkweb system is ready to use.`,
        ].join('\n'),
      });

      logger.info('Setup command completed successfully', { guildId: guild.id });
    } catch (error) {
      logger.error('Error in setup command', {
        error: error instanceof Error ? error.message : String(error),
      });

      const content = '❌ An error occurred during setup verification.';
      if (interaction.deferred) {
        await interaction.editReply({ content });
      } else if (!interaction.replied) {
        await interaction.reply({ content, ephemeral: true });
      }
    }
  },
};
