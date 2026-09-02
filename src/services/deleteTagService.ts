import { prisma } from '../database/client';
import { logger } from '../utils/logger';

export async function unlinkUserTag(discordId: string): Promise<{ success: boolean; tag?: string; error?: string }> {
  try {
    // Find the user's current linked tag
    const user = await prisma.darkwebUser.findUnique({
      where: { discordId },
    });

    if (!user) {
      return {
        success: false,
        error: 'You do not currently have a Darkweb tag.',
      };
    }

    const tag = user.darkwebTag;

    // Unlink the Discord user by setting discordId to NULL
    await prisma.darkwebUser.update({
      where: { id: user.id },
      data: { discordId: null },
    });

    logger.info('User tag unlinked', {
      tag,
      userId: user.id,
    });

    return {
      success: true,
      tag,
    };
  } catch (error: unknown) {
    logger.error('Failed to unlink user tag', {
      discordId,
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      success: false,
      error: 'An error occurred while unlinking your tag. Please try again.',
    };
  }
}

export async function getUserTag(discordId: string) {
  return prisma.darkwebUser.findUnique({
    where: { discordId },
  });
}
