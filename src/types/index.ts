import { UserStatus } from '@prisma/client';

export interface DarkwebUserData {
  id: string;
  discordId: string;
  darkwebTag: string;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface DarkwebMessageData {
  id: string;
  discordUserId: string;
  darkwebTag: string;
  content: string;
  discordMessageId: string | null;
  deleted: boolean;
  createdAt: Date;
  editedAt: Date | null;
}

export interface RegistrationResult {
  success: boolean;
  tag?: string;
  error?: string;
  alreadyRegistered?: boolean;
  existingTag?: string;
}

export interface MessageResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface StaffLookupResult {
  found: boolean;
  tag?: string;
  discordId?: string | null;
  discordUsername?: string;
  status?: UserStatus;
  createdAt?: Date;
  messageCount?: number;
}

export interface StaffListEntry {
  tag: string;
  discordId: string | null;
  status: UserStatus;
  createdAt: Date;
  messageCount: number;
}

export interface StaffListResult {
  total: number;
  entries: StaffListEntry[];
}

export interface StaffActionResult {
  success: boolean;
  error?: string;
}

export type ModerationCheckResult = {
  passed: boolean;
  reason?: string;
};

export const CUSTOM_IDS = {
  CREATE_TAG_BUTTON: 'darkweb:create_tag',
  DELETE_TAG_BUTTON: 'darkweb:delete_tag',
  DELETE_TAG_CONFIRM: 'darkweb:delete_tag_confirm',
  DELETE_TAG_CANCEL: 'darkweb:delete_tag_cancel',
  NEW_MESSAGE_BUTTON: 'darkweb:new_message',
  REPLY_MESSAGE_BUTTON: 'darkweb:reply_message',
  EDIT_MESSAGE_BUTTON: 'darkweb:edit_message',
  CREATE_TAG_MODAL: 'darkweb:create_tag_modal',
  CREATE_TAG_INPUT: 'darkweb:create_tag_input',
  NEW_MESSAGE_MODAL: 'darkweb:new_message_modal',
  NEW_MESSAGE_INPUT: 'darkweb:new_message_input',
  REPLY_TARGET_MODAL: 'darkweb:reply_target_modal',
  REPLY_TARGET_INPUT: 'darkweb:reply_target_input',
  REPLY_CONTENT_MODAL: 'darkweb:reply_content_modal',
  REPLY_CONTENT_INPUT: 'darkweb:reply_content_input',
  EDIT_MESSAGE_MODAL: 'darkweb:edit_message_modal',
  EDIT_MESSAGE_INPUT: 'darkweb:edit_message_input',
  STAFF_LIST_PREV: 'darkweb:staff_list_prev',
  STAFF_LIST_NEXT: 'darkweb:staff_list_next',
} as const;
