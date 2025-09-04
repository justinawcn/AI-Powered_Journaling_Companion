// Encryption utilities for journal entries
import { JournalEntry } from './database';

// Generate a random key for encryption
export async function generateEncryptionKey(): Promise<CryptoKey> {
  return await crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true, // extractable
    ['encrypt', 'decrypt']
  );
}

// Derive a key from a password using PBKDF2
export async function deriveKeyFromPassword(
  password: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as unknown as ArrayBuffer,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Encrypt text data
export async function encryptText(
  text: string,
  key: CryptoKey
): Promise<{ encryptedData: ArrayBuffer; iv: Uint8Array }> {
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for GCM
  const encodedText = new TextEncoder().encode(text);

  const encryptedData = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv as unknown as ArrayBuffer,
    },
    key,
    encodedText
  );

  return { encryptedData, iv };
}

// Decrypt text data
export async function decryptText(
  encryptedData: ArrayBuffer,
  iv: Uint8Array,
  key: CryptoKey
): Promise<string> {
  const decryptedData = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv as unknown as ArrayBuffer,
    },
    key,
    encryptedData
  );

  return new TextDecoder().decode(decryptedData);
}

// Encrypt a journal entry
export async function encryptJournalEntry(
  entry: Omit<JournalEntry, 'id' | 'encrypted' | 'createdAt' | 'updatedAt'>,
  key: CryptoKey
): Promise<{
  id: string;
  content: ArrayBuffer;
  iv: Uint8Array;
  emojis: string[];
  timestamp: Date;
  encrypted: boolean;
  tags?: string[];
  mood?: string;
  createdAt: Date;
  updatedAt: Date;
}> {
  const content = typeof entry.content === 'string' ? entry.content : '';
  const { encryptedData, iv } = await encryptText(content, key);
  
  return {
    id: crypto.randomUUID(),
    content: encryptedData as ArrayBuffer, // Store as ArrayBuffer
    iv,
    emojis: entry.emojis,
    timestamp: entry.timestamp,
    encrypted: true,
    tags: entry.tags,
    mood: entry.mood,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

// Decrypt a journal entry
export async function decryptJournalEntry(
  encryptedEntry: JournalEntry,
  key: CryptoKey
): Promise<JournalEntry> {
  if (!encryptedEntry.encrypted) {
    return encryptedEntry; // Already decrypted
  }

  if (typeof encryptedEntry.content === 'string') {
    return encryptedEntry; // Already decrypted
  }
  
  if (!encryptedEntry.iv) {
    throw new Error('IV is required for decryption');
  }
  
  const decryptedContent = await decryptText(
    encryptedEntry.content,
    encryptedEntry.iv,
    key
  );

  return {
    ...encryptedEntry,
    content: decryptedContent,
    encrypted: false,
  };
}

// Key management utilities
export class EncryptionManager {
  private key: CryptoKey | null = null;
  private salt: Uint8Array | null = null;

  // Initialize with password
  async initializeWithPassword(password: string): Promise<void> {
    // Generate or retrieve salt
    this.salt = this.getOrCreateSalt();
    
    // Derive key from password
    this.key = await deriveKeyFromPassword(password, this.salt);
  }

  // Initialize with existing key
  async initializeWithKey(key: CryptoKey): Promise<void> {
    this.key = key;
  }

  // Get or create salt for key derivation
  private getOrCreateSalt(): Uint8Array {
    const saltKey = 'vibe_journal_salt';
    const storedSalt = localStorage.getItem(saltKey);
    
    if (storedSalt) {
      return new Uint8Array(JSON.parse(storedSalt));
    }
    
    // Generate new salt
    const newSalt = crypto.getRandomValues(new Uint8Array(16));
    localStorage.setItem(saltKey, JSON.stringify(Array.from(newSalt)));
    return newSalt;
  }

  // Check if encryption is initialized
  isInitialized(): boolean {
    return this.key !== null;
  }

  // Get the current encryption key
  getKey(): CryptoKey | null {
    return this.key;
  }

  // Encrypt text
  async encrypt(text: string): Promise<{ encryptedData: ArrayBuffer; iv: Uint8Array }> {
    if (!this.key) {
      throw new Error('Encryption not initialized');
    }
    return encryptText(text, this.key);
  }

  // Decrypt text
  async decrypt(encryptedData: ArrayBuffer, iv: Uint8Array): Promise<string> {
    if (!this.key) {
      throw new Error('Encryption not initialized');
    }
    return decryptText(encryptedData, iv, this.key);
  }

  // Encrypt journal entry
  async encryptEntry(
    entry: Omit<JournalEntry, 'id' | 'encrypted' | 'createdAt' | 'updatedAt'>
  ): Promise<JournalEntry> {
    if (!this.key) {
      throw new Error('Encryption not initialized');
    }
    return encryptJournalEntry(entry, this.key);
  }

  // Decrypt journal entry
  async decryptEntry(encryptedEntry: JournalEntry): Promise<JournalEntry> {
    if (!this.key) {
      throw new Error('Encryption not initialized');
    }
    return decryptJournalEntry(encryptedEntry, this.key);
  }

  // Clear encryption state
  clear(): void {
    this.key = null;
    this.salt = null;
  }

  // Export key (for backup purposes)
  async exportKey(): Promise<ArrayBuffer> {
    if (!this.key) {
      throw new Error('No key to export');
    }
    return await crypto.subtle.exportKey('raw', this.key);
  }

  // Import key (for restore purposes)
  async importKey(keyData: ArrayBuffer): Promise<void> {
    this.key = await crypto.subtle.importKey(
      'raw',
      keyData,
      'AES-GCM',
      false,
      ['encrypt', 'decrypt']
    );
  }
}

// Singleton instance
export const encryptionManager = new EncryptionManager();
