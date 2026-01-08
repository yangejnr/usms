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

    const teacherResult = await pool.query(
      `SELECT id, account_id, full_name, email, status, school
       FROM users
       WHERE id = $1 AND user_role = 'teacher'
       LIMIT 1`,
      [id]
    );
    const teacher = teacherResult.rows[0];

    if (!teacher) {
      return NextResponse.json(
        { ok: false, message: "Teacher not found." },
        { status: 404 }
      );
    }

    const adminSchoolResult = await pool.query<{ school: string | null }>(
      "SELECT school FROM users WHERE id = $1 LIMIT 1",
      [user.id]
    );
    const adminSchool = adminSchoolResult.rows[0]?.school;
    if (adminSchool && teacher.school !== adminSchool) {
      return NextResponse.json(
        { ok: false, message: "Forbidden." },
        { status: 403 }
      );
    }

    const classesResult = await pool.query(
      `SELECT
         tc.id as assignment_id,
         tc.class_group,
         c.id,
         c.name,
         c.code,
         c.category,
         COALESCE(subject_counts.total_subjects, 0) as total_subjects
       FROM teacher_classes tc
       JOIN classes c ON c.id = tc.class_id
       LEFT JOIN (
         SELECT class_id, user_id, COUNT(*)::int AS total_subjects
         FROM teacher_class_subjects
         WHERE status = 'active'
         GROUP BY class_id, user_id
       ) subject_counts
         ON subject_counts.class_id = tc.class_id AND subject_counts.user_id = tc.user_id
       WHERE tc.user_id = $1 AND tc.status = 'active'
       ORDER BY c.name ASC`,
      [id]
    );

    return NextResponse.json({
      ok: true,
      teacher,
      classes: classesResult.rows,
    });
  } catch (error) {
    console.error("Load teacher details failed:", error);
    return NextResponse.json(
      { ok: false, message: "Unable to load teacher details." },
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
    const addedBy = user.id;

    if (!id || !classId || !classGroup) {
      return NextResponse.json(
        { ok: false, message: "Teacher id, class id, and class group are required." },
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
      `INSERT INTO teacher_classes (user_id, class_id, class_group, status, added_by, date_added)
       VALUES ($1, $2, $3, 'active', $4, NOW())`,
      [id, classId, classGroup, addedBy]
    );

    return NextResponse.json({ ok: true, message: "Class assigned." });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: "Unable to assign class." },
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
      `UPDATE teacher_classes
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

    const classResult = await pool.query<{ class_id: string }>(
      "SELECT class_id FROM teacher_classes WHERE id = $1 AND user_id = $2",
      [assignmentId, id]
    );
    const classId = classResult.rows[0]?.class_id;
    if (classId) {
      await pool.query(
        `UPDATE teacher_class_subjects
         SET status = 'inactive',
             removed_by = $3,
             date_removed = NOW()
         WHERE user_id = $1 AND class_id = $2 AND status = 'active'`,
        [id, classId, removedBy]
      );
    }

    return NextResponse.json({ ok: true, message: "Assignment deactivated." });
  } catch (error) {
    console.error("Deactivate class assignment failed:", error);
    return NextResponse.json(
      { ok: false, message: "Unable to deactivate assignment." },
      { status: 500 }
    );
  }
}
