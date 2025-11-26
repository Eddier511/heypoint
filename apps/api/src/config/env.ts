import dotenv from "dotenv";
dotenv.config();

export const env = {
  port: Number(process.env.PORT ?? 4000),
  corsOrigin: process.env.CORS_ORIGIN ?? "*",
  fbProjectId: process.env.FB_PROJECT_ID ?? "",
  fbClientEmail: process.env.FB_CLIENT_EMAIL ?? "",
  fbPrivateKey: (process.env.FB_PRIVATE_KEY ?? "").replace(/\\n/g, "\n"),
};
