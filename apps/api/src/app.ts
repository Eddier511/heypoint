import express, { type Application } from "express";
import cors from "cors";
import { env } from "./config/env";
import authRoutes from "./routes/auth.routes";
import productsRoutes from "./routes/products.routes";
import cartRoutes from "./routes/cart.routes";

const app: Application = express();

app.use(cors({ origin: env.corsOrigin, credentials: false }));
app.use(express.json({ limit: "2mb" }));

app.get("/", (_req, res) => res.send("🚀 HeyPoint Backend API (TS) en vivo!"));

app.use("/api/auth", authRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/cart", cartRoutes);

app.use((req, res) =>
  res.status(404).json({ error: "Not found", path: req.path })
);

export default app;
