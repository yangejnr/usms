import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { ok: false, message: "User id is required." },
        { status: 400 }
      );
    }

    const result = await pool.query(
      "UPDATE users SET status = 'inactive' WHERE id = $1 RETURNING id, status",
      [id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { ok: false, message: "User not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, message: "User deactivated." });
  } catch (error) {
    console.error("Deactivate user failed:", error);
    return NextResponse.json(
      { ok: false, message: "Unable to deactivate user." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const nextStatus = body?.status ? String(body.status).trim() : null;
    const nextEmail = body?.email ? String(body.email).trim().toLowerCase() : null;
    const nextFullName = body?.full_name ? String(body.full_name).trim() : null;
    const nextRole = body?.role ? String(body.role).trim() : null;
    const nextCategory = body?.category ? String(body.category).trim() : null;
    const nextSchool = body?.school ? String(body.school).trim() : null;

    if (!id) {
      return NextResponse.json(
        { ok: false, message: "User id is required." },
        { status: 400 }
      );
    }

    const updates: string[] = [];
    const values: Array<string> = [];
    let index = 1;

    if (nextStatus) {
      updates.push(`status = $${index++}`);
      values.push(nextStatus);
    }
    if (nextEmail) {
      updates.push(`email = $${index++}`);
      values.push(nextEmail);
    }
    if (nextFullName !== null) {
      updates.push(`full_name = $${index++}`);
      values.push(nextFullName);
    }
    if (nextRole) {
      updates.push(`user_role = $${index++}`);
      values.push(nextRole);
    }
    if (nextCategory) {
      updates.push(`category = $${index++}`);
      values.push(nextCategory);
    }
    if (nextSchool !== null) {
      updates.push(`school = $${index++}`);
      values.push(nextSchool);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { ok: false, message: "No fields provided to update." },
        { status: 400 }
      );
    }

    values.push(id);

    const result = await pool.query(
      `UPDATE users SET ${updates.join(", ")} WHERE id = $${
        index
      } RETURNING id, status`,
      values
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { ok: false, message: "User not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "User updated.",
    });
  } catch (error) {
    console.error("Update user status failed:", error);
    return NextResponse.json(
      { ok: false, message: "Unable to update user status." },
      { status: 500 }
    );
  }
}
