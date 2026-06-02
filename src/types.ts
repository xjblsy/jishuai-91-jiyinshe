/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface FriendDecrypted {
  id: string;
  name: string;
  nickname: string;
  avatar: string; // Base64 representation of compressed image/avatar, or empty string
  createdAt: number; // Unix timestamp in ms
}

export interface MemoryDecrypted {
  id: string;
  friendId: string;
  quote: string;
  image: string | null; // Base64 representation of compressed photo, or null
  tags: string[];
  favorite: boolean;
  createdAt: number; // Unix timestamp in ms
}

export interface EncryptedDataPayload {
  name?: string;
  nickname?: string;
  avatar?: string;
  quote?: string;
  image?: string | null;
  tags?: string[];
}

export interface FriendEncryptedDb {
  id: string;
  encryptedData: string; // AES-GCM encrypted string of JSON string { name, nickname, avatar }
  createdAt: any; // Date string or Firestore Timestamp
}

export interface MemoryEncryptedDb {
  id: string;
  friendId: string;
  encryptedData: string; // AES-GCM encrypted string of JSON string { quote, image, tags }
  favorite: boolean;
  createdAt: any; // Date string or Firestore Timestamp
}

export interface SecurityVaultStatus {
  isConfigured: boolean; // Has the user ever setup a password?
  isUnlocked: boolean;   // Is the vault unlocked with key in memory?
}
