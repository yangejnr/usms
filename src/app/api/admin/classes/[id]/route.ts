import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!id) {
      return NextResponse.json(
        { ok: false, message: "Class id is required." },
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
      `UPDATE classes SET ${fields.join(", ")} WHERE id = $${index}`,
      values
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { ok: false, message: "Class not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, message: "Class updated." });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: "Unable to update class." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { ok: false, message: "Class id is required." },
        { status: 400 }
      );
    }

    const result = await pool.query(
      "UPDATE classes SET status = 'inactive' WHERE id = $1",
      [id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { ok: false, message: "Class not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, message: "Class deactivated." });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: "Unable to deactivate class." },
      { status: 500 }
    );
  }
}
