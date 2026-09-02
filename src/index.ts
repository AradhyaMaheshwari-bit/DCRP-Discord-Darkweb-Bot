import {
  Client,
  GatewayIntentBits,
  Partials,
  ButtonInteraction,
  ModalSubmitInteraction,
} from 'discord.js';
import { connectDatabase, disconnectDatabase } from './database/client';
import { config } from './config/config';
import { logger } from './utils/logger';
import { CUSTOM_IDS } from './types';
import { handleCreateTagButton } from './interactions/buttons/createTag';
import { handleNewMessageButton } from './interactions/buttons/newMessage';
import { handleCreateTagModal } from './interactions/modals/createTag';
import { handleNewMessageModal } from './interactions/modals/newMessage';
import { staff } from './commands/staff';
import { setup } from './commands/setup';

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

// Event: Ready
client.on('ready', async () => {
  logger.info('Bot logged in', { tag: client.user?.tag });

  try {
    await connectDatabase();
    logger.info('Database connection established');
  } catch (error) {
    logger.error('Failed to connect to database on startup', {
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  }

  // Set status
  if (client.user) {
    client.user.setActivity('the Darkweb', { type: 3 }); // 3 = WATCHING
  }
});

// Event: Interaction handling
client.on('interactionCreate', async (interaction) => {
  try {
    // Handle slash commands
    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === 'darkweb') {
        // Both setup and staff use the same command name with subcommands
        const subcommand = interaction.options.getSubcommand();
        if (subcommand === 'setup') {
          await setup.execute(interaction);
        } else {
          await staff.execute(interaction);
        }
      }
      return;
    }

    // Handle buttons
    if (interaction.isButton()) {
      if (interaction.customId === CUSTOM_IDS.CREATE_TAG_BUTTON) {
        await handleCreateTagButton(interaction);
      } else if (interaction.customId === CUSTOM_IDS.NEW_MESSAGE_BUTTON) {
        await handleNewMessageButton(interaction);
      }
      return;
    }

    // Handle modals
    if (interaction.isModalSubmit()) {
      if (interaction.customId === CUSTOM_IDS.CREATE_TAG_MODAL) {
        await handleCreateTagModal(interaction);
      } else if (interaction.customId === CUSTOM_IDS.NEW_MESSAGE_MODAL) {
        await handleNewMessageModal(interaction);
      }
      return;
    }
  } catch (error) {
    logger.error('Error handling interaction', {
      error: error instanceof Error ? error.message : String(error),
      interactionType: interaction.type,
    });

    try {
      if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: '❌ An error occurred. Please try again later.',
          ephemeral: true,
        });
      }
    } catch {
      logger.error('Failed to send error reply to user');
    }
  }
});

// Event: Error handling
client.on('error', (error) => {
  logger.error('Discord client error', {
    error: error instanceof Error ? error.message : String(error),
  });
});

process.on('SIGINT', async () => {
  logger.info('Shutting down gracefully...');
  await disconnectDatabase();
  await client.destroy();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Shutting down gracefully...');
  await disconnectDatabase();
  await client.destroy();
  process.exit(0);
});

// Login
logger.info('Starting Darkweb bot...');
client.login(config.discord.token);
