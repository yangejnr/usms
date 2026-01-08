import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get("subject_id");

    if (!subjectId) {
      return NextResponse.json(
        { ok: false, message: "Subject id is required." },
        { status: 400 }
      );
    }

    const { rows } = await pool.query(
      `SELECT DISTINCT s.id, s.student_no, s.surname, s.firstname, s.othername
       FROM student_class_subjects scs
       JOIN students s ON s.id = scs.student_id
       WHERE scs.subject_id = $1 AND scs.status = 'active'
       ORDER BY s.surname ASC, s.firstname ASC`,
      [subjectId]
    );

    return NextResponse.json({ ok: true, students: rows });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: "Unable to fetch students." },
      { status: 500 }
    );
  }
}
