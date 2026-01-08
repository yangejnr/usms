import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { requireAuthUser, requireSchoolAdmin } from "@/lib/authorization";

export async function PATCH(
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
    const body = await request.json();
    const status = String(body?.status ?? "").trim();

    if (!id || !status) {
      return NextResponse.json(
        { ok: false, message: "Student id and status are required." },
        { status: 400 }
      );
    }

    const adminSchoolResult = await pool.query<{ school: string | null }>(
      "SELECT school FROM users WHERE id = $1 LIMIT 1",
      [user.id]
    );
    const adminSchool = adminSchoolResult.rows[0]?.school;

    const result = await pool.query(
      `UPDATE students SET status = $1 WHERE id = $2 AND school = $3`,
      [status, id, adminSchool]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { ok: false, message: "Student not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, message: "Status updated." });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: "Unable to update status." },
      { status: 500 }
    );
  }
}
