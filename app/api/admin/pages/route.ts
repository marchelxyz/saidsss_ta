import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getPool } from "@/lib/db";
import { slugify } from "@/lib/slug";
import { generateIndustryPageMAS } from "@/lib/ai";
import { generateImage, uploadImageVariants, uploadScreenshotVariants } from "@/lib/images";
import { captureScreenshot } from "@/lib/screenshot";
import { getPublicBaseUrl, getScreenshotConfig } from "@/lib/env";
import { logAudit } from "@/lib/audit";

type PageCreatePayload = {
  title?: string;
  slug?: string;
  pageType?: string;
  niche?: string;
  generate?: boolean;
};

type PageGenerationStatus = "pending" | "ready" | "failed";

function buildIndustryBlocks(draft: {
  hero: { title: string; subtitle: string };
  pain_points: Array<{ title: string; description: string; loss_amount: string }>;
  process_breakdown: { old_way: string[]; new_way_ai: string[] };
  roi_calculator: {
    hours_saved_per_month: number;
    savings_percentage: number;
    revenue_uplift_percentage: number;
    roi_percentage: number;
    payback_period_months: number;
  };
  software_stack: string[];
  comparison_table: Array<{ feature: string; human: string; ai: string }>;
  case_study: {
    title: string;
    company: string;
    source_url?: string;
    is_public: boolean;
    story: string;
    result_bullet_points: string[];
  };
  image?: { prompt?: string; avifUrl?: string; webpUrl?: string; jpgUrl?: string };
}) {
  return [
    {
      block_type: "hero",
      content: {
        title: draft.hero.title,
        subtitle: draft.hero.subtitle,
        button_text: "Получить аудит",
        button_link: "#contact",
        short_title: "Вводная"
      },
      sort_order: 0
    },
    {
      block_type: "pain_cards",
      content: {
        title: "Где вы теряете деньги",
        short_title: "Боли",
        items: draft.pain_points
      },
      sort_order: 1
    },
    {
      block_type: "process_compare",
      content: {
        title: "Было → Стало",
        short_title: "Процесс",
        old_way: draft.process_breakdown.old_way,
        new_way_ai: draft.process_breakdown.new_way_ai
      },
      sort_order: 2
    },
    {
      block_type: "roi",
      content: {
        title: "ROI и эффект",
        short_title: "ROI",
        hours_saved_per_month: draft.roi_calculator.hours_saved_per_month,
        savings_percentage: draft.roi_calculator.savings_percentage,
        revenue_uplift_percentage: draft.roi_calculator.revenue_uplift_percentage,
        roi_percentage: draft.roi_calculator.roi_percentage,
        payback_period_months: draft.roi_calculator.payback_period_months
      },
      sort_order: 3
    },
    {
      block_type: "badges",
      content: {
        title: "Интеграции и стек",
        short_title: "Стек",
        items: draft.software_stack
      },
      sort_order: 4
    },
    {
      block_type: "comparison_table",
      content: {
        title: "Сравнение: люди vs AI",
        short_title: "Сравнение",
        rows: draft.comparison_table
      },
      sort_order: 5
    },
    {
      block_type: "case_study",
      content: {
        title: draft.case_study.title,
        short_title: "Кейс",
        story: draft.case_study.story,
        result_bullet_points: draft.case_study.result_bullet_points,
        company: draft.case_study.company,
        source_url: draft.case_study.source_url,
        is_public: draft.case_study.is_public
      },
      sort_order: 6
    },
    ...(draft.image?.avifUrl || draft.image?.webpUrl || draft.image?.jpgUrl
      ? [
          {
            block_type: "image",
            content: {
              title: "Инфографика",
              short_title: "Инфографика",
              image_prompt: draft.image.prompt ?? "",
              image_avif_url: draft.image.avifUrl,
              image_webp_url: draft.image.webpUrl,
              image_url: draft.image.jpgUrl
            },
            sort_order: 7
          }
        ]
      : []),
    {
      block_type: "contact",
      content: {
        title: "Обсудим внедрение",
        short_title: "Контакты",
        subtitle: "Оставьте контакты — вернемся с планом аудита."
      },
      sort_order: 8
    }
  ];
}

