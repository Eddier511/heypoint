// src/api.ts
import axios from "axios";

/**
 * Configuración base de Axios para conectar el frontend con el backend.
 *
 * Durante desarrollo: usa http://localhost:3000
 * En producción: apunta al dominio o hosting donde publiques tu API.
 */

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: false, // si usas cookies o autenticación
});

// ============================
// Sección de ENDPOINTS
// ============================

// --- Autenticación ---
export const AuthAPI = {
  register: (data: { email: string; password: string }) =>
    api.post("/auth/register", data),

  login: (data: { email: string; password: string }) =>
    api.post("/auth/login", data),

  logout: () => api.post("/auth/logout"),
};

// --- Productos ---
export const ProductsAPI = {
  getAll: () => api.get("/products"),
  getById: (id: string) => api.get(`/products/${id}`),
  create: (data: any) => api.post("/products", data),
  update: (id: string, data: any) => api.put(`/products/${id}`, data),
  delete: (id: string) => api.delete(`/products/${id}`),
};

// --- Carrito ---
export const CartAPI = {
  getUserCart: (userId: string) => api.get(`/cart/${userId}`),
  addToCart: (data: any) => api.post("/cart", data),
  removeFromCart: (id: string) => api.delete(`/cart/${id}`),
  clearCart: (userId: string) => api.delete(`/cart/clear/${userId}`),
};

// ============================
// Ejemplo de uso
// ============================
// import { ProductsAPI } from "./api";
// const products = await ProductsAPI.getAll();

export default api;
