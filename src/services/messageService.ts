import { UserStatus } from '@prisma/client';
import { prisma } from '../database/client';
import { config } from '../config/config';
import { logger } from '../utils/logger';
import { validateMessageContent, sanitizeContent } from '../utils/validation';
import { checkModeration } from './moderationService';
import type { MessageResult } from '../types';

// In-memory cooldown tracker — keyed by Discord user ID
const cooldowns = new Map<string, number>();

export function checkCooldown(discordId: string): { allowed: boolean; remainingSeconds: number } {
  const now = Date.now();
  const lastSent = cooldowns.get(discordId);

  if (!lastSent) {
    return { allowed: true, remainingSeconds: 0 };
  }

  const elapsed = (now - lastSent) / 1000;
  const cooldownSeconds = config.darkweb.messageCooldownSeconds;

  if (elapsed < cooldownSeconds) {
    return {
      allowed: false,
      remainingSeconds: cooldownSeconds - elapsed,
    };
  }

  return { allowed: true, remainingSeconds: 0 };
}

export function setCooldown(discordId: string): void {
  cooldowns.set(discordId, Date.now());
}

export async function createMessage(
  discordId: string,
  darkwebTag: string,
  rawContent: string
): Promise<MessageResult> {
  // Validate content
  const contentValidation = validateMessageContent(rawContent);
  if (!contentValidation.valid) {
    return { success: false, error: contentValidation.error };
  }

  // Sanitize content
  const content = sanitizeContent(rawContent);

  // Run moderation checks
  const moderationResult = checkModeration(content);
  if (!moderationResult.passed) {
    logger.info('Message rejected by moderation', { discordId, reason: moderationResult.reason });
    return { success: false, error: moderationResult.reason };
  }

  // Check cooldown
  const cooldown = checkCooldown(discordId);
  if (!cooldown.allowed) {
    return {
      success: false,
      error: `Please wait ${Math.ceil(cooldown.remainingSeconds)} seconds before sending another Darkweb message.`,
    };
  }

  // Verify user status
  const user = await prisma.darkwebUser.findUnique({
    where: { discordId },
  });

  if (!user) {
    return { success: false, error: 'User not found.' };
  }

  if (user.status === UserStatus.REVOKED) {
    return { success: false, error: 'Your Darkweb identity is currently inactive.' };
  }

  if (user.status === UserStatus.BANNED) {
    return { success: false, error: 'Your Darkweb identity is currently inactive.' };
  }

  // Save to database (Discord message ID set later after posting)
  try {
    const message = await prisma.darkwebMessage.create({
      data: {
        discordUserId: discordId,
        darkwebTag,
        content,
      },
    });

    // Set cooldown after successful database write
    setCooldown(discordId);

    logger.info('Message created', { messageId: message.id, tag: darkwebTag });
    return { success: true, messageId: message.id };
  } catch (error: unknown) {
    logger.error('Failed to create message', {
      discordId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

export async function updateDiscordMessageId(
  messageId: string,
  discordMessageId: string
): Promise<void> {
  await prisma.darkwebMessage.update({
    where: { id: messageId },
    data: { discordMessageId },
  });
}

export async function markMessageDeleted(messageId: string): Promise<void> {
  await prisma.darkwebMessage.update({
    where: { id: messageId },
    data: { deleted: true },
  });
}

export async function getMessageById(messageId: string) {
  return prisma.darkwebMessage.findUnique({
    where: { id: messageId },
  });
}
