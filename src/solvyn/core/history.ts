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

export class CloudStorageAdapter implements StorageAdapter {
  constructor(private saveUrl: string, private loadUrl: string, private headers: Record<string, string> = {}) {}

  async save(items: SolvynHistoryItem[]) {
    try {
      await fetch(this.saveUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...this.headers },
        body: JSON.stringify(items)
      });
    } catch (e) { console.error("CloudStorageAdapter save failed", e); }
  }

  async load(): Promise<SolvynHistoryItem[]> {
    try {
      const res = await fetch(this.loadUrl, { headers: this.headers });
      if (res.ok) return await res.json();
    } catch (e) { console.error("CloudStorageAdapter load failed", e); }
    return [];
  }

  async clear() {
    try {
      await fetch(this.saveUrl, {
        method: 'DELETE',
        headers: this.headers
      });
    } catch (e) { console.error("CloudStorageAdapter clear failed", e); }
  }
}

export class HistoryManager {
  private items: SolvynHistoryItem[] = [];
  private adapter: StorageAdapter;
  private maxItems: number;

  constructor(adapter?: StorageAdapter | "memory" | "localStorage" | "indexedDB" | "cloud" | any, maxItems: number = 100) {
    this.maxItems = maxItems;
    if (adapter === "localStorage") {
      this.adapter = new LocalStorageAdapter();
    } else if (adapter === "indexedDB") {
      this.adapter = new IndexedDBAdapter();
    } else if (adapter === "cloud") {
      // Dummy cloud adapter for demo purposes if string is passed
      this.adapter = new CloudStorageAdapter('/api/history', '/api/history');
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
      this.enforceLimit();
    }
  }

  private enforceLimit() {
    if (this.items.length > this.maxItems) {
      this.items = this.items.slice(this.items.length - this.maxItems);
    }
  }

  async add(item: SolvynHistoryItem) {
    this.items.push(item);
    this.enforceLimit();
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

  async import(json: string) {
    try {
      const parsed = JSON.parse(json);
      if (Array.isArray(parsed)) {
        this.items = parsed;
        this.enforceLimit();
        await this.adapter.save(this.items);
      }
    } catch (e) {
      console.error("Failed to import history", e);
    }
  }
}
