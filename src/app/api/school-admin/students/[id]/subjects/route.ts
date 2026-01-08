import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get("class_id");

    if (!id || !classId) {
      return NextResponse.json(
        { ok: false, message: "Student id and class id are required." },
        { status: 400 }
      );
    }

    const { rows } = await pool.query(
      `SELECT scs.id as assignment_id, s.id, s.name, s.code, s.category
       FROM student_class_subjects scs
       JOIN subjects s ON s.id = scs.subject_id
       WHERE scs.student_id = $1 AND scs.class_id = $2 AND scs.status = 'active'
       ORDER BY s.name ASC`,
      [id, classId]
    );

    return NextResponse.json({ ok: true, subjects: rows });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: "Unable to fetch subjects." },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const classId = String(body?.class_id ?? "").trim();
    const subjectId = String(body?.subject_id ?? "").trim();
    const addedBy = body?.added_by ? String(body.added_by) : null;

    if (!id || !classId || !subjectId) {
      return NextResponse.json(
        { ok: false, message: "Student id, class id, and subject id are required." },
        { status: 400 }
      );
    }

    await pool.query(
      `INSERT INTO student_class_subjects (student_id, class_id, subject_id, status, added_by, date_added)
       VALUES ($1, $2, $3, 'active', $4, NOW())
       ON CONFLICT (student_id, class_id, subject_id)
       DO UPDATE SET status = 'active', added_by = EXCLUDED.added_by, date_added = NOW(), removed_by = NULL, date_removed = NULL`,
      [id, classId, subjectId, addedBy]
    );

    return NextResponse.json({ ok: true, message: "Subject assigned." });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: "Unable to assign subject." },
      { status: 500 }
    );
  }
}
