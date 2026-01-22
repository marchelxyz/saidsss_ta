import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { slugify } from "@/lib/slug";
import { draftIndustryPage } from "@/lib/ai";
import { logAudit } from "@/lib/audit";

type PageCreatePayload = {
  title?: string;
  slug?: string;
  pageType?: string;
  niche?: string;
  generate?: boolean;
};

function buildIndustryBlocks(draft: {
  title: string;
  subheadline: string;
  pain_points: string[];
  solution: string;
  metrics: string[];
  automation_example: string;
  why_it_works: string;
  value_props: string[];
  process_steps: string[];
  faq: string[];
  deliverables: string[];
  risks: string[];
}) {
  const valueProps =
    draft.value_props?.length > 0
      ? draft.value_props
      : ["Снижение ФОТ", "Рост скорости обработки", "Контроль качества", "Прозрачные метрики"];
  const processSteps =
    draft.process_steps?.length > 0
      ? draft.process_steps
      : [
          "Аудит всех отделов и потерь",
          "Карта AI-внедрений и ROI",
          "Внедрение и интеграции",
          "Обучение команды"
        ];
  const deliverables =
    draft.deliverables?.length > 0
      ? draft.deliverables
      : ["Отчет аудита", "Карта внедрений", "Запущенные автоматизации", "Инструкции"];
  const risks =
    draft.risks?.length > 0
      ? draft.risks
      : ["Потери на ручных операциях", "Срывы сроков", "Рост затрат"];
  const faq =
    draft.faq?.length > 0
      ? draft.faq
      : ["В: С чего начать? — О: С аудита всех отделов."];

  return [
    {
      block_type: "hero",
      content: {
        title: draft.title,
        subtitle: draft.subheadline,
        button_text: "Получить аудит",
        button_link: "#contact"
      },
      sort_order: 0
    },
    {
      block_type: "list",
      content: {
        title: "Боли отрасли",
        items: draft.pain_points
      },
      sort_order: 1
    },
    {
      block_type: "list",
      content: {
        title: "Что вы получите",
        items: deliverables
      },
      sort_order: 2
    },
    {
      block_type: "text",
      content: {
        title: "Решение TeleAgent",
        text: draft.solution
      },
      sort_order: 3
    },
    {
      block_type: "list",
      content: {
        title: "Преимущества",
        items: valueProps
      },
      sort_order: 4
    },
    {
      block_type: "text",
      content: {
        title: "Пример автоматизации",
        text: draft.automation_example
      },
      sort_order: 5
    },
    {
      block_type: "text",
      content: {
        title: "Почему это сработает",
        text: draft.why_it_works
      },
      sort_order: 6
    },
    {
      block_type: "list",
      content: {
        title: "Метрики и эффект",
        items: draft.metrics
      },
      sort_order: 7
    },
    {
      block_type: "list",
      content: {
        title: "Этапы внедрения",
        items: processSteps
      },
      sort_order: 8
    },
    {
      block_type: "list",
      content: {
        title: "Риски без внедрения",
        items: risks
      },
      sort_order: 9
    },
    {
      block_type: "text",
      content: {
        title: "FAQ",
        text: faq.join("\n")
      },
      sort_order: 10
    },
    {
      block_type: "contact",
      content: {
        title: "Обсудим внедрение",
        subtitle: "Оставьте контакты — вернемся с планом аудита."
      },
      sort_order: 11
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
      const draft = await draftIndustryPage(niche);
      pageTitle = draft.title;
      metaDescription = draft.meta_description;
      blocks = buildIndustryBlocks(draft);
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
    return NextResponse.json({ ok: true, id: pageId, slug });
  } catch (error) {
    await pool.query("rollback");
    return NextResponse.json(
      { ok: false, message: "Не удалось создать страницу." },
      { status: 500 }
    );
  }
}
