import { Router } from "express";
import { addToCart, clearCart, getCart } from "../controllers/cart.controller";
import { verifyIdToken } from "../middlewares/auth.middleware";

const router = Router();
router.get("/", verifyIdToken, getCart);
router.post("/add", verifyIdToken, addToCart);
router.post("/clear", verifyIdToken, clearCart);
export default router;
