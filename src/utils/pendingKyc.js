/**
 * Cross-refresh KYC handoff for onboarding.
 *
 * Register collects the NIN + ID document BEFORE the account gets an auth
 * cookie (Register → OTP verify → auth). The protected KYC endpoint can only
 * be called after VerifyOtp authenticates, so the File must survive a page
 * refresh between Register and VerifyOtp.
 *
 * The real File (plus its document type and NIN) is stored in IndexedDB in a
 * dedicated `pending_kyc` record. It is consumed exactly once after OTP
 * verification and an in-memory fallback covers IndexedDB failures. A failed
 * upload can re-stash the same payload for a later retry.
 */

const DB_NAME = "socketmoni-onboarding";
const DB_VERSION = 2;
const STORE_NAMES = ["pending_selfie", "pending_kyc"];
const STORE_NAME = "pending_kyc";
const RECORD_KEY = "kyc";

let memoryFallback = null;

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      // Both stores are created on upgrade so whichever onboarding utility
      // opens the shared DB first establishes a consistent schema.
      for (const name of STORE_NAMES) {
        if (!db.objectStoreNames.contains(name)) {
          db.createObjectStore(name);
        }
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

export async function setPendingKyc(payload) {
  if (!payload?.file) return;
  try {
    await idbPut(payload);
  } catch {
    memoryFallback = payload;
  }
}

export async function takePendingKyc() {
  try {
    const payload = await idbGet();
    if (payload) {
      await idbDelete();
      return payload;
    }
    return null;
  } catch {
    const payload = memoryFallback;
    memoryFallback = null;
    return payload;
  }
}