export async function GET() {
  const pool = getPool();
  const result = await pool.query(
    `select p.id,
            p.title,
            p.slug,
            p.page_type,
            p.niche,
            p.meta_description,
            p.generation_status,
            p.generation_error,
            p.published,
            count(l.id)::int as leads_count
     from site_pages p
     left join leads l on l.source_page = p.slug
     group by p.id
     order by p.created_at desc`
  );

  const publicBaseUrl = getPublicBaseUrl();
  const pages = result.rows.map((row) => {
    const base = publicBaseUrl.replace(/\/$/, "");
    const path =
      row.page_type === "home"
        ? "/"
        : row.page_type === "industry"
          ? `/industry/${row.slug}`
          : `/p/${row.slug}`;
    return {
      ...row,
      public_url: publicBaseUrl ? `${base}${path}` : ""
    };
  });
  return NextResponse.json({ ok: true, pages });
}

export async function POST(request: Request) {
  const requestId = randomUUID();
  logPageStep(requestId, "request.start");
  let body: PageCreatePayload | null = null;
  try {
    body = (await request.json()) as PageCreatePayload;
    logPageStep(requestId, "request.parsed", { body });
  } catch {
    logPageStep(requestId, "request.parse_failed");
    return NextResponse.json({ ok: false, message: "Неверный формат." }, { status: 400 });
  }

  const pageType = body?.pageType?.trim() || "custom";
  const niche = body?.niche?.trim() || "";
  const title = body?.title?.trim() || (niche ? `TeleAgent для ${niche}` : "Новая страница");
  const slug =
    pageType === "home"
      ? "home"
      : body?.slug?.trim() || (niche ? slugify(niche) : slugify(title));
  const generate = Boolean(body?.generate);
  logPageStep(requestId, "request.normalized", {
    pageType,
    niche,
    title,
    slug,
    generate
  });

  const pool = getPool();
  logPageStep(requestId, "db.pool.ready");
  const client = await pool.connect();
  logPageStep(requestId, "db.client.connected");
  const { enabled: screenshotEnabled } = getScreenshotConfig();
  const publicBaseUrl = getPublicBaseUrl();

  const slugCheck = await client.query(
    `select id, page_type from site_pages where slug = $1 limit 1`,
    [slug]
  );
  if (slugCheck.rows[0]) {
    logPageStep(requestId, "slug.conflict", { slug, pageType: slugCheck.rows[0].page_type });
    client.release();
    return NextResponse.json(
      { ok: false, message: "Страница с таким slug уже существует." },
      { status: 409 }
    );
  }

  await client.query("begin");
  logPageStep(requestId, "db.tx.begin");
  try {
    let metaDescription = "";
    let pageTitle = title;
    let blocks: Array<{
      block_type: string;
      content: Record<string, unknown>;
      sort_order: number;
    }> = [];
    let generationStatus: PageGenerationStatus = "ready";
    let published = true;

    if (pageType === "industry" && generate) {
      if (!niche) {
        await client.query("rollback");
        client.release();
        logPageStep(requestId, "validation.failed", { reason: "empty_niche" });
        return NextResponse.json(
          { ok: false, message: "Укажите нишу." },
          { status: 400 }
        );
      }
      generationStatus = "pending";
      published = false;
      logPageStep(requestId, "generate.industry.queued", { niche });
    }

    logPageStep(requestId, "db.page.insert.start");
    const pageResult = await client.query(
      `insert into site_pages (title, slug, page_type, niche, meta_description, published, generation_status)
       values ($1, $2, $3, $4, $5, $6, $7)
       returning id`,
      [
        pageTitle,
        slug,
        pageType,
        niche || null,
        metaDescription || null,
        published,
        generationStatus
      ]
    );

    const pageId = pageResult.rows[0]?.id as string;
    logPageStep(requestId, "db.page.insert.done", { pageId });

    if (blocks.length > 0) {
      logPageStep(requestId, "db.blocks.insert.start", { count: blocks.length });
      const insertValues = blocks
        .map(
          (_, index) =>
            `($1, $${index * 3 + 2}, $${index * 3 + 3}, $${index * 3 + 4})`
        )
        .join(", ");
      const params: Array<unknown> = [pageId];
      blocks.forEach((block) => {
        params.push(block.block_type, block.content, block.sort_order);
      });
      await client.query(
        `insert into site_blocks (page_id, block_type, content, sort_order)
         values ${insertValues}`,
        params
      );
      logPageStep(requestId, "db.blocks.insert.done", { count: blocks.length });
    }

    logPageStep(requestId, "audit.log.start");
    await logAudit({
      action: generationStatus === "pending" ? "page_create_pending" : "page_create",
      entityType: "site_page",
      entityId: pageId,
      payload: { pageType, slug, niche, requestId, generationStatus }
    });
    logPageStep(requestId, "audit.log.done");

    await client.query("commit");
    client.release();
    logPageStep(requestId, "db.tx.commit");

    if (generationStatus === "pending") {
      void processIndustryPageGeneration({
        requestId,
        pageId,
        slug,
        niche,
        pageType,
        publicBaseUrl,
        screenshotEnabled
      });
      logPageStep(requestId, "request.success", { pageId, slug, generationStatus });
      return NextResponse.json({ ok: true, id: pageId, slug, requestId, generationStatus });
    }

    if (screenshotEnabled && publicBaseUrl) {
      try {
        const pageUrl =
          pageType === "home"
            ? `${publicBaseUrl.replace(/\/$/, "")}/`
            : pageType === "industry"
              ? `${publicBaseUrl.replace(/\/$/, "")}/industry/${slug}`
              : `${publicBaseUrl.replace(/\/$/, "")}/p/${slug}`;
        logPageStep(requestId, "screenshot.start", { pageUrl });
        const screenshot = await captureScreenshot(pageUrl);
        logPageStep(requestId, "screenshot.captured", { size: screenshot.length });
        const uploaded = await uploadScreenshotVariants(screenshot, pageId);
        logPageStep(requestId, "screenshot.uploaded", uploaded);
        await pool.query(
          `update site_pages
           set screenshot_avif_url = $2,
               screenshot_webp_url = $3,
               screenshot_jpg_url = $4,
               updated_at = now()
           where id = $1`,
          [pageId, uploaded.avifUrl, uploaded.webpUrl, uploaded.jpgUrl]
        );
        logPageStep(requestId, "screenshot.saved");
      } catch (error) {
        logPageError(requestId, "screenshot.failed", error);
      }
    }

    logPageStep(requestId, "request.success", { pageId, slug, generationStatus });
    return NextResponse.json({ ok: true, id: pageId, slug, requestId, generationStatus });
  } catch (error) {
    try {
      await client.query("rollback");
    } finally {
      client.release();
    }
    logPageError(requestId, "request.failed", error);
    await logAuditFailure({
      action: "page_create_failed",
      payload: { pageType, slug, niche, requestId, error: formatError(error) }
    });
    return NextResponse.json(
      { ok: false, message: "Не удалось создать страницу.", requestId },
      { status: 500 }
    );
  }
}

