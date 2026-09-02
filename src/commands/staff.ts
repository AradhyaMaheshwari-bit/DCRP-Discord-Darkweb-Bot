import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { lookupByTag, lookupByDiscordId, revokeUser, banUser, unbanUser, resetUser } from '../services/staffService';
import { config } from '../config/config';
import { logger } from '../utils/logger';
import { formatTag } from '../utils/formatting';

function isStaff(interaction: ChatInputCommandInteraction): boolean {
  if (!config.staff.roleId) {
    return false;
  }
  return (interaction.member?.roles as any)?.has?.(config.staff.roleId) || false;
}

export const staff = {
  data: new SlashCommandBuilder()
    .setName('darkweb')
    .setDescription('Darkweb staff commands')
    .addSubcommand((sub) =>
      sub
        .setName('lookup')
        .setDescription('Look up a Darkweb identity')
        .addStringOption((opt) =>
          opt
            .setName('tag')
            .setDescription('Darkweb tag (e.g., 3699)')
            .setRequired(false)
        )
        .addUserOption((opt) =>
          opt
            .setName('user')
            .setDescription('Discord user')
            .setRequired(false)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('revoke')
        .setDescription('Revoke a Darkweb identity')
        .addStringOption((opt) =>
          opt
            .setName('tag')
            .setDescription('Darkweb tag to revoke')
            .setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('ban')
        .setDescription('Ban a Darkweb identity')
        .addStringOption((opt) =>
          opt
            .setName('tag')
            .setDescription('Darkweb tag to ban')
            .setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('unban')
        .setDescription('Restore a revoked/banned Darkweb identity')
        .addStringOption((opt) =>
          opt
            .setName('tag')
            .setDescription('Darkweb tag to restore')
            .setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('reset')
        .setDescription('Reset a user\'s registration (allows re-registration)')
        .addUserOption((opt) =>
          opt
            .setName('user')
            .setDescription('Discord user to reset')
            .setRequired(true)
        )
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

      const subcommand = interaction.options.getSubcommand();

      if (subcommand === 'lookup') {
        await handleLookup(interaction);
      } else if (subcommand === 'revoke') {
        await handleRevoke(interaction);
      } else if (subcommand === 'ban') {
        await handleBan(interaction);
      } else if (subcommand === 'unban') {
        await handleUnban(interaction);
      } else if (subcommand === 'reset') {
        await handleReset(interaction);
      }
    } catch (error) {
      logger.error('Error in staff command', {
        error: error instanceof Error ? error.message : String(error),
      });

      const content = '❌ An error occurred executing the command.';
      if (interaction.deferred) {
        await interaction.editReply({ content });
      } else if (!interaction.replied) {
        await interaction.reply({ content, ephemeral: true });
      }
    }
  },
};

async function handleLookup(interaction: ChatInputCommandInteraction): Promise<void> {
  try {
    const tag = interaction.options.getString('tag');
    const user = interaction.options.getUser('user');

    if (!tag && !user) {
      await interaction.reply({
        content: '❌ You must provide either a tag or a user.',
        ephemeral: true,
      });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    let result;
    if (tag) {
      result = await lookupByTag(tag);
    } else {
      result = await lookupByDiscordId(user!.id);
    }

    if (!result.found) {
      await interaction.editReply({
        content: '❌ Identity not found.',
      });
      return;
    }

    const statusEmoji = result.status === 'ACTIVE' ? '✅' : '⚠️';

    const info = [
      `${statusEmoji} **Darkweb Identity Lookup**`,
      ``,
      `**Tag:** ${formatTag(result.tag!)}`,
      `**Discord ID:** ${result.discordId}`,
      `**Status:** ${result.status}`,
      `**Messages:** ${result.messageCount}`,
      `**Registered:** ${result.createdAt?.toLocaleString()}`,
    ].join('\n');

    await interaction.editReply({ content: info });
  } catch (error) {
    logger.error('Error in lookup command', {
      error: error instanceof Error ? error.message : String(error),
    });
    if (interaction.deferred) {
      await interaction.editReply({ content: '❌ Lookup failed.' });
    }
  }
}

async function handleRevoke(interaction: ChatInputCommandInteraction): Promise<void> {
  try {
    const tag = interaction.options.getString('tag', true);

    await interaction.deferReply({ ephemeral: true });

    const result = await revokeUser(tag);

    if (!result.success) {
      await interaction.editReply({
        content: `❌ **Revoke Failed**\n\n${result.error}`,
      });
      return;
    }

    await interaction.editReply({
      content: `✅ **Revoked**\n\n${formatTag(tag)} has been revoked and cannot send messages.`,
    });

    logger.info('Staff revoked identity via command', { tag });
  } catch (error) {
    logger.error('Error in revoke command', {
      error: error instanceof Error ? error.message : String(error),
    });
    if (interaction.deferred) {
      await interaction.editReply({ content: '❌ Revoke failed.' });
    }
  }
}

async function handleBan(interaction: ChatInputCommandInteraction): Promise<void> {
  try {
    const tag = interaction.options.getString('tag', true);

    await interaction.deferReply({ ephemeral: true });

    const result = await banUser(tag);

    if (!result.success) {
      await interaction.editReply({
        content: `❌ **Ban Failed**\n\n${result.error}`,
      });
      return;
    }

    await interaction.editReply({
      content: `✅ **Banned**\n\n${formatTag(tag)} has been banned from the Darkweb.`,
    });

    logger.info('Staff banned identity via command', { tag });
  } catch (error) {
    logger.error('Error in ban command', {
      error: error instanceof Error ? error.message : String(error),
    });
    if (interaction.deferred) {
      await interaction.editReply({ content: '❌ Ban failed.' });
    }
  }
}

async function handleUnban(interaction: ChatInputCommandInteraction): Promise<void> {
  try {
    const tag = interaction.options.getString('tag', true);

    await interaction.deferReply({ ephemeral: true });

    const result = await unbanUser(tag);

    if (!result.success) {
      await interaction.editReply({
        content: `❌ **Unban Failed**\n\n${result.error}`,
      });
      return;
    }

    await interaction.editReply({
      content: `✅ **Restored**\n\n${formatTag(tag)} has been restored and can use the Darkweb.`,
    });

    logger.info('Staff restored identity via command', { tag });
  } catch (error) {
    logger.error('Error in unban command', {
      error: error instanceof Error ? error.message : String(error),
    });
    if (interaction.deferred) {
      await interaction.editReply({ content: '❌ Restore failed.' });
    }
  }
}

async function handleReset(interaction: ChatInputCommandInteraction): Promise<void> {
  try {
    const user = interaction.options.getUser('user', true);

    await interaction.deferReply({ ephemeral: true });

    const result = await resetUser(user.id);

    if (!result.success) {
      await interaction.editReply({
        content: `❌ **Reset Failed**\n\n${result.error}`,
      });
      return;
    }

    await interaction.editReply({
      content: `✅ **Reset**\n\n<@${user.id}>'s registration has been reset. They can register again.`,
    });

    logger.info('Staff reset user registration via command', { userId: user.id });
  } catch (error) {
    logger.error('Error in reset command', {
      error: error instanceof Error ? error.message : String(error),
    });
    if (interaction.deferred) {
      await interaction.editReply({ content: '❌ Reset failed.' });
    }
  }
}
