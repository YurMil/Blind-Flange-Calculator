export type HistoryEntrySource = 'manual' | 'live';

export type ConfigurationHistorySummary = {
  dn: number;
  pn: number;
  geometryMode: string;
  pressureOp: number;
  pressureTest: number;
  material: string;
  outerDiameter?: number;
  thickness?: number;
  boltCircle?: number;
  boltCount?: number;
  boltSize?: string;
};

export type HistoryEntry = {
  id: string;
  tag: string;
  savedAt: string;
  updatedAt: string;
  source: HistoryEntrySource;
  summary: ConfigurationHistorySummary;
  config: unknown;
};

const DB_NAME = 'blind-flange-calculator';
const DB_VERSION = 1;
const STORE_NAME = 'configurations';

export const createHistoryEntryId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;
};

export const createLiveHistoryEntryId = (tag: string) =>
  `live:${tag.trim().toLowerCase().replace(/[^a-z0-9._-]+/g, '-')}`;

const openDatabase = () =>
  new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, {keyPath: 'id'});
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Could not open configuration history.'));
  });

const withStore = async <TResult,>(
  mode: IDBTransactionMode,
  handler: (store: IDBObjectStore) => IDBRequest<TResult>,
) => {
  const db = await openDatabase();
  return new Promise<TResult>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, mode);
    const request = handler(transaction.objectStore(STORE_NAME));

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('History operation failed.'));
    transaction.oncomplete = () => db.close();
    transaction.onerror = () => {
      db.close();
      reject(transaction.error ?? new Error('History transaction failed.'));
    };
  });
};

export const getAllHistoryEntries = () => withStore<HistoryEntry[]>('readonly', (store) => store.getAll());

const notifyHistoryChanged = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('blind-flange-history-changed'));
  }
};

export const saveHistoryEntry = async (entry: HistoryEntry) => {
  const result = await withStore<IDBValidKey>('readwrite', (store) => store.put(entry));
  notifyHistoryChanged();
  return result;
};

export const deleteHistoryEntry = async (id: string) => {
  const result = await withStore<undefined>('readwrite', (store) => store.delete(id));
  notifyHistoryChanged();
  return result;
};

export const clearHistoryEntries = async () => {
  const result = await withStore<undefined>('readwrite', (store) => store.clear());
  notifyHistoryChanged();
  return result;
};

export const isHistoryEntry = (value: unknown): value is HistoryEntry =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as HistoryEntry).id === 'string' &&
  typeof (value as HistoryEntry).tag === 'string' &&
  typeof (value as HistoryEntry).savedAt === 'string' &&
  'config' in value;

export const normalizeHistoryEntry = (value: HistoryEntry): HistoryEntry => ({
  ...value,
  updatedAt: value.updatedAt ?? value.savedAt,
  source: value.source ?? 'manual',
  summary: value.summary ?? {
    dn: 0,
    pn: 0,
    geometryMode: 'unknown',
    pressureOp: 0,
    pressureTest: 0,
    material: 'unknown',
  },
});
