import pool from "@/lib/db";

const PREFIX_MAP: Record<string, string> = {
  admin: "AD",
  clerk: "AD",
  editor: "AD",
  teacher: "TE",
  bursar: "TE",
};

export async function generateAccountId(role: string) {
  const prefix = PREFIX_MAP[role];
  if (!prefix) {
    throw new Error("Unsupported role for account ID generation.");
  }

  const { rows } = await pool.query<{ account_id: string }>(
    `SELECT account_id
     FROM users
     WHERE account_id LIKE $1
     ORDER BY account_id DESC
     LIMIT 1`,
    [`${prefix}%`]
  );

  const lastId = rows[0]?.account_id ?? `${prefix}0000`;
  const lastNumber = Number(lastId.replace(prefix, "")) || 0;
  const nextNumber = String(lastNumber + 1).padStart(4, "0");
  return `${prefix}${nextNumber}`;
}
