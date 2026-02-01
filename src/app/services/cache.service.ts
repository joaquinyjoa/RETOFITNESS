import { Injectable } from '@angular/core';

interface CacheEntry {
  data: any;
  timestamp: number;
  version: string; // Para invalidar caché al actualizar la app
}

@Injectable({
  providedIn: 'root'
})
export class CacheService {
  private readonly DB_NAME = 'fitness_cache';
  private readonly DB_VERSION = 1;
  private readonly STORE_NAME = 'data_cache';
  private db: IDBDatabase | null = null;

  constructor() {
    this.initDB();
  }

  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          db.createObjectStore(this.STORE_NAME);
        }
      };
    });
  }

  /**
   * Obtener del caché con TTL inteligente
   * @param key Clave única
   * @param ttl Tiempo de vida en ms (default: 15 minutos)
   */
  async get<T>(key: string, ttl: number = 15 * 60 * 1000): Promise<T | null> {
    if (!this.db) await this.initDB();
    
    return new Promise((resolve) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.get(key);
      
      request.onsuccess = () => {
        const entry: CacheEntry = request.result;
        
        if (!entry) {
          resolve(null);
          return;
        }
        
        const now = Date.now();
        const isExpired = (now - entry.timestamp) > ttl;
        
        if (isExpired) {
          this.delete(key); // Limpiar caché expirado
          resolve(null);
        } else {
          resolve(entry.data as T);
        }
      };
      
      request.onerror = () => resolve(null);
    });
  }

  /**
   * Guardar en caché
   */
  async set(key: string, data: any): Promise<void> {
    if (!this.db) await this.initDB();
    
    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      version: '1.0' // Incrementar al actualizar app para invalidar todo
    };
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.put(entry, key);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Eliminar entrada específica
   */
  async delete(key: string): Promise<void> {
    if (!this.db) await this.initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.delete(key);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Invalidar por patrón (ej: 'clientes:*')
   */
  async invalidatePattern(pattern: string): Promise<void> {
    if (!this.db) await this.initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.getAllKeys();
      
      request.onsuccess = () => {
        const keys = request.result as string[];
        const prefix = pattern.replace('*', '');
        
        keys.forEach(key => {
          if (key.startsWith(prefix)) {
            store.delete(key);
          }
        });
        
        resolve();
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Limpiar todo el caché
   */
  async clear(): Promise<void> {
    if (!this.db) await this.initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.clear();
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}
