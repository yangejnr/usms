import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { requireAuthUser, requireRole } from "@/lib/authorization";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { user, response } = await requireAuthUser(request);
    if (!user) {
      return response;
    }

    const { userId } = await params;
    if (!userId) {
      return NextResponse.json(
        { ok: false, message: "User id is required." },
        { status: 400 }
      );
    }

    if (user.user_role !== "admin" && user.id !== userId) {
      return NextResponse.json(
        { ok: false, message: "Forbidden." },
        { status: 403 }
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
    const { user, response } = await requireAuthUser(request);
    if (!user) {
      return response;
    }
    const roleCheck = requireRole(user, ["admin"]);
    if (roleCheck) {
      return roleCheck;
    }

    const { userId } = await params;
    await request.json().catch(() => null);
    const assignedBy = user.id;

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
    const targetUser = rows[0];

    if (!targetUser || targetUser.user_role !== "teacher") {
      return NextResponse.json(
        { ok: false, message: "Only teachers can be assigned." },
        { status: 400 }
      );
    }

    await pool.query(
      `INSERT INTO school_admins (user_id, account_id, email, status, assigned_by, date_assigned)
       VALUES ($1, $2, $3, 'active', $4, NOW())`,
      [userId, targetUser.account_id, targetUser.email, assignedBy]
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
    const { user, response } = await requireAuthUser(request);
    if (!user) {
      return response;
    }
    const roleCheck = requireRole(user, ["admin"]);
    if (roleCheck) {
      return roleCheck;
    }

    const { userId } = await params;
    await request.json().catch(() => null);
    const removedBy = user.id;

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
