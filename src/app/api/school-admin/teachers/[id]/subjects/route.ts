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
        { ok: false, message: "Teacher id and class id are required." },
        { status: 400 }
      );
    }

    const schoolResult = await pool.query<{ school: string | null }>(
      "SELECT school FROM users WHERE id = $1 LIMIT 1",
      [user.id]
    );
    const adminSchool = schoolResult.rows[0]?.school;
    const teacherSchoolResult = await pool.query<{ school: string | null }>(
      "SELECT school FROM users WHERE id = $1 LIMIT 1",
      [id]
    );
    const teacherSchool = teacherSchoolResult.rows[0]?.school;
    if (adminSchool && teacherSchool !== adminSchool) {
      return NextResponse.json(
        { ok: false, message: "Forbidden." },
        { status: 403 }
      );
    }

    const { rows } = await pool.query(
      `SELECT ts.id as assignment_id, s.id, s.name, s.code, s.category
       FROM teacher_class_subjects ts
       JOIN subjects s ON s.id = ts.subject_id
       WHERE ts.user_id = $1 AND ts.class_id = $2 AND ts.status = 'active'
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
        { ok: false, message: "Teacher id, class id, and subject id are required." },
        { status: 400 }
      );
    }

    const schoolResult = await pool.query<{ school: string | null }>(
      "SELECT school FROM users WHERE id = $1 LIMIT 1",
      [user.id]
    );
    const adminSchool = schoolResult.rows[0]?.school;
    const teacherSchoolResult = await pool.query<{ school: string | null }>(
      "SELECT school FROM users WHERE id = $1 LIMIT 1",
      [id]
    );
    const teacherSchool = teacherSchoolResult.rows[0]?.school;
    if (adminSchool && teacherSchool !== adminSchool) {
      return NextResponse.json(
        { ok: false, message: "Forbidden." },
        { status: 403 }
      );
    }

    await pool.query(
      `INSERT INTO teacher_class_subjects (user_id, class_id, subject_id, status, added_by, date_added)
       VALUES ($1, $2, $3, 'active', $4, NOW())
       ON CONFLICT (user_id, class_id, subject_id)
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

export async function PATCH(
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
    const assignmentId = String(body?.assignment_id ?? "").trim();
    const removedBy = user.id;

    if (!id || !assignmentId) {
      return NextResponse.json(
        { ok: false, message: "Teacher id and assignment id are required." },
        { status: 400 }
      );
    }

    const schoolResult = await pool.query<{ school: string | null }>(
      "SELECT school FROM users WHERE id = $1 LIMIT 1",
      [user.id]
    );
    const adminSchool = schoolResult.rows[0]?.school;
    const teacherSchoolResult = await pool.query<{ school: string | null }>(
      "SELECT school FROM users WHERE id = $1 LIMIT 1",
      [id]
    );
    const teacherSchool = teacherSchoolResult.rows[0]?.school;
    if (adminSchool && teacherSchool !== adminSchool) {
      return NextResponse.json(
        { ok: false, message: "Forbidden." },
        { status: 403 }
      );
    }

    const result = await pool.query(
      `UPDATE teacher_class_subjects
       SET status = 'inactive',
           removed_by = $3,
           date_removed = NOW()
       WHERE id = $1 AND user_id = $2`,
      [assignmentId, id, removedBy]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { ok: false, message: "Assignment not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, message: "Assignment removed." });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: "Unable to remove assignment." },
      { status: 500 }
    );
  }
}
