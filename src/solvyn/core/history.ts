import { SolvynResult } from './types';

export interface SolvynHistoryItem {
  id: string;
  input: string;
  result: SolvynResult;
  timestamp: number;
}

export interface StorageAdapter {
  save(items: SolvynHistoryItem[]): void | Promise<void>;
  load(): SolvynHistoryItem[] | Promise<SolvynHistoryItem[]>;
  clear(): void | Promise<void>;
}

export class MemoryStorage implements StorageAdapter {
  private items: SolvynHistoryItem[] = [];
  save(items: SolvynHistoryItem[]) { this.items = items; }
  load() { return this.items; }
  clear() { this.items = []; }
}

export class LocalStorageAdapter implements StorageAdapter {
  constructor(private key: string = 'solvyn_history') {}
  save(items: SolvynHistoryItem[]) {
    try { localStorage.setItem(this.key, JSON.stringify(items)); } catch (e) {}
  }
  load() {
    try {
      const data = localStorage.getItem(this.key);
      return data ? JSON.parse(data) : [];
    } catch (e) { return []; }
  }
  clear() {
    try { localStorage.removeItem(this.key); } catch (e) {}
  }
}

export class IndexedDBAdapter implements StorageAdapter {
  private dbName = 'solvyn_db';
  private storeName = 'history';

  private async getDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'id' });
        }
      };
    });
  }

  async save(items: SolvynHistoryItem[]) {
    try {
      const db = await this.getDB();
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      store.clear();
      items.forEach(item => store.put(item));
      return new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (e) {}
  }

  async load(): Promise<SolvynHistoryItem[]> {
    try {
      const db = await this.getDB();
      const tx = db.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);
      const request = store.getAll();
      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      return [];
    }
  }

  async clear() {
    try {
      const db = await this.getDB();
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      store.clear();
    } catch (e) {}
  }
}

export class HistoryManager {
  private items: SolvynHistoryItem[] = [];
  private adapter: StorageAdapter;

  constructor(adapter?: StorageAdapter | "memory" | "localStorage" | "indexedDB" | any) {
    if (adapter === "localStorage") {
      this.adapter = new LocalStorageAdapter();
    } else if (adapter === "indexedDB") {
      this.adapter = new IndexedDBAdapter();
    } else if (typeof adapter === "object" && adapter !== null) {
      this.adapter = adapter;
    } else {
      this.adapter = new MemoryStorage();
    }
    this.init();
  }

  private async init() {
    const loaded = await this.adapter.load();
    if (loaded && loaded.length) {
      this.items = loaded;
    }
  }

  async add(item: SolvynHistoryItem) {
    this.items.push(item);
    await this.adapter.save(this.items);
  }

  get(): SolvynHistoryItem[] {
    return [...this.items];
  }

  async clear() {
    this.items = [];
    await this.adapter.clear();
  }

  export(): string {
    return JSON.stringify(this.items, null, 2);
  }
}
