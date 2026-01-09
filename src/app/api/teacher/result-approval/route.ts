import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { requireAuthUser, requireRole } from "@/lib/authorization";

async function getFormTeacherGroup(
  teacherId: string,
  classId: string,
  schoolSession: string
) {
  const { rows } = await pool.query<{ class_group: string | null }>(
    `SELECT class_group
     FROM form_teachers
     WHERE teacher_id = $1
       AND class_id = $2
       AND status = 'active'
       AND school_session = $3
     LIMIT 1`,
    [teacherId, classId, schoolSession]
  );
  return rows[0]?.class_group ?? null;
}

export async function GET(request: Request) {
  try {
    const { user, response } = await requireAuthUser(request);
    if (!user) {
      return response;
    }
    const roleCheck = requireRole(user, ["teacher"]);
    if (roleCheck) {
      return roleCheck;
    }

    const { searchParams } = new URL(request.url);
    const classId = String(searchParams.get("class_id") ?? "").trim();
    const schoolSession = String(searchParams.get("school_session") ?? "").trim();
    const schoolTerm = String(searchParams.get("school_term") ?? "").trim();

    if (!classId || !schoolSession || !schoolTerm) {
      return NextResponse.json(
        { ok: false, message: "Class, session, and term are required." },
        { status: 400 }
      );
    }

    const classGroup = await getFormTeacherGroup(user.id, classId, schoolSession);
    const canApprove = Boolean(classGroup !== null);
    const schoolId = user.school ?? null;

    const approvalResult = await pool.query(
      `SELECT 1
       FROM result_summary
       WHERE class_id = $1
         AND class_group IS NOT DISTINCT FROM $2
         AND school_session = $3
         AND school_term = $4
         AND school_id IS NOT DISTINCT FROM $5
         AND status = 'approved'
       LIMIT 1`,
      [classId, classGroup, schoolSession, schoolTerm, schoolId]
    );

    return NextResponse.json({
      ok: true,
      approved: approvalResult.rows.length > 0,
      can_approve: canApprove,
      class_group: classGroup,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: "Unable to check approval status." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { user, response } = await requireAuthUser(request);
    if (!user) {
      return response;
    }
    const roleCheck = requireRole(user, ["teacher"]);
    if (roleCheck) {
      return roleCheck;
    }

    const body = await request.json();
    const classId = String(body?.class_id ?? "").trim();
    const schoolSession = String(body?.school_session ?? "").trim();
    const schoolTerm = String(body?.school_term ?? "").trim();

    if (!classId || !schoolSession || !schoolTerm) {
      return NextResponse.json(
        { ok: false, message: "Class, session, and term are required." },
        { status: 400 }
      );
    }

    const classGroup = await getFormTeacherGroup(user.id, classId, schoolSession);
    if (classGroup === null) {
      return NextResponse.json(
        { ok: false, message: "Only the form teacher can approve results." },
        { status: 403 }
      );
    }

    const schoolId = user.school ?? null;

    const approvedCheck = await pool.query(
      `SELECT 1
       FROM result_summary
       WHERE class_id = $1
         AND class_group IS NOT DISTINCT FROM $2
         AND school_session = $3
         AND school_term = $4
         AND school_id IS NOT DISTINCT FROM $5
         AND status = 'approved'
       LIMIT 1`,
      [classId, classGroup, schoolSession, schoolTerm, schoolId]
    );

    if (approvedCheck.rows.length) {
      return NextResponse.json({ ok: true, approved: true });
    }

    const totalsResult = await pool.query(
      `SELECT COUNT(DISTINCT sc.student_id)::int AS total_students,
              COALESCE(SUM(ss.total), 0)::numeric(10,2) AS total_score,
              COALESCE(AVG(ss.total), 0)::numeric(10,2) AS average_score
       FROM student_classes sc
       LEFT JOIN student_scores ss
         ON ss.student_id = sc.student_id
        AND ss.class_id = sc.class_id
        AND ss.status = 'active'
        AND COALESCE(ss.school_session, ss.session_year) = $3
        AND COALESCE(ss.school_term, ss.term) = $4
       WHERE sc.class_id = $1
         AND sc.status = 'active'
         AND sc.class_group IS NOT DISTINCT FROM $2
         AND sc.school_session = $3`,
      [classId, classGroup, schoolSession, schoolTerm]
    );

    const totals = totalsResult.rows[0] ?? {
      total_students: 0,
      total_score: 0,
      average_score: 0,
    };

    await pool.query(
      `INSERT INTO result_summary
        (class_id, school_session, school_term, total_students, total_score,
         average_score, status, approved_by, approved_at, created_at, school_id, class_group)
       VALUES ($1, $2, $3, $4, $5, $6, 'approved', $7, NOW(), NOW(), $8, $9)`,
      [
        classId,
        schoolSession,
        schoolTerm,
        totals.total_students,
        totals.total_score,
        totals.average_score,
        user.id,
        schoolId,
        classGroup,
      ]
    );

    return NextResponse.json({ ok: true, approved: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: "Unable to approve results." },
      { status: 500 }
    );
  }
}
