import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");
    const subjectId = searchParams.get("subject_id");

    if (!userId || !subjectId) {
      return NextResponse.json(
        { ok: false, message: "User id and subject id are required." },
        { status: 400 }
      );
    }

    const { rows } = await pool.query(
      `SELECT DISTINCT c.id, c.name, c.code, c.category
       FROM teacher_class_subjects tcs
       JOIN classes c ON c.id = tcs.class_id
       WHERE tcs.user_id = $1 AND tcs.subject_id = $2 AND tcs.status = 'active'
       ORDER BY c.name ASC`,
      [userId, subjectId]
    );

    return NextResponse.json({ ok: true, classes: rows });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: "Unable to fetch classes." },
      { status: 500 }
    );
  }
}
