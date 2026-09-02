import { UserStatus } from '@prisma/client';
import { prisma } from '../database/client';
import { logger } from '../utils/logger';
import type { StaffLookupResult, StaffActionResult } from '../types';

export async function lookupByTag(tag: string): Promise<StaffLookupResult> {
  const user = await prisma.darkwebUser.findUnique({
    where: { darkwebTag: tag },
    include: {
      messages: {
        where: { deleted: false },
      },
    },
  });

  if (!user) {
    return { found: false };
  }

  logger.info('Staff lookup performed', { tag });

  return {
    found: true,
    tag: user.darkwebTag,
    discordId: user.discordId,
    status: user.status,
    createdAt: user.createdAt,
    messageCount: user.messages.length,
  };
}

export async function lookupByDiscordId(discordId: string): Promise<StaffLookupResult> {
  const user = await prisma.darkwebUser.findUnique({
    where: { discordId },
    include: {
      messages: {
        where: { deleted: false },
      },
    },
  });

  if (!user) {
    return { found: false };
  }

  logger.info('Staff lookup by Discord ID performed', { discordId });

  return {
    found: true,
    tag: user.darkwebTag,
    discordId: user.discordId,
    status: user.status,
    createdAt: user.createdAt,
    messageCount: user.messages.length,
  };
}

export async function revokeUser(tag: string): Promise<StaffActionResult> {
  const user = await prisma.darkwebUser.findUnique({
    where: { darkwebTag: tag },
  });

  if (!user) {
    return { success: false, error: `Anon #${tag} not found.` };
  }

  if (user.status === UserStatus.REVOKED) {
    return { success: false, error: `Anon #${tag} is already revoked.` };
  }

  await prisma.darkwebUser.update({
    where: { darkwebTag: tag },
    data: { status: UserStatus.REVOKED },
  });

  logger.info('Staff revoked user', { tag });
  return { success: true };
}

export async function banUser(tag: string): Promise<StaffActionResult> {
  const user = await prisma.darkwebUser.findUnique({
    where: { darkwebTag: tag },
  });

  if (!user) {
    return { success: false, error: `Anon #${tag} not found.` };
  }

  if (user.status === UserStatus.BANNED) {
    return { success: false, error: `Anon #${tag} is already banned.` };
  }

  await prisma.darkwebUser.update({
    where: { darkwebTag: tag },
    data: { status: UserStatus.BANNED },
  });

  logger.info('Staff banned user', { tag });
  return { success: true };
}

export async function resetUser(discordId: string): Promise<StaffActionResult> {
  const user = await prisma.darkwebUser.findUnique({
    where: { discordId },
  });

  if (!user) {
    return { success: false, error: 'User not found.' };
  }

  // Delete the registration (keeps message history via discordUserId)
  await prisma.darkwebUser.delete({
    where: { discordId },
  });

  logger.info('Staff reset user registration', { discordId, previousTag: user.darkwebTag });
  return { success: true };
}

export async function unbanUser(tag: string): Promise<StaffActionResult> {
  const user = await prisma.darkwebUser.findUnique({
    where: { darkwebTag: tag },
  });

  if (!user) {
    return { success: false, error: `Anon #${tag} not found.` };
  }

  if (user.status === UserStatus.ACTIVE) {
    return { success: false, error: `Anon #${tag} is already active.` };
  }

  await prisma.darkwebUser.update({
    where: { darkwebTag: tag },
    data: { status: UserStatus.ACTIVE },
  });

  logger.info('Staff unbanned/unrevoked user', { tag });
  return { success: true };
}
