import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { requireAuthUser, requireSchoolAdmin } from "@/lib/authorization";

export async function GET(request: Request) {
  try {
    const { user, response } = await requireAuthUser(request);
    if (!user) {
      return response;
    }
    const adminCheck = await requireSchoolAdmin(user.id);
    if (adminCheck) {
      return adminCheck;
    }

    const adminResult = await pool.query<{ school: string | null }>(
      "SELECT school FROM users WHERE id = $1 LIMIT 1",
      [user.id]
    );
    const school = adminResult.rows[0]?.school;

    if (!school) {
      return NextResponse.json(
        { ok: false, message: "School not found for this user." },
        { status: 400 }
      );
    }

    const { rows } = await pool.query(
      `SELECT id, account_id, full_name, email, status
       FROM users
       WHERE user_role = 'teacher' AND school = $1
       ORDER BY full_name ASC NULLS LAST`,
      [school]
    );

    return NextResponse.json({ ok: true, teachers: rows, school });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: "Unable to fetch teachers." },
      { status: 500 }
    );
  }
}
