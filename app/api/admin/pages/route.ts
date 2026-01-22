import { NextResponse } from "next/server";
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
            p.published,
            count(l.id)::int as leads_count
     from site_pages p
     left join leads l on l.source_page = p.slug
     group by p.id
     order by p.created_at desc`
  );

  return NextResponse.json({ ok: true, pages: result.rows });
}

export async function POST(request: Request) {
  let body: PageCreatePayload | null = null;
  try {
    body = (await request.json()) as PageCreatePayload;
  } catch {
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

  const pool = getPool();
  const { enabled: screenshotEnabled } = getScreenshotConfig();
  const publicBaseUrl = getPublicBaseUrl();

  await pool.query("begin");
  try {
    let metaDescription = "";
    let pageTitle = title;
    let blocks: Array<{
      block_type: string;
      content: Record<string, unknown>;
      sort_order: number;
    }> = [];

    if (pageType === "industry" && generate) {
      if (!niche) {
        await pool.query("rollback");
        return NextResponse.json(
          { ok: false, message: "Укажите нишу." },
          { status: 400 }
        );
      }
      console.log(`[pages] generate industry niche="${niche}"`);
      const draft = await generateIndustryPageMAS(niche);
      let imageData:
        | {
            prompt?: string;
            avifUrl?: string;
            webpUrl?: string;
            jpgUrl?: string;
          }
        | undefined;
      try {
        console.log("[pages] generating image");
        const rawPrompt = draft.image_prompt;
        const imagePrompt =
          (typeof rawPrompt === "string" && rawPrompt.trim()) ||
          (rawPrompt ? JSON.stringify(rawPrompt) : "") ||
          `Инфографика для ниши: ${niche}. Тема: автоматизация процессов, рост эффективности, AI-помощники, строгий бизнес-стиль, темный фон, акцентные синие/фиолетовые цвета.`;
        const generated = await generateImage(imagePrompt);
        const uploaded = await uploadImageVariants(generated.buffer);
        imageData = {
          prompt: imagePrompt,
          avifUrl: uploaded.avifUrl,
          webpUrl: uploaded.webpUrl,
          jpgUrl: uploaded.jpgUrl
        };
        console.log("[pages] image uploaded");
      } catch (error) {
        console.log("[pages] image generation failed", error);
        imageData = undefined;
      }
      pageTitle = draft.hero.title;
      metaDescription = draft.meta_description;
      blocks = buildIndustryBlocks({ ...draft, image: imageData });
    }

    const pageResult = await pool.query(
      `insert into site_pages (title, slug, page_type, niche, meta_description, published)
       values ($1, $2, $3, $4, $5, true)
       returning id`,
      [pageTitle, slug, pageType, niche || null, metaDescription || null]
    );

    const pageId = pageResult.rows[0]?.id as string;

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
      await pool.query(
        `insert into site_blocks (page_id, block_type, content, sort_order)
         values ${insertValues}`,
        params
      );
    }

    await logAudit({
      action: "page_create",
      entityType: "site_page",
      entityId: pageId,
      payload: { pageType, slug, niche }
    });

    await pool.query("commit");

    if (screenshotEnabled && publicBaseUrl) {
      try {
        const pageUrl =
          pageType === "home"
            ? `${publicBaseUrl.replace(/\/$/, "")}/`
            : pageType === "industry"
              ? `${publicBaseUrl.replace(/\/$/, "")}/industry/${slug}`
              : `${publicBaseUrl.replace(/\/$/, "")}/p/${slug}`;
        console.log(`[pages] screenshot start ${pageUrl}`);
        const screenshot = await captureScreenshot(pageUrl);
        const uploaded = await uploadScreenshotVariants(screenshot, pageId);
        await pool.query(
          `update site_pages
           set screenshot_avif_url = $2,
               screenshot_webp_url = $3,
               screenshot_jpg_url = $4,
               updated_at = now()
           where id = $1`,
          [pageId, uploaded.avifUrl, uploaded.webpUrl, uploaded.jpgUrl]
        );
        console.log("[pages] screenshot saved");
      } catch (error) {
        console.log("[pages] screenshot failed", error);
      }
    }

    return NextResponse.json({ ok: true, id: pageId, slug });
  } catch (error) {
    await pool.query("rollback");
    return NextResponse.json(
      { ok: false, message: "Не удалось создать страницу." },
      { status: 500 }
    );
  }
}
