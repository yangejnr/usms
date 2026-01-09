import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { requireAuthUser, requireRole } from "@/lib/authorization";

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
    const studentId = searchParams.get("student_id");
    const sessionParam = searchParams.get("school_session");
    const termParam = searchParams.get("school_term");

    if (!studentId) {
      return NextResponse.json(
        { ok: false, message: "Student id is required." },
        { status: 400 }
      );
    }

    const studentResult = await pool.query(
      `SELECT id, student_no, surname, firstname, othername, gender, school
       FROM students
       WHERE id = $1
       LIMIT 1`,
      [studentId]
    );
    const student = studentResult.rows[0];
    if (!student) {
      return NextResponse.json(
        { ok: false, message: "Student not found." },
        { status: 404 }
      );
    }

    const classResult = await pool.query(
      `SELECT sc.class_id,
              sc.class_group,
              sc.school_session,
              c.name,
              c.code,
              c.category
       FROM student_classes sc
       JOIN classes c ON c.id = sc.class_id
       WHERE sc.student_id = $1 AND sc.status = 'active'
       ORDER BY sc.date_added DESC
       LIMIT 1`,
      [studentId]
    );
    const classInfo = classResult.rows[0];
    if (!classInfo) {
      return NextResponse.json(
        { ok: false, message: "Student class not found." },
        { status: 404 }
      );
    }

    const classId = classInfo.class_id as string;
    const activeSession =
      sessionParam && sessionParam.trim().length > 0
        ? sessionParam.trim()
        : classInfo.school_session;

    const teacherClassCheck = await pool.query(
      `SELECT 1
       FROM teacher_classes
       WHERE user_id = $1 AND class_id = $2 AND status = 'active'
       LIMIT 1`,
      [user.id, classId]
    );
    if (!teacherClassCheck.rows.length) {
      return NextResponse.json(
        { ok: false, message: "Forbidden." },
        { status: 403 }
      );
    }

    const { rows } = await pool.query(
      `SELECT
         s.id,
         s.name,
         s.code,
         s.category,
         scores.id AS score_id,
         scores.school_session,
         scores.school_term,
         scores.assess_1,
         scores.assess_2,
         scores.test_1,
         scores.test_2,
         scores.exam,
         scores.total,
         COALESCE(subject_counts.total_students, 0)::int AS total_students,
         avg_scores.avg_total,
         position_scores.position
       FROM teacher_class_subjects tcs
       JOIN student_class_subjects scs
         ON scs.subject_id = tcs.subject_id
        AND scs.class_id = tcs.class_id
        AND scs.student_id = $1
        AND scs.status = 'active'
       JOIN student_classes sc
         ON sc.student_id = scs.student_id
        AND sc.class_id = scs.class_id
        AND sc.status = 'active'
       JOIN subjects s ON s.id = tcs.subject_id
       LEFT JOIN LATERAL (
         SELECT ss.id,
           ss.school_session,
           ss.school_term,
           ss.first_assessment AS assess_1,
           ss.second_assessment AS assess_2,
           ss.first_test AS test_1,
           ss.second_test AS test_2,
           ss.exam,
           ss.total
         FROM student_scores ss
         WHERE ss.student_id = $1
           AND ss.class_id = $2
           AND ss.subject_id = tcs.subject_id
           AND ss.status = 'active'
           AND ($3::text IS NULL OR ss.school_session = $3::text)
           AND ($4::text IS NULL OR ss.school_term = $4::text)
         ORDER BY ss.date_added DESC
         LIMIT 1
       ) scores ON true
       LEFT JOIN LATERAL (
         SELECT COUNT(*) AS total_students
         FROM student_class_subjects scs2
         JOIN student_classes sc2
           ON sc2.student_id = scs2.student_id
          AND sc2.class_id = scs2.class_id
          AND sc2.status = 'active'
         WHERE scs2.class_id = $2
           AND scs2.subject_id = tcs.subject_id
           AND scs2.status = 'active'
           AND sc2.class_group IS NOT DISTINCT FROM sc.class_group
           AND ($3::text IS NULL OR scs2.school_session = $3::text)
       ) subject_counts ON true
       LEFT JOIN LATERAL (
         SELECT AVG(ss2.total)::numeric(6,2) AS avg_total
         FROM student_scores ss2
         JOIN student_classes sc3
           ON sc3.student_id = ss2.student_id
          AND sc3.class_id = ss2.class_id
          AND sc3.status = 'active'
         WHERE ss2.class_id = $2
           AND ss2.subject_id = tcs.subject_id
           AND ss2.status = 'active'
           AND sc3.class_group IS NOT DISTINCT FROM sc.class_group
           AND ($3::text IS NULL OR ss2.school_session = $3::text)
           AND ($4::text IS NULL OR ss2.school_term = $4::text)
       ) avg_scores ON true
       LEFT JOIN LATERAL (
         SELECT ranked.position
         FROM (
           SELECT ss3.student_id,
             DENSE_RANK() OVER (ORDER BY ss3.total DESC NULLS LAST) AS position
           FROM student_scores ss3
           JOIN student_classes sc4
             ON sc4.student_id = ss3.student_id
            AND sc4.class_id = ss3.class_id
            AND sc4.status = 'active'
           WHERE ss3.class_id = $2
             AND ss3.subject_id = tcs.subject_id
             AND ss3.status = 'active'
             AND sc4.class_group IS NOT DISTINCT FROM sc.class_group
             AND ($3::text IS NULL OR ss3.school_session = $3::text)
             AND ($4::text IS NULL OR ss3.school_term = $4::text)
         ) ranked
         WHERE ranked.student_id = $1
         LIMIT 1
       ) position_scores ON true
       WHERE tcs.user_id = $5
         AND tcs.class_id = $2
         AND tcs.status = 'active'
         AND ($3::text IS NULL OR tcs.school_session = $3::text)
       ORDER BY s.name ASC`,
      [studentId, classId, activeSession, termParam, user.id]
    );

    return NextResponse.json({
      ok: true,
      student,
      class_info: classInfo,
      subjects: rows,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: "Unable to fetch score sheet." },
      { status: 500 }
    );
  }
}
