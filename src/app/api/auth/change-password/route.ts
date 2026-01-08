import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import pool from "@/lib/db";
import { validatePasswordPolicy } from "@/lib/password";
import { getAuthUserFromRequest } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const authUser = await getAuthUserFromRequest(request);
    if (!authUser) {
      return NextResponse.json(
        { ok: false, message: "Unauthorized." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const currentPassword = String(body?.currentPassword ?? "");
    const newPassword = String(body?.newPassword ?? "");

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { ok: false, message: "All fields are required." },
        { status: 400 }
      );
    }

    const policy = validatePasswordPolicy(newPassword);
    if (!policy.valid) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Password must be at least 8 characters and include upper, lower, number, and special character.",
        },
        { status: 400 }
      );
    }

    const { rows } = await pool.query<{
      id: string;
      password: string;
    }>(
      `SELECT id, password FROM users
       WHERE id = $1
       LIMIT 1`,
      [authUser.id]
    );
    const user = rows[0];

    if (!user?.password) {
      return NextResponse.json(
        { ok: false, message: "Invalid credentials." },
        { status: 401 }
      );
    }

    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) {
      return NextResponse.json(
        { ok: false, message: "Current password is incorrect." },
        { status: 401 }
      );
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await pool.query(
      `UPDATE users
       SET password = $1,
           must_change_password = true
       WHERE id = $2`,
      [passwordHash, user.id]
    );

    return NextResponse.json({
      ok: true,
      message: "Password updated successfully.",
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: "Unable to update password." },
      { status: 500 }
    );
  }
}
