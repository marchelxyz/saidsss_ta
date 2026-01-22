export function getDatabaseUrl() {
  const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  return url;
}

export function getAdminToken() {
  return process.env.ADMIN_TOKEN ?? process.env.ADMIN_PASSWORD ?? "";
}

export function getAdminPassword() {
  return process.env.ADMIN_PASSWORD ?? "";
}

export function getAiConfig() {
  const apiKey = process.env.AI_API_KEY ?? "";
  const apiBase = process.env.AI_API_BASE ?? "https://api.openai.com/v1";
  const model = process.env.AI_MODEL ?? "gpt-4o-mini";
  return { apiKey, apiBase, model };
}

export function getImageConfig() {
  const apiKey = process.env.IMAGE_API_KEY ?? "";
  const apiBase =
    process.env.IMAGE_API_BASE ?? "https://generativelanguage.googleapis.com/v1beta";
  const model = process.env.IMAGE_MODEL ?? "models/gemini-3-pro-image-preview";
  const fallbackModel =
    process.env.IMAGE_FALLBACK_MODEL ?? "models/gemini-2.5-flash-image";
  const provider = process.env.IMAGE_PROVIDER ?? "gemini";
  return { apiKey, apiBase, model, fallbackModel, provider };
}

export function getS3Config() {
  const endpoint = process.env.S3_ENDPOINT ?? "";
  const region = process.env.S3_REGION ?? "ru-central1";
  const bucket = process.env.S3_BUCKET ?? "";
  const accessKeyId = process.env.S3_ACCESS_KEY ?? "";
  const secretAccessKey = process.env.S3_SECRET_KEY ?? "";
  const publicBaseUrl = process.env.S3_PUBLIC_BASE_URL ?? "";
  if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) {
    throw new Error("S3 config is not set");
  }
  return { endpoint, region, bucket, accessKeyId, secretAccessKey, publicBaseUrl };
}

export function getPublicBaseUrl() {
  return process.env.PUBLIC_BASE_URL ?? "";
}

export function getScreenshotConfig() {
  const enabled = process.env.SCREENSHOT_ENABLED === "true";
  const apiKey = process.env.SCREENSHOT_API_KEY ?? "";
  const provider = process.env.SCREENSHOT_PROVIDER ?? "local";
  const timeoutMs = Number(process.env.SCREENSHOT_TIMEOUT_MS ?? 30000);
  return { enabled, apiKey, provider, timeoutMs };
}
