import { db } from "../core/db";

export type UserRole = "user" | "admin";

export async function getUserRole(userId: string): Promise<UserRole> {
  const result = await db.query(
    `
    SELECT role
    FROM admins
    WHERE user_id = $1
    LIMIT 1;
    `,
    [userId]
  );

  if (result.rows.length === 0) {
    return "user";
  }

  return result.rows[0].role === "admin" ? "admin" : "user";
}
