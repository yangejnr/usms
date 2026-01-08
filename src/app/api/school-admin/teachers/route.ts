import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");

    if (!userId) {
      return NextResponse.json(
        { ok: false, message: "User id is required." },
        { status: 400 }
      );
    }

    const adminResult = await pool.query<{ school: string | null }>(
      "SELECT school FROM users WHERE id = $1 LIMIT 1",
      [userId]
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
