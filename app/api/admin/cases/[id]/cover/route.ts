import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { isAdminSession } from "@/lib/admin";
import { uploadCaseCover } from "@/lib/images";

export async function POST(request: Request, context: { params: { id: string } }) {
  if (!isAdminSession(request.headers.get("cookie"))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, message: "Файл не найден." }, { status: 400 });
  }

  const pool = getPool();
  const exists = await pool.query(`select 1 from cases where id = $1`, [context.params.id]);
  if (!exists.rows[0]) {
    return NextResponse.json({ ok: false, message: "Кейс не найден." }, { status: 404 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const url = await uploadCaseCover(
    buffer,
    file.name,
    file.type || "image/jpeg",
    context.params.id
  );

  await pool.query(`update cases set cover_url = $1, updated_at = now() where id = $2`, [
    url,
    context.params.id
  ]);

  return NextResponse.json({ ok: true, url });
}
