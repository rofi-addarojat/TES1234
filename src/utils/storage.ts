import { InfrastructureItem, ClusterFolder } from '../types';

const STORAGE_KEY = 'ftth_infrastructure_items_v1';
const TECHNICIAN_KEY = 'ftth_last_technician_name';
const LAST_FAT_CODE_KEY = 'ftth_last_fat_code';
const MAP_CENTER_KEY = 'ftth_last_map_center';
const CLUSTERS_KEY = 'ftth_clusters_list_v1';
const ACTIVE_CLUSTER_KEY = 'ftth_active_cluster_id_v1';

export const DEFAULT_CLUSTERS: ClusterFolder[] = [
  {
    id: 'cls-bintaro',
    name: 'Cluster Bintaro Jaya',
    code: 'BIN',
    color: '#06b6d4',
    createdAt: new Date().toISOString(),
    notes: 'Cluster area Bintaro Jaya Sektor 1-9',
  },
  {
    id: 'cls-cibubur',
    name: 'Cluster Cibubur Asri',
    code: 'CBR',
    color: '#10b981',
    createdAt: new Date().toISOString(),
    notes: 'Cluster area Cibubur & Kota Wisata',
  },
  {
    id: 'cls-sudirman',
    name: 'Cluster Sudirman Central',
    code: 'SDR',
    color: '#f59e0b',
    createdAt: new Date().toISOString(),
    notes: 'Cluster area perkantoran Sudirman',
  },
];

// Initial starter points to demonstrate FTTH layout immediately
const DEFAULT_SEED_DATA: InfrastructureItem[] = [
  {
    id: 'TG-1001',
    category: 'tiang',
    subType: 'Tiang 7.2',
    lat: -6.208851,
    lng: 106.845624,
    accuracy: 2.4,
    technicianName: 'Ahmad Fauzi',
    timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
    condition: 'Bagus',
    notes: 'Tiang utama feeder, dekat gardu PLN',
    clusterId: 'cls-bintaro',
    clusterName: 'Cluster Bintaro Jaya',
  },
  {
    id: 'TG-1002',
    category: 'tiang',
    subType: 'Ext Telkom',
    lat: -6.209180,
    lng: 106.845910,
    accuracy: 3.1,
    technicianName: 'Ahmad Fauzi',
    timestamp: new Date(Date.now() - 3600000 * 3.5).toISOString(),
    condition: 'Bagus',
    notes: 'Tiang beton existing, tarikan kabel 48 core',
    clusterId: 'cls-bintaro',
    clusterName: 'Cluster Bintaro Jaya',
  },
  {
    id: 'FAT-2001',
    category: 'fat',
    subType: 'FAT A01',
    fatCode: 'A01',
    fatCapacity: 16,
    lat: -6.209195,
    lng: 106.845925,
    accuracy: 1.8,
    technicianName: 'Ahmad Fauzi',
    timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
    condition: 'Baru Pasang',
    notes: 'FAT 16 port terpasang di TG-1002, splitter 1:8 ok',
    connectedToId: 'TG-1002',
    clusterId: 'cls-bintaro',
    clusterName: 'Cluster Bintaro Jaya',
  },
  {
    id: 'TG-1003',
    category: 'tiang',
    subType: 'Tiang 7.3',
    lat: -6.209540,
    lng: 106.846250,
    accuracy: 2.8,
    technicianName: 'Budi Santoso',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    condition: 'Bagus',
    notes: 'Tikungan jalan masuk gang',
    clusterId: 'cls-bintaro',
    clusterName: 'Cluster Bintaro Jaya',
  },
  {
    id: 'TG-1004',
    category: 'tiang',
    subType: 'Ext tiang listrik',
    lat: -6.209860,
    lng: 106.846610,
    accuracy: 3.5,
    technicianName: 'Budi Santoso',
    timestamp: new Date(Date.now() - 3600000 * 1.5).toISOString(),
    condition: 'Perlu Perbaikan',
    notes: 'Klem suspensi kendur, perlu kencangkan',
    clusterId: 'cls-bintaro',
    clusterName: 'Cluster Bintaro Jaya',
  },
  {
    id: 'FAT-2002',
    category: 'fat',
    subType: 'FAT A02',
    fatCode: 'A02',
    fatCapacity: 8,
    lat: -6.209875,
    lng: 106.846625,
    accuracy: 2.1,
    technicianName: 'Budi Santoso',
    timestamp: new Date(Date.now() - 3600000 * 1).toISOString(),
    condition: 'Baru Pasang',
    notes: 'FAT 8 port untuk distribusi Blok C',
    connectedToId: 'TG-1004',
    clusterId: 'cls-bintaro',
    clusterName: 'Cluster Bintaro Jaya',
  },
  {
    id: 'TG-1005',
    category: 'tiang',
    subType: 'Tiang 9.4',
    lat: -6.210210,
    lng: 106.846980,
    accuracy: 2.0,
    technicianName: 'Budi Santoso',
    timestamp: new Date(Date.now() - 3600000 * 0.5).toISOString(),
    condition: 'Bagus',
    notes: 'Tiang besi 9 meter untuk bentangan jalan raya',
    clusterId: 'cls-bintaro',
    clusterName: 'Cluster Bintaro Jaya',
  }
];

