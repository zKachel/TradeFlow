import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { PGlite, type Transaction } from "@electric-sql/pglite";

const root = join(__dirname, "..");

/** Startet eine frische In-Memory-Postgres mit Supabase-Nachbildung und allen Migrationen. */
export async function createTestDb() {
  const db = new PGlite();
  await db.exec(readFileSync(join(root, "tests", "supabase-stub.sql"), "utf8"));
  const migrations = readdirSync(join(root, "migrations"))
    .filter((f) => f.endsWith(".sql"))
    .sort();
  for (const file of migrations) {
    await db.exec(readFileSync(join(root, "migrations", file), "utf8"));
  }
  return db;
}

export type Db = PGlite;
export type Tx = Transaction;

/** Legt einen Nutzer an (wie Supabase Auth bei der Registrierung). */
export async function createUser(
  db: Db,
  email: string,
  meta: Record<string, unknown> = {},
): Promise<string> {
  const r = await db.query<{ id: string }>(
    "insert into auth.users (email, raw_user_meta_data) values ($1, $2) returning id",
    [email, JSON.stringify(meta)],
  );
  return r.rows[0].id;
}

/** Führt fn als angemeldeter Nutzer aus (Rolle authenticated + JWT-Claims), danach Rollback-frei Commit. */
export async function asUser<T>(
  db: Db,
  userId: string,
  fn: (tx: Tx) => Promise<T>,
): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.query("select set_config('request.jwt.claims', $1, true)", [
      JSON.stringify({ sub: userId, role: "authenticated" }),
    ]);
    await tx.exec("set local role authenticated");
    return fn(tx);
  });
}

/** Führt fn als nicht angemeldeter Besucher (anon) aus. */
export async function asAnon<T>(
  db: Db,
  fn: (tx: Tx) => Promise<T>,
): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.query("select set_config('request.jwt.claims', $1, true)", [
      JSON.stringify({ role: "anon" }),
    ]);
    await tx.exec("set local role anon");
    return fn(tx);
  });
}
