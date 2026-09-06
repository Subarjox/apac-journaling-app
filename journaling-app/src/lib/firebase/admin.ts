import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

export function parseBearerToken(header: string | null): string | null {
  if (!header || !header.startsWith("Bearer ")) return null;
  return header.substring(7).trim();
}

function getFirebaseAdminApp() {
  const existingApps = getApps();
  if (existingApps.length > 0) return existingApps[0]!;

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (clientEmail && privateKey && projectId) {
    return initializeApp({
      credential: cert({ projectId, clientEmail, privateKey })
    });
  }

  return initializeApp({
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
  return await getAuth(app).verifyIdToken(token);
}