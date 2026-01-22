import { randomUUID } from "crypto";
import { getAiConfig } from "./env";
import { getNicheForms, type NicheForms } from "@/lib/niche";

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
  const requestId = randomUUID();
  const startedAt = Date.now();
  logAiStep(requestId, "request.start", {
    model,
    apiBase,
    messagesCount: messages.length
  });

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
    logAiError(requestId, "request.failed", {
      status: response.status,
      body: text
    });
    throw new Error(text || "AI request failed");
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = data.choices?.[0]?.message?.content ?? "{}";
  try {
    const parsed = JSON.parse(content) as Record<string, unknown>;
    logAiStep(requestId, "request.success", { durationMs: Date.now() - startedAt });
    return parsed;
  } catch (error) {
    logAiError(requestId, "response.parse_failed", {
      durationMs: Date.now() - startedAt,
      contentSnippet: content.slice(0, 2000)
    });
    throw error;
  }
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
        "Ты ведущий sales-аналитик TeleAgent. Дай жесткое, деловое заключение по лиду без воды. Верни JSON: {summary, priority, next_steps, risks, potential_value}."
    },
    {
      role: "user",
      content: `ДАННЫЕ ЛИДА:\n${JSON.stringify(payload, null, 2)}\n\nИНСТРУКЦИИ:\n1) Сфокусируйся на боли и деньгах клиента.\n2) В summary опиши суть запроса и потенциальный эффект от аудита.\n3) В next_steps дай 3-5 конкретных шагов, первым всегда \"Аудит всех отделов\".\n4) risks — бизнес-риски, если оставить как есть.\n5) potential_value — диапазон эффекта/экономии в понятных единицах.`
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
        "# ROLE\nТы — ведущий бизнес-аналитик и Growth-маркетолог компании \"TeleAgent\".\nТвоя специализация: Трансформация бизнеса с AI под ключ, аудит бизнес-процессов, автоматизация отделов.\nТвой враг: Рутина, раздутый штат, человеческий фактор, неэффективные расходы на ФОТ.\n\n# CONTEXT\nПользователь пришлет тебе JSON с параметрами: {Тема, Аудитория, Цель, Тон}.\nТвоя задача — написать экспертную статью на основе этих данных, которая будет продавать услуги TeleAgent.\n\n# WRITING RULES (CRITICAL!)\n1. Стиль (Tone of Voice): Ильяхов/Инфостиль. Пиши конкретно, жестко, без воды.\n   - ЗАПРЕЩЕНО: \"В современном мире\", \"Уникальная возможность\", \"Инновационные решения\", \"Динамично развивающийся\".\n   - МОЖНО: \"Вы теряете 30% выручки\", \"Менеджеры забывают перезвонить\", \"AI стоит 0 рублей за больничный\".\n2. Структура:\n   - Заголовок: Должен бить в боль или деньги.\n   - Лид: Сразу обозначь проблему. Почему текущий метод работы (ручной труд) — это убытки.\n   - Тело статьи: Разбей на четкие пункты. Используй примеры \"Было/Стало\".\n   - Продукт: Вплети услуги TeleAgent (Аудит, Внедрение) как единственное логичное решение проблемы.\n   - CTA: Призыв заказать аудит.\n3. Форматирование: Используй HTML теги для заголовков (<h2>, <h3>) и списков (<ul>, <li>).\n\n# RESPONSE FORMAT\nВерни ТОЛЬКО валидный JSON без Markdown-обертки:\n{\n  \"title\": \"Продающий заголовок\",\n  \"excerpt\": \"Краткое описание (meta description) для превью, 2-3 предложения, цепляющие за живое.\",\n  \"content\": \"Текст статьи в HTML формате...\"\n}"
    },
    {
      role: "user",
      content: `ВВОДНЫЕ ДАННЫЕ ОТ ПОЛЬЗОВАТЕЛЯ:\n- Тема статьи: ${input.topic}\n- Целевая аудитория (для кого пишем): ${input.audience ?? ""}\n- Главная цель статьи (что должен сделать читатель): ${input.goal ?? ""}\n- Желаемый тон: ${input.tone ?? ""}\n\nДОПОЛНИТЕЛЬНЫЕ ИНСТРУКЦИИ:\n1. Обязательно упомяни, что процесс начинается с глубокого АУДИТА всех отделов.\n2. Приведи пример, релевантный для этой аудитории.\n3. В конце сделай подводку к тому, что \"TeleAgent\" найдет точки роста.`
    }
  ]);

  return result as ArticleDraftResult;
}