function logPageStep(
  requestId: string,
  step: string,
  meta?: Record<string, unknown>
) {
  const prefix = `[pages] [${requestId}] ${step}`;
  if (!meta) {
    console.log(prefix);
    return;
  }
  console.log(prefix, meta);
}

function logPageError(requestId: string, step: string, error: unknown) {
  const details = formatError(error);
  console.error(`[pages] [${requestId}] ${step}`, details);
}

function summarizeIndustryDraft(draft: {
  hero?: { title?: string; subtitle?: string };
  pain_points?: Array<unknown>;
  process_breakdown?: { old_way?: Array<unknown>; new_way_ai?: Array<unknown> };
  comparison_table?: Array<unknown>;
  software_stack?: Array<unknown>;
  case_study?: { title?: string };
  meta_description?: string;
}) {
  return {
    heroTitle: draft.hero?.title ?? "",
    heroSubtitleLength: draft.hero?.subtitle?.length ?? 0,
    painPointsCount: draft.pain_points?.length ?? 0,
    oldWayCount: draft.process_breakdown?.old_way?.length ?? 0,
    newWayCount: draft.process_breakdown?.new_way_ai?.length ?? 0,
    comparisonCount: draft.comparison_table?.length ?? 0,
    softwareCount: draft.software_stack?.length ?? 0,
    caseTitle: draft.case_study?.title ?? "",
    metaDescriptionLength: draft.meta_description?.length ?? 0
  };
}

function formatError(error: unknown) {
  if (error instanceof Error) {
    return { message: error.message, stack: error.stack };
  }
  return { message: String(error) };
}

async function logAuditFailure(params: { action: string; payload: Record<string, unknown> }) {
  try {
    await logAudit({
      action: params.action,
      entityType: "site_page",
      payload: params.payload
    });
  } catch (error) {
    console.error("[pages] audit log failed", formatError(error));
  }
}

