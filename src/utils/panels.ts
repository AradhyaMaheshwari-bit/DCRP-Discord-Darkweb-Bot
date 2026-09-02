import { TextChannel, EmbedBuilder, Colors } from "discord.js";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { config } from "../config/config";
import { logger } from "../utils/logger";
import { CUSTOM_IDS } from "../types";

export async function postRegistrationPanel(
  channel: TextChannel,
): Promise<string | null> {
  try {
    const createButton = new ButtonBuilder()
      .setCustomId(CUSTOM_IDS.CREATE_TAG_BUTTON)
      .setLabel("Create Tag")
      .setEmoji("📝")
      .setStyle(ButtonStyle.Primary);

    const deleteButton = new ButtonBuilder()
      .setCustomId(CUSTOM_IDS.DELETE_TAG_BUTTON)
      .setLabel("Delete Tag")
      .setEmoji("🗑️")
      .setStyle(ButtonStyle.Danger);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(createButton, deleteButton);

    const embed = new EmbedBuilder()
      .setTitle("🕸️ DARKWEB REGISTRATION")
      .setColor(Colors.Blue)
      .setDescription(
        "🟢 **Welcome to the Darkweb.**\n\nCreate your anonymous numeric identity to access the Darkweb messaging system.\n\n",
      )
      .addFields(
        {
          name: "🔒 YOUR PRIVACY MATTERS",
          value:
            "Your Discord identity will NOT be displayed alongside your Darkweb messages.",
        },
        {
          name: "​",
          value: "​",
        },
        {
          name: "⚖️ RULES",
          value:
            "• Choose a unique numeric tag\n• Keep your tag private\n• No spam or abuse\n• Follow server rules\n• Be respectful",
        },
        {
          name: "​",
          value: "​",
        },
        {
          name: "⚙️ HOW IT WORKS",
          value:
            "1. Create your anonymous tag\n2. Send messages via bot DM or control panel buttons\n3. Your messages will appear in the darkweb channel with your tag",
        },
        {
          name: "​",
          value: "​",
        },
        {
          name: "GET STARTED BELOW:",
          value: "​",
        },
      )
      .setImage(
        "https://cdn.dribbble.com/userupload/22408110/file/original-dd8968e341f92b175cb61748f7ebd6c0.gif",
      );

    const message = await channel.send({
      embeds: [embed],
      components: [row],
    });

    logger.info("Registration panel posted", {
      messageId: message.id,
      channelId: channel.id,
    });
    return message.id;
  } catch (error) {
    logger.error("Failed to post registration panel", {
      channelId: channel.id,
      channelType: (channel as any)?.type,
      error: error instanceof Error ? error.message : String(error),
      errorCode: (error as any)?.code,
      errorStatus: (error as any)?.status,
    });
    return null;
  }
}

export async function postMessagingPanel(
  channel: TextChannel,
): Promise<string | null> {
  try {
    const button = new ButtonBuilder()
      .setCustomId(CUSTOM_IDS.NEW_MESSAGE_BUTTON)
      .setLabel("New Message")
      .setEmoji("📝")
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

    const message = await channel.send({
      content: [
        `🕸️ **DARKWEB MESSAGING**`,
        ``,
        `Send anonymous messages using the button below.`,
        ``,
        `Your registered Darkweb identity is automatically attached to your message.`,
      ].join("\n"),
      components: [row],
    });

    logger.info("Messaging panel posted", {
      messageId: message.id,
      channelId: channel.id,
    });
    return message.id;
  } catch (error) {
    logger.error("Failed to post messaging panel", {
      channelId: channel.id,
      channelType: (channel as any)?.type,
      error: error instanceof Error ? error.message : String(error),
      errorCode: (error as any)?.code,
      errorStatus: (error as any)?.status,
    });
    return null;
  }
}
