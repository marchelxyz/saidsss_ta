import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { isAdminSession } from "@/lib/admin";
import { logAudit } from "@/lib/audit";

export async function GET(request: Request) {
  if (!isAdminSession(request.headers.get("cookie"))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const pool = getPool();
  const result = await pool.query(
    `select telegram, email, phone, address, company_name, legal_address, inn, ogrn, kpp,
            policy_url, vk_url, telegram_url, youtube_url, instagram_url
     from site_settings where id = 1`
  );

  return NextResponse.json({ ok: true, settings: result.rows[0] ?? {} });
}

export async function PUT(request: Request) {
  if (!isAdminSession(request.headers.get("cookie"))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    telegram?: string;
    email?: string;
    phone?: string;
    address?: string;
    company_name?: string;
    legal_address?: string;
    inn?: string;
    ogrn?: string;
    kpp?: string;
    policy_url?: string;
    vk_url?: string;
    telegram_url?: string;
    youtube_url?: string;
    instagram_url?: string;
  };

  const pool = getPool();
  await pool.query(
    `update site_settings
     set telegram = $1,
         email = $2,
         phone = $3,
         address = $4,
         company_name = $5,
         legal_address = $6,
         inn = $7,
         ogrn = $8,
         kpp = $9,
         policy_url = $10,
         vk_url = $11,
         telegram_url = $12,
         youtube_url = $13,
         instagram_url = $14,
         updated_at = now()
     where id = 1`,
    [
      body.telegram?.trim() ?? null,
      body.email?.trim() ?? null,
      body.phone?.trim() ?? null,
      body.address?.trim() ?? null,
      body.company_name?.trim() ?? null,
      body.legal_address?.trim() ?? null,
      body.inn?.trim() ?? null,
      body.ogrn?.trim() ?? null,
      body.kpp?.trim() ?? null,
      body.policy_url?.trim() ?? null,
      body.vk_url?.trim() ?? null,
      body.telegram_url?.trim() ?? null,
      body.youtube_url?.trim() ?? null,
      body.instagram_url?.trim() ?? null
    ]
  );

  await logAudit({
    action: "settings_update",
    entityType: "site_settings",
    entityId: null
  });

  return NextResponse.json({ ok: true });
}
