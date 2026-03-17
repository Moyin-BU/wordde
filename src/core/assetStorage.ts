// IndexedDB-based asset storage for offline image persistence
// Stores logo and background images as Blobs (bypasses localStorage's 5MB limit)

const DB_NAME = 'bible_projection_assets';
const DB_VERSION = 1;
const STORE_NAME = 'assets';

export type AssetType = 'logo' | 'softBackground';

interface AssetRecord {
  id: AssetType;
  file: Blob;
  createdAt: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveAsset(type: AssetType, file: Blob): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const record: AssetRecord = { id: type, file, createdAt: Date.now() };
    const req = store.put(record);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}

export async function loadAsset(type: AssetType): Promise<Blob | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(type);
    req.onsuccess = () => {
      const record = req.result as AssetRecord | undefined;
      resolve(record?.file ?? null);
    };
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}

export async function deleteAsset(type: AssetType): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(type);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}

export async function loadAllAssets(): Promise<Record<AssetType, string>> {
  const result: Record<AssetType, string> = { logo: '', softBackground: '' };
  try {
    const [logoBlob, bgBlob] = await Promise.all([
      loadAsset('logo'),
      loadAsset('softBackground'),
    ]);
    if (logoBlob) result.logo = URL.createObjectURL(logoBlob);
    if (bgBlob) result.softBackground = URL.createObjectURL(bgBlob);
  } catch (e) {
    console.error('Failed to load assets from IndexedDB:', e);
  }
  return result;
}

// Validation
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return 'Unsupported format. Use PNG, JPG, or WEBP.';
  }
  if (file.size > MAX_SIZE) {
    return 'File too large. Maximum size is 10 MB.';
  }
  return null;
}
