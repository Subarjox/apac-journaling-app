import { SecretManagerServiceClient } from "@google-cloud/secret-manager";

let cachedKey: string | null = null;

/**
 * Retrieves the Gemini API Key.
 *
 * Priorities:
 * 1. In-memory cache (avoid repeated GCP Secret Manager API calls).
 * 2. Google Cloud Secret Manager (if configured via GEMINI_API_KEY_SECRET_NAME or USE_SECRET_MANAGER=true).
 * 3. Fallback to process.env.GEMINI_API_KEY.
 */
export async function getGeminiApiKey(): Promise<string> {
  if (cachedKey) {
    return cachedKey;
  }

  const secretName = process.env.GEMINI_API_KEY_SECRET_NAME;
  const useSecretManager = process.env.USE_SECRET_MANAGER === "true";
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.GCP_PROJECT_ID;

  if (secretName || (useSecretManager && projectId)) {
    try {
      const client = new SecretManagerServiceClient();
      const resourceName =
        secretName || `projects/${projectId}/secrets/GEMINI_API_KEY/versions/latest`;

      const [version] = await client.accessSecretVersion({
        name: resourceName
      });

      const secretPayload = version.payload?.data?.toString();
      if (secretPayload && secretPayload.trim().length > 0) {
        cachedKey = secretPayload.trim();
        return cachedKey;
      }
    } catch (err) {
      console.warn(
        "Google Cloud Secret Manager retrieval notice (falling back to env variable):",
        err instanceof Error ? err.message : String(err)
      );
    }
  }

  const envKey = process.env.GEMINI_API_KEY || "";
  if (envKey) {
    cachedKey = envKey;
  }
  return envKey;
}

/**
 * Reset cache for testing or runtime rotation.
 */
export function resetSecretCache(): void {
  cachedKey = null;
}
