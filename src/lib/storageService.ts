// Comprehensive storage service combining IndexedDB and encryption
import { dbManager, JournalEntry, ChatSession } from './database';
import { encryptionManager } from './encryption';
import { aiService } from './aiService';

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
    
    // Clear AI analysis cache when new entries are added
    aiService.clearCache();
    
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
    
    // Check if encryption is enabled but not initialized
    const encryptionEnabled = await this.getSetting('encryptionEnabled', false) as boolean;
    
    if (encryptionEnabled && !encryptionManager.isInitialized()) {
      // Encryption is enabled but not initialized - return entries as-is
      // The UI should prompt for password to decrypt
      console.warn('Encryption is enabled but not initialized. Entries will be shown as encrypted.');
      return entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }
    
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
      entryIds: entries.map(entry => entry.id), // Store only entry IDs
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

  async getChatSessionWithEntries(id: string): Promise<{ session: ChatSession; entries: JournalEntry[] } | null> {
    this.ensureInitialized();
    const session = await dbManager.getSession(id);
    if (!session) return null;

    // Resolve entry IDs to actual entries
    const entries = await Promise.all(
      session.entryIds.map(async (entryId) => {
        const entry = await this.getJournalEntry(entryId);
        if (!entry) {
          console.warn(`Entry ${entryId} not found for session ${id}`);
          return null;
        }
        return entry;
      })
    );

    // Filter out null entries (in case some entries were deleted)
    const validEntries = entries.filter((entry): entry is JournalEntry => entry !== null);

    return { session, entries: validEntries };
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
async saveSetting(key: string, value: unknown): Promise<void> {
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

  async getSetting(key: string, defaultValue?: unknown): Promise<unknown> {
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
        (settings as unknown as Record<string, unknown>)[key] = value;
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
      lastBackup: await this.getSetting('lastBackup') as Date | undefined,
    };
  }

  // Backup and Restore
  async exportData(): Promise<{ entries: JournalEntry[]; sessions: ChatSession[]; settings: Record<string, unknown> }> {
    this.ensureInitialized();

    const entries = await this.getAllJournalEntries();
    const sessions = await this.getAllChatSessions();
    const settings = await this.getAllSettings();

    return { entries, sessions, settings: settings as unknown as Record<string, unknown> };
  }

  async importData(data: { entries?: JournalEntry[]; sessions?: ChatSession[]; settings?: Record<string, unknown> }): Promise<void> {
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

  // Cleanup method to remove duplicate entries from existing data
  async cleanupDuplicateEntries(): Promise<{ removedEntries: number; updatedSessions: number }> {
    this.ensureInitialized();

    console.log('🧹 Starting cleanup of duplicate entries...');
    
    const allEntries = await dbManager.getAllEntries();
    const allSessions = await dbManager.getAllSessions();
    
    let removedEntries = 0;
    let updatedSessions = 0;
    
    // Group entries by content and timestamp to find duplicates
    const entryGroups = new Map<string, JournalEntry[]>();
    
    for (const entry of allEntries) {
      const content = typeof entry.content === 'string' ? entry.content : '[encrypted]';
      const key = `${content}-${entry.timestamp.getTime()}`;
      
      if (!entryGroups.has(key)) {
        entryGroups.set(key, []);
      }
      entryGroups.get(key)!.push(entry);
    }
    
    // Find and remove duplicate entries
    const entriesToKeep = new Set<string>();
    const entriesToRemove = new Set<string>();
    
    for (const [key, entries] of entryGroups) {
      if (entries.length > 1) {
        console.log(`Found ${entries.length} duplicate entries for: ${key.substring(0, 50)}...`);
        
        // Keep the first entry (oldest by createdAt)
        const sortedEntries = entries.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        entriesToKeep.add(sortedEntries[0].id);
        
        // Mark others for removal
        for (let i = 1; i < sortedEntries.length; i++) {
          entriesToRemove.add(sortedEntries[i].id);
        }
      } else {
        entriesToKeep.add(entries[0].id);
      }
    }
    
    // Remove duplicate entries
    for (const entryId of entriesToRemove) {
      await dbManager.deleteEntry(entryId);
      removedEntries++;
    }
    
    // Update sessions to use entryIds instead of full entries (if they still have the old format)
    for (const session of allSessions) {
      // Check if this session has the old format (entries property instead of entryIds)
      if ('entries' in session && Array.isArray((session as unknown as { entries: JournalEntry[] }).entries)) {
        console.log(`Updating session ${session.id} from old format to new format`);
        
        const oldEntries = (session as unknown as { entries: JournalEntry[] }).entries;
        const entryIds = oldEntries
          .map(entry => entry.id)
          .filter(id => entriesToKeep.has(id)); // Only keep IDs of entries that weren't removed
        
        const updatedSession: ChatSession = {
          id: session.id,
          entryIds,
          startTime: session.startTime,
          endTime: session.endTime,
          summary: session.summary,
        };
        
        await dbManager.updateSession(updatedSession);
        updatedSessions++;
      }
    }
    
    console.log(`✅ Cleanup complete: Removed ${removedEntries} duplicate entries, updated ${updatedSessions} sessions`);
    
    return { removedEntries, updatedSessions };
  }
}

// Singleton instance
export const storageService = new StorageService();
