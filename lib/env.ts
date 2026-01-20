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
