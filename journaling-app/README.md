# Reflect — User-Authenticated Gemini Reflective Journaling App

Reflect is a private, editorial-grade reflective journaling sanctuary built with Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Google Cloud Firestore, Firebase Authentication, and Gemini 3.6 Flash.

---

## Key Features

1. **Editorial Craft & Calm UI:** Designed using Anthropic Frontend Design and Addy Osmani UI Engineering guidelines. Distraction-free, responsive split-screen canvas with keyboard shortcuts (`Cmd/Ctrl + Enter`).
2. **Multi-Turn Reflection Dialogue:** Converse seamlessly with Gemini acting as an empathetic, introspective journaling companion that listens, asks grounding questions, and avoids unsolicited advice.
3. **Synthesis & Takeaways:** One-click summarization powered by Gemini structured output, automatically extracting key insights and mood tags into Firestore.
4. **Tenant Isolation:** Cloud Firestore security rules strictly isolate all journal entries to `/users/{userId}/entries/{entryId}`.
5. **Zero-Key Development Mode:** Built with mock adapters for both Gemini streaming and Firestore data access so you can run, test, and develop offline before configuring cloud credentials.

---

## Quickstart

### 1. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser. In development mode, mock authentication and simulated Gemini responses are active by default.

### 2. Run Automated Tests
```bash
npx vitest run
```
Runs all 16 unit and route integration tests.

### 3. Production Build
```bash
npm run build
npm run start
```

---

## Environment Configuration

When you are ready to connect live credentials, copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

### 1. Google Gemini API
Acquire an API key from Google AI Studio and populate:
```env
GEMINI_API_KEY=AIzaSy...
```

### 2. Firebase Client Authentication
Create a project in the [Firebase Console](https://console.firebase.google.com/), enable **Google Authentication**, create a Firestore Database, and add a Web App:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-app
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-app.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1234567890
NEXT_PUBLIC_FIREBASE_APP_ID=1:1234567890:web:abcdef
```

### 3. Firebase Admin SDK (Server Route Verification)
Generate a private service account key in Firebase Console -> Project Settings -> Service Accounts:
```env
FIREBASE_ADMIN_PROJECT_ID=your-app
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-...@your-app.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
```

---

## Cloud Firestore Security Rules

Deploy the included `firestore.rules` via the Firebase CLI or console:

```javascript
rules_version = '2';
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