// IndexedDB database configuration and setup
export interface JournalEntry {
  id: string;
  content: string | ArrayBuffer;
  emojis: string[];
  timestamp: Date;
  encrypted: boolean;
  iv?: Uint8Array;
  tags?: string[];
  mood?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatSession {
  id: string;
  entryIds: string[]; // Store only entry IDs instead of full entries
  startTime: Date;
  endTime?: Date;
  summary?: string;
}

const DB_NAME = 'VibeJournalDB';
const DB_VERSION = 1;

// Database stores
export const STORES = {
  ENTRIES: 'journalEntries',
  SESSIONS: 'chatSessions',
  SETTINGS: 'userSettings',
} as const;

export class DatabaseManager {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error('Failed to open database'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create journal entries store
        if (!db.objectStoreNames.contains(STORES.ENTRIES)) {
          const entriesStore = db.createObjectStore(STORES.ENTRIES, { keyPath: 'id' });
          entriesStore.createIndex('timestamp', 'timestamp', { unique: false });
          entriesStore.createIndex('createdAt', 'createdAt', { unique: false });
          entriesStore.createIndex('tags', 'tags', { unique: false, multiEntry: true });
        }

        // Create chat sessions store
        if (!db.objectStoreNames.contains(STORES.SESSIONS)) {
          const sessionsStore = db.createObjectStore(STORES.SESSIONS, { keyPath: 'id' });
          sessionsStore.createIndex('startTime', 'startTime', { unique: false });
        }

        // Create user settings store
        if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
          db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
        }
      };
    });
  }

  private ensureDB(): IDBDatabase {
    if (!this.db) {
      throw new Error('Database not initialized. Call init() first.');
    }
    return this.db;
  }

  // Generic CRUD operations
  async add<T>(storeName: string, data: T): Promise<void> {
    const db = this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.add(data);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error(`Failed to add data to ${storeName}`));
    });
  }

  async get<T>(storeName: string, key: string): Promise<T | undefined> {
    const db = this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error(`Failed to get data from ${storeName}`));
    });
  }

  async getAll<T>(storeName: string): Promise<T[]> {
    const db = this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error(`Failed to get all data from ${storeName}`));
    });
  }

  async update<T>(storeName: string, data: T): Promise<void> {
    const db = this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error(`Failed to update data in ${storeName}`));
    });
  }

  async delete(storeName: string, key: string): Promise<void> {
    const db = this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error(`Failed to delete data from ${storeName}`));
    });
  }

  // Journal entries specific methods
  async saveEntry(entry: JournalEntry): Promise<void> {
    return this.add(STORES.ENTRIES, entry);
  }

  async getEntry(id: string): Promise<JournalEntry | undefined> {
    return this.get<JournalEntry>(STORES.ENTRIES, id);
  }

  async getAllEntries(): Promise<JournalEntry[]> {
    return this.getAll<JournalEntry>(STORES.ENTRIES);
  }

  async updateEntry(entry: JournalEntry): Promise<void> {
    return this.update(STORES.ENTRIES, entry);
  }

  async deleteEntry(id: string): Promise<void> {
    return this.delete(STORES.ENTRIES, id);
  }

  async getEntriesByDateRange(startDate: Date, endDate: Date): Promise<JournalEntry[]> {
    const db = this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.ENTRIES], 'readonly');
      const store = transaction.objectStore(STORES.ENTRIES);
      const index = store.index('timestamp');
      const range = IDBKeyRange.bound(startDate, endDate);
      const request = index.getAll(range);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error('Failed to get entries by date range'));
    });
  }

  // Chat sessions specific methods
  async saveSession(session: ChatSession): Promise<void> {
    return this.add(STORES.SESSIONS, session);
  }

  async getSession(id: string): Promise<ChatSession | undefined> {
    return this.get<ChatSession>(STORES.SESSIONS, id);
  }

  async getAllSessions(): Promise<ChatSession[]> {
    return this.getAll<ChatSession>(STORES.SESSIONS);
  }

  async updateSession(session: ChatSession): Promise<void> {
    return this.update(STORES.SESSIONS, session);
  }

  async deleteSession(id: string): Promise<void> {
    return this.delete(STORES.SESSIONS, id);
  }

  // Settings methods
  async saveSetting(key: string, value: unknown): Promise<void> {
    return this.add(STORES.SETTINGS, { key, value });
  }

  async getSetting(key: string): Promise<unknown> {
    const result = await this.get<{ key: string; value: unknown }>(STORES.SETTINGS, key);
    return result?.value;
  }

  async updateSetting(key: string, value: unknown): Promise<void> {
    return this.update(STORES.SETTINGS, { key, value });
  }
}

// Singleton instance
export const dbManager = new DatabaseManager();
