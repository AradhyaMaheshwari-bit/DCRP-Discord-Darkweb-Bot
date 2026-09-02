import { TextChannel } from 'discord.js';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { config } from '../config/config';
import { logger } from '../utils/logger';
import { CUSTOM_IDS } from '../types';

export async function postRegistrationPanel(channel: TextChannel): Promise<string | null> {
  try {
    const button = new ButtonBuilder()
      .setCustomId(CUSTOM_IDS.CREATE_TAG_BUTTON)
      .setLabel('Create Tag')
      .setEmoji('📝')
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

    const message = await channel.send({
      content: [
        `╔════════════════════════════════════╗`,
        `       🕸️ DARKWEB REGISTRATION`,
        `╠════════════════════════════════════╣`,
        ``,
        `Welcome to the Darkweb.`,
        ``,
        `Create your anonymous numeric identity`,
        `to access the Darkweb messaging system.`,
        ``,
        `Your Discord identity will not be displayed`,
        `alongside your Darkweb messages.`,
        ``,
        `**Rules:**`,
        `• Choose a unique numeric tag`,
        `• Do not impersonate another user`,
        `• No spam`,
        `• Follow server rules`,
        ``,
        `╚════════════════════════════════════╝`,
      ].join('\n'),
      components: [row],
    });

    logger.info('Registration panel posted', { messageId: message.id, channelId: channel.id });
    return message.id;
  } catch (error) {
    logger.error('Failed to post registration panel', {
      channelId: channel.id,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

export async function postMessagingPanel(channel: TextChannel): Promise<string | null> {
  try {
    const button = new ButtonBuilder()
      .setCustomId(CUSTOM_IDS.NEW_MESSAGE_BUTTON)
      .setLabel('New Message')
      .setEmoji('📝')
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

    const message = await channel.send({
      content: [
        `🕸️ **DARKWEB MESSAGING**`,
        ``,
        `Send anonymous messages using the button below.`,
        ``,
        `Your registered Darkweb identity is automatically attached to your message.`,
      ].join('\n'),
      components: [row],
    });

    logger.info('Messaging panel posted', { messageId: message.id, channelId: channel.id });
    return message.id;
  } catch (error) {
    logger.error('Failed to post messaging panel', {
      channelId: channel.id,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}
