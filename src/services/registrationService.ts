import { UserStatus } from '@prisma/client';
import { prisma } from '../database/client';
import { logger } from '../utils/logger';
import { validateTag } from '../utils/validation';
import type { RegistrationResult } from '../types';

export async function registerUser(discordId: string, tag: string): Promise<RegistrationResult> {
  // Validate tag format
  const tagValidation = validateTag(tag);
  if (!tagValidation.valid) {
    return { success: false, error: tagValidation.error };
  }

  // Check if user is already registered
  const existingUser = await prisma.darkwebUser.findUnique({
    where: { discordId },
  });

  if (existingUser) {
    logger.info('Registration rejected: user already registered', {
      discordId,
      existingTag: existingUser.darkwebTag,
    });
    return {
      success: false,
      alreadyRegistered: true,
      existingTag: existingUser.darkwebTag,
      error: 'You already have a Darkweb identity.',
    };
  }

  // Check if tag is available
  const existingTag = await prisma.darkwebUser.findUnique({
    where: { darkwebTag: tag },
  });

  if (existingTag) {
    logger.info('Registration rejected: tag already taken', { tag });
    return {
      success: false,
      error: `Anon #${tag} is already registered. Please choose another tag.`,
    };
  }

  // Create the registration — the unique constraints handle race conditions
  try {
    await prisma.darkwebUser.create({
      data: {
        discordId,
        darkwebTag: tag,
        status: UserStatus.ACTIVE,
      },
    });

    logger.info('Registration successful', { discordId, tag });
    return { success: true, tag };
  } catch (error: unknown) {
    // Handle unique constraint violation (race condition)
    if (
      error instanceof Error &&
      'code' in error &&
      (error as { code: string }).code === 'P2002'
    ) {
      logger.warn('Registration race condition', { discordId, tag });
      return {
        success: false,
        error: `Anon #${tag} was just registered by another user. Please choose another tag.`,
      };
    }
    logger.error('Registration failed unexpectedly', {
      discordId,
      tag,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

export async function getUserByDiscordId(discordId: string) {
  return prisma.darkwebUser.findUnique({
    where: { discordId },
  });
}

export async function getUserByTag(tag: string) {
  return prisma.darkwebUser.findUnique({
    where: { darkwebTag: tag },
  });
}
