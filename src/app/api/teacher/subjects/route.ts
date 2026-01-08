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

    const { rows } = await pool.query(
      `SELECT DISTINCT s.id, s.name, s.code, s.category
       FROM teacher_class_subjects tcs
       JOIN subjects s ON s.id = tcs.subject_id
       WHERE tcs.user_id = $1 AND tcs.status = 'active'
       ORDER BY s.name ASC`,
      [userId]
    );

    return NextResponse.json({ ok: true, subjects: rows });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: "Unable to fetch subjects." },
      { status: 500 }
    );
  }
}
