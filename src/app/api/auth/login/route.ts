import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import pool from "@/lib/db";

type UserRow = {
  id: string | number;
  email?: string;
  username?: string;
  password?: string;
  user_role?: string;
  full_name?: string;
  account_id?: string;
  must_change_password?: boolean;
};

const USER_TABLE = process.env.AUTH_USER_TABLE ?? "users";
const EMAIL_COLUMN = process.env.AUTH_USER_EMAIL_COLUMN ?? "email";
const USERNAME_COLUMN = process.env.AUTH_USER_USERNAME_COLUMN ?? "username";
const PASSWORD_COLUMN = process.env.AUTH_USER_PASSWORD_COLUMN ?? "password";

function isBcryptHash(value: string) {
  return value.startsWith("$2a$") || value.startsWith("$2b$") || value.startsWith("$2y$");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const identifier = String(body?.identifier ?? "").trim();
    const password = String(body?.password ?? "");

    if (!identifier || !password) {
      return NextResponse.json(
        { ok: false, message: "Missing login credentials." },
        { status: 400 }
      );
    }

    const query = `
      SELECT id, ${EMAIL_COLUMN} as email, ${USERNAME_COLUMN} as username, ${PASSWORD_COLUMN} as password, user_role, full_name, account_id, must_change_password
      FROM ${USER_TABLE}
      WHERE ${EMAIL_COLUMN} = $1 OR ${USERNAME_COLUMN} = $1
      LIMIT 1
    `;
    const { rows } = await pool.query<UserRow>(query, [identifier]);
    const user = rows[0];

    if (!user?.password) {
      return NextResponse.json(
        { ok: false, message: "Invalid credentials." },
        { status: 401 }
      );
    }

    let match = false;
    if (isBcryptHash(user.password)) {
      match = await bcrypt.compare(password, user.password);
    } else {
      match = password === user.password;
    }

    if (!match) {
      return NextResponse.json(
        { ok: false, message: "Invalid credentials." },
        { status: 401 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Authenticated.",
      user: {
        id: user.id,
        email: user.email ?? null,
        username: user.username ?? null,
        user_role: user.user_role ?? null,
        full_name: user.full_name ?? null,
        account_id: user.account_id ?? null,
        must_change_password: user.must_change_password ?? false,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: "Login failed." },
      { status: 500 }
    );
  }
}
