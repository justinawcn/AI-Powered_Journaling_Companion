// Comprehensive storage service combining IndexedDB and encryption
import { dbManager, JournalEntry, ChatSession, STORES } from './database';
import { encryptionManager } from './encryption';

export interface StorageSettings {
  encryptionEnabled: boolean;
  autoSave: boolean;
  backupEnabled: boolean;
  theme: 'light' | 'dark' | 'auto';
  notifications: boolean;
}

export interface StorageStats {
  totalEntries: number;
  totalSessions: number;
  storageUsed: number;
  lastBackup?: Date;
}

export class StorageService {
  private initialized = false;

  // Initialize the storage service
  async initialize(password?: string): Promise<void> {
    try {
      // Initialize database
      await dbManager.init();
      
      // Initialize encryption if password provided
      if (password) {
        await encryptionManager.initializeWithPassword(password);
        await this.saveSetting('encryptionEnabled', true);
      } else {
        await this.saveSetting('encryptionEnabled', false);
      }
      
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize storage service:', error);
      throw new Error('Storage initialization failed');
    }
  }

  // Check if service is initialized
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('Storage service not initialized. Call initialize() first.');
    }
  }

  // Journal Entry Operations
  async saveJournalEntry(
    content: string,
    emojis: string[] = [],
    tags?: string[],
    mood?: string
  ): Promise<JournalEntry> {
    this.ensureInitialized();

    const entryData = {
      content,
      emojis,
      timestamp: new Date(),
      tags,
      mood,
    };

    let entry: JournalEntry;

    if (encryptionManager.isInitialized()) {
      // Encrypt the entry
      entry = await encryptionManager.encryptEntry(entryData);
    } else {
      // Store unencrypted
      entry = {
        id: crypto.randomUUID(),
        content,
        emojis,
        timestamp: new Date(),
        encrypted: false,
        tags,
        mood,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    await dbManager.saveEntry(entry);
    return entry;
  }

  async getJournalEntry(id: string): Promise<JournalEntry | null> {
    this.ensureInitialized();

    const entry = await dbManager.getEntry(id);
    if (!entry) return null;

    if (entry.encrypted && encryptionManager.isInitialized()) {
      return await encryptionManager.decryptEntry(entry);
    }

    return entry;
  }

  async getAllJournalEntries(): Promise<JournalEntry[]> {
    this.ensureInitialized();

    const entries = await dbManager.getAllEntries();
    
    if (encryptionManager.isInitialized()) {
      // Decrypt all encrypted entries
      const decryptedEntries = await Promise.all(
        entries.map(async (entry) => {
          if (entry.encrypted) {
            return await encryptionManager.decryptEntry(entry);
          }
          return entry;
        })
      );
      return decryptedEntries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }

    return entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async updateJournalEntry(id: string, updates: Partial<JournalEntry>): Promise<JournalEntry | null> {
    this.ensureInitialized();

    const existingEntry = await dbManager.getEntry(id);
    if (!existingEntry) return null;

    const updatedEntry = {
      ...existingEntry,
      ...updates,
      updatedAt: new Date(),
    };

    if (encryptionManager.isInitialized() && updates.content) {
      // Re-encrypt if content was updated
      const encryptedEntry = await encryptionManager.encryptEntry({
        content: updates.content,
        emojis: updatedEntry.emojis,
        timestamp: updatedEntry.timestamp,
        tags: updatedEntry.tags,
        mood: updatedEntry.mood,
      });
      updatedEntry.content = encryptedEntry.content;
      updatedEntry.iv = encryptedEntry.iv;
      updatedEntry.encrypted = true;
    }

    await dbManager.updateEntry(updatedEntry);
    return updatedEntry;
  }

  async deleteJournalEntry(id: string): Promise<boolean> {
    this.ensureInitialized();

    try {
      await dbManager.deleteEntry(id);
      return true;
    } catch (error) {
      console.error('Failed to delete journal entry:', error);
      return false;
    }
  }

  async getEntriesByDateRange(startDate: Date, endDate: Date): Promise<JournalEntry[]> {
    this.ensureInitialized();

    const entries = await dbManager.getEntriesByDateRange(startDate, endDate);
    
    if (encryptionManager.isInitialized()) {
      return await Promise.all(
        entries.map(async (entry) => {
          if (entry.encrypted) {
            return await encryptionManager.decryptEntry(entry);
          }
          return entry;
        })
      );
    }

    return entries;
  }

  // Chat Session Operations
  async saveChatSession(entries: JournalEntry[], sessionId?: string): Promise<ChatSession> {
    this.ensureInitialized();

    const session: ChatSession = {
      id: sessionId || crypto.randomUUID(),
      entries,
      startTime: new Date(),
      endTime: new Date(),
    };

    await dbManager.saveSession(session);
    return session;
  }

  async getChatSession(id: string): Promise<ChatSession | null> {
    this.ensureInitialized();
    const session = await dbManager.getSession(id);
    return session || null;
  }

  async getAllChatSessions(): Promise<ChatSession[]> {
    this.ensureInitialized();
    return await dbManager.getAllSessions();
  }

  async updateChatSession(id: string, updates: Partial<ChatSession>): Promise<ChatSession | null> {
    this.ensureInitialized();

    const existingSession = await dbManager.getSession(id);
    if (!existingSession) return null;

    const updatedSession = { ...existingSession, ...updates };
    await dbManager.updateSession(updatedSession);
    return updatedSession;
  }

  async deleteChatSession(id: string): Promise<boolean> {
    this.ensureInitialized();

    try {
      await dbManager.deleteSession(id);
      return true;
    } catch (error) {
      console.error('Failed to delete chat session:', error);
      return false;
    }
  }

  // Settings Operations
async saveSetting(key: string, value: any): Promise<void> {
  // Allow saving encryptionEnabled during initialization
  if (!this.initialized && key !== 'encryptionEnabled') {
    throw new Error('Storage service not initialized. Call initialize() first.');
  }

  try {
    const existing = await dbManager.getSetting(key);
    if (existing !== undefined) {
      await dbManager.updateSetting(key, value);
    } else {
      await dbManager.saveSetting(key, value);
    }
  } catch (error) {
    console.error('Failed to save setting:', error);
    throw error; // Re-throw to see the actual error
  }
}

  async getSetting(key: string, defaultValue?: any): Promise<any> {
    this.ensureInitialized();

    try {
      const value = await dbManager.getSetting(key);
      return value !== undefined ? value : defaultValue;
    } catch (error) {
      console.error('Failed to get setting:', error);
      return defaultValue;
    }
  }

  async getAllSettings(): Promise<StorageSettings> {
    this.ensureInitialized();

    const defaultSettings: StorageSettings = {
      encryptionEnabled: false,
      autoSave: true,
      backupEnabled: false,
      theme: 'auto',
      notifications: true,
    };

    const settings: StorageSettings = { ...defaultSettings };

    for (const key of Object.keys(defaultSettings) as (keyof StorageSettings)[]) {
      const value = await this.getSetting(key);
      if (value !== undefined) {
        (settings as any)[key] = value;
      }
    }

    return settings;
  }

  // Statistics
  async getStorageStats(): Promise<StorageStats> {
    this.ensureInitialized();

    const entries = await dbManager.getAllEntries();
    const sessions = await dbManager.getAllSessions();
    
    // Estimate storage usage (rough calculation)
    const storageUsed = JSON.stringify({ entries, sessions }).length;

    return {
      totalEntries: entries.length,
      totalSessions: sessions.length,
      storageUsed,
      lastBackup: await this.getSetting('lastBackup'),
    };
  }

  // Backup and Restore
  async exportData(): Promise<{ entries: JournalEntry[]; sessions: ChatSession[]; settings: any }> {
    this.ensureInitialized();

    const entries = await this.getAllJournalEntries();
    const sessions = await this.getAllChatSessions();
    const settings = await this.getAllSettings();

    return { entries, sessions, settings };
  }

  async importData(data: { entries?: JournalEntry[]; sessions?: ChatSession[]; settings?: any }): Promise<void> {
    this.ensureInitialized();

    if (data.entries) {
      for (const entry of data.entries) {
        await dbManager.saveEntry(entry);
      }
    }

    if (data.sessions) {
      for (const session of data.sessions) {
        await dbManager.saveSession(session);
      }
    }

    if (data.settings) {
      for (const [key, value] of Object.entries(data.settings)) {
        await this.saveSetting(key, value);
      }
    }
  }

  // Clear all data
  async clearAllData(): Promise<void> {
    this.ensureInitialized();

    const entries = await dbManager.getAllEntries();
    const sessions = await dbManager.getAllSessions();

    // Delete all entries
    for (const entry of entries) {
      await dbManager.deleteEntry(entry.id);
    }

    // Delete all sessions
    for (const session of sessions) {
      await dbManager.deleteSession(session.id);
    }

    // Clear encryption state
    encryptionManager.clear();
  }

  // Encryption management
  async enableEncryption(password: string): Promise<void> {
    this.ensureInitialized();

    // Get all existing entries
    const entries = await dbManager.getAllEntries();
    
    // Initialize encryption
    await encryptionManager.initializeWithPassword(password);
    
    // Re-encrypt all existing entries
    for (const entry of entries) {
      if (!entry.encrypted) {
        const encryptedEntry = await encryptionManager.encryptEntry({
          content: entry.content,
          emojis: entry.emojis,
          timestamp: entry.timestamp,
          tags: entry.tags,
          mood: entry.mood,
        });
        await dbManager.updateEntry(encryptedEntry);
      }
    }

    await this.saveSetting('encryptionEnabled', true);
  }

  async disableEncryption(password: string): Promise<void> {
    this.ensureInitialized();

    if (!encryptionManager.isInitialized()) {
      throw new Error('Encryption not enabled');
    }

    // Decrypt all entries
    const entries = await dbManager.getAllEntries();
    for (const entry of entries) {
      if (entry.encrypted) {
        const decryptedEntry = await encryptionManager.decryptEntry(entry);
        decryptedEntry.encrypted = false;
        await dbManager.updateEntry(decryptedEntry);
      }
    }

    // Clear encryption
    encryptionManager.clear();
    await this.saveSetting('encryptionEnabled', false);
  }

  isEncryptionEnabled(): boolean {
    return encryptionManager.isInitialized();
  }
}

// Singleton instance
export const storageService = new StorageService();
