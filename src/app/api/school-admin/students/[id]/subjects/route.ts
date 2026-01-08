import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { requireAuthUser, requireSchoolAdmin } from "@/lib/authorization";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, response } = await requireAuthUser(request);
    if (!user) {
      return response;
    }
    const adminCheck = await requireSchoolAdmin(user.id);
    if (adminCheck) {
      return adminCheck;
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get("class_id");

    if (!id || !classId) {
      return NextResponse.json(
        { ok: false, message: "Student id and class id are required." },
        { status: 400 }
      );
    }

    const adminSchoolResult = await pool.query<{ school: string | null }>(
      "SELECT school FROM users WHERE id = $1 LIMIT 1",
      [user.id]
    );
    const adminSchool = adminSchoolResult.rows[0]?.school;
    const studentResult = await pool.query<{ id: string }>(
      "SELECT id FROM students WHERE id = $1 AND school = $2 LIMIT 1",
      [id, adminSchool]
    );
    if (!studentResult.rows.length) {
      return NextResponse.json(
        { ok: false, message: "Student not found." },
        { status: 404 }
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
    const { user, response } = await requireAuthUser(request);
    if (!user) {
      return response;
    }
    const adminCheck = await requireSchoolAdmin(user.id);
    if (adminCheck) {
      return adminCheck;
    }

    const { id } = await params;
    const body = await request.json();
    const classId = String(body?.class_id ?? "").trim();
    const subjectId = String(body?.subject_id ?? "").trim();
    const addedBy = user.id;

    if (!id || !classId || !subjectId) {
      return NextResponse.json(
        { ok: false, message: "Student id, class id, and subject id are required." },
        { status: 400 }
      );
    }

    const adminSchoolResult = await pool.query<{ school: string | null }>(
      "SELECT school FROM users WHERE id = $1 LIMIT 1",
      [user.id]
    );
    const adminSchool = adminSchoolResult.rows[0]?.school;
    const studentResult = await pool.query<{ id: string }>(
      "SELECT id FROM students WHERE id = $1 AND school = $2 LIMIT 1",
      [id, adminSchool]
    );
    if (!studentResult.rows.length) {
      return NextResponse.json(
        { ok: false, message: "Student not found." },
        { status: 404 }
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
