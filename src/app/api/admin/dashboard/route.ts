import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  try {
    const schoolsResult = await pool.query<{ count: string }>(
      "SELECT COUNT(*)::text as count FROM schools"
    );
    const activeUsersResult = await pool.query<{ count: string }>(
      "SELECT COUNT(*)::text as count FROM users WHERE status = 'active'"
    );
    const inactiveUsersResult = await pool.query<{ count: string }>(
      "SELECT COUNT(*)::text as count FROM users WHERE status = 'inactive'"
    );
    const recentSchoolsResult = await pool.query<{
      id: string;
      name: string;
      school_code: string;
      status: string;
    }>(
      `SELECT id, name, school_code, status
       FROM schools
       ORDER BY date_created DESC
       LIMIT 4`
    );

    return NextResponse.json({
      ok: true,
      stats: {
        totalSchools: Number(schoolsResult.rows[0]?.count ?? 0),
        activeUsers: Number(activeUsersResult.rows[0]?.count ?? 0),
        inactiveUsers: Number(inactiveUsersResult.rows[0]?.count ?? 0),
      },
      recentSchools: recentSchoolsResult.rows,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: "Unable to load dashboard." },
      { status: 500 }
    );
  }
}
