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
    const classId = searchParams.get("class_id");
    const sessionParam = searchParams.get("school_session") || null;
    const termParam = searchParams.get("school_term") || null;

    if (!studentId || !classId) {
      return NextResponse.json(
        { ok: false, message: "Student id and class id are required." },
        { status: 400 }
      );
    }

    const teacherCheck = await pool.query(
      `SELECT 1
       FROM teacher_classes
       WHERE user_id = $1 AND class_id = $2 AND status = 'active'`,
      [user.id, classId]
    );
    if (!teacherCheck.rows.length) {
      return NextResponse.json(
        { ok: false, message: "Not allowed to view this class." },
        { status: 403 }
      );
    }

    const { rows } = await pool.query(
      `SELECT s.id,
        s.name,
        s.code,
        s.category,
        COALESCE(subject_counts.total_students, 0)::int AS total_students,
        scores.score_id,
        scores.school_session,
        scores.school_term,
        scores.assess_1,
        scores.assess_2,
        scores.test_1,
        scores.test_2,
        scores.exam,
        scores.total,
        avg_scores.avg_total,
        position_scores.position
       FROM student_class_subjects scs
       JOIN student_classes sc
         ON sc.student_id = scs.student_id
        AND sc.class_id = scs.class_id
        AND sc.status = 'active'
       JOIN subjects s ON s.id = scs.subject_id
       LEFT JOIN LATERAL (
         SELECT ss.school_session,
           ss.school_term,
           ss.id AS score_id,
           ss.first_assessment AS assess_1,
           ss.second_assessment AS assess_2,
           ss.first_test AS test_1,
           ss.second_test AS test_2,
           ss.exam,
           ss.total
         FROM student_scores ss
         WHERE ss.student_id = $1
           AND ss.class_id = $2
           AND ss.subject_id = scs.subject_id
           AND ss.status = 'active'
           AND ($3::text IS NULL OR COALESCE(ss.school_session, ss.session_year) = $3::text)
           AND ($4::text IS NULL OR COALESCE(ss.school_term, ss.term) = $4::text)
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
         WHERE scs2.class_id = scs.class_id
           AND scs2.subject_id = scs.subject_id
           AND scs2.status = 'active'
           AND sc2.class_group IS NOT DISTINCT FROM sc.class_group
       ) subject_counts ON true
       LEFT JOIN LATERAL (
         SELECT AVG(ss2.total)::numeric(6,2) AS avg_total
         FROM student_scores ss2
         JOIN student_classes sc3
           ON sc3.student_id = ss2.student_id
          AND sc3.class_id = ss2.class_id
          AND sc3.status = 'active'
         WHERE ss2.class_id = scs.class_id
           AND ss2.subject_id = scs.subject_id
           AND ss2.status = 'active'
           AND sc3.class_group IS NOT DISTINCT FROM sc.class_group
           AND (COALESCE($3::text, scores.school_session) IS NULL
             OR COALESCE(ss2.school_session, ss2.session_year) =
               COALESCE($3::text, scores.school_session))
           AND (COALESCE($4::text, scores.school_term) IS NULL
             OR COALESCE(ss2.school_term, ss2.term) =
               COALESCE($4::text, scores.school_term))
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
           WHERE ss3.class_id = scs.class_id
             AND ss3.subject_id = scs.subject_id
             AND ss3.status = 'active'
             AND sc4.class_group IS NOT DISTINCT FROM sc.class_group
             AND (COALESCE($3::text, scores.school_session) IS NULL
               OR COALESCE(ss3.school_session, ss3.session_year) =
                 COALESCE($3::text, scores.school_session))
             AND (COALESCE($4::text, scores.school_term) IS NULL
               OR COALESCE(ss3.school_term, ss3.term) =
                 COALESCE($4::text, scores.school_term))
         ) ranked
         WHERE ranked.student_id = $1
         LIMIT 1
       ) position_scores ON true
       WHERE scs.student_id = $1
         AND scs.class_id = $2
         AND scs.status = 'active'
        ORDER BY s.name ASC`,
      [studentId, classId, sessionParam, termParam]
    );

    const studentResult = await pool.query(
      `SELECT id, student_no, surname, firstname, othername
       FROM students
       WHERE id = $1
       LIMIT 1`,
      [studentId]
    );

    const classResult = await pool.query(
      `SELECT c.name, c.code, sc.class_group, sc.school_session
       FROM student_classes sc
       JOIN classes c ON c.id = sc.class_id
       WHERE sc.student_id = $1 AND sc.class_id = $2 AND sc.status = 'active'
       LIMIT 1`,
      [studentId, classId]
    );

    const classInfo = classResult.rows[0] ?? null;
    const effectiveSession = sessionParam ?? classInfo?.school_session ?? null;
    const effectiveTerm = termParam ?? null;
    const subjectsAll = rows;
    const subjectsScored = rows.filter((subject) => subject.score_id);

    return NextResponse.json({
      ok: true,
      subjects: subjectsScored,
      subjects_all: subjectsAll,
      student: studentResult.rows[0] ?? null,
      class_info: classInfo,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: "Unable to fetch subjects." },
      { status: 500 }
    );
  }
}
