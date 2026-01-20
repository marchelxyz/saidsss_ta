import { NextResponse } from "next/server";
import { getAdminPassword, getAdminToken } from "@/lib/env";

export async function POST(request: Request) {
  const { password } = (await request.json().catch(() => ({}))) as {
    password?: string;
  };

  const expected = getAdminPassword();
  if (!expected || password !== expected) {
    return NextResponse.json(
      { ok: false, message: "Неверный пароль." },
      { status: 401 }
    );
  }

  const token = getAdminToken();
  const response = NextResponse.json({ ok: true });
  response.cookies.set("admin_session", token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/"
  });

  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set("admin_session", "", {
    httpOnly: true,
    expires: new Date(0),
    path: "/"
  });
  return response;
}
