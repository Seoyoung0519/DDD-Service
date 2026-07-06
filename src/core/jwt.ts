import jwt from "jsonwebtoken";
import { config } from "./config";
import type { UserRole } from "../services/admin";

export interface JwtPayload {
  userId: string;
  role: UserRole;
}

export function createAccessToken(
  userId: string,
  role: UserRole = "user"
): string {
  return jwt.sign({ userId, role }, config.jwtSecret, { expiresIn: "1h" });
}

export function verifyAccessToken(token: string): JwtPayload {
  const payload = jwt.verify(token, config.jwtSecret) as Partial<JwtPayload>;

  return {
    userId: payload.userId as string,
    role: payload.role === "admin" ? "admin" : "user",
  };
}
