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

    const { rows } = await pool.query(
      `SELECT s.id,
              s.student_no,
              s.surname,
              s.firstname,
              s.othername,
              s.gender,
              COALESCE(sub.subject_count, 0) AS total_subjects
       FROM student_classes sc
       JOIN teacher_classes tc
         ON tc.class_id = sc.class_id
        AND tc.user_id = $2
        AND tc.status = 'active'
       JOIN students s ON s.id = sc.student_id
       LEFT JOIN (
         SELECT student_id, class_id, COUNT(*)::int AS subject_count
         FROM student_class_subjects
         WHERE status = 'active'
         GROUP BY student_id, class_id
       ) sub
         ON sub.student_id = sc.student_id
        AND sub.class_id = sc.class_id
       WHERE sc.class_id = $1 AND sc.status = 'active'
       ORDER BY s.surname ASC, s.firstname ASC`,
      [classId, user.id]
    );

    const classInfoResult = await pool.query<{
      name: string;
      class_group: string | null;
    }>(
      `SELECT c.name, tc.class_group
       FROM classes c
       LEFT JOIN teacher_classes tc
         ON tc.class_id = c.id
        AND tc.user_id = $2
        AND tc.status = 'active'
       WHERE c.id = $1
       LIMIT 1`,
      [classId, user.id]
    );

    return NextResponse.json({
      ok: true,
      students: rows,
      class_info: classInfoResult.rows[0] ?? null,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: "Unable to fetch students." },
      { status: 500 }
    );
  }
}
