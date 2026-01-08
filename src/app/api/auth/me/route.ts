import { NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/lib/auth";

export async function GET(request: Request) {
  const user = await getAuthUserFromRequest(request);
  if (!user) {
    return NextResponse.json(
      { ok: false, message: "Unauthorized." },
      { status: 401 }
    );
  }

  return NextResponse.json({ ok: true, user });
}
