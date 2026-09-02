// Temporary storage for reply target messages
// Maps user ID -> {targetMessageId, timestamp}
// Cleaned up after 5 minutes to prevent memory leaks

const replyTargetCache = new Map<string, { targetMessageId: string; timestamp: number }>();

const CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

export function storeReplyTarget(userId: string, targetMessageId: string): void {
  // Clean up old entries for this user
  const existing = replyTargetCache.get(userId);
  if (existing && Date.now() - existing.timestamp > CACHE_EXPIRY_MS) {
    replyTargetCache.delete(userId);
  }

  replyTargetCache.set(userId, {
    targetMessageId,
    timestamp: Date.now(),
  });
}

export function getReplyTarget(userId: string): string | null {
  const entry = replyTargetCache.get(userId);

  if (!entry) {
    return null;
  }

  // Check if expired
  if (Date.now() - entry.timestamp > CACHE_EXPIRY_MS) {
    replyTargetCache.delete(userId);
    return null;
  }

  return entry.targetMessageId;
}

export function clearReplyTarget(userId: string): void {
  replyTargetCache.delete(userId);
}

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [userId, entry] of replyTargetCache.entries()) {
    if (now - entry.timestamp > CACHE_EXPIRY_MS) {
      replyTargetCache.delete(userId);
    }
  }
}, 60000); // Check every minute
