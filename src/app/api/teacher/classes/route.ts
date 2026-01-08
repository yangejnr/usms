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
      `SELECT c.id, c.name, c.code, c.category
       FROM teacher_classes tc
       JOIN classes c ON c.id = tc.class_id
       WHERE tc.user_id = $1 AND tc.status = 'active'
       ORDER BY c.name ASC`,
      [user.id]
    );

    return NextResponse.json({ ok: true, classes: rows });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: "Unable to fetch classes." },
      { status: 500 }
    );
  }
}