async function processIndustryPageGeneration(params: {
  requestId: string;
  pageId: string;
  slug: string;
  niche: string;
  pageType: string;
  publicBaseUrl: string;
  screenshotEnabled: boolean;
}) {
  const { requestId, pageId, slug, niche, pageType, publicBaseUrl, screenshotEnabled } = params;
  const pool = getPool();
  const client = await pool.connect();
  logPageStep(requestId, "generate.worker.start", { pageId });
  let transactionStarted = false;
  try {
    const draft = await generateIndustryPageMAS(niche);
    logPageStep(requestId, "generate.industry.draft_ready", summarizeIndustryDraft(draft));
    const imageData = await buildImageData({
      requestId,
      niche,
      imagePrompt: draft.image_prompt
    });
    const blocks = buildIndustryBlocks({ ...draft, image: imageData });
    logPageStep(requestId, "blocks.built", { count: blocks.length });

    await client.query("begin");
    transactionStarted = true;
    await client.query(
      `update site_pages
       set title = $2,
           meta_description = $3,
           published = true,
           generation_status = 'ready',
           generation_error = null,
           generation_started_at = coalesce(generation_started_at, now()),
           generation_finished_at = now(),
           updated_at = now()
       where id = $1`,
      [pageId, draft.hero.title, draft.meta_description ?? null]
    );
    await client.query(`delete from site_blocks where page_id = $1`, [pageId]);
    if (blocks.length > 0) {
      const insertValues = blocks
        .map(
          (_, index) =>
            `($1, $${index * 3 + 2}, $${index * 3 + 3}, $${index * 3 + 4})`
        )
        .join(", ");
      const params: Array<unknown> = [pageId];
      blocks.forEach((block) => {
        params.push(block.block_type, block.content, block.sort_order);
      });
      await client.query(
        `insert into site_blocks (page_id, block_type, content, sort_order)
         values ${insertValues}`,
        params
      );
    }
    await client.query("commit");
    transactionStarted = false;
    logPageStep(requestId, "generate.worker.saved", { pageId });
  } catch (error) {
    if (transactionStarted) {
      await client.query("rollback");
    }
    logPageError(requestId, "generate.worker.failed", error);
    await pool.query(
      `update site_pages
       set generation_status = 'failed',
           generation_error = $2,
           generation_started_at = coalesce(generation_started_at, now()),
           generation_finished_at = now(),
           updated_at = now()
       where id = $1`,
      [pageId, formatError(error).message]
    );
    return;
  } finally {
    client.release();
  }

  if (screenshotEnabled && publicBaseUrl) {
    try {
      const pageUrl =
        pageType === "home"
          ? `${publicBaseUrl.replace(/\/$/, "")}/`
          : pageType === "industry"
            ? `${publicBaseUrl.replace(/\/$/, "")}/industry/${slug}`
            : `${publicBaseUrl.replace(/\/$/, "")}/p/${slug}`;
      logPageStep(requestId, "screenshot.start", { pageUrl });
      const screenshot = await captureScreenshot(pageUrl);
      logPageStep(requestId, "screenshot.captured", { size: screenshot.length });
      const uploaded = await uploadScreenshotVariants(screenshot, pageId);
      logPageStep(requestId, "screenshot.uploaded", uploaded);
      await pool.query(
        `update site_pages
         set screenshot_avif_url = $2,
             screenshot_webp_url = $3,
             screenshot_jpg_url = $4,
             updated_at = now()
         where id = $1`,
        [pageId, uploaded.avifUrl, uploaded.webpUrl, uploaded.jpgUrl]
      );
      logPageStep(requestId, "screenshot.saved");
    } catch (error) {
      logPageError(requestId, "screenshot.failed", error);
    }
  }
}

async function buildImageData(params: {
  requestId: string;
  niche: string;
  imagePrompt?: string;
}): Promise<
  | {
      prompt?: string;
      avifUrl?: string;
      webpUrl?: string;
      jpgUrl?: string;
    }
  | undefined
> {
  const { requestId, niche, imagePrompt } = params;
  try {
    logPageStep(requestId, "image.generate.start");
    const safePrompt =
      (typeof imagePrompt === "string" && imagePrompt.trim()) ||
      (imagePrompt ? JSON.stringify(imagePrompt) : "") ||
      `Инфографика для ниши: ${niche}. Тема: автоматизация процессов, рост эффективности, AI-помощники, строгий бизнес-стиль, темный фон, акцентные синие/фиолетовые цвета.`;
    logPageStep(requestId, "image.generate.prompt_ready", {
      promptLength: safePrompt.length
    });
    const generated = await generateImage(safePrompt);
    logPageStep(requestId, "image.generate.done", {
      contentType: generated.contentType,
      size: generated.buffer.length
    });
    const uploaded = await uploadImageVariants(generated.buffer);
    logPageStep(requestId, "image.upload.done", uploaded);
    return {
      prompt: safePrompt,
      avifUrl: uploaded.avifUrl,
      webpUrl: uploaded.webpUrl,
      jpgUrl: uploaded.jpgUrl
    };
  } catch (error) {
    logPageError(requestId, "image.generate.failed", error);
    return undefined;
  }
}
