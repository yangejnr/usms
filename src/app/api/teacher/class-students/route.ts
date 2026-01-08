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
      `SELECT s.id, s.student_no, s.surname, s.firstname, s.othername
       FROM student_classes sc
       JOIN teacher_classes tc
         ON tc.class_id = sc.class_id
        AND tc.user_id = $2
        AND tc.status = 'active'
       JOIN students s ON s.id = sc.student_id
       WHERE sc.class_id = $1 AND sc.status = 'active'
       ORDER BY s.surname ASC, s.firstname ASC`,
      [classId, user.id]
    );

    return NextResponse.json({ ok: true, students: rows });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: "Unable to fetch students." },
      { status: 500 }
    );
  }
}
