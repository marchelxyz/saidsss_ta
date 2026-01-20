import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";

type LeadPayload = {
  name?: string;
  phone?: string;
  email?: string;
  company?: string;
  role?: string;
  summary?: string;
  message?: string;
  budget?: string;
  timeline?: string;
};

export async function POST(request: Request) {
  let body: LeadPayload | null = null;

  try {
    body = (await request.json()) as LeadPayload;
  } catch {
    return NextResponse.json(
      { ok: false, message: "Неверный формат запроса." },
      { status: 400 }
    );
  }

  const name = body?.name?.trim() ?? "";
  const phone = body?.phone?.trim() ?? "";
  const email = body?.email?.trim() ?? "";
  const company = body?.company?.trim() ?? "";
  const role = body?.role?.trim() ?? "";
  const summary = body?.summary?.trim() ?? "";
  const message = body?.message?.trim() ?? "";
  const budget = body?.budget?.trim() ?? "";
  const timeline = body?.timeline?.trim() ?? "";

  if (!name || !phone) {
    return NextResponse.json(
      { ok: false, message: "Укажите имя и телефон." },
      { status: 400 }
    );
  }

  const pool = getPool();

  await pool.query(
    `insert into leads (name, phone, email, company, role, summary, message, budget, timeline)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [name, phone, email, company, role, summary, message, budget, timeline]
  );

  return NextResponse.json({ ok: true });
}
