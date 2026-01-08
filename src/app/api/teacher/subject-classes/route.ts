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
      `SELECT DISTINCT c.id, c.name, c.code, c.category
       FROM teacher_class_subjects tcs
       JOIN classes c ON c.id = tcs.class_id
       WHERE tcs.user_id = $1 AND tcs.subject_id = $2 AND tcs.status = 'active'
       ORDER BY c.name ASC`,
      [user.id, subjectId]
    );

    return NextResponse.json({ ok: true, classes: rows });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: "Unable to fetch classes." },
      { status: 500 }
    );
  }
}