export type IndustryPageDraft = {
  hero: {
    title: string;
    subtitle: string;
  };
  pain_points: Array<{
    title: string;
    description: string;
    loss_amount: string;
  }>;
  process_breakdown: {
    old_way: string[];
    new_way_ai: string[];
  };
  roi_calculator: {
    hours_saved_per_month: number;
    savings_percentage: number;
    revenue_uplift_percentage: number;
    roi_percentage: number;
    payback_period_months: number;
  };
  software_stack: string[];
  comparison_table: Array<{
    feature: string;
    human: string;
    ai: string;
  }>;
  case_study: {
    title: string;
    company: string;
    source_url?: string;
    is_public: boolean;
    story: string;
    result_bullet_points: string[];
  };
  meta_description: string;
  image_prompt?: string;
};

type AgentResult = Record<string, unknown>;

async function runAgent(name: string, system: string, input: Record<string, unknown>) {
  const startedAt = Date.now();
  logAiStep("mas", "agent.start", { name });
  const result = await callAi([
    { role: "system", content: system },
    { role: "user", content: JSON.stringify({ agent: name, ...input }, null, 2) }
  ]);
  logAiStep("mas", "agent.done", { name, durationMs: Date.now() - startedAt });
  return result as AgentResult;
}

const MAS_RULES =
  "Правила: только проценты/доли/индексы/сроки. Никаких валют. Пиши на профессиональном сленге ниши. Реальные компании упоминай только если кейс публичный и проверяемый, иначе обезличенно.";

