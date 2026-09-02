import { REST, Routes } from 'discord.js';
import { config } from './config/config';
import { logger } from './utils/logger';
import { staff } from './commands/staff';
import { setup } from './commands/setup';

const commands = [
  // Combine staff and setup into one command definition since they share the same name
  {
    ...staff.data.toJSON(),
    options: [
      ...(staff.data.toJSON().options || []),
      ...(setup.data.toJSON().options || []),
    ],
  },
];

const rest = new REST({ version: '10' }).setToken(config.discord.token);

async function deployCommands(): Promise<void> {
  try {
    logger.info('Deploying slash commands...');

    const data = await rest.put(
      Routes.applicationGuildCommands(config.discord.clientId, config.discord.guildId),
      { body: commands }
    );

    logger.info('Slash commands deployed successfully', {
      count: Array.isArray(data) ? data.length : 1,
    });
  } catch (error) {
    logger.error('Failed to deploy commands', {
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  }
}

deployCommands();
