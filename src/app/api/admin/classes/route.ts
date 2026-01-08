import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, code, category, status
       FROM classes
       ORDER BY date_created DESC`
    );
    return NextResponse.json({ ok: true, classes: rows });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: "Unable to fetch classes." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = String(body?.name ?? "").trim();
    const code = String(body?.code ?? "").trim().toUpperCase();
    const category = String(body?.category ?? "").trim();
    const status = String(body?.status ?? "active").trim();

    if (!name || !code || !category) {
      return NextResponse.json(
        { ok: false, message: "All fields are required." },
        { status: 400 }
      );
    }

    const { rows } = await pool.query<{ id: string }>(
      `INSERT INTO classes (name, code, category, status)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [name, code, category, status]
    );

    return NextResponse.json({
      ok: true,
      message: "Class created.",
      class: {
        id: rows[0]?.id ?? null,
        name,
        code,
        category,
        status,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: "Unable to create class." },
      { status: 500 }
    );
  }
}
