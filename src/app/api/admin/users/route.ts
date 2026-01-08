import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import pool from "@/lib/db";
import { generateAccountId } from "@/lib/id";
import { sendAccountEmail } from "@/lib/email";
import { validatePasswordPolicy } from "@/lib/password";

const TEMP_PASSWORD_LENGTH = 10;

function generateTempPassword() {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#$%";
  let output = "";
  for (let i = 0; i < TEMP_PASSWORD_LENGTH; i += 1) {
    output += chars[Math.floor(Math.random() * chars.length)];
  }
  return output;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const fullName = String(body?.full_name ?? "").trim();
    const email = String(body?.email ?? "").trim().toLowerCase();
    const role = String(body?.role ?? "admin").trim();
    const status = String(body?.status ?? "active").trim();
    const category = String(body?.category ?? "school").trim();
    const school = String(body?.school ?? "").trim();

    if (!email || !role) {
      return NextResponse.json(
        { ok: false, message: "Email and role are required." },
        { status: 400 }
      );
    }

    if (role === "student") {
      return NextResponse.json(
        {
          ok: false,
          message: "Student accounts are created by school administrators.",
        },
        { status: 403 }
      );
    }

    const accountId = await generateAccountId(role);
    let tempPassword = generateTempPassword();
    while (!validatePasswordPolicy(tempPassword).valid) {
      tempPassword = generateTempPassword();
    }
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const { rows } = await pool.query<{ id: string }>(
      `INSERT INTO users (email, password, status, user_role, full_name, account_id, category, school, must_change_password)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id`,
      [
        email,
        passwordHash,
        status,
        role,
        fullName || null,
        accountId,
        category,
        category === "diocese" ? null : school || null,
        true,
      ]
    );

    await sendAccountEmail({
      to: email,
      fullName: fullName || "User",
      accountId,
      tempPassword,
      role,
    });

    return NextResponse.json({
      ok: true,
      message: "User created and notification sent.",
      user: {
        id: rows[0]?.id ?? null,
        email,
        account_id: accountId,
        full_name: fullName || null,
        user_role: role,
        status,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: "Unable to create user." },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const { rows } = await pool.query(
      `SELECT id, account_id, full_name, email, user_role, status, category, school
       FROM users
       ORDER BY date_created DESC`
    );

    return NextResponse.json({ ok: true, users: rows });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: "Unable to fetch users." },
      { status: 500 }
    );
  }
}
