import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { requireAuthUser, requireRole } from "@/lib/authorization";

export async function GET(request: Request) {
  try {
    const { user, response } = await requireAuthUser(request);
    if (!user) {
      return response;
    }
    const roleCheck = requireRole(user, ["admin", "teacher"]);
    if (roleCheck) {
      return roleCheck;
    }

    const { rows } = await pool.query(
      `SELECT id, name, code, category, status
       FROM subjects
       WHERE status = 'active'
       ORDER BY name ASC`
    );
    return NextResponse.json({ ok: true, subjects: rows });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: "Unable to fetch subjects." },
      { status: 500 }
    );
  }
}
