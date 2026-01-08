import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(request: Request) {
  try {
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
       JOIN students s ON s.id = sc.student_id
       WHERE sc.class_id = $1 AND sc.status = 'active'
       ORDER BY s.surname ASC, s.firstname ASC`,
      [classId]
    );

    return NextResponse.json({ ok: true, students: rows });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: "Unable to fetch students." },
      { status: 500 }
    );
  }
}
