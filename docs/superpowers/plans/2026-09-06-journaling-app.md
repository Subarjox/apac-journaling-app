# User-Authenticated Gemini Reflective Journaling Web App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a production-grade, user-authenticated reflective journaling web application in `journaling-app/` using Next.js App Router, Firebase Authentication (Google Sign-In), Cloud Firestore, and Gemini 3.6 Flash streaming.

**Architecture:** A unified Next.js full-stack application where client components manage UI state and Firebase auth, while server Route Handlers verify Firebase ID tokens via `firebase-admin` and call the official Gemini SDK (`@google/genai`) using `GEMINI_API_KEY`, streaming responses back to the client. When keys are unconfigured, a robust development mock adapter provides simulated reflection and summarization.

**Tech Stack:** Next.js 15+ (App Router), React 19, TypeScript, Tailwind CSS, Lucide React, Firebase JS SDK 11+, Firebase Admin SDK 12+, `@google/genai` SDK, Vitest / Testing Library.

## Global Constraints

- Project Location: `G:\Projects\APAC\journaling-app`
- System Instruction: Sourced directly from `G:\Projects\APAC\system_Instruction.md`
- Design Standards: High editorial craft, warm neutral palette (slate/sand), distraction-free writing, accessible WCAG AA (derived from `frontend-design` and `frontend-ui-engineering`)
- Zero Secret Leaks: `GEMINI_API_KEY` and Firebase private credentials strictly restricted to server environment variables
- Multi-Tenant Isolation: Firestore queries and security rules strictly scoped to `/users/{userId}/entries/{entryId}`

---

### Task 1: Next.js Project Scaffolding & Dependencies

**Files:**
- Create: `journaling-app/package.json`
- Create: `journaling-app/tsconfig.json`
- Create: `journaling-app/tailwind.config.ts`
- Create: `journaling-app/postcss.config.mjs`
- Create: `journaling-app/next.config.ts`
- Create: `journaling-app/.env.example`

**Interfaces:**
- Consumes: Node.js & npm runtime
- Produces: Runnable Next.js project skeleton with TypeScript and Tailwind CSS

- [ ] **Step 1: Scaffold Next.js application**
Run in root:
```bash
npx --yes create-next-app@latest journaling-app --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --no-turbopack
```

- [ ] **Step 2: Install required production and development dependencies**
Run in `journaling-app`:
```bash
npm install firebase firebase-admin @google/genai lucide-react clsx tailwind-merge
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom
```

- [ ] **Step 3: Create `.env.example`**
Create `journaling-app/.env.example`:
```env
# Client Firebase Config (Public)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Server Secrets (Private)
GEMINI_API_KEY=your_gemini_api_key
FIREBASE_ADMIN_PROJECT_ID=your_project_id
FIREBASE_ADMIN_CLIENT_EMAIL=your_service_account_email
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
```

- [ ] **Step 4: Verify project builds cleanly**
Run in `journaling-app`: `npm run build`
Expected: Build finishes with exit code 0.

---

### Task 2: Core Domain Types & Configuration

**Files:**
- Create: `journaling-app/src/types/journal.ts`
- Create: `journaling-app/src/types/auth.ts`
- Create: `journaling-app/vitest.config.ts`
- Test: `journaling-app/tests/types.test.ts`

**Interfaces:**
- Consumes: Global spec definitions
- Produces: Strict TypeScript definitions for UserProfile, JournalEntry, ChatTurn, and ApiResponses

- [ ] **Step 1: Write type verification test**
Create `journaling-app/tests/types.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import type { JournalEntry, ChatTurn } from "@/types/journal";

describe("Domain Types", () => {
  it("should validate JournalEntry structure", () => {
    const turn: ChatTurn = {
      id: "turn-1",
      role: "user",
      content: "Feeling overwhelmed today.",
      timestamp: Date.now()
    };
    const entry: JournalEntry = {
      id: "entry-1",
      userId: "user-123",
      title: "Morning Thoughts",
      content: "Initial journal content",
      summary: null,
      moodTags: ["anxious"],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      turns: [turn]
    };
    expect(entry.turns.length).toBe(1);
  });
});
```

- [ ] **Step 2: Create Vitest configuration**
Create `journaling-app/vitest.config.ts`:
```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  }
});
```

- [ ] **Step 3: Define TypeScript interfaces**
Create `journaling-app/src/types/journal.ts`:
```typescript
export interface ChatTurn {
  id: string;
  role: "user" | "model";
  content: string;
  timestamp: number;
}

export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  content: string;
  summary: string | null;
  moodTags: string[];
  createdAt: number;
  updatedAt: number;
  turns: ChatTurn[];
}

export interface EntrySummaryResponse {
  summary: string;
  keyInsights: string[];
  suggestedTags: string[];
}
```

