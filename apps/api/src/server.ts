import app from "./app";
import { env } from "./config/env";

app.listen(env.port, () => {
  console.log(`✅ HeyPoint Backend API (TS) en http://localhost:${env.port}`);
});
