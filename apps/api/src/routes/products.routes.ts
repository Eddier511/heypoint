import { Router } from "express";
import {
  listProducts,
  getProduct,
  createProduct,
} from "../controllers/products.controller";
import { verifyIdToken } from "../middlewares/auth.middleware";

const router = Router();
router.get("/", listProducts);
router.get("/:id", getProduct);
router.post("/", verifyIdToken, createProduct);
export default router;
