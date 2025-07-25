/**
 * Advanced caching manager for NFT marketplace
 * Handles memory cache, localStorage, and IndexedDB for different data types
 */

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  version: string;
}

interface CacheConfig {
  maxAge: number; // in milliseconds
  maxSize: number; // maximum number of items
  version: string;
  storage: 'memory' | 'localStorage' | 'indexedDB';
}

class CacheManager {
  private memoryCache = new Map<string, CacheItem<any>>();
  private dbName = 'NFTMarketplaceCache';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  constructor() {
    this.initIndexedDB();
    this.startCleanupInterval();
  }

  // Initialize IndexedDB
  private async initIndexedDB(): Promise<void> {
    if (typeof window === 'undefined') return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object stores
        if (!db.objectStoreNames.contains('nfts')) {
          db.createObjectStore('nfts', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('collections')) {
          db.createObjectStore('collections', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('users')) {
          db.createObjectStore('users', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('images')) {
          db.createObjectStore('images', { keyPath: 'url' });
        }
      };
    });
  }

  // Set item in cache
  async set<T>(
    key: string, 
    data: T, 
    config: Partial<CacheConfig> = {}
  ): Promise<void> {
    const defaultConfig: CacheConfig = {
      maxAge: 5 * 60 * 1000, // 5 minutes
      maxSize: 100,
      version: '1.0.0',
      storage: 'memory'
    };

    const finalConfig = { ...defaultConfig, ...config };
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + finalConfig.maxAge,
      version: finalConfig.version
    };

    switch (finalConfig.storage) {
      case 'memory':
        this.setMemoryCache(key, item, finalConfig.maxSize);
        break;
      case 'localStorage':
        this.setLocalStorage(key, item);
        break;
      case 'indexedDB':
        await this.setIndexedDB(key, item);
        break;
    }
  }

  // Get item from cache
  async get<T>(
    key: string, 
    storage: 'memory' | 'localStorage' | 'indexedDB' = 'memory'
  ): Promise<T | null> {
    let item: CacheItem<T> | null = null;

    switch (storage) {
      case 'memory':
        item = this.getMemoryCache(key);
        break;
      case 'localStorage':
        item = this.getLocalStorage(key);
        break;
      case 'indexedDB':
        item = await this.getIndexedDB(key);
        break;
    }

    if (!item) return null;

    // Check if expired
    if (Date.now() > item.expiresAt) {
      this.delete(key, storage);
      return null;
    }

    return item.data;
  }

  // Delete item from cache
  async delete(
    key: string, 
    storage: 'memory' | 'localStorage' | 'indexedDB' = 'memory'
  ): Promise<void> {
    switch (storage) {
      case 'memory':
        this.memoryCache.delete(key);
        break;
      case 'localStorage':
        if (typeof window !== 'undefined') {
          localStorage.removeItem(`cache_${key}`);
        }
        break;
      case 'indexedDB':
        await this.deleteIndexedDB(key);
        break;
    }
  }

  // Clear all cache
  async clear(storage?: 'memory' | 'localStorage' | 'indexedDB'): Promise<void> {
    if (!storage || storage === 'memory') {
      this.memoryCache.clear();
    }

    if (!storage || storage === 'localStorage') {
      if (typeof window !== 'undefined') {
        const keys = Object.keys(localStorage).filter(key => key.startsWith('cache_'));
        keys.forEach(key => localStorage.removeItem(key));
      }
    }

    if (!storage || storage === 'indexedDB') {
      await this.clearIndexedDB();
    }
  }

  // Memory cache methods
  private setMemoryCache<T>(key: string, item: CacheItem<T>, maxSize: number): void {
    // Remove oldest items if cache is full
    if (this.memoryCache.size >= maxSize) {
      const oldestKey = this.memoryCache.keys().next().value;
      this.memoryCache.delete(oldestKey);
    }

    this.memoryCache.set(key, item);
  }

  private getMemoryCache<T>(key: string): CacheItem<T> | null {
    return this.memoryCache.get(key) || null;
  }

  // localStorage methods
  private setLocalStorage<T>(key: string, item: CacheItem<T>): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(`cache_${key}`, JSON.stringify(item));
    } catch (error) {
      console.warn('Failed to set localStorage cache:', error);
    }
  }

  private getLocalStorage<T>(key: string): CacheItem<T> | null {
    if (typeof window === 'undefined') return null;

    try {
      const item = localStorage.getItem(`cache_${key}`);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.warn('Failed to get localStorage cache:', error);
      return null;
    }
  }

  // IndexedDB methods
  private async setIndexedDB<T>(key: string, item: CacheItem<T>): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['nfts'], 'readwrite');
      const store = transaction.objectStore('nfts');
      const request = store.put({ id: key, ...item });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async getIndexedDB<T>(key: string): Promise<CacheItem<T> | null> {
    if (!this.db) return null;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['nfts'], 'readonly');
      const store = transaction.objectStore('nfts');
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          const { id, ...item } = result;
          resolve(item as CacheItem<T>);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  private async deleteIndexedDB(key: string): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['nfts'], 'readwrite');
      const store = transaction.objectStore('nfts');
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async clearIndexedDB(): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['nfts', 'collections', 'users', 'images'], 'readwrite');
      
      const stores = ['nfts', 'collections', 'users', 'images'];
      let completed = 0;

      stores.forEach(storeName => {
        const store = transaction.objectStore(storeName);
        const request = store.clear();
        
        request.onsuccess = () => {
          completed++;
          if (completed === stores.length) {
            resolve();
          }
        };
        request.onerror = () => reject(request.error);
      });
    });
  }

  // Cleanup expired items
  private startCleanupInterval(): void {
    if (typeof window === 'undefined') return;

    setInterval(() => {
      this.cleanupExpiredItems();
    }, 5 * 60 * 1000); // Run every 5 minutes
  }

  private cleanupExpiredItems(): void {
    const now = Date.now();

    // Cleanup memory cache
    for (const [key, item] of Array.from(this.memoryCache.entries())) {
      if (now > item.expiresAt) {
        this.memoryCache.delete(key);
      }
    }

    // Cleanup localStorage
    if (typeof window !== 'undefined') {
      const keys = Object.keys(localStorage).filter(key => key.startsWith('cache_'));
      keys.forEach(key => {
        try {
          const item = JSON.parse(localStorage.getItem(key) || '{}');
          if (item.expiresAt && now > item.expiresAt) {
            localStorage.removeItem(key);
          }
        } catch (error) {
          // Remove invalid items
          localStorage.removeItem(key);
        }
      });
    }
  }

  // Get cache statistics
  getStats(): {
    memorySize: number;
    localStorageSize: number;
    memoryItems: number;
  } {
    const localStorageSize = typeof window !== 'undefined' 
      ? Object.keys(localStorage).filter(key => key.startsWith('cache_')).length 
      : 0;

    return {
      memorySize: this.getMemoryCacheSize(),
      localStorageSize,
      memoryItems: this.memoryCache.size
    };
  }

  private getMemoryCacheSize(): number {
    let size = 0;
    for (const item of Array.from(this.memoryCache.values())) {
      size += JSON.stringify(item).length;
    }
    return size;
  }
}

