// Cria (ou atualiza) o colaborador inicial. Uso: npm run seed:admin
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

config({ path: ".env.local", quiet: true });

async function main() {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD } = process.env;
  const name = process.env.SEED_ADMIN_NAME || "Administrador";
  const position = process.env.SEED_ADMIN_POSITION || "Administrador";
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SEED_ADMIN_EMAIL || !SEED_ADMIN_PASSWORD) {
    throw new Error("Defina SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SEED_ADMIN_EMAIL e SEED_ADMIN_PASSWORD no .env.local");
  }

  const email = SEED_ADMIN_EMAIL.trim().toLowerCase();
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const { error } = await supabase.from("colaboradores").upsert(
    { name, email, position, passwordhash: await bcrypt.hash(SEED_ADMIN_PASSWORD, 10) },
    { onConflict: "email" },
  );
  if (error) throw error;

  console.log(`Colaborador "${email}" pronto.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
