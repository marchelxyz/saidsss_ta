import { getAiConfig } from "./env";

export type LeadForAnalysis = {
  name: string;
  company?: string;
  role?: string;
  summary?: string;
  message?: string;
  budget?: string;
  timeline?: string;
};

export type LeadAnalysisResult = {
  summary: string;
  priority: "low" | "medium" | "high";
  next_steps: string[];
  risks: string[];
  potential_value: string;
};

async function callAi(messages: Array<{ role: string; content: string }>) {
  const { apiKey, apiBase, model } = getAiConfig();
  if (!apiKey) {
    throw new Error("AI_API_KEY is not set");
  }

  const response = await fetch(`${apiBase}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.4,
      response_format: { type: "json_object" }
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "AI request failed");
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = data.choices?.[0]?.message?.content ?? "{}";
  return JSON.parse(content) as Record<string, unknown>;
}

export async function analyzeLead(lead: LeadForAnalysis) {
  const payload = {
    name: lead.name,
    company: lead.company ?? "",
    role: lead.role ?? "",
    summary: lead.summary ?? "",
    message: lead.message ?? "",
    budget: lead.budget ?? "",
    timeline: lead.timeline ?? ""
  };

  const result = await callAi([
    {
      role: "system",
      content:
        "Ты консультант по AI-трансформации бизнеса. Верни JSON: {summary, priority, next_steps, risks, potential_value}."
    },
    {
      role: "user",
      content: JSON.stringify(payload)
    }
  ]);

  return result as LeadAnalysisResult;
}

export type ArticleDraftRequest = {
  topic: string;
  audience?: string;
  goal?: string;
  tone?: string;
};

export type ArticleDraftResult = {
  title: string;
  excerpt: string;
  content: string;
};

export async function draftArticle(input: ArticleDraftRequest) {
  const result = await callAi([
    {
      role: "system",
      content:
        "Ты копирайтер B2B. Верни JSON: {title, excerpt, content}. Контент — готовая статья с заголовками и списками."
    },
    { role: "user", content: JSON.stringify(input) }
  ]);

  return result as ArticleDraftResult;
}