// Open IndexedDB
const DB_NAME = 'ftth_map_db';
const DB_VERSION = 1;
const STORE_NAME = 'infrastructure_items';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
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

export async function getStoredItems(): Promise<InfrastructureItem[]> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        const items = req.result as InfrastructureItem[];
        if (items && items.length > 0) {
          resolve(items);
        } else {
          // Check LocalStorage fallback
          const localData = localStorage.getItem(STORAGE_KEY);
          if (localData) {
            try {
              const parsed = JSON.parse(localData);
              if (Array.isArray(parsed) && parsed.length > 0) {
                // Migrate to IndexedDB
                saveAllItems(parsed).catch(console.error);
                resolve(parsed);
                return;
              }
            } catch {
              // ignore
            }
          }
          // Seed with default initial data
          saveAllItems(DEFAULT_SEED_DATA).catch(console.error);
          resolve(DEFAULT_SEED_DATA);
        }
      };
      req.onerror = () => {
        resolve(getFromLocalStorageFallback());
      };
    });
  } catch (err) {
    console.warn('Falling back to LocalStorage:', err);
    return getFromLocalStorageFallback();
  }
}

function getFromLocalStorageFallback(): InfrastructureItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SEED_DATA));
    return DEFAULT_SEED_DATA;
  } catch {
    return DEFAULT_SEED_DATA;
  }
}

export async function saveItem(item: InfrastructureItem): Promise<void> {
  // Sync to IndexedDB
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(item);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('IDB write failed, updating LocalStorage:', err);
  }

  // Also sync to LocalStorage as safety backup
  try {
    const current = getFromLocalStorageFallback();
    const idx = current.findIndex((x) => x.id === item.id);
    if (idx >= 0) {
      current[idx] = item;
    } else {
      current.push(item);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch (e) {
    console.error('LocalStorage write error:', e);
  }
}

export async function saveAllItems(items: InfrastructureItem[]): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.clear();
      for (const it of items) {
        store.put(it);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('IDB bulk write failed:', err);
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('LocalStorage error:', e);
  }
}

export async function deleteItemById(id: string): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('IDB delete error:', err);
  }

  try {
    const current = getFromLocalStorageFallback().filter((x) => x.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch (e) {
    console.error('LocalStorage delete error:', e);
  }
}

export async function clearAllItems(): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('IDB clear error:', err);
  }
  localStorage.removeItem(STORAGE_KEY);
}

// Technician Name helper
export function getLastTechnicianName(): string {
  try {
    return localStorage.getItem(TECHNICIAN_KEY) || 'Teknisi 1';
  } catch {
    return 'Teknisi 1';
  }
}

export function setLastTechnicianName(name: string): void {
  try {
    localStorage.setItem(TECHNICIAN_KEY, name.trim());
  } catch {
    // ignore
  }
}

// Last FAT Code helper
export function getLastFatCode(): string {
  try {
    return localStorage.getItem(LAST_FAT_CODE_KEY) || 'A01';
  } catch {
    return 'A01';
  }
}

export function setLastFatCode(code: string): void {
  try {
    localStorage.setItem(LAST_FAT_CODE_KEY, code.trim());
  } catch {
    // ignore
  }
}

// Generate Next ID based on category and current items
export function generateNextId(category: 'tiang' | 'fat', items: InfrastructureItem[]): string {
  const prefix = category === 'tiang' ? 'TG-' : 'FAT-';
  const baseNum = category === 'tiang' ? 1000 : 2000;
  
  const relevantNums = items
    .filter((i) => i.category === category && i.id.startsWith(prefix))
    .map((i) => {
      const numPart = parseInt(i.id.replace(prefix, ''), 10);
      return isNaN(numPart) ? 0 : numPart;
    });

  const maxNum = relevantNums.length > 0 ? Math.max(...relevantNums) : baseNum;
  return `${prefix}${maxNum + 1}`;
}

// Last map center
export function getSavedMapCenter(): [number, number] | null {
  try {
    const raw = localStorage.getItem(MAP_CENTER_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length === 2) {
        return [parsed[0], parsed[1]];
      }
    }
  } catch {
    // ignore
  }
  return null;
}

export function setSavedMapCenter(center: [number, number]): void {
  try {
    localStorage.setItem(MAP_CENTER_KEY, JSON.stringify(center));
  } catch {
    // ignore
  }
}

export async function getStoredClusters(): Promise<ClusterFolder[]> {
  try {
    const raw = localStorage.getItem(CLUSTERS_KEY);
    if (!raw) {
      localStorage.setItem(CLUSTERS_KEY, JSON.stringify(DEFAULT_CLUSTERS));
      return DEFAULT_CLUSTERS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_CLUSTERS;
  } catch {
    return DEFAULT_CLUSTERS;
  }
}

export async function saveClusters(clusters: ClusterFolder[]): Promise<void> {
  try {
    localStorage.setItem(CLUSTERS_KEY, JSON.stringify(clusters));
  } catch {
    // ignore
  }
}

export function getActiveClusterId(): string {
  try {
    return localStorage.getItem(ACTIVE_CLUSTER_KEY) || 'cls-bintaro';
  } catch {
    return 'cls-bintaro';
  }
}

export function setActiveClusterId(id: string): void {
  try {
    localStorage.setItem(ACTIVE_CLUSTER_KEY, id);
  } catch {
    // ignore
  }
}

