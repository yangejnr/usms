import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { requireAuthUser, requireRole } from "@/lib/authorization";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params;
    const body = await request.json();

    if (!id) {
      return NextResponse.json(
        { ok: false, message: "Subject id is required." },
        { status: 400 }
      );
    }

    const fields: string[] = [];
    const values: Array<string> = [];
    let index = 1;

    if (body?.name) {
      fields.push(`name = $${index++}`);
      values.push(String(body.name).trim());
    }
    if (body?.code) {
      fields.push(`code = $${index++}`);
      values.push(String(body.code).trim().toUpperCase());
    }
    if (body?.category) {
      fields.push(`category = $${index++}`);
      values.push(String(body.category).trim());
    }
    if (body?.status) {
      fields.push(`status = $${index++}`);
      values.push(String(body.status).trim());
    }

    if (fields.length === 0) {
      return NextResponse.json(
        { ok: false, message: "No fields provided to update." },
        { status: 400 }
      );
    }

    values.push(id);

    const result = await pool.query(
      `UPDATE subjects SET ${fields.join(", ")} WHERE id = $${index}`,
      values
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { ok: false, message: "Subject not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, message: "Subject updated." });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: "Unable to update subject." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { ok: false, message: "Subject id is required." },
        { status: 400 }
      );
    }

    const result = await pool.query(
      "UPDATE subjects SET status = 'inactive' WHERE id = $1",
      [id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { ok: false, message: "Subject not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, message: "Subject deactivated." });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: "Unable to deactivate subject." },
      { status: 500 }
    );
  }
}
