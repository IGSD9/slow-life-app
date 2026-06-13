import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });
import { defineConfig } from "prisma/config";

/** Vercel から db.*.supabase.co:5432 へ届かないため、pooler の session モード (5432) を優先 */
function getMigrationDatabaseUrl(): string {
  const pooler = process.env.DATABASE_URL;
  if (pooler?.includes("pooler.supabase.com")) {
    return pooler.replace(":6543/", ":5432/").replace(/\?pgbouncer=true/, "");
  }
  const direct = process.env.DIRECT_URL;
  if (direct) return direct;
  if (pooler) return pooler;
  throw new Error("DATABASE_URL or DIRECT_URL is required for migrations");
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "npx tsx prisma/seed.ts",
  },
  datasource: {
    url: getMigrationDatabaseUrl(),
  },
});
