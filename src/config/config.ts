import 'dotenv/config';

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function optionalEnv(key: string, fallback: string): string {
  return process.env[key] || fallback;
}

export const config = {
  discord: {
    token: requireEnv('DISCORD_TOKEN'),
    clientId: requireEnv('DISCORD_CLIENT_ID'),
    guildId: requireEnv('DISCORD_GUILD_ID'),
  },

  channels: {
    registrationChannelId: process.env['DARKWEB_REGISTRATION_CHANNEL_ID'] || '',
    messageChannelId: process.env['DARKWEB_MESSAGE_CHANNEL_ID'] || '',
  },

  staff: {
    roleId: process.env['DARKWEB_STAFF_ROLE_ID'] || '',
  },

  darkweb: {
    messageCooldownSeconds: parseInt(optionalEnv('DARKWEB_MESSAGE_COOLDOWN_SECONDS', '10'), 10),
    messageMaxLength: parseInt(optionalEnv('DARKWEB_MESSAGE_MAX_LENGTH', '1000'), 10),
    tagLength: 4,
    tagRegex: /^[0-9]{4}$/,
  },
} as const;
