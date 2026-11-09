/**
 * Cross-refresh selfie handoff for onboarding.
 *
 * Register collects the selfie BEFORE the account gets an auth cookie
 * (Register → OTP verify → auth). The protected avatar endpoint can only be
 * called after VerifyOtp authenticates, so the File must survive a page
 * refresh between Register and VerifyOtp.
 *
 * The File is stored in IndexedDB (real file data, never a blob URL as a
 * permanent avatar URL). It is consumed exactly once after OTP verification
 * (then deleted), and an in-memory fallback covers IndexedDB failures.
 */

const DB_NAME = "socketmoni-onboarding";
const DB_VERSION = 1;
const STORE_NAME = "pending_selfie";
const RECORD_KEY = "selfie";

let memoryFallback = null;

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error("IndexedDB open failed"));
  });
}

async function idbPut(value) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(value, RECORD_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(new Error("IndexedDB put failed"));
  });
}

async function idbGet() {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(RECORD_KEY);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(new Error("IndexedDB get failed"));
  });
}

async function idbDelete() {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(RECORD_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(new Error("IndexedDB delete failed"));
  });
}

export async function setPendingSelfie(file) {
  if (!file) return;
  try {
    await idbPut(file);
  } catch {
    memoryFallback = file;
  }
}

export async function takePendingSelfie() {
  try {
    const file = await idbGet();
    if (file) {
      await idbDelete();
      return file;
    }
    return null;
  } catch {
    const file = memoryFallback;
    memoryFallback = null;
    return file;
  }
}
