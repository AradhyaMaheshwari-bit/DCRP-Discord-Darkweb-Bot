import { config } from '../config/config';

export function validateTag(tag: string): { valid: boolean; error?: string } {
  if (!tag) {
    return { valid: false, error: 'Tag cannot be empty.' };
  }

  if (!config.darkweb.tagRegex.test(tag)) {
    return {
      valid: false,
      error: `Tag must be exactly ${config.darkweb.tagLength} digits (0000–9999).`,
    };
  }

  return { valid: true };
}

export function validateMessageContent(content: string): { valid: boolean; error?: string } {
  if (!content || content.trim().length === 0) {
    return { valid: false, error: 'Message cannot be empty.' };
  }

  if (content.length > config.darkweb.messageMaxLength) {
    return {
      valid: false,
      error: `Message exceeds the maximum length of ${config.darkweb.messageMaxLength} characters.`,
    };
  }

  return { valid: true };
}

export function sanitizeContent(content: string): string {
  // Trim whitespace
  let sanitized = content.trim();

  // Remove Discord mentions (@everyone, @here, <@id>, <@!id>, <@&id>)
  sanitized = sanitized.replace(/@(everyone|here)/gi, '[mention removed]');
  sanitized = sanitized.replace(/<@[!&]?\d+>/g, '[mention removed]');

  return sanitized;
}
