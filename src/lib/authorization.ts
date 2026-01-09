import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { AuthUser, getAuthCookieName, getAuthUserFromRequest } from "@/lib/auth";

export async function requireAuthUser(request: Request) {
  const user = await getAuthUserFromRequest(request);
  if (!user) {
    const response = NextResponse.json(
      { ok: false, message: "Unauthorized." },
      { status: 401 }
    );
    response.cookies.set(getAuthCookieName(), "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    return { user: null, response };
  }
  return { user, response: null };
}

export function requireRole(user: AuthUser, roles: string[]) {
  if (!user.user_role || !roles.includes(user.user_role)) {
    return NextResponse.json(
      { ok: false, message: "Forbidden." },
      { status: 403 }
    );
  }
  return null;
}

export async function requireSchoolAdmin(userId: string) {
  const { rows } = await pool.query<{ id: string }>(
    `SELECT id
     FROM school_admins
     WHERE user_id = $1 AND status = 'active'
     LIMIT 1`,
    [userId]
  );
  if (!rows.length) {
    return NextResponse.json(
      { ok: false, message: "Forbidden." },
      { status: 403 }
    );
  }
  return null;
}
