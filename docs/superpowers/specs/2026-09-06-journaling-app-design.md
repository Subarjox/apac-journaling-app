# Specification: User-Authenticated Gemini Reflective Journaling Web App

- **Date:** 2026-09-06
- **Status:** Draft (Pending User Review)
- **Target Directory:** `G:\Projects\APAC\journaling-app`
- **Related Documents:**
  - Spec Input: [`prompt.md`](file:///G:/Projects/APAC/prompt.md)
  - LLM System Instructions: [`system_Instruction.md`](file:///G:/Projects/APAC/system_Instruction.md)

---

## 1. Executive Summary & Goals

The goal is to build a modern, user-authenticated web application where users write personal journal entries and engage in multi-turn reflective conversations with Gemini 3.6 Flash. All interactions are persisted securely to Google Cloud Firestore, strictly isolated per user so no tenant can access another tenant'\''s data.

The user experience prioritizes thoughtful minimalism, typographic craftsmanship, and immediate emotional safety, conforming to high-craft frontend standards ([`frontend-design`](file:///G:/Projects/APAC/.agents/skills/frontend-design/SKILL.md) and [`frontend-ui-engineering`](file:///G:/Projects/APAC/.agents/skills/frontend-ui-engineering/SKILL.md)).

---

## 2. System Architecture

```
[ Browser Client (Next.js React UI) ]
   �
   +-- 1. Auth: Google Sign-In via Firebase Auth SDK (Client)
   �      +-- Obtains Firebase ID Token (JWT)
   �
   +-- 2. Data Read/Write: Cloud Firestore
   �      +-- Real-time queries governed by Firestore Security Rules
   �      +-- Path: /users/{userId}/entries/{entryId}
   �
   +-- 3. Chat & Reflection: POST /api/journal/chat (Server Route Handler)
          +-- Header: Authorization: Bearer <Firebase_ID_Token>
          +-- Next.js Server verifies JWT with firebase-admin
          +-- Next.js Server loads system instructions from system_Instruction.md
          +-- Server calls Gemini 3.6 Flash API (@google/genai SDK) using GEMINI_API_KEY
          +-- Streams SSE / ReadableStream chunks back to client UI
```

### Technology Stack:
* **Frontend Framework:** Next.js 15 (App Router, React 19, TypeScript)
* **Styling & UI:** Tailwind CSS, Lucide React Icons
* **Authentication:** Firebase Authentication (Google Identity Provider)
* **Database:** Cloud Firestore (Isolated Document Subcollections)
* **AI Engine:** Google Gemini 3.6 Flash (`@google/genai` official SDK)
* **Server Verification:** `firebase-admin` for secure server-side ID token verification

---

## 3. UI/UX & Design Philosophy

Adhering to [`frontend-design`](file:///G:/Projects/APAC/.agents/skills/frontend-design/SKILL.md) and [`frontend-ui-engineering`](file:///G:/Projects/APAC/.agents/skills/frontend-ui-engineering/SKILL.md):
* **No Generic AI Clich�s:** No loud saturated purple gradients, gimmicky bouncing blobs, or cluttered dashboards.
* **Warm, Grounded Aesthetics:** High-contrast editorial typography (clean serif/sans pairing like Merriweather + Inter), calm neutral tones (slate/sand backgrounds), generous whitespace, and focused distraction-free writing modes.
* **Layout Structure:**
  * **Landing Page (`/`):** Minimal hero explaining reflective journaling, prominent "Continue with Google" button, privacy and local encryption reassurance.
  * **Dashboard (`/dashboard`):** Two-panel responsive layout:
    * *Sidebar (Left):* Chronological past entries list, search/filter by date or mood tag, user profile, sign-out button.
    * *Journal Canvas (Right/Main):* Clean writing area for new entry, multi-turn conversational stream with Gemini, one-click "Synthesize Entry Summary" button.
* **Accessibility (a11y):** WCAG AA compliant contrast ratios, accessible keyboard shortcuts (e.g. `Cmd+Enter` to submit turn), ARIA live regions for streaming AI responses.

---

## 4. Data Architecture & Firestore Schema

All user data is stored within subcollections isolated by the user'\''s unique Firebase Auth `uid`:

```
/users/{userId}
  +-- profile: {
  �     uid: string,
  �     email: string,
  �     displayName: string,
  �     photoURL: string,
  �     createdAt: timestamp,
  �     lastLoginAt: timestamp
  �   }
  +-- entries/{entryId}
        +-- id: string,
        +-- title: string,
        +-- createdAt: timestamp,
        +-- updatedAt: timestamp,
        +-- summary: string | null,
        +-- moodTags: string[],
        +-- turns: [
              {
                id: string,
                role: "user" | "model",
                content: string,
                timestamp: timestamp
              }
            ]
```

### Firestore Security Rules (`firestore.rules`):
```javascript
rules_version = '\''2'\'';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      match /entries/{entryId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

---

## 5. Security & Threat Model Analysis

Addressing the unfinished threat model in [`prompt.md`](file:///G:/Projects/APAC/prompt.md):
1. **API Key Protection:** `GEMINI_API_KEY` and Firebase service account credentials reside exclusively in server-side environment variables (`.env.local`). No client bundle ever receives raw secrets.
2. **Unauthorized Cross-Tenant Snooping:** Every request to `/api/journal/*` requires a valid Bearer ID Token. The server verifies `decodedToken.uid == requestedUserId` before dispatching to Gemini or Firestore.
3. **Prompt Injection & Data Poisoning:** System instructions in [`system_Instruction.md`](file:///G:/Projects/APAC/system_Instruction.md) are prepended at the server level and locked in the `systemInstruction` field of Gemini API calls. User input cannot override system bounds.
4. **Emotional & Crisis Safeguards:** Gemini is instructed not to offer psychiatric diagnoses and to supply crisis hotline numbers if explicit self-harm is detected.

---

## 6. Implementation Stages

1. **Phase 1: Project Setup & Config**
   * Scaffold `journaling-app` using Next.js, TypeScript, Tailwind CSS.
   * Configure environment variables and Firebase SDKs (Client + Admin).
2. **Phase 2: Authentication & Protected Routes**
   * Implement Firebase Google Auth context/hook.
   * Build landing page and protected route wrapper for `/dashboard`.
3. **Phase 3: Firestore Data Layer & Security Rules**
   * Setup typed Firestore repository functions for entries and messages.
   * Write and test `firestore.rules`.
4. **Phase 4: Gemini Streaming API & Journal Conversation**
   * Build `/api/journal/chat` route with `@google/genai` and streaming response.
   * Inject instructions from `system_Instruction.md`.
   * Build multi-turn chat and reflection UI.
5. **Phase 5: Entry Summarization & Historical View**
   * Build `/api/journal/summarize` route to synthesize completed reflections.
   * Build historical entries drawer/sidebar with search and filtering.
6. **Phase 6: Visual Polish, Verification & Pre-commit Quality**
   * Verify responsiveness, a11y, error states, and offline handling.
