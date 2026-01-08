import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");

    if (!userId) {
      return NextResponse.json(
        { ok: false, message: "User id is required." },
        { status: 400 }
      );
    }

    const adminResult = await pool.query<{ school: string | null }>(
      "SELECT school FROM users WHERE id = $1 LIMIT 1",
      [userId]
    );
    const school = adminResult.rows[0]?.school;

    if (!school) {
      return NextResponse.json(
        { ok: false, message: "School not found for this user." },
        { status: 400 }
      );
    }

    const studentsByClassResult = await pool.query(
      `SELECT c.id,
              c.name,
              c.code,
              c.category,
              COUNT(s.id)::int AS total
       FROM classes c
       LEFT JOIN student_classes sc
         ON sc.class_id = c.id
        AND sc.status = 'active'
       LEFT JOIN students s
         ON s.id = sc.student_id
        AND s.school = $1
        AND s.status = 'active'
       GROUP BY c.id, c.name, c.code, c.category
       ORDER BY c.name ASC`,
      [school]
    );

    const teachersByClassResult = await pool.query(
      `SELECT c.id,
              c.name,
              c.code,
              c.category,
              COUNT(u.id)::int AS total
       FROM classes c
       LEFT JOIN teacher_classes tc
         ON tc.class_id = c.id
        AND tc.status = 'active'
       LEFT JOIN users u
         ON u.id = tc.user_id
        AND u.school = $1
        AND u.user_role = 'teacher'
       GROUP BY c.id, c.name, c.code, c.category
       ORDER BY c.name ASC`,
      [school]
    );

    const genderDistributionResult = await pool.query(
      `SELECT LOWER(COALESCE(s.gender, 'unknown')) AS gender,
              COUNT(*)::int AS total
       FROM students s
       WHERE s.school = $1
         AND s.status = 'active'
       GROUP BY LOWER(COALESCE(s.gender, 'unknown'))
       ORDER BY gender ASC`,
      [school]
    );

    return NextResponse.json({
      ok: true,
      school,
      studentsByClass: studentsByClassResult.rows,
      teachersByClass: teachersByClassResult.rows,
      genderDistribution: genderDistributionResult.rows,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: "Unable to load statistics." },
      { status: 500 }
    );
  }
}
