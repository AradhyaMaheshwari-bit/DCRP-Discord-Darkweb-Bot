import type { ModerationCheckResult } from '../types';

/**
 * Moderation service — extensible layer for content filtering.
 *
 * V1 provides basic validation. Additional rules (word filters,
 * pattern detection, etc.) can be added here without modifying
 * the message processing pipeline.
 */

type ModerationRule = (content: string) => ModerationCheckResult;

const rules: ModerationRule[] = [
  // Rule: reject empty / whitespace-only content (redundant safety net)
  (content) => {
    if (!content || content.trim().length === 0) {
      return { passed: false, reason: 'Message cannot be empty.' };
    }
    return { passed: true };
  },
];

/**
 * Run all moderation rules against the content.
 * Returns on the first failure.
 */
export function checkModeration(content: string): ModerationCheckResult {
  for (const rule of rules) {
    const result = rule(content);
    if (!result.passed) {
      return result;
    }
  }
  return { passed: true };
}

/**
 * Register an additional moderation rule at runtime.
 * Rules are executed in registration order.
 */
export function addModerationRule(rule: ModerationRule): void {
  rules.push(rule);
}
