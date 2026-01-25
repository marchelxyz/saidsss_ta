import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { isAdminSession } from "@/lib/admin";
import { uploadCaseImage } from "@/lib/images";

type UploadedImage = {
  id: string;
  image_url: string;
  sort_order: number;
};

export async function GET(request: Request, context: { params: { id: string } }) {
  if (!isAdminSession(request.headers.get("cookie"))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const pool = getPool();
  const result = await pool.query(
    `select id, image_url, sort_order
     from case_images
     where case_id = $1
     order by sort_order asc, created_at asc`,
    [context.params.id]
  );

  return NextResponse.json({ ok: true, items: result.rows });
}

export async function POST(request: Request, context: { params: { id: string } }) {
  if (!isAdminSession(request.headers.get("cookie"))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const form = await request.formData();
  const files = form.getAll("files").filter((item): item is File => item instanceof File);
  if (!files.length) {
    return NextResponse.json({ ok: false, message: "Файлы не найдены." }, { status: 400 });
  }

  const pool = getPool();
  const exists = await pool.query(`select 1 from cases where id = $1`, [context.params.id]);
  if (!exists.rows[0]) {
    return NextResponse.json({ ok: false, message: "Кейс не найден." }, { status: 404 });
  }

  const orderResult = await pool.query(
    `select coalesce(max(sort_order), 0) as last_order from case_images where case_id = $1`,
    [context.params.id]
  );
  const baseOrder = Number(orderResult.rows[0]?.last_order ?? 0);
  const uploaded: UploadedImage[] = [];

  for (let i = 0; i < files.length; i += 1) {
    const file = files[i];
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const url = await uploadCaseImage(buffer, file.name, file.type || "image/jpeg", context.params.id);
    const sortOrder = baseOrder + i + 1;
    const insert = await pool.query(
      `insert into case_images (case_id, image_url, sort_order)
       values ($1, $2, $3)
       returning id`,
      [context.params.id, url, sortOrder]
    );
    uploaded.push({
      id: insert.rows[0]?.id,
      image_url: url,
      sort_order: sortOrder
    });
  }

  return NextResponse.json({ ok: true, items: uploaded });
}
