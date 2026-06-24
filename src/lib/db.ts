/**
 * Client-side IndexedDB manager for storing document contents
 * provides unlimited free storage without LocalStorage limits.
 */
class DocumentDB {
  private dbName = 'StudyFlowDocumentsDB';
  private storeName = 'documents';
  private version = 1;

  private openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB is not supported in this environment.'));
        return;
      }
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'id' });
        }
      };
    });
  }

  async saveDocument(
    id: string, 
    textContent: string, 
    chunks: string[], 
    summary: any, 
    filename: string
  ): Promise<void> {
    try {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(this.storeName, 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.put({ 
          id, 
          textContent, 
          chunks, 
          summary, 
          filename, 
          updatedAt: new Date().toISOString() 
        });
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    } catch (e) {
      console.error('Failed to save to IndexedDB:', e);
    }
  }

  async getDocument(id: string): Promise<{ 
    id: string; 
    textContent: string; 
    chunks: string[]; 
    summary: any; 
    filename: string; 
  } | null> {
    try {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(this.storeName, 'readonly');
        const store = transaction.objectStore(this.storeName);
        const request = store.get(id);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result || null);
      });
    } catch (e) {
      console.error('Failed to get from IndexedDB:', e);
      return null;
    }
  }

  async deleteDocument(id: string): Promise<void> {
    try {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(this.storeName, 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.delete(id);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    } catch (e) {
      console.error('Failed to delete from IndexedDB:', e);
    }
  }
}

export const documentDB = typeof window !== 'undefined' ? new DocumentDB() : null;
