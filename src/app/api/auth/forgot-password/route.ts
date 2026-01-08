import { NextResponse } from "next/server";
import crypto from "crypto";
import pool from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";

const RESET_EXPIRY_HOURS = Number(
  process.env.RESET_TOKEN_EXPIRY_HOURS ?? 2
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body?.email ?? "").trim().toLowerCase();

    if (!email) {
      return NextResponse.json(
        { ok: false, message: "Email is required." },
        { status: 400 }
      );
    }

    const { rows } = await pool.query<{
      id: string;
      full_name: string | null;
      email: string;
    }>("SELECT id, full_name, email FROM users WHERE email = $1 LIMIT 1", [
      email,
    ]);
    const user = rows[0];

    if (!user) {
      return NextResponse.json({
        ok: true,
        message: "If the account exists, a reset link has been sent.",
      });
    }

    const token = crypto.randomBytes(24).toString("hex");
    const expiresAt = new Date(
      Date.now() + RESET_EXPIRY_HOURS * 60 * 60 * 1000
    );

    await pool.query(
      "UPDATE users SET reset_token = $1, reset_token_expires_at = $2 WHERE id = $3",
      [token, expiresAt.toISOString(), user.id]
    );

    const baseUrl = process.env.FRONTEND_BASE_URL ?? "http://localhost:3000";
    const resetLink = `${baseUrl}/reset-password?token=${token}`;

    await sendPasswordResetEmail({
      to: user.email,
      fullName: user.full_name ?? "",
      resetLink,
      expiryHours: RESET_EXPIRY_HOURS,
    });

    return NextResponse.json({
      ok: true,
      message: "If the account exists, a reset link has been sent.",
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: "Unable to process request." },
      { status: 500 }
    );
  }
}
