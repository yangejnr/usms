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
        { ok: false, message: "School id is required." },
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
    if (body?.school_code) {
      fields.push(`school_code = $${index++}`);
      values.push(String(body.school_code).trim().toUpperCase());
    }
    if (body?.category) {
      fields.push(`category = $${index++}`);
      values.push(String(body.category).trim());
    }
    if (body?.address) {
      fields.push(`address = $${index++}`);
      values.push(String(body.address).trim());
    }
    if (body?.school_type) {
      fields.push(`school_type = $${index++}`);
      values.push(String(body.school_type).trim());
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
      `UPDATE schools SET ${fields.join(", ")} WHERE id = $${index}`,
      values
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { ok: false, message: "School not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, message: "School updated." });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: "Unable to update school." },
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
        { ok: false, message: "School id is required." },
        { status: 400 }
      );
    }

    const result = await pool.query(
      "UPDATE schools SET status = 'inactive' WHERE id = $1",
      [id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { ok: false, message: "School not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, message: "School deactivated." });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: "Unable to deactivate school." },
      { status: 500 }
    );
  }
}