Create `journaling-app/src/types/auth.ts`:
```typescript
export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}
```

- [ ] **Step 4: Run test to verify passes**
Run in `journaling-app`: `npx vitest run tests/types.test.ts`
Expected: PASS

---

### Task 3: Firebase Client & Admin Authentication Foundation

**Files:**
- Create: `journaling-app/src/lib/firebase/client.ts`
- Create: `journaling-app/src/lib/firebase/admin.ts`
- Create: `journaling-app/src/context/AuthContext.tsx`
- Test: `journaling-app/tests/auth.test.ts`

**Interfaces:**
- Consumes: Firebase credentials, environment variables
- Produces: `useAuth()` hook, `verifyAuthToken(req)` server utility

- [ ] **Step 1: Write auth helper tests**
Create `journaling-app/tests/auth.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { parseBearerToken } from "@/lib/firebase/admin";

describe("Auth Server Helpers", () => {
  it("extracts token from authorization header correctly", () => {
    const token = parseBearerToken("Bearer sample-token-xyz");
    expect(token).toBe("sample-token-xyz");
  });

  it("returns null for malformed authorization header", () => {
    expect(parseBearerToken("Basic xyz")).toBeNull();
    expect(parseBearerToken("")).toBeNull();
    expect(parseBearerToken(null)).toBeNull();
  });
});
```

- [ ] **Step 2: Implement Client Firebase SDK initialization**
Create `journaling-app/src/lib/firebase/client.ts`:
```typescript
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "mock-api-key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "mock-app.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "mock-project",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "mock-project.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:123456:web:abcdef"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
```

- [ ] **Step 3: Implement Server Firebase Admin & Token Verifier**
Create `journaling-app/src/lib/firebase/admin.ts`:
```typescript
import * as admin from "firebase-admin";

export function parseBearerToken(header: string | null): string | null {
  if (!header || !header.startsWith("Bearer ")) return null;
  return header.substring(7).trim();
}

function getFirebaseAdminApp() {
  if (admin.apps.length > 0) return admin.apps[0]!;
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (clientEmail && privateKey && projectId) {
    return admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey })
    });
  }

  // Fallback for development without service account
  return admin.initializeApp({
    projectId: projectId || "demo-journaling-app"
  });
}

export async function verifyFirebaseIdToken(token: string) {
  const app = getFirebaseAdminApp();
  // Mock mode for local dev when auth emulator or real keys are unconfigured
  if (process.env.NODE_ENV === "development" && (!process.env.FIREBASE_ADMIN_CLIENT_EMAIL || token.startsWith("mock-"))) {
    return { uid: "dev-mock-user-123", email: "dev@example.com" };
  }
  return await admin.auth(app).verifyIdToken(token);
}
```

- [ ] **Step 4: Create React AuthContext**
Create `journaling-app/src/context/AuthContext.tsx` providing `user`, `loading`, `signInWithGoogle()`, and `signOutUser()`.

- [ ] **Step 5: Run tests**
Run: `npx vitest run tests/auth.test.ts`
Expected: PASS

---

### Task 4: Gemini Service Layer with Mock Fallback

**Files:**
- Create: `journaling-app/src/lib/gemini/service.ts`
- Test: `journaling-app/tests/gemini.test.ts`

**Interfaces:**
- Consumes: `GEMINI_API_KEY`, `system_Instruction.md`
- Produces: `streamReflectionChat(turns, userPrompt)`, `generateEntrySummary(entryContent)`

- [ ] **Step 1: Write Gemini service tests (mocked)**
Create `journaling-app/tests/gemini.test.ts` verifying that when `GEMINI_API_KEY` is missing or mock is invoked, the service returns coherent reflective streaming chunks and JSON summaries without crashing.

- [ ] **Step 2: Implement Gemini Service Layer with Fallback**
Create `journaling-app/src/lib/gemini/service.ts`:
- Reads `system_Instruction.md` as default system prompt.
- Uses `@google/genai` SDK when `process.env.GEMINI_API_KEY` is present.
- Employs a built-in reflective fallback mock when `GEMINI_API_KEY` is not yet supplied by the user, ensuring the app runs end-to-end immediately.

- [ ] **Step 3: Run Gemini tests**
Run: `npx vitest run tests/gemini.test.ts`
Expected: PASS

---

### Task 5: Firestore Security Rules & Repository Layer

**Files:**
- Create: `journaling-app/firestore.rules`
- Create: `journaling-app/src/lib/firestore/entries.ts`
- Test: `journaling-app/tests/firestore-entries.test.ts`

