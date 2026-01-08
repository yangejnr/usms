import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const status = String(body?.status ?? "").trim();

    if (!id || !status) {
      return NextResponse.json(
        { ok: false, message: "Student id and status are required." },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `UPDATE students SET status = $1 WHERE id = $2`,
      [status, id]
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
