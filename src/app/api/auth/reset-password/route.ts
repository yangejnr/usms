import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import pool from "@/lib/db";
import { validatePasswordPolicy } from "@/lib/password";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const token = String(body?.token ?? "").trim();
    const password = String(body?.password ?? "");

    if (!token || !password) {
      return NextResponse.json(
        { ok: false, message: "Token and password are required." },
        { status: 400 }
      );
    }

    const policy = validatePasswordPolicy(password);
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
      reset_token_expires_at: string | null;
    }>(
      "SELECT id, reset_token_expires_at FROM users WHERE reset_token = $1 LIMIT 1",
      [token]
    );
    const user = rows[0];

    if (!user || !user.reset_token_expires_at) {
      return NextResponse.json(
        { ok: false, message: "Invalid or expired token." },
        { status: 400 }
      );
    }

    if (Date.parse(user.reset_token_expires_at) < Date.now()) {
      return NextResponse.json(
        { ok: false, message: "Reset token has expired." },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await pool.query(
      `UPDATE users
       SET password = $1,
           reset_token = NULL,
           reset_token_expires_at = NULL,
           must_change_password = false
       WHERE id = $2`,
      [passwordHash, user.id]
    );

    return NextResponse.json({
      ok: true,
      message: "Password updated successfully.",
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: "Unable to reset password." },
      { status: 500 }
    );
  }
}
