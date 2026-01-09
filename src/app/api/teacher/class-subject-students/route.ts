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
    const classId = searchParams.get("class_id");
    const subjectId = searchParams.get("subject_id");
    const sessionParam = searchParams.get("school_session");
    const termParam = searchParams.get("school_term");

    if (!classId || !subjectId) {
      return NextResponse.json(
        { ok: false, message: "Class id and subject id are required." },
        { status: 400 }
      );
    }

    const { rows } = await pool.query(
      `SELECT s.id,
        s.student_no,
        s.surname,
        s.firstname,
        s.othername,
        scores.score_id,
        scores.assess_1,
        scores.assess_2,
        scores.test_1,
        scores.test_2,
        scores.exam,
        scores.total,
        COALESCE(subject_counts.total_students, 0)::int AS total_students,
        avg_scores.avg_total,
        position_scores.position
       FROM student_class_subjects scs
       JOIN student_classes sc_base
         ON sc_base.student_id = scs.student_id
        AND sc_base.class_id = scs.class_id
        AND sc_base.status = 'active'
       JOIN teacher_class_subjects tcs
         ON tcs.class_id = scs.class_id
        AND tcs.subject_id = scs.subject_id
        AND tcs.user_id = $3
        AND tcs.status = 'active'
       JOIN students s ON s.id = scs.student_id
       LEFT JOIN LATERAL (
         SELECT ss.id AS score_id,
           ss.first_assessment AS assess_1,
           ss.second_assessment AS assess_2,
           ss.first_test AS test_1,
           ss.second_test AS test_2,
           ss.exam,
           ss.total
         FROM student_scores ss
         WHERE ss.student_id = scs.student_id
           AND ss.class_id = scs.class_id
           AND ss.subject_id = scs.subject_id
           AND ss.status = 'active'
           AND ($4::text IS NULL OR COALESCE(ss.school_session, ss.session_year) = $4::text)
           AND ($5::text IS NULL OR COALESCE(ss.school_term, ss.term) = $5::text)
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
           AND sc2.class_group IS NOT DISTINCT FROM sc_base.class_group
           AND ($4::text IS NULL OR scs2.school_session = $4::text)
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
           AND sc3.class_group IS NOT DISTINCT FROM sc_base.class_group
           AND ($4::text IS NULL OR COALESCE(ss2.school_session, ss2.session_year) = $4::text)
           AND ($5::text IS NULL OR COALESCE(ss2.school_term, ss2.term) = $5::text)
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
             AND sc4.class_group IS NOT DISTINCT FROM sc_base.class_group
             AND ($4::text IS NULL OR COALESCE(ss3.school_session, ss3.session_year) = $4::text)
             AND ($5::text IS NULL OR COALESCE(ss3.school_term, ss3.term) = $5::text)
         ) ranked
         WHERE ranked.student_id = scs.student_id
         LIMIT 1
       ) position_scores ON true
       WHERE scs.class_id = $1
         AND scs.subject_id = $2
         AND scs.status = 'active'
         AND ($4::text IS NULL OR scs.school_session = $4::text)
         AND ($4::text IS NULL OR tcs.school_session = $4::text)
       ORDER BY s.surname ASC, s.firstname ASC`,
      [classId, subjectId, user.id, sessionParam, termParam]
    );

    const infoResult = await pool.query(
      `SELECT s.name AS subject_name,
              c.code,
              tc.class_group,
              tc.school_session
       FROM subjects s
       JOIN classes c ON c.id = $1
       LEFT JOIN teacher_classes tc
         ON tc.class_id = c.id
        AND tc.user_id = $3
        AND tc.status = 'active'
       WHERE s.id = $2
       LIMIT 1`,
      [classId, subjectId, user.id]
    );

    const info = infoResult.rows[0] ?? null;

    return NextResponse.json({
      ok: true,
      students: rows,
      subject_name: info?.subject_name ?? null,
      class_info: info
        ? {
            code: info.code ?? null,
            class_group: info.class_group ?? null,
            school_session: info.school_session ?? null,
          }
        : null,
      school_term: termParam ?? null,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: "Unable to fetch students." },
      { status: 500 }
    );
  }
}
