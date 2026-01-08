import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, school_code, category, address, school_type, status
       FROM schools
       ORDER BY date_created DESC`
    );
    return NextResponse.json({ ok: true, schools: rows });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: "Unable to fetch schools." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = String(body?.name ?? "").trim();
    const schoolCode = String(body?.school_code ?? "").trim().toUpperCase();
    const category = String(body?.category ?? "").trim();
    const address = String(body?.address ?? "").trim();
    const schoolType = String(body?.school_type ?? "").trim();
    const status = String(body?.status ?? "active").trim();

    if (!name || !schoolCode || !category || !address || !schoolType) {
      return NextResponse.json(
        { ok: false, message: "All fields are required." },
        { status: 400 }
      );
    }

    const { rows } = await pool.query<{ id: string }>(
      `INSERT INTO schools (name, school_code, category, address, school_type, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [name, schoolCode, category, address, schoolType, status]
    );

    return NextResponse.json({
      ok: true,
      message: "School created.",
      school: {
        id: rows[0]?.id ?? null,
        name,
        school_code: schoolCode,
        category,
        address,
        school_type: schoolType,
        status,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: "Unable to create school." },
      { status: 500 }
    );
  }
}
