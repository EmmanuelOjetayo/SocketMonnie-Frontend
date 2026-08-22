import { useState, useEffect } from "react";

/**
 * Sync state with localStorage, persists data across page reloads.
 *
 * @param {string} key - localStorage key
 * @param {*} initialValue - default value if not present
 * @returns {[*, function]} state and setter
 */
export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch {
      // ignore
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}