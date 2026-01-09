import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { requireAuthUser, requireSchoolAdmin } from "@/lib/authorization";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, response } = await requireAuthUser(request);
    if (!user) {
      return response;
    }
    const adminCheck = await requireSchoolAdmin(user.id);
    if (adminCheck) {
      return adminCheck;
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { ok: false, message: "Class id is required." },
        { status: 400 }
      );
    }

    const schoolResult = await pool.query<{ school: string | null }>(
      "SELECT school FROM users WHERE id = $1 LIMIT 1",
      [user.id]
    );
    const school = schoolResult.rows[0]?.school;
    if (!school) {
      return NextResponse.json(
        { ok: false, message: "School not found for this user." },
        { status: 400 }
      );
    }

    const { rows } = await pool.query(
      `SELECT s.id, s.student_no, s.surname, s.firstname, s.othername, s.gender
       FROM student_classes sc
       JOIN students s ON s.id = sc.student_id
       WHERE sc.class_id = $1
         AND sc.status = 'active'
         AND s.school = $2
         AND s.status = 'active'
       ORDER BY s.surname ASC, s.firstname ASC`,
      [id, school]
    );

    return NextResponse.json({ ok: true, students: rows });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: "Unable to fetch class students." },
      { status: 500 }
    );
  }
}