// Create singleton instance
export const cacheManager = new CacheManager();

// Specialized cache functions for different data types
export const NFTCache = {
  set: (id: string, nft: any) => 
    cacheManager.set(`nft_${id}`, nft, { 
      maxAge: 10 * 60 * 1000, // 10 minutes
      storage: 'indexedDB' 
    }),
  
  get: (id: string) => 
    cacheManager.get(`nft_${id}`, 'indexedDB'),
  
  delete: (id: string) => 
    cacheManager.delete(`nft_${id}`, 'indexedDB')
};

export const CollectionCache = {
  set: (id: string, collection: any) => 
    cacheManager.set(`collection_${id}`, collection, { 
      maxAge: 15 * 60 * 1000, // 15 minutes
      storage: 'localStorage' 
    }),
  
  get: (id: string) => 
    cacheManager.get(`collection_${id}`, 'localStorage'),
  
  delete: (id: string) => 
    cacheManager.delete(`collection_${id}`, 'localStorage')
};

export const SearchCache = {
  set: (query: string, results: any) => 
    cacheManager.set(`search_${query}`, results, { 
      maxAge: 2 * 60 * 1000, // 2 minutes
      storage: 'memory' 
    }),
  
  get: (query: string) => 
    cacheManager.get(`search_${query}`, 'memory'),
  
  delete: (query: string) => 
    cacheManager.delete(`search_${query}`, 'memory')
};

export const ImageCache = {
  set: (url: string, blob: Blob) => 
    cacheManager.set(`image_${url}`, blob, { 
      maxAge: 60 * 60 * 1000, // 1 hour
      storage: 'indexedDB' 
    }),
  
  get: (url: string) => 
    cacheManager.get(`image_${url}`, 'indexedDB'),
  
  delete: (url: string) => 
    cacheManager.delete(`image_${url}`, 'indexedDB')
};

export default cacheManager;
