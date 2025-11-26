import { type Request, type Response } from "express";
import { auth, db } from "../config/firebase";

export async function register(req: Request, res: Response) {
  try {
    const { email, password, displayName } = req.body as {
      email: string;
      password: string;
      displayName?: string;
    };
    if (!email || !password)
      return res.status(400).json({ error: "email & password required" });

    const user = await auth.createUser({ email, password, displayName });
    await db
      .collection("users")
      .doc(user.uid)
      .set({
        email: user.email,
        displayName: user.displayName ?? "",
        createdAt: new Date().toISOString(),
      });

    res.status(201).json({ uid: user.uid, email: user.email });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email } = req.body as { email: string };
    const user = await auth.getUserByEmail(email);
    res.json({ uid: user.uid, email: user.email });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

export async function me(req: Request, res: Response) {
  try {
    // @ts-expect-error added by middleware
    const uid: string = req.user.uid;
    const snap = await db.collection("users").doc(uid).get();
    res.json({ uid, ...snap.data() });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}
