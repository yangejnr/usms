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
    const subjectId = searchParams.get("subject_id");
    const sessionParam = searchParams.get("school_session");

    if (!subjectId) {
      return NextResponse.json(
        { ok: false, message: "Subject id is required." },
        { status: 400 }
      );
    }

    const { rows } = await pool.query(
      `SELECT DISTINCT
         c.id,
         c.name,
         c.code,
         c.category,
         tcs.school_session,
         s.name AS subject_name,
         COALESCE(student_counts.total_students, 0)::int AS total_students
       FROM teacher_class_subjects tcs
       JOIN classes c ON c.id = tcs.class_id
       JOIN subjects s ON s.id = tcs.subject_id
       LEFT JOIN (
         SELECT class_id, subject_id, COUNT(*) AS total_students
         FROM student_class_subjects
         WHERE status = 'active'
           AND ($3::text IS NULL OR school_session = $3::text)
         GROUP BY class_id, subject_id
       ) student_counts
         ON student_counts.class_id = tcs.class_id
        AND student_counts.subject_id = tcs.subject_id
       WHERE tcs.user_id = $1
         AND tcs.subject_id = $2
         AND tcs.status = 'active'
         AND ($3::text IS NULL OR tcs.school_session = $3::text)
       ORDER BY c.name ASC`,
      [user.id, subjectId, sessionParam]
    );

    return NextResponse.json({
      ok: true,
      classes: rows,
      subject_name: rows[0]?.subject_name ?? null,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: "Unable to fetch classes." },
      { status: 500 }
    );
  }
}
