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
    if (!id) {
      return NextResponse.json(
        { ok: false, message: "Teacher id is required." },
        { status: 400 }
      );
    }

    const adminSchoolResult = await pool.query<{ school: string | null }>(
      "SELECT school FROM users WHERE id = $1 LIMIT 1",
      [user.id]
    );
    const adminSchool = adminSchoolResult.rows[0]?.school;

    const teacherResult = await pool.query(
      `SELECT id, account_id, full_name, email, status, school
       FROM users
       WHERE id = $1 AND user_role = 'teacher'
       LIMIT 1`,
      [id]
    );
    const teacher = teacherResult.rows[0];

    if (!teacher || (adminSchool && teacher.school !== adminSchool)) {
      return NextResponse.json(
        { ok: false, message: "Teacher not found." },
        { status: 404 }
      );
    }

    const classesResult = await pool.query(
      `SELECT
         ft.id as assignment_id,
         ft.class_group,
         ft.school_session,
         c.id,
         c.name,
         c.code,
         c.category,
         ft.status,
         ft.date_assigned
       FROM form_teachers ft
       JOIN classes c ON c.id = ft.class_id
       WHERE ft.teacher_id = $1 AND ft.status = 'active'
       ORDER BY c.name ASC`,
      [id]
    );

    return NextResponse.json({
      ok: true,
      teacher,
      classes: classesResult.rows,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: "Unable to load form teacher details." },
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
    const classGroup = String(body?.class_group ?? "").trim().toUpperCase();
    const schoolSession = String(body?.school_session ?? "").trim();

    if (!id || !classId || !classGroup || !schoolSession) {
      return NextResponse.json(
        {
          ok: false,
          message: "Teacher id, class id, class group, and school session are required.",
        },
        { status: 400 }
      );
    }

    const adminSchoolResult = await pool.query<{ school: string | null }>(
      "SELECT school FROM users WHERE id = $1 LIMIT 1",
      [user.id]
    );
    const adminSchool = adminSchoolResult.rows[0]?.school;
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
      `UPDATE form_teachers
       SET status = 'inactive',
           removed_by = $2,
           date_removed = NOW()
       WHERE class_id = $1 AND status = 'active'`,
      [classId, user.id]
    );

    await pool.query(
      `INSERT INTO form_teachers (teacher_id, class_id, class_group, school_session, status, assigned_by, date_assigned)
       VALUES ($1, $2, $3, $4, 'active', $5, NOW())`,
      [id, classId, classGroup, schoolSession, user.id]
    );

    return NextResponse.json({ ok: true, message: "Form teacher assigned." });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: "Unable to assign form teacher." },
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

    if (!id || !assignmentId) {
      return NextResponse.json(
        { ok: false, message: "Teacher id and assignment id are required." },
        { status: 400 }
      );
    }

    const adminSchoolResult = await pool.query<{ school: string | null }>(
      "SELECT school FROM users WHERE id = $1 LIMIT 1",
      [user.id]
    );
    const adminSchool = adminSchoolResult.rows[0]?.school;
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
      `UPDATE form_teachers
       SET status = 'inactive',
           removed_by = $3,
           date_removed = NOW()
       WHERE id = $1 AND teacher_id = $2`,
      [assignmentId, id, user.id]
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
