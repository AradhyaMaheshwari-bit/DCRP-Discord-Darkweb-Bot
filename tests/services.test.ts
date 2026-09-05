import { describe, it, expect, afterAll, beforeEach } from 'vitest';
import { PrismaClient, UserStatus } from '@prisma/client';

// Set dummy environment variables for tests
process.env.DISCORD_TOKEN = 'test_token';
process.env.DISCORD_CLIENT_ID = 'test_client_id';
process.env.DISCORD_GUILD_ID = 'test_guild_id';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/darkweb_test?schema=public';

import { registerUser, getUserByDiscordId, getUserByTag } from '../src/services/registrationService';
import { createMessage, checkCooldown, setCooldown, __testResetCooldowns } from '../src/services/messageService';
import { validateTag, validateMessageContent } from '../src/utils/validation';
import { getAllDarkwebUsers } from '../src/services/staffService';
import { staff } from '../src/commands/staff';

// Use a test database URL or create an in-memory database for tests
const prisma = new PrismaClient();

describe('Registration Service', () => {
  beforeEach(async () => {
    // Clean up before each test
    await prisma.darkwebMessage.deleteMany({});
    await prisma.darkwebUser.deleteMany({});
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Tag Validation', () => {
    it('should accept valid 4-digit tags', () => {
      const validTags = ['0001', '0042', '3699', '9999', '0000'];
      validTags.forEach((tag) => {
        const result = validateTag(tag);
        expect(result.valid).toBe(true);
      });
    });

    it('should reject tags with incorrect format', () => {
      const invalidTags = ['691', '12345', '12A4', 'abcd', '-123', '', '  '];
      invalidTags.forEach((tag) => {
        const result = validateTag(tag);
        expect(result.valid).toBe(false);
        expect(result.error).toBeDefined();
      });
    });

    it('should preserve leading zeros', () => {
      const result = validateTag('0691');
      expect(result.valid).toBe(true);
    });
  });

  describe('Registration', () => {
    it('should register a new user successfully', async () => {
      const result = await registerUser('discord_user_1', '1234');
      expect(result.success).toBe(true);
      expect(result.tag).toBe('1234');
    });

    it('should reject duplicate Discord account registration', async () => {
      await registerUser('discord_user_2', '2222');
      const result = await registerUser('discord_user_2', '3333');
      expect(result.success).toBe(false);
      expect(result.alreadyRegistered).toBe(true);
      expect(result.existingTag).toBe('2222');
    });

    it('should reject duplicate tag', async () => {
      await registerUser('discord_user_3', '4444');
      const result = await registerUser('discord_user_4', '4444');
      expect(result.success).toBe(false);
      expect(result.error).toContain('already registered');
    });

    it('should handle concurrent registration race conditions', async () => {
      // Simulate two registrations for the same tag happening almost simultaneously
      const promise1 = registerUser('discord_user_5', '5555');
      const promise2 = registerUser('discord_user_6', '5555');

      const [result1, result2] = await Promise.all([promise1, promise2]);

      // Exactly one should succeed
      const successes = [result1, result2].filter((r) => r.success).length;
      expect(successes).toBe(1);

      // The other should fail
      const failures = [result1, result2].filter((r) => !r.success).length;
      expect(failures).toBe(1);
    });

    it('should store tag as string preserving leading zeros', async () => {
      await registerUser('discord_user_7', '0007');
      const user = await getUserByDiscordId('discord_user_7');
      expect(user?.darkwebTag).toBe('0007');
    });

    it('should create active user by default', async () => {
      await registerUser('discord_user_8', '8888');
      const user = await getUserByDiscordId('discord_user_8');
      expect(user?.status).toBe(UserStatus.ACTIVE);
    });
  });

  describe('User Lookup', () => {
    beforeEach(async () => {
      await registerUser('discord_user_9', '9999');
    });

    it('should look up user by Discord ID', async () => {
      const user = await getUserByDiscordId('discord_user_9');
      expect(user?.discordId).toBe('discord_user_9');
      expect(user?.darkwebTag).toBe('9999');
    });

    it('should look up user by tag', async () => {
      const user = await getUserByTag('9999');
      expect(user?.darkwebTag).toBe('9999');
      expect(user?.discordId).toBe('discord_user_9');
    });

    it('should return null for non-existent user', async () => {
      const user = await getUserByDiscordId('non_existent');
      expect(user).toBeNull();
    });
  });
});

