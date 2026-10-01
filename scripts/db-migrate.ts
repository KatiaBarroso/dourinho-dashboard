// Aplica as migrações de supabase/migrations em ordem, sem apagar dados. Uso: npm run db:migrate
// As migrações são idempotentes. Requer SUPABASE_DB_URL no .env.local (Session pooler).
import { readdirSync, readFileSync } from "node:fs";
import { config } from "dotenv";
import { Client } from "pg";

config({ path: ".env.local", quiet: true });

const DIR = "supabase/migrations";

async function main() {
  const connectionString = process.env.SUPABASE_DB_URL;
  if (!connectionString) {
    throw new Error("Defina SUPABASE_DB_URL no .env.local (string de conexão do Postgres do Supabase).");
  }

  const files = readdirSync(DIR).filter((f) => f.endsWith(".sql")).sort();
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    for (const file of files) {
      await client.query("begin");
      try {
        await client.query(readFileSync(`${DIR}/${file}`, "utf8"));
        await client.query("commit");
        console.log(`Migração aplicada: ${file}`);
      } catch (error) {
        await client.query("rollback");
        throw new Error(`${file}: ${error instanceof Error ? error.message : error}`);
      }
    }
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("Falha ao aplicar as migrações:", error instanceof Error ? error.message : error);
  process.exit(1);
});
