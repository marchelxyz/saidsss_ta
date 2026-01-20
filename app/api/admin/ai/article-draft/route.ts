import { NextResponse } from "next/server";
import { draftArticle } from "@/lib/ai";
import { isAdminSession } from "@/lib/admin";

export async function POST(request: Request) {
  if (!isAdminSession(request.headers.get("cookie"))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    topic?: string;
    audience?: string;
    goal?: string;
    tone?: string;
  };

  if (!body.topic) {
    return NextResponse.json(
      { ok: false, message: "Укажите тему статьи." },
      { status: 400 }
    );
  }

  try {
    const draft = await draftArticle({
      topic: body.topic,
      audience: body.audience,
      goal: body.goal,
      tone: body.tone
    });

    return NextResponse.json({ ok: true, draft });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "AI ошибка" },
      { status: 500 }
    );
  }
}