export async function generateIndustryPageMAS(niche: string) {
  const startedAt = Date.now();
  const log = (msg: string) => console.log(`[mas] ${msg}`);
  const nicheForms = getNicheForms(niche);
  log(`start niche="${niche}"`);
  const auditor = await runAgent(
    "Auditor",
    `Ты циничный бизнес-консультант Big4. Ищи потери в нише и считаешь эффект внедрения. ${MAS_RULES} Верни JSON: { pain_points: [{title, description, loss_amount}], roi_calculator: {hours_saved_per_month, savings_percentage, revenue_uplift_percentage, roi_percentage, payback_period_months} }.`,
    { niche }
  );
  log("auditor done");

  let architectDraft = await runAgent(
    "Architect",
    `Ты B2B-маркетолог в инфостиле. Используй данные аудитора. ${MAS_RULES} Верни JSON: { hero, process_breakdown, comparison_table, software_stack, case_study }. В case_study: {title, company, source_url, is_public, story, result_bullet_points}. Требования к кейсу: компания описана конкретно (тип, масштаб, регион/рынок), без фраз "компания из ниши". История минимум 3-4 предложения, 350+ символов.`,
    { niche, audit: auditor }
  );
  log("architect done");

  let approved = false;
  let criticFeedback = "";
  let attempts = 0;
  while (!approved && attempts < 3) {
    log(`critic attempt ${attempts + 1}`);
    const critic = await runAgent(
      "Critic",
      `Ты вредный заказчик. Проверяешь логику, цифры, сленг и отсутствие воды. ${MAS_RULES} Верни JSON: { approved: boolean, feedback: string }.`,
      { niche, draft: architectDraft, audit: auditor }
    );
    approved = Boolean(critic.approved);
    criticFeedback = (critic.feedback as string) ?? "";
    log(approved ? "critic approved" : `critic feedback: ${criticFeedback}`);
    if (!approved) {
      architectDraft = await runAgent(
        "Architect",
        `Ты B2B-маркетолог в инфостиле. Исправь по фидбеку. ${MAS_RULES} Верни JSON: { hero, process_breakdown, comparison_table, software_stack, case_study }. Убедись, что в case_study указана конкретная профильная компания и история развернута.`,
        { niche, audit: auditor, feedback: criticFeedback, previous_draft: architectDraft }
      );
      log("architect revised");
    }
    attempts += 1;
  }

  if (!approved) {
    log("critic not approved after max attempts, running refiner");
    architectDraft = await runAgent(
      "Refiner",
      `Ты редактор-валидатор. Исправь все замечания критика и согласуй цифры. ${MAS_RULES} Убедись, что проценты реалистичны (0-100), нет противоречий в таблицах и кейсе. В case_study оставь конкретную профильную компанию и развернутую историю. Верни JSON: { hero, process_breakdown, comparison_table, software_stack, case_study }.`,
      { niche, audit: auditor, feedback: criticFeedback, previous_draft: architectDraft }
    );
    log("refiner done");
  }

  const artDirector = await runAgent(
    "ArtDirector",
    `Ты арт-директор. Сгенерируй промпт изображения в стиле Dark Tech Corporate, минимализм, неон, темный фон. Без людей, лиц, врачей, пациентов и реальных фотографий — только абстрактная графика, схемы, диаграммы. Верни JSON: { image_prompt }.`,
    { niche, hero: architectDraft.hero }
  );
  log("art director done");

  const growth = await runAgent(
    "GrowthHacker",
    `Ты SEO-специалист. ${MAS_RULES} Верни JSON: { meta_description }.`,
    { niche, draft: architectDraft, audit: auditor }
  );
  log("growth done");

  const uiQa = await runAgent(
    "UIQA",
    `Ты верстальщик. Проверь структуру и длину. Заголовки <= 60 символов, массивы не пустые. В кейсе обязательна конкретная профильная компания и 3-4 предложения истории. Верни исправленный JSON с полями hero, pain_points, process_breakdown, comparison_table, software_stack, case_study.`,
    { niche, draft: architectDraft, audit: auditor }
  );
  log("ui qa done");

  const normalizePercent = (value: unknown, fallback = 20) => {
    const num = typeof value === "number" ? value : Number(value);
    if (Number.isNaN(num)) return fallback;
    return Math.max(1, Math.min(100, Math.round(num)));
  };

  const normalizeLoss = (value: unknown) => {
    const text = String(value ?? "").trim();
    if (!text) return "Потеря: -15%";
    const match = text.match(/-?\d{1,3}/);
    const percent = match ? normalizePercent(match[0], 15) : 15;
    return `Потеря: -${percent}%`;
  };

  const normalizePainPoints = (
    items: IndustryPageDraft["pain_points"] | undefined
  ): IndustryPageDraft["pain_points"] => {
    const safeItems = Array.isArray(items) ? items : [];
    return safeItems.map((item) => ({
      title: item.title || "Потеря конверсии",
      description: item.description || "Есть разрыв между заявкой и результатом.",
      loss_amount: normalizeLoss(item.loss_amount)
    }));
  };

  const result: IndustryPageDraft = {
    hero: normalizeHero(uiQa.hero, nicheForms),
    pain_points: normalizePainPoints(
      auditor.pain_points as IndustryPageDraft["pain_points"]
    ),
    process_breakdown: normalizeProcessBreakdown(uiQa.process_breakdown),
    roi_calculator: {
      hours_saved_per_month: Math.max(
        10,
        Number((auditor.roi_calculator as any)?.hours_saved_per_month ?? 60)
      ),
      savings_percentage: normalizePercent(
        (auditor.roi_calculator as any)?.savings_percentage ?? 25
      ),
      revenue_uplift_percentage: normalizePercent(
        (auditor.roi_calculator as any)?.revenue_uplift_percentage ?? 15
      ),
      roi_percentage: normalizePercent((auditor.roi_calculator as any)?.roi_percentage ?? 80),
      payback_period_months: Math.max(
        1,
        Number((auditor.roi_calculator as any)?.payback_period_months ?? 2)
      )
    },
    software_stack: normalizeStringList(uiQa.software_stack),
    comparison_table: normalizeComparison(uiQa.comparison_table, niche),
    case_study: normalizeCaseStudy(uiQa.case_study, nicheForms),
    meta_description: String((growth.meta_description as string) ?? "").trim(),
    image_prompt: String((artDirector.image_prompt as string) ?? "").trim()
  };

  log(`finish in ${Date.now() - startedAt}ms`);
  return result;
}
function logAiStep(requestId: string, step: string, meta?: Record<string, unknown>) {
  const prefix = `[ai] [${requestId}] ${step}`;
  if (!meta) {
    console.log(prefix);
    return;
  }
  console.log(prefix, meta);
}

