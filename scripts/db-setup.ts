// Cria as tabelas executando supabase/schema.sql. Uso: npm run db:setup
// Requer SUPABASE_DB_URL no .env.local (Connect > Connection string > Session pooler).
import { readFileSync } from "node:fs";
import { config } from "dotenv";
import { Client } from "pg";

config({ path: ".env.local", quiet: true });

async function main() {
  const connectionString = process.env.SUPABASE_DB_URL;
  if (!connectionString) {
    throw new Error("Defina SUPABASE_DB_URL no .env.local (string de conexão do Postgres do Supabase).");
  }

  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    await client.query("begin");
    await client.query(readFileSync("supabase/schema.sql", "utf8"));
    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw error;
  }

  const { rows } = await client.query<{ table_name: string }>(
    "select table_name from information_schema.tables where table_schema = 'public' order by table_name",
  );
  await client.end();
  console.log("Tabelas no schema public:", rows.map((r) => r.table_name).join(", "));
}

main().catch((error) => {
  console.error("Falha ao criar as tabelas:", error instanceof Error ? error.message : error);
  process.exit(1);
});
