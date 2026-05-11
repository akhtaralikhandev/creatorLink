import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // DIRECT_URL bypasses the Supabase pgbouncer pooler.
    // The pooler (DATABASE_URL) drops connections during migrations (P1017).
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL!,
  },
});