function logAiError(
  requestId: string,
  step: string,
  meta: Record<string, unknown>
) {
  console.error(`[ai] [${requestId}] ${step}`, meta);
}

function normalizeHero(hero: unknown, nicheForms: NicheForms): IndustryPageDraft["hero"] {
  const fallback = {
    title: buildHeroTitle(nicheForms),
    subtitle: "Автоматизируем процессы и убираем потери в отделах."
  };
  if (!hero || typeof hero !== "object") return fallback;
  const candidate = hero as IndustryPageDraft["hero"];
  return {
    title: candidate.title?.trim() || fallback.title,
    subtitle: candidate.subtitle?.trim() || fallback.subtitle
  };
}

function normalizeProcessBreakdown(
  input: unknown
): IndustryPageDraft["process_breakdown"] {
  const fallback = {
    old_way: ["Ручные согласования", "Распыление ответственности", "Срывы сроков"],
    new_way_ai: ["Единый контроль", "Прозрачные метрики", "Автоматические проверки"]
  };
  if (!input || typeof input !== "object") return fallback;
  const candidate = input as IndustryPageDraft["process_breakdown"];
  const oldWay = Array.isArray(candidate.old_way) ? candidate.old_way : [];
  const newWay = Array.isArray(candidate.new_way_ai) ? candidate.new_way_ai : [];
  return {
    old_way: oldWay.length > 0 ? oldWay : fallback.old_way,
    new_way_ai: newWay.length > 0 ? newWay : fallback.new_way_ai
  };
}

function normalizeStringList(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input.filter((item) => typeof item === "string" && item.trim().length > 0);
}

function normalizeComparison(
  input: unknown,
  niche: string
): IndustryPageDraft["comparison_table"] {
  if (!Array.isArray(input)) return buildComparisonFallback(niche);
  const rows = input
    .map((item) => item as IndustryPageDraft["comparison_table"][number])
    .filter((item) => Boolean(item?.feature));
  return rows.length > 0 ? rows : buildComparisonFallback(niche);
}

function normalizeCaseStudy(
  input: unknown,
  nicheForms: NicheForms
): IndustryPageDraft["case_study"] {
  const fallback: IndustryPageDraft["case_study"] = {
    title: buildCaseTitle(nicheForms),
    company: buildCaseCompany(nicheForms),
    is_public: false,
    story: buildCaseStory(nicheForms),
    result_bullet_points: buildCaseResults()
  };
  if (!input || typeof input !== "object") return fallback;
  const candidate = input as IndustryPageDraft["case_study"];
  const normalizedCompany = normalizeCaseCompany(candidate.company, nicheForms);
  const normalizedStory = normalizeCaseStory(candidate.story, nicheForms);
  const normalizedResults = normalizeCaseResults(candidate.result_bullet_points);
  return {
    title: normalizeCaseTitle(candidate.title, nicheForms),
    company: normalizedCompany,
    source_url: candidate.source_url,
    is_public: Boolean(candidate.is_public),
    story: normalizedStory,
    result_bullet_points: normalizedResults
  };
}

