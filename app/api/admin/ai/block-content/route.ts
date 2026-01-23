import { NextResponse } from "next/server";
import { isAdminSession } from "@/lib/admin";
import { generateBlockContent } from "@/lib/ai";

type BlockContentPayload = {
  blockType?: string;
  pageTitle?: string;
  niche?: string | null;
  content?: Record<string, unknown>;
};

export async function POST(request: Request) {
  if (!isAdminSession(request.headers.get("cookie"))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as BlockContentPayload;
  const blockType = body.blockType?.trim() ?? "";
  if (!blockType) {
    return NextResponse.json(
      { ok: false, message: "Не указан тип блока." },
      { status: 400 }
    );
  }

  try {
    const content = await generateBlockContent({
      blockType,
      pageTitle: body.pageTitle,
      niche: body.niche,
      content: body.content ?? {}
    });
    return NextResponse.json({ ok: true, content });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "AI ошибка" },
      { status: 500 }
    );
  }
}
