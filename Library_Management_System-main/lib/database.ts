import { neon } from "@neondatabase/serverless"

function getSql() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error("DATABASE_URL must be configured.")
  }
  return neon(databaseUrl)
}

export const sql = getSql()

let schemaReady: Promise<void> | null = null

export function ensureDatabaseSchema() {
  if (!schemaReady) {
    schemaReady = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS books (
          id INTEGER PRIMARY KEY,
          title TEXT NOT NULL,
          author TEXT NOT NULL,
          genre TEXT NOT NULL DEFAULT 'Uncategorized',
          year INTEGER NOT NULL,
          status TEXT NOT NULL CHECK (status IN ('Available', 'Checked Out')),
          borrowed_date TEXT,
          cover_image_key TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          borrow_count INTEGER NOT NULL DEFAULT 0 CHECK (borrow_count >= 0)
        )
      `
      await sql`ALTER TABLE books ADD COLUMN IF NOT EXISTS genre TEXT NOT NULL DEFAULT 'Uncategorized'`
      await sql`ALTER TABLE books ADD COLUMN IF NOT EXISTS borrowed_date TEXT`
      await sql`ALTER TABLE books ADD COLUMN IF NOT EXISTS cover_image_key TEXT`
      await sql`ALTER TABLE books ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
      await sql`ALTER TABLE books ADD COLUMN IF NOT EXISTS borrow_count INTEGER NOT NULL DEFAULT 0`
      await sql`ALTER TABLE books ADD COLUMN IF NOT EXISTS title TEXT`
      await sql`ALTER TABLE books ADD COLUMN IF NOT EXISTS author TEXT`
      await sql`ALTER TABLE books ADD COLUMN IF NOT EXISTS year INTEGER`
      await sql`ALTER TABLE books ADD COLUMN IF NOT EXISTS status TEXT`
      await sql`UPDATE books SET status = 'Available' WHERE status IS NULL`
      await sql`ALTER TABLE books ALTER COLUMN status SET NOT NULL`
      await sql`
        CREATE TABLE IF NOT EXISTS patrons (
          id INTEGER PRIMARY KEY,
          name TEXT NOT NULL
        )
      `
      await sql`
        CREATE TABLE IF NOT EXISTS transaction_history (
          id BIGSERIAL PRIMARY KEY,
          transaction_type TEXT NOT NULL CHECK (transaction_type IN ('arrival', 'removal', 'borrow', 'return', 'extend', 'patron_add', 'patron_remove')),
          book_id INTEGER,
          book_title TEXT,
          patron_id INTEGER,
          patron_name TEXT,
          extension_days INTEGER,
          quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
          occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `
      // Replace the check constraint atomically so concurrent schema initialization is safe.
      await sql`
        ALTER TABLE transaction_history
        DROP CONSTRAINT IF EXISTS transaction_history_transaction_type_check,
        ADD CONSTRAINT transaction_history_transaction_type_check
          CHECK (transaction_type IN ('arrival', 'removal', 'borrow', 'return', 'extend', 'patron_add', 'patron_remove'))
      `
      await sql`ALTER TABLE transaction_history ALTER COLUMN book_id DROP NOT NULL`
      await sql`ALTER TABLE transaction_history ALTER COLUMN book_title DROP NOT NULL`
      await sql`ALTER TABLE transaction_history ADD COLUMN IF NOT EXISTS extension_days INTEGER`
      await sql`CREATE INDEX IF NOT EXISTS transaction_history_occurred_at_idx ON transaction_history (occurred_at DESC)`
      await sql`CREATE INDEX IF NOT EXISTS transaction_history_patron_name_idx ON transaction_history (LOWER(patron_name))`
      await sql`
        CREATE TABLE IF NOT EXISTS loans (
          patron_id INTEGER NOT NULL REFERENCES patrons(id) ON DELETE RESTRICT,
          book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE RESTRICT,
          PRIMARY KEY (patron_id, book_id),
          borrowed_date TIMESTAMP NOT NULL,
          due_return_date DATE NOT NULL,
          extended_at TIMESTAMP
        )
      `
      await sql`ALTER TABLE loans ADD COLUMN IF NOT EXISTS borrowed_date TIMESTAMP`
      await sql`ALTER TABLE loans ADD COLUMN IF NOT EXISTS due_return_date DATE`
      await sql`ALTER TABLE loans ADD COLUMN IF NOT EXISTS extended_at TIMESTAMP`
      await sql`
        UPDATE books
        SET status = 'Checked Out'
        WHERE id IN (SELECT book_id FROM loans)
      `
      await sql`
        UPDATE books
        SET borrow_count = 1
        WHERE status = 'Checked Out' AND borrow_count = 0
      `

    })().catch((error) => {
      schemaReady = null
      throw error
    })
  }
  return schemaReady
}
