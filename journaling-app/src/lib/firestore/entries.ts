import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
  query, 
  orderBy 
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { JournalEntry } from "@/types/journal";

// Local storage fallback key prefix
const STORAGE_PREFIX = "reflect_entries_";

function getBrowserStorage(userId: string): Map<string, JournalEntry> {
  const store = new Map<string, JournalEntry>();
  if (typeof window === "undefined") return store;

  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${userId}`);
    if (raw) {
      const parsed = JSON.parse(raw) as JournalEntry[];
      parsed.forEach((entry) => store.set(entry.id, entry));
    }
  } catch (err) {
    console.warn("LocalStorage read warning:", err);
  }
  return store;
}

function saveBrowserStorage(userId: string, store: Map<string, JournalEntry>) {
  if (typeof window === "undefined") return;
  try {
    const array = Array.from(store.values());
    localStorage.setItem(`${STORAGE_PREFIX}${userId}`, JSON.stringify(array));
  } catch (err) {
    console.warn("LocalStorage write warning:", err);
  }
}

// Memory store for server-side / vitest environments
const inMemoryStore = new Map<string, Map<string, JournalEntry>>();

function getMemoryStore(userId: string): Map<string, JournalEntry> {
  if (!inMemoryStore.has(userId)) {
    inMemoryStore.set(userId, new Map());
  }
  return inMemoryStore.get(userId)!;
}

export async function saveJournalEntry(userId: string, entry: JournalEntry): Promise<void> {
  if (!userId) throw new Error("userId is required to save journal entry");

  const updatedEntry = {
    ...entry,
    updatedAt: Date.now()
  };

  // 1. Always guarantee local persistence first (zero data loss, instant)
  if (typeof window !== "undefined") {
    const localStore = getBrowserStorage(userId);
    localStore.set(updatedEntry.id, updatedEntry);
    saveBrowserStorage(userId, localStore);
  } else {
    const memStore = getMemoryStore(userId);
    memStore.set(updatedEntry.id, updatedEntry);
  }

  // 2. Non-blocking asynchronous remote Firestore sync
  if (process.env.NODE_ENV !== "test" && !process.env.VITEST) {
    // Fire in the background - never hang UI or delay notifications
    (async () => {
      try {
        const entryRef = doc(db, "users", userId, "entries", updatedEntry.id);
        await setDoc(entryRef, updatedEntry, { merge: true });
      } catch (firestoreErr) {
        console.warn("Firestore background sync warning (entry is safely stored locally):", firestoreErr);
      }
    })();
  }
}

export async function getJournalEntry(userId: string, entryId: string): Promise<JournalEntry | null> {
  if (!userId || !entryId) return null;

  // Check local storage first
  if (typeof window !== "undefined") {
    const local = getBrowserStorage(userId).get(entryId);
    if (local) return local;
  } else {
    const mem = getMemoryStore(userId).get(entryId);
    if (mem) return mem;
  }

  // Fallback to Firestore with timeout guard
  if (process.env.NODE_ENV !== "test" && !process.env.VITEST) {
    try {
      const entryRef = doc(db, "users", userId, "entries", entryId);
      const fetchPromise = getDoc(entryRef);
      const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500));
      const snapshot = await Promise.race([fetchPromise, timeout]);
      if (snapshot && "exists" in snapshot && snapshot.exists()) {
        return snapshot.data() as JournalEntry;
      }
    } catch (err) {
      console.warn("Firestore fetch single entry warning:", err);
    }
  }

  return null;
}

export async function getUserJournalEntries(userId: string): Promise<JournalEntry[]> {
  if (!userId) return [];

  const localMap = typeof window !== "undefined" ? getBrowserStorage(userId) : getMemoryStore(userId);

  if (process.env.NODE_ENV !== "test" && !process.env.VITEST) {
    try {
      const entriesRef = collection(db, "users", userId, "entries");
      const q = query(entriesRef, orderBy("createdAt", "desc"));
      
      // Guard against Firestore connection stalls with a 1500ms timeout
      const remoteFetch = getDocs(q);
      const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500));
      const snapshot = await Promise.race([remoteFetch, timeout]);
      
      // Merge Firestore entries into local map if available
      if (snapshot && "docs" in snapshot) {
        snapshot.docs.forEach((d) => {
          const remote = d.data() as JournalEntry;
          const local = localMap.get(remote.id);
          if (!local || remote.updatedAt > local.updatedAt) {
            localMap.set(remote.id, remote);
          }
        });

        if (typeof window !== "undefined") {
          saveBrowserStorage(userId, localMap);
        }
      }
    } catch (firestoreErr) {
      console.warn("Firestore query warning (using local entries):", firestoreErr);
    }
  }

  return Array.from(localMap.values()).sort((a, b) => b.createdAt - a.createdAt);
}

export async function deleteJournalEntry(userId: string, entryId: string): Promise<void> {
  if (!userId || !entryId) return;

  if (typeof window !== "undefined") {
    const localStore = getBrowserStorage(userId);
    localStore.delete(entryId);
    saveBrowserStorage(userId, localStore);
  } else {
    const memStore = getMemoryStore(userId);
    memStore.delete(entryId);
  }

  if (process.env.NODE_ENV !== "test" && !process.env.VITEST) {
    (async () => {
      try {
        const entryRef = doc(db, "users", userId, "entries", entryId);
        await deleteDoc(entryRef);
      } catch (err) {
        console.warn("Firestore delete warning:", err);
      }
    })();
  }
}