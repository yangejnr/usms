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

    const { rows } = await pool.query(
      `SELECT c.id, c.name, c.code, c.category, ft.class_group
       FROM form_teachers ft
       JOIN classes c ON c.id = ft.class_id
       WHERE ft.teacher_id = $1 AND ft.status = 'active'
       ORDER BY c.name ASC`,
      [user.id]
    );

    return NextResponse.json({ ok: true, classes: rows });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: "Unable to fetch form teacher classes." },
      { status: 500 }
    );
  }
}