function buildHeroTitle(nicheForms: NicheForms): string {
  if (!nicheForms.genitive) return "TeleAgent для бизнеса";
  return `TeleAgent для ${nicheForms.genitive}`;
}

function buildCaseTitle(nicheForms: NicheForms): string {
  if (!nicheForms.prepositional) return "Кейс: бизнес";
  return `Кейс в ${nicheForms.prepositional}`;
}

function buildCaseCompany(nicheForms: NicheForms): string {
  if (!nicheForms.genitive) return "Региональная компания в B2B";
  return `Региональная компания из сферы ${nicheForms.genitive}`;
}

function buildCaseStory(nicheForms: NicheForms): string {
  const nicheLabel = nicheForms.genitive || "бизнеса";
  return (
    `Компания из сферы ${nicheLabel} масштабировалась и уперлась в хаос ручных процессов: ` +
    "планирование, контроль качества и коммуникации шли в разных системах. " +
    "TeleAgent настроил сквозной аудит и автоматизацию, чтобы свести потери к минимуму. " +
    "Через 6 недель процессы выровнялись, контроль стал прозрачным, а руководители получили прогнозируемый результат."
  );
}

function buildCaseResults(): string[] {
  return ["Снижение потерь на 18%", "Рост прозрачности на 24%", "Ускорение цикла на 22%"];
}

function normalizeCaseTitle(title: string | undefined, nicheForms: NicheForms): string {
  const trimmed = title?.trim();
  if (!trimmed) return buildCaseTitle(nicheForms);
  return trimmed;
}

function normalizeCaseCompany(
  company: string | undefined,
  nicheForms: NicheForms
): string {
  const trimmed = company?.trim() ?? "";
  if (!trimmed) return buildCaseCompany(nicheForms);
  if (isGenericCompany(trimmed)) return buildCaseCompany(nicheForms);
  if (trimmed.length < 6) return buildCaseCompany(nicheForms);
  return trimmed;
}

function normalizeCaseStory(story: string | undefined, nicheForms: NicheForms): string {
  const trimmed = story?.trim() ?? "";
  if (trimmed.length < 240) return buildCaseStory(nicheForms);
  return trimmed;
}

function normalizeCaseResults(values: string[] | undefined): string[] {
  const items = Array.isArray(values) ? values.map((item) => item.trim()).filter(Boolean) : [];
  if (items.length >= 3) return items;
  return buildCaseResults();
}

function isGenericCompany(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return true;
  if (normalized === "компания" || normalized === "организация" || normalized === "клиент") {
    return true;
  }
  if (/компания из ниши|компания из отрасли|компания из сферы/.test(normalized)) {
    return true;
  }
  if (normalized.startsWith("компания")) {
    return normalized.split(/\s+/).length <= 2;
  }
  return false;
}
/**
 * Возвращает базовое сравнение людей и AI, если модель не заполнила таблицу.
 */
function buildComparisonFallback(niche: string): IndustryPageDraft["comparison_table"] {
  const suffix = niche ? ` (${niche})` : "";
  return [
    {
      feature: `Скорость реакции${suffix}`,
      human: "Минуты или часы",
      ai: "Секунды и автоматические сценарии"
    },
    {
      feature: `Точность данных${suffix}`,
      human: "Ошибки из-за ручного ввода",
      ai: "Проверка и консолидация в потоке"
    },
    {
      feature: `Прозрачность процессов${suffix}`,
      human: "Разрозненные отчеты",
      ai: "Единые дашборды и контроль статусов"
    },
    {
      feature: `Стабильность качества${suffix}`,
      human: "Зависит от людей",
      ai: "Регламент + автоматические проверки"
    }
  ];
}
