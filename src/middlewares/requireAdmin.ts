import { Request, Response, NextFunction } from "express";
import { getUserRole } from "../services/admin";

export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const userId = (req as any).userId as string | undefined;

  if (!userId) {
    return res.status(401).json({ error: "UNAUTHENTICATED" });
  }

  try {
    const role = await getUserRole(userId);

    if (role !== "admin") {
      return res.status(403).json({
        error: "FORBIDDEN",
        message: "관리자 권한이 필요합니다.",
      });
    }

    (req as any).role = role;
    next();
  } catch (err) {
    console.error("requireAdmin error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
