import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    if (!userId) {
      return NextResponse.json(
        { ok: false, message: "User id is required." },
        { status: 400 }
      );
    }

    const { rows } = await pool.query<{ status: string }>(
      "SELECT status FROM school_admins WHERE user_id = $1 AND status = 'active' ORDER BY date_assigned DESC LIMIT 1",
      [userId]
    );
    const assigned = rows.length > 0;

    return NextResponse.json({ ok: true, assigned });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: "Unable to fetch assignment status." },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const body = await request.json();
    const assignedBy = body?.assigned_by ? String(body.assigned_by) : null;

    if (!userId) {
      return NextResponse.json(
        { ok: false, message: "User id is required." },
        { status: 400 }
      );
    }

    const { rows } = await pool.query<{
      account_id: string | null;
      email: string;
      user_role: string;
    }>(
      "SELECT account_id, email, user_role FROM users WHERE id = $1 LIMIT 1",
      [userId]
    );
    const user = rows[0];

    if (!user || user.user_role !== "teacher") {
      return NextResponse.json(
        { ok: false, message: "Only teachers can be assigned." },
        { status: 400 }
      );
    }

    await pool.query(
      `INSERT INTO school_admins (user_id, account_id, email, status, assigned_by, date_assigned)
       VALUES ($1, $2, $3, 'active', $4, NOW())`,
      [userId, user.account_id, user.email, assignedBy]
    );

    return NextResponse.json({ ok: true, message: "Assigned." });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: "Unable to assign role." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const body = await request.json();
    const removedBy = body?.assigned_by ? String(body.assigned_by) : null;

    if (!userId) {
      return NextResponse.json(
        { ok: false, message: "User id is required." },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `UPDATE school_admins
       SET status = 'inactive',
           removed_by = $1,
           date_removed = NOW()
       WHERE user_id = $2 AND status = 'active'`,
      [removedBy, userId]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { ok: false, message: "Assignment not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, message: "Removed." });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: "Unable to remove role." },
      { status: 500 }
    );
  }
}
