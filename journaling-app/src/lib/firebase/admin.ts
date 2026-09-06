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

  return admin.initializeApp({
    projectId: projectId || "demo-journaling-app"
  });
}

export async function verifyFirebaseIdToken(token: string) {
  const app = getFirebaseAdminApp();
  // Mock mode for local dev when auth emulator or real keys are unconfigured
  if (process.env.NODE_ENV === "development" && (!process.env.FIREBASE_ADMIN_CLIENT_EMAIL || token.startsWith("mock-"))) {
    return {
      uid: "dev-mock-user-123",
      email: "dev@example.com",
      name: "Development User",
      picture: "https://lh3.googleusercontent.com/a/default-user"
    };
  }
  return await admin.auth(app).verifyIdToken(token);
}
