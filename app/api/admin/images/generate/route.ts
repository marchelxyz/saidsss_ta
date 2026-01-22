import { NextResponse } from "next/server";
import { generateImage, uploadImageVariants } from "@/lib/images";

export async function POST(request: Request) {
  let body: { prompt?: string } | null = null;
  try {
    body = (await request.json()) as { prompt?: string };
  } catch {
    return NextResponse.json({ ok: false, message: "Неверный формат." }, { status: 400 });
  }

  const prompt = body?.prompt?.trim();
  if (!prompt) {
    return NextResponse.json({ ok: false, message: "Нужен промпт." }, { status: 400 });
  }

  try {
    const generated = await generateImage(prompt);
    const uploaded = await uploadImageVariants(generated.buffer);
    return NextResponse.json({
      ok: true,
      urls: {
        avif: uploaded.avifUrl,
        webp: uploaded.webpUrl,
        jpg: uploaded.jpgUrl
      }
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: "Не удалось сгенерировать изображение." },
      { status: 500 }
    );
  }
}
