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

    if (!subjectId) {
      return NextResponse.json(
        { ok: false, message: "Subject id is required." },
        { status: 400 }
      );
    }

    const { rows } = await pool.query(
      `SELECT DISTINCT s.id, s.student_no, s.surname, s.firstname, s.othername
       FROM student_class_subjects scs
       JOIN teacher_class_subjects tcs
         ON tcs.class_id = scs.class_id
        AND tcs.subject_id = scs.subject_id
        AND tcs.user_id = $2
        AND tcs.status = 'active'
       JOIN students s ON s.id = scs.student_id
       WHERE scs.subject_id = $1 AND scs.status = 'active'
       ORDER BY s.surname ASC, s.firstname ASC`,
      [subjectId, user.id]
    );

    return NextResponse.json({ ok: true, students: rows });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: "Unable to fetch students." },
      { status: 500 }
    );
  }
}
