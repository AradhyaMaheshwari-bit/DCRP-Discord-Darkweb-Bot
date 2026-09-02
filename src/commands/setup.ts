import { SlashCommandBuilder, ChatInputCommandInteraction, TextChannel } from 'discord.js';
import { config } from '../config/config';
import { logger } from '../utils/logger';
import { postRegistrationPanel, postMessagingPanel } from '../utils/panels';

function isStaff(interaction: ChatInputCommandInteraction): boolean {
  if (!config.staff.roleId) {
    return false;
  }
  return (interaction.member?.roles as any)?.cache?.has(config.staff.roleId) ?? false;
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

      // Check channel-specific permissions
      if (registrationChannel) {
        const regPerms = registrationChannel.permissionsFor(botMember);
        if (!regPerms?.has('ViewChannel')) {
          issues.push('Bot cannot view registration channel (check channel permissions).');
        }
        if (!regPerms?.has('SendMessages')) {
          issues.push('Bot cannot send messages to registration channel (check channel permissions).');
        }
      }
      if (messageChannel) {
        const msgPerms = messageChannel.permissionsFor(botMember);
        if (!msgPerms?.has('ViewChannel')) {
          issues.push('Bot cannot view message channel (check channel permissions).');
        }
        if (!msgPerms?.has('SendMessages')) {
          issues.push('Bot cannot send messages to message channel (check channel permissions).');
        }
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

      // Post the registration and messaging panels
      const regChannel = registrationChannel as TextChannel;
      const msgChannel = messageChannel as TextChannel;

      // DIAGNOSTIC: Log channel types and text-based status
      logger.info('Channel diagnostics', {
        regChannelType: registrationChannel?.type,
        regChannelIsTextBased: (registrationChannel as any)?.isTextBased?.(),
        msgChannelType: messageChannel?.type,
        msgChannelIsTextBased: (messageChannel as any)?.isTextBased?.(),
      });

      const panelResults: string[] = [];

      try {
        const regPanelId = await postRegistrationPanel(regChannel);
        if (regPanelId) {
          panelResults.push('✅ Registration panel posted');
        } else {
          panelResults.push('⚠️ Failed to post registration panel');
        }
      } catch (error) {
        logger.error('Error posting registration panel', {
          error: error instanceof Error ? error.message : String(error),
        });
        panelResults.push('⚠️ Failed to post registration panel');
      }

      try {
        const msgPanelId = await postMessagingPanel(msgChannel);
        if (msgPanelId) {
          panelResults.push('✅ Messaging panel posted');
        } else {
          panelResults.push('⚠️ Failed to post messaging panel');
        }
      } catch (error) {
        logger.error('Error posting messaging panel', {
          error: error instanceof Error ? error.message : String(error),
        });
        panelResults.push('⚠️ Failed to post messaging panel');
      }

      await interaction.editReply({
        content: [
          `✅ **Setup Verified**`,
          ``,
          `All permissions and channels are correctly configured.`,
          ``,
          panelResults.join('\n'),
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
