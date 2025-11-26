import { type NextFunction, type Request, type Response } from "express";
import { auth } from "../config/firebase";

export async function verifyIdToken(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const header = req.headers.authorization ?? "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Missing token" });

    const decoded = await auth.verifyIdToken(token);
    // @ts-expect-error attach user for downstream handlers
    req.user = decoded;
    next();
  } catch (err: any) {
    console.error("verifyIdToken error:", err?.message);
    res.status(401).json({ error: "Invalid token" });
  }
}
