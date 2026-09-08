// src/lib/api.ts
import axios from "axios";
import { getAuth } from "firebase/auth";

// ✅ Prioriza prod URL y evita caer a localhost en producción
const raw =
  (import.meta.env.VITE_API_URL as string | undefined) ||
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ||
  "";

// Limpia por si alguien puso "url1,url2"
const normalizedBase = raw.split(",")[0].trim().replace(/\/+$/, "");

// Si viene solo dominio, le agregamos /api
export const API_URL =
  normalizedBase.length > 0
    ? normalizedBase.endsWith("/api")
      ? normalizedBase
      : `${normalizedBase}/api`
    : import.meta.env.PROD
      ? "https://api.heypoint.com.ar/api" // ✅ fallback seguro en producción
      : "http://localhost:4000/api"; // ✅ fallback solo para local

export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: false,
});

// 🔥 mete token Firebase actual automáticamente si existe
api.interceptors.request.use(async (config) => {
  const token = await getAuth().currentUser?.getIdToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --------------------------------
// Wrappers (opcionales)
// --------------------------------
export const CategoriesAPI = {
  getAll: () => api.get("/categories"),
};

export const ProductsAPI = {
  getAll: (params?: any) => api.get("/products", { params }),
  getById: (id: string) => api.get(`/products/${id}`),
};

export type CustomerProfile = {
  phone: string;
  dni: string;
  birthDate: string; // YYYY-MM-DD
  apartmentNumber?: string;
  pickupPoint: string;
  residenceAuthorizationAccepted?: boolean;
  termsAccepted?: boolean;
  termsAcceptedAt?: string;
  termsVersion?: string;
  privacyAccepted?: boolean;
  privacyAcceptedAt?: string;
  privacyVersion?: string;
};

export const CustomersAPI = {
  me: () => api.get("/customers/me"),
  upsertMe: (data: CustomerProfile) => api.put("/customers/me", data),
};
