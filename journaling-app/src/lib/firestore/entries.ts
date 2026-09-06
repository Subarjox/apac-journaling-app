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

// Local development fallback store for when live Firebase keys are not yet configured
const inMemoryStore = new Map<string, Map<string, JournalEntry>>();

function getLocalStore(userId: string): Map<string, JournalEntry> {
  if (!inMemoryStore.has(userId)) {
    inMemoryStore.set(userId, new Map());
  }
  return inMemoryStore.get(userId)!;
}

const isMockFirebase = !process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID === "your_project_id" || 
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID === "mock-project";

export async function saveJournalEntry(userId: string, entry: JournalEntry): Promise<void> {
  if (!userId) throw new Error("userId is required to save journal entry");

  if (isMockFirebase) {
    const store = getLocalStore(userId);
    store.set(entry.id, { ...entry, updatedAt: Date.now() });
    return;
  }

  const entryRef = doc(db, "users", userId, "entries", entry.id);
  await setDoc(entryRef, {
    ...entry,
    updatedAt: Date.now()
  }, { merge: true });
}

export async function getJournalEntry(userId: string, entryId: string): Promise<JournalEntry | null> {
  if (!userId || !entryId) return null;

  if (isMockFirebase) {
    const store = getLocalStore(userId);
    return store.get(entryId) || null;
  }

  const entryRef = doc(db, "users", userId, "entries", entryId);
  const snapshot = await getDoc(entryRef);
  if (!snapshot.exists()) return null;
  return snapshot.data() as JournalEntry;
}

export async function getUserJournalEntries(userId: string): Promise<JournalEntry[]> {
  if (!userId) return [];

  if (isMockFirebase) {
    const store = getLocalStore(userId);
    return Array.from(store.values()).sort((a, b) => b.createdAt - a.createdAt);
  }

  const entriesRef = collection(db, "users", userId, "entries");
  const q = query(entriesRef, orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => doc.data() as JournalEntry);
}

export async function deleteJournalEntry(userId: string, entryId: string): Promise<void> {
  if (!userId || !entryId) return;

  if (isMockFirebase) {
    const store = getLocalStore(userId);
    store.delete(entryId);
    return;
  }

  const entryRef = doc(db, "users", userId, "entries", entryId);
  await deleteDoc(entryRef);
}