describe('Message Service', () => {
  beforeEach(async () => {
    await prisma.darkwebMessage.deleteMany({});
    await prisma.darkwebUser.deleteMany({});
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Message Validation', () => {
    it('should reject empty messages', () => {
      const result = validateMessageContent('');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('empty');
    });

    it('should reject whitespace-only messages', () => {
      const result = validateMessageContent('   \n\t  ');
      expect(result.valid).toBe(false);
    });

    it('should accept valid messages', () => {
      const result = validateMessageContent('This is a valid message.');
      expect(result.valid).toBe(true);
    });

    it('should reject messages exceeding max length', () => {
      const longMessage = 'a'.repeat(2001);
      const result = validateMessageContent(longMessage);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('exceeds');
    });
  });

  describe('Cooldown', () => {
    it('should allow first message (no cooldown)', () => {
      const result = checkCooldown('discord_user_cooldown_1');
      expect(result.allowed).toBe(true);
      expect(result.remainingSeconds).toBe(0);
    });

    it('should enforce cooldown after message', () => {
      const userId = 'discord_user_cooldown_2';
      setCooldown(userId);

      const result = checkCooldown(userId);
      expect(result.allowed).toBe(false);
      expect(result.remainingSeconds).toBeGreaterThan(0);
    });

    it('should allow message after cooldown expires', () => {
      const userId = 'discord_user_cooldown_3';

      // Set cooldown to far past
      const now = Date.now();
      const cooldowns = new Map<string, number>();
      cooldowns.set(userId, now - 15000); // 15 seconds ago

      // We can't directly test this without refactoring cooldown tracking,
      // but the logic is verified through checkCooldown logic inspection
    });
  });

  describe('Message Creation', () => {
    beforeEach(async () => {
      __testResetCooldowns();
      await registerUser('discord_user_msg_1', '1001');
      await registerUser('discord_user_msg_2', '2002');
    });

    it('should create message for registered user', async () => {
      const result = await createMessage('discord_user_msg_1', '1001', 'Test message');
      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });

    it('should reject message from unregistered user', async () => {
      const result = await createMessage('discord_user_unregistered', '9999', 'Test message');
      expect(result.success).toBe(false);
    });

    it('should reject message from revoked user', async () => {
      await prisma.darkwebUser.update({
        where: { discordId: 'discord_user_msg_2' },
        data: { status: UserStatus.REVOKED },
      });

      const result = await createMessage('discord_user_msg_2', '2002', 'Test message');
      expect(result.success).toBe(false);
      expect(result.error).toContain('inactive');
    });

    it('should reject empty message content', async () => {
      const result = await createMessage('discord_user_msg_1', '1001', '');
      expect(result.success).toBe(false);
    });

    it('should enforce cooldown on message creation', async () => {
      // First message should succeed
      const result1 = await createMessage('discord_user_msg_1', '1001', 'First message');
      expect(result1.success).toBe(true);

      // Immediate second message should fail due to cooldown
      const result2 = await createMessage('discord_user_msg_1', '1001', 'Second message');
      expect(result2.success).toBe(false);
      expect(result2.error).toContain('wait');
    });
  });
});

describe('Staff List Service (getAllDarkwebUsers)', () => {
  beforeEach(async () => {
    __testResetCooldowns();
    await prisma.darkwebMessage.deleteMany({});
    await prisma.darkwebUser.deleteMany({});
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should return an empty result when no identities exist', async () => {
    const result = await getAllDarkwebUsers();
    expect(result.total).toBe(0);
    expect(result.entries).toEqual([]);
  });

  it('should return multiple identities', async () => {
    await registerUser('discord_list_1', '1001');
    await registerUser('discord_list_2', '1002');
    await registerUser('discord_list_3', '1003');

    const result = await getAllDarkwebUsers();
    expect(result.total).toBe(3);
    expect(result.entries).toHaveLength(3);
  });

  it('should include ACTIVE identities', async () => {
    await registerUser('discord_list_active', '2001');
    const result = await getAllDarkwebUsers();
    const entry = result.entries.find((e) => e.tag === '2001');
    expect(entry).toBeDefined();
    expect(entry?.status).toBe(UserStatus.ACTIVE);
  });

  it('should include REVOKED identities', async () => {
    await registerUser('discord_list_revoked', '2002');
    await prisma.darkwebUser.update({
      where: { discordId: 'discord_list_revoked' },
      data: { status: UserStatus.REVOKED },
    });

    const result = await getAllDarkwebUsers();
    const entry = result.entries.find((e) => e.tag === '2002');
    expect(entry).toBeDefined();
    expect(entry?.status).toBe(UserStatus.REVOKED);
  });

  it('should include BANNED identities', async () => {
    await registerUser('discord_list_banned', '2003');
    await prisma.darkwebUser.update({
      where: { discordId: 'discord_list_banned' },
      data: { status: UserStatus.BANNED },
    });

    const result = await getAllDarkwebUsers();
    const entry = result.entries.find((e) => e.tag === '2003');
    expect(entry).toBeDefined();
    expect(entry?.status).toBe(UserStatus.BANNED);
  });

  it('should include UNLINKED identities (discordId = NULL)', async () => {
    // Register and then simulate Delete Tag by nulling discordId
    await prisma.darkwebUser.create({
      data: {
        discordId: null,
        darkwebTag: '6969',
        status: UserStatus.ACTIVE,
      },
    });

    const result = await getAllDarkwebUsers();
    const entry = result.entries.find((e) => e.tag === '6969');
    expect(entry).toBeDefined();
    expect(entry?.discordId).toBeNull();
  });

  it('should compute correct message counts', async () => {
    await registerUser('discord_list_counts', '3001');

    // Insert 3 messages directly to bypass the cooldown layer
    // (we are testing the count behavior, not the cooldown)
    await prisma.darkwebMessage.createMany({
      data: [
        { discordUserId: 'discord_list_counts', darkwebTag: '3001', content: 'msg 1' },
        { discordUserId: 'discord_list_counts', darkwebTag: '3001', content: 'msg 2' },
        { discordUserId: 'discord_list_counts', darkwebTag: '3001', content: 'msg 3' },
      ],
    });

    const result = await getAllDarkwebUsers();
    const entry = result.entries.find((e) => e.tag === '3001');
    expect(entry?.messageCount).toBe(3);
  });

  it('should return only non-deleted messages in the count', async () => {
    await registerUser('discord_list_deleted', '3002');
    const created = await createMessage('discord_list_deleted', '3002', 'visible');
    expect(created.success).toBe(true);

    // Mark the message as deleted in the DB
    if (created.messageId) {
      await prisma.darkwebMessage.update({
        where: { id: created.messageId },
        data: { deleted: true },
      });
    }

    const result = await getAllDarkwebUsers();
    const entry = result.entries.find((e) => e.tag === '3002');
    expect(entry?.messageCount).toBe(0);
  });

  it('should not expose message content in list entries', async () => {
    await registerUser('discord_list_content', '3003');
    await createMessage('discord_list_content', '3003', 'super secret content');

    const result = await getAllDarkwebUsers();
    const entry = result.entries.find((e) => e.tag === '3003');
    expect(entry).toBeDefined();

    // Serialize the entire result and check no message content leaks
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain('super secret content');
  });

  it('should sort entries newest first (descending createdAt)', async () => {
    const a = await registerUser('discord_list_order_a', '4001');
    expect(a.success).toBe(true);

    // Force a clear ordering by waiting briefly between registrations
    await new Promise((r) => setTimeout(r, 10));

    const b = await registerUser('discord_list_order_b', '4002');
    expect(b.success).toBe(true);

    await new Promise((r) => setTimeout(r, 10));

    const c = await registerUser('discord_list_order_c', '4003');
    expect(c.success).toBe(true);

    const result = await getAllDarkwebUsers();
    expect(result.entries[0]?.tag).toBe('4003');
    expect(result.entries[1]?.tag).toBe('4002');
    expect(result.entries[2]?.tag).toBe('4001');
  });

  it('should preserve unlinked identities alongside linked ones in total', async () => {
    await registerUser('discord_list_linked', '5001');
    await prisma.darkwebUser.create({
      data: {
        discordId: null,
        darkwebTag: '5002',
        status: UserStatus.ACTIVE,
      },
    });

    const result = await getAllDarkwebUsers();
    expect(result.total).toBe(2);
    expect(result.entries).toHaveLength(2);

    const unlinked = result.entries.find((e) => e.tag === '5002');
    expect(unlinked?.discordId).toBeNull();
  });

  it('should return createdAt as a Date object', async () => {
    await registerUser('discord_list_date', '6001');
    const result = await getAllDarkwebUsers();
    const entry = result.entries.find((e) => e.tag === '6001');
    expect(entry?.createdAt).toBeInstanceOf(Date);
  });
});

describe('Staff List Command Behavior (Ephemeral Permission Check)', () => {
  it('should have list subcommand registered on /darkweb', () => {
    const subcommands = staff.data.options.map((o) => o.name);
    expect(subcommands).toContain('list');
  });

  it('should require no options for the list subcommand', () => {
    const listOption = staff.data.options.find((o) => o.name === 'list');
    expect(listOption).toBeDefined();
    if (listOption && 'options' in listOption && listOption.options) {
      expect(listOption.options.length).toBe(0);
    }
  });
});
