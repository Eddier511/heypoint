// src/lib/api.ts
import axios from "axios";

// ✅ Prioriza prod URL y evita caer a localhost en producción
const raw =
  (import.meta.env.VITE_API_URL as string | undefined) ||
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ||
  "";

// Limpia por si alguien puso "url1,url2"
const normalizedBase = raw.split(",")[0].trim().replace(/\/+$/, "");

// Si viene solo dominio, le agregamos /api
const API_URL =
  normalizedBase.length > 0
    ? normalizedBase.endsWith("/api")
      ? normalizedBase
      : `${normalizedBase}/api`
    : import.meta.env.PROD
      ? "https://api.heypoint.com.ar/api" // ✅ fallback seguro en producción
      : "http://localhost:4000/api"; // ✅ fallback solo para local

export const STORAGE_KEYS = {
  idToken: "heypoint_id_token",
} as const;

export function setIdToken(token: string | null) {
  if (!token) localStorage.removeItem(STORAGE_KEYS.idToken);
  else localStorage.setItem(STORAGE_KEYS.idToken, token);
}

export function getIdTokenFromStorage() {
  return localStorage.getItem(STORAGE_KEYS.idToken);
}

export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: false,
});

// 🔥 mete token automáticamente si existe
api.interceptors.request.use((config) => {
  const token = getIdTokenFromStorage();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --------------------
// PUBLIC / CUSTOMER
// --------------------
export const CategoriesAPI = {
  getAll: () => api.get("/categories"),
};

export const ProductsAPI = {
  getAll: () => api.get("/products"),
  getById: (id: string) => api.get(`/products/${id}`),
};

// (si tu backend los tiene públicos)
export const CartAPI = {
  getUserCart: (userId: string) => api.get(`/cart/${userId}`),
  addToCart: (data: any) => api.post("/cart", data),
  removeFromCart: (id: string) => api.delete(`/cart/${id}`),
  clearCart: (userId: string) => api.delete(`/cart/clear/${userId}`),
};

// --------------------
// PROFILE (Firestore customers/{uid})
// --------------------
export type CustomerProfile = {
  phone: string;
  dni: string;
  birthDate: string; // YYYY-MM-DD
  apartmentNumber?: string;
  pickupPoint: string;
};

export const CustomersAPI = {
  me: () => api.get("/customers/me"),
  upsertMe: (data: CustomerProfile) => api.put("/customers/me", data),
};

// --------------------
// (Opcional) AUTH backend propio
// --------------------
export const AuthAPI = {
  register: (data: { email: string; password: string }) =>
    api.post("/auth/register", data),
  login: (data: { email: string; password: string }) =>
    api.post("/auth/login", data),
  logout: () => api.post("/auth/logout"),
};

export default api;