**Interfaces:**
- Consumes: Firestore Client SDK, `JournalEntry` types
- Produces: `saveEntry()`, `getEntry()`, `getUserEntries()`, `deleteEntry()`

- [ ] **Step 1: Write entries repository unit tests with Firestore mocks**
- [ ] **Step 2: Implement repository methods for user-isolated CRUD**
- [ ] **Step 3: Write strict `firestore.rules`** enforcing `request.auth.uid == userId`
- [ ] **Step 4: Run tests**
Expected: PASS

---

### Task 6: Editorial UI Components (Design & UI Engineering)

**Files:**
- Create: `journaling-app/src/components/ui/Button.tsx`
- Create: `journaling-app/src/components/ui/Card.tsx`
- Create: `journaling-app/src/components/ui/Input.tsx`
- Create: `journaling-app/src/app/globals.css`
- Create: `journaling-app/src/app/page.tsx` (Landing Page)

**Interfaces:**
- Consumes: `frontend-design` & `frontend-ui-engineering` guidelines
- Produces: Accessible, beautifully typed UI components and landing page with Google Sign-In

- [ ] **Step 1: Implement global styles with high-contrast editorial typography in `globals.css`**
- [ ] **Step 2: Build accessible UI primitives (`Button`, `Card`, `Input`)**
- [ ] **Step 3: Build responsive Landing Page with Google Auth call-to-action**
- [ ] **Step 4: Verify landing page renders and buttons meet WCAG AA contrast**

---

### Task 7: Interactive Journal Canvas & Dashboard Layout

**Files:**
- Create: `journaling-app/src/app/dashboard/page.tsx`
- Create: `journaling-app/src/components/dashboard/Sidebar.tsx`
- Create: `journaling-app/src/components/journal/EntryEditor.tsx`
- Create: `journaling-app/src/components/journal/ReflectionStream.tsx`

**Interfaces:**
- Consumes: `useAuth()`, `JournalEntry` types
- Produces: Full dashboard UI allowing drafting, entry creation, and chat message display

- [ ] **Step 1: Build responsive split-view Dashboard layout**
- [ ] **Step 2: Build `EntryEditor` with auto-saving title, content textarea, and mood tags**
- [ ] **Step 3: Build `ReflectionStream` showing user questions and Gemini replies**
- [ ] **Step 4: Add keyboard shortcuts (`Cmd/Ctrl + Enter`) to dispatch turns**

---

### Task 8: Server-Side Streaming API Route (`/api/journal/chat`)

**Files:**
- Create: `journaling-app/src/app/api/journal/chat/route.ts`
- Test: `journaling-app/tests/chat-route.test.ts`

**Interfaces:**
- Consumes: POST `{ entryId, prompt, history }`, `Authorization: Bearer <token>`
- Produces: Streaming response (text/event-stream or ReadableStream)

- [ ] **Step 1: Write integration test for `/api/journal/chat`**
- [ ] **Step 2: Implement route handler with JWT verification and Gemini streaming**
- [ ] **Step 3: Wire frontend `ReflectionStream` to read from the stream**
- [ ] **Step 4: Run test to verify streaming works**

---

### Task 9: Summarization Route & Historical Entries Persistence

**Files:**
- Create: `journaling-app/src/app/api/journal/summarize/route.ts`
- Create: `journaling-app/src/components/journal/EntrySummaryModal.tsx`
- Test: `journaling-app/tests/summarize-route.test.ts`

**Interfaces:**
- Consumes: POST `{ entryId, content, turns }`, `Authorization: Bearer <token>`
- Produces: `{ summary, keyInsights, suggestedTags }`

- [ ] **Step 1: Write test for `/api/journal/summarize`**
- [ ] **Step 2: Implement route handler using Gemini 3.6 Flash structured JSON output**
- [ ] **Step 3: Connect "Synthesize Reflection" button on UI to trigger summary and persist to Firestore**
- [ ] **Step 4: Verify entries list in Sidebar updates dynamically**

---

### Task 10: End-to-End Verification, Security & Production Build

**Files:**
- Modify: `journaling-app/README.md`
- Test: Full build and test suite execution

**Interfaces:**
- Consumes: All modules
- Produces: Verified production build ready for deployment

- [ ] **Step 1: Run all unit and component tests**
Run in `journaling-app`: `npm run test` or `npx vitest run`
Expected: 100% tests PASS

- [ ] **Step 2: Run production Next.js build**
Run in `journaling-app`: `npm run build`
Expected: Exit code 0, zero linting or TypeScript errors

- [ ] **Step 3: Write comprehensive setup documentation in `journaling-app/README.md` explaining how to plug in real Firebase keys and `GEMINI_API_KEY`**
