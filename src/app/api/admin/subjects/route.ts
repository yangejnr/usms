import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { requireAuthUser, requireRole } from "@/lib/authorization";

export async function GET(request: Request) {
  try {
    const { user, response } = await requireAuthUser(request);
    if (!user) {
      return response;
    }
    const roleCheck = requireRole(user, ["admin"]);
    if (roleCheck) {
      return roleCheck;
    }

    const { rows } = await pool.query(
      `SELECT id, name, code, category, status
       FROM subjects
       ORDER BY name ASC`
    );
    return NextResponse.json({ ok: true, subjects: rows });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: "Unable to fetch subjects." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { user, response } = await requireAuthUser(request);
    if (!user) {
      return response;
    }
    const roleCheck = requireRole(user, ["admin"]);
    if (roleCheck) {
      return roleCheck;
    }

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
      `INSERT INTO subjects (name, code, category, status)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [name, code, category, status]
    );

    return NextResponse.json({
      ok: true,
      message: "Subject created.",
      subject: {
        id: rows[0]?.id ?? null,
        name,
        code,
        category,
        status,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: "Unable to create subject." },
      { status: 500 }
    );
  }
}
