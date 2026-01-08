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

    if (!classId) {
      return NextResponse.json(
        { ok: false, message: "Class id is required." },
        { status: 400 }
      );
    }

    let classInfo: { name: string; class_group: string | null } | null = null;
    try {
      const classInfoResult = await pool.query(
        `SELECT c.name, tc.class_group
         FROM classes c
         LEFT JOIN teacher_classes tc
           ON tc.class_id = c.id AND tc.user_id = $1 AND tc.status = 'active'
         WHERE c.id = $2
         LIMIT 1`,
        [user.id, classId]
      );
      classInfo = classInfoResult.rows[0] ?? null;
    } catch (error) {
      try {
        const fallbackResult = await pool.query(
          `SELECT name FROM classes WHERE id = $1 LIMIT 1`,
          [classId]
        );
        const fallback = fallbackResult.rows[0];
        classInfo = fallback ? { name: fallback.name, class_group: null } : null;
      } catch (fallbackError) {
        classInfo = null;
      }
    }

    const { rows } = await pool.query(
      `SELECT
         s.id,
         s.name,
         s.code,
         s.category,
         COALESCE(counts.total_students, 0) as total_students
       FROM teacher_class_subjects tcs
       JOIN subjects s ON s.id = tcs.subject_id
       LEFT JOIN (
         SELECT subject_id, class_id, COUNT(DISTINCT student_id)::int AS total_students
         FROM student_class_subjects
         WHERE class_id = $2 AND status = 'active'
         GROUP BY subject_id, class_id
       ) counts
         ON counts.subject_id = s.id AND counts.class_id = $2
       WHERE tcs.user_id = $1 AND tcs.class_id = $2 AND tcs.status = 'active'
       GROUP BY s.id, s.name, s.code, s.category, counts.total_students
       ORDER BY s.name ASC`,
      [user.id, classId]
    );

    return NextResponse.json({
      ok: true,
      subjects: rows,
      classInfo,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: "Unable to fetch subjects." },
      { status: 500 }
    );
  }
}
