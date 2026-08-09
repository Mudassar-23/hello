const DB_NAME = "PortfolioVideoDB_v1";
const STORE_NAME = "videos";
const DB_VERSION = 1;

const blobUrlCache = new Map();

function openDB() {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB is not supported in this environment"));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveVideoBlob(id, fileOrBlob) {
  const db = await openDB();
  const key = `indexeddb_${id}`;
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(fileOrBlob, key);
    req.onsuccess = () => {
      if (blobUrlCache.has(key)) {
        URL.revokeObjectURL(blobUrlCache.get(key));
        blobUrlCache.delete(key);
      }
      resolve(`indexeddb:${key}`);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function getVideoBlobUrl(videoUrlKey) {
  if (!videoUrlKey || !videoUrlKey.startsWith("indexeddb:")) {
    return videoUrlKey;
  }

  const key = videoUrlKey.replace("indexeddb:", "");

  if (blobUrlCache.has(key)) {
    return blobUrlCache.get(key);
  }

  try {
    const db = await openDB();
    const blob = await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });

    if (blob) {
      const objectUrl = URL.createObjectURL(blob);
      blobUrlCache.set(key, objectUrl);
      return objectUrl;
    }
  } catch (err) {
    console.error("Error retrieving video blob from IndexedDB:", err);
  }

  return "";
}

export async function deleteVideoBlob(videoUrlKey) {
  if (!videoUrlKey || !videoUrlKey.startsWith("indexeddb:")) return;
  const key = videoUrlKey.replace("indexeddb:", "");

  if (blobUrlCache.has(key)) {
    URL.revokeObjectURL(blobUrlCache.get(key));
    blobUrlCache.delete(key);
  }

  try {
    const db = await openDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error("Error deleting video blob from IndexedDB:", err);
  }
}
