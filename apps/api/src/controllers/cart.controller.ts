import { type Request, type Response } from "express";
import { db } from "../config/firebase";

export async function getCart(req: Request, res: Response) {
  try {
    // @ts-expect-error added by middleware
    const uid: string = req.user.uid;
    const ref = db.collection("carts").doc(uid);
    const snap = await ref.get();
    res.json({ items: snap.exists ? snap.data()?.items ?? [] : [] });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

export async function addToCart(req: Request, res: Response) {
  try {
    // @ts-expect-error added by middleware
    const uid: string = req.user.uid;
    const { productId, qty = 1 } = req.body as {
      productId: string;
      qty?: number;
    };
    if (!productId)
      return res.status(400).json({ error: "productId required" });

    const ref = db.collection("carts").doc(uid);
    await db.runTransaction(async (t) => {
      const snap = await t.get(ref);
      const items: Array<{ productId: string; qty: number }> = snap.exists
        ? snap.data()?.items ?? []
        : [];
      const i = items.findIndex((it) => it.productId === productId);
      if (i >= 0) items[i].qty += qty;
      else items.push({ productId, qty });
      t.set(ref, { items }, { merge: true });
    });

    res.status(200).json({ ok: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

export async function clearCart(req: Request, res: Response) {
  try {
    // @ts-expect-error added by middleware
    const uid: string = req.user.uid;
    await db.collection("carts").doc(uid).set({ items: [] });
    res.json({ ok: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}
