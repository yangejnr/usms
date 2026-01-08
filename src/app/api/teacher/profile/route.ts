import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { requireAuthUser, requireRole } from "@/lib/authorization";

export async function GET(request: Request) {
  try {
    const { user, response } = await requireAuthUser(request);
    if (!user) {
      return response;
    }
    const roleCheck = requireRole(user, ["teacher"]);
    if (roleCheck) {
      return roleCheck;
    }

    const { rows } = await pool.query(
      `SELECT user_id, phone, address, gender, date_of_birth, marital_status, photo_data_url
       FROM teacher_profiles
       WHERE user_id = $1
       LIMIT 1`,
      [user.id]
    );

    return NextResponse.json({ ok: true, profile: rows[0] ?? null });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: "Unable to fetch profile." },
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
    const roleCheck = requireRole(user, ["teacher"]);
    if (roleCheck) {
      return roleCheck;
    }

    const body = await request.json();
    const phone = String(body?.phone ?? "").trim();
    const address = String(body?.address ?? "").trim();
    const gender = String(body?.gender ?? "").trim();
    const dateOfBirth = String(body?.date_of_birth ?? "").trim();
    const maritalStatus = String(body?.marital_status ?? "").trim();
    const photoDataUrl = String(body?.photo_data_url ?? "").trim();

    if (!phone || !address || !gender || !dateOfBirth || !maritalStatus) {
      return NextResponse.json(
        { ok: false, message: "All fields are required." },
        { status: 400 }
      );
    }

    await pool.query(
      `INSERT INTO teacher_profiles (user_id, phone, address, gender, date_of_birth, marital_status, photo_data_url, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       ON CONFLICT (user_id)
       DO UPDATE SET
         phone = EXCLUDED.phone,
         address = EXCLUDED.address,
         gender = EXCLUDED.gender,
         date_of_birth = EXCLUDED.date_of_birth,
         marital_status = EXCLUDED.marital_status,
         photo_data_url = EXCLUDED.photo_data_url,
         updated_at = NOW()`,
      [
        user.id,
        phone,
        address,
        gender,
        dateOfBirth,
        maritalStatus,
        photoDataUrl || null,
      ]
    );

    return NextResponse.json({ ok: true, message: "Profile saved." });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: "Unable to save profile." },
      { status: 500 }
    );
  }
}
