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
        { ok: false, message: "Student id is required." },
        { status: 400 }
      );
    }

    const adminSchoolResult = await pool.query<{ school: string | null }>(
      "SELECT school FROM users WHERE id = $1 LIMIT 1",
      [user.id]
    );
    const adminSchool = adminSchoolResult.rows[0]?.school;

    const studentResult = await pool.query(
      `SELECT id, student_no, surname, firstname, othername, gender, school
       FROM students
       WHERE id = $1 AND school = $2
       LIMIT 1`,
      [id, adminSchool]
    );
    const student = studentResult.rows[0];

    if (!student) {
      return NextResponse.json(
        { ok: false, message: "Student not found." },
        { status: 404 }
      );
    }

    const classResult = await pool.query(
      `SELECT c.id, c.name, c.code, c.category
       FROM student_classes sc
       JOIN classes c ON c.id = sc.class_id
       WHERE sc.student_id = $1 AND sc.status = 'active'
       LIMIT 1`,
      [id]
    );

    const subjectsResult = await pool.query(
      `SELECT s.id, s.name, s.code, s.category
       FROM student_class_subjects scs
       JOIN subjects s ON s.id = scs.subject_id
       WHERE scs.student_id = $1 AND scs.status = 'active'
       ORDER BY s.name ASC`,
      [id]
    );

    return NextResponse.json({
      ok: true,
      student,
      class: classResult.rows[0] ?? null,
      subjects: subjectsResult.rows,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: "Unable to load student details." },
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
    const addedBy = user.id;

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

    await pool.query(
      `UPDATE student_classes
       SET status = 'inactive',
           removed_by = $2,
           date_removed = NOW()
       WHERE student_id = $1 AND status = 'active'`,
      [id, addedBy]
    );

    await pool.query(
      `INSERT INTO student_classes (student_id, class_id, status, added_by, date_added)
       VALUES ($1, $2, 'active', $3, NOW())`,
      [id, classId, addedBy]
    );

    await pool.query(
      `UPDATE student_class_subjects
       SET status = 'inactive',
           removed_by = $2,
           date_removed = NOW()
       WHERE student_id = $1 AND status = 'active'`,
      [id, addedBy]
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
        { ok: false, message: "Student id and assignment id are required." },
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

    const result = await pool.query(
      `UPDATE student_class_subjects
       SET status = 'inactive',
           removed_by = $3,
           date_removed = NOW()
       WHERE id = $1 AND student_id = $2`,
      [assignmentId, id, removedBy]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { ok: false, message: "Assignment not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, message: "Subject removed." });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: "Unable to remove subject." },
      { status: 500 }
    );
  }
}
