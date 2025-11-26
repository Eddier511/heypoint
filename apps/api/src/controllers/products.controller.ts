import { type Request, type Response } from "express";
import { db } from "../config/firebase";

export async function listProducts(_req: Request, res: Response) {
  try {
    const q = await db.collection("products").orderBy("name").get();
    const data = q.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.json(data);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

export async function getProduct(req: Request, res: Response) {
  try {
    const ref = db.collection("products").doc(req.params.id);
    const snap = await ref.get();
    if (!snap.exists)
      return res.status(404).json({ error: "Product not found" });
    res.json({ id: snap.id, ...snap.data() });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

export async function createProduct(req: Request, res: Response) {
  try {
    const { name, price, category, image } = req.body as {
      name: string;
      price: number;
      category?: string;
      image?: string;
    };
    if (!name || price == null)
      return res.status(400).json({ error: "name & price required" });

    const ref = await db.collection("products").add({
      name,
      price,
      category: category ?? null,
      image: image ?? null,
      createdAt: new Date().toISOString(),
    });

    res.status(201).json({ id: ref.id });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}
