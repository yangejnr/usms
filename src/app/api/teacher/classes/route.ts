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

    const { rows } = await pool.query(
      `SELECT c.id, c.name, c.code, c.category
       FROM teacher_classes tc
       JOIN classes c ON c.id = tc.class_id
       WHERE tc.user_id = $1 AND tc.status = 'active'
       ORDER BY c.name ASC`,
      [userId]
    );

    return NextResponse.json({ ok: true, classes: rows });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: "Unable to fetch classes." },
      { status: 500 }
    );
  }
}
