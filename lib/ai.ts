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
};

export async function draftIndustryPage(niche: string) {
  const result = await callAi([
    {
      role: "system",
      content:
        "Ты старший бизнес-консультант Big4 (McKinsey/BCG) по операционной эффективности. Пиши жестко и конкретно, с цифрами и профессиональным жаргоном ниши. Ненавидишь общие слова и клише. Запрещены суммы денег и валюты — используй только проценты, доли, индексы и сроки. Реальные компании упоминай только если кейс публичный и проверяемый, иначе используй обезличенное описание. Верни ТОЛЬКО валидный JSON по строгой схеме."
    },
    {
      role: "user",
      content: `Ниша: ${niche}.\n\nСгенерируй насыщенный лендинг с данными для инфографики. Обязательно используй сленг ниши и названия ПО (1C, amoCRM, Bitrix24, YCLIENTS, iiko — если релевантно).\nЗАПРЕТ: суммы в валюте. Используй ТОЛЬКО проценты/доли/индексы/сроки.\nСхема JSON:\n{\n  \"hero\": {\"title\": \"Жесткий заголовок с цифрой\", \"subtitle\": \"Оффер с конкретным обещанием\"},\n  \"pain_points\": [\n    {\"title\": \"Название боли\", \"description\": \"Детальная ситуация\", \"loss_amount\": \"Потеря: -18%\"}\n  ],\n  \"process_breakdown\": {\"old_way\": [\"...\"], \"new_way_ai\": [\"...\"]},\n  \"roi_calculator\": {\"hours_saved_per_month\": 120, \"savings_percentage\": 28, \"revenue_uplift_percentage\": 14, \"roi_percentage\": 320, \"payback_period_months\": 1.5},\n  \"software_stack\": [\"...\"],\n  \"comparison_table\": [\n    {\"feature\": \"Скорость ответа\", \"human\": \"5-20 минут\", \"ai\": \"2 секунды\"}\n  ],\n  \"case_study\": {\"title\": \"Публичный кейс\", \"company\": \"\", \"source_url\": \"\", \"is_public\": false, \"story\": \"Короткая история\", \"result_bullet_points\": [\"...\"]},\n  \"meta_description\": \"до 160 символов\"\n}\n\nТребования:\n- pain_points: 5 пунктов.\n- old_way/new_way_ai: по 4-6 шагов.\n- software_stack: 6-8 инструментов, релевантных нише.\n- comparison_table: 4-5 строк.\n- case_study.result_bullet_points: 3-4 пункта.\n- Если кейс публичный и есть источник, заполни company и source_url, is_public = true. Иначе company пустой, is_public = false.\n- Только валидный JSON, без Markdown.`
    }
  ]);

  return result as IndustryPageDraft;
}
