import type { Book, Patron, LibraryStats } from "./types"
import { MAX_BORROWED_BOOKS_PER_PATRON } from "./constants"
import { ensureDatabaseSchema, sql } from "./database"

function getManilaDate(): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date())
  const dateParts: Record<string, string> = {}
  for (const part of parts) {
    if (part.type !== "literal") dateParts[part.type] = part.value
  }
  const { year, month, day } = dateParts
  if (!year || !month || !day) throw new Error("Unable to determine the current date in Asia/Manila.")
  return `${year}-${month}-${day}`
}

function addDaysToDate(date: string, days: number): string {
  const result = new Date(`${date}T00:00:00.000Z`)
  result.setUTCDate(result.getUTCDate() + days)
  return result.toISOString().slice(0, 10)
}

export async function loadBooks(): Promise<Book[]> {
  await ensureDatabaseSchema()
  const rows = await sql`
    SELECT b.id, b.title, b.author, b.genre, b.year, b.status, b.borrowed_date,
           CASE WHEN b.cover_image_key IS NULL THEN NULL ELSE '/api/books/' || b.id::text || '/cover?v=' || md5(b.cover_image_key) END AS cover_image,
           l.due_return_date::text AS due_return_date, l.extended_at
    FROM books b
    LEFT JOIN loans l ON l.book_id = b.id
    ORDER BY b.id
  `
  return rows.map((row) => {
    const dueReturnDate = row.due_return_date ? String(row.due_return_date).slice(0, 10) : null
    const isOverdue =
      row.status === "Checked Out" &&
      Boolean(dueReturnDate) &&
      dueReturnDate! < getManilaDate()
    return {
      id: row.id,
      title: row.title,
      author: row.author,
      genre: row.genre || "Uncategorized",
      year: row.year,
      status: row.status,
      borrowed_date: row.borrowed_date,
      cover_image: row.cover_image,
      due_return_date: dueReturnDate,
      is_overdue: isOverdue,
      is_extended: Boolean(row.extended_at),
    }
  }) as Book[]
}

export async function getBookById(id: number): Promise<Book | undefined> {
  await ensureDatabaseSchema()
  const rows = await sql`
    SELECT b.id, b.title, b.author, b.genre, b.year, b.status, b.borrowed_date,
           CASE WHEN b.cover_image_key IS NULL THEN NULL ELSE '/api/books/' || b.id::text || '/cover?v=' || md5(b.cover_image_key) END AS cover_image,
           l.due_return_date::text AS due_return_date, l.extended_at
    FROM books b
    LEFT JOIN loans l ON l.book_id = b.id
    WHERE b.id = ${id}
  `
  const row = rows[0]
  if (!row) return undefined
  const dueReturnDate = row.due_return_date ? String(row.due_return_date).slice(0, 10) : null
  return {
    ...row,
    borrowed_date: row.borrowed_date,
    cover_image: row.cover_image,
    due_return_date: dueReturnDate,
    is_extended: Boolean(row.extended_at),
    is_overdue:
      row.status === "Checked Out" &&
      Boolean(dueReturnDate) &&
      dueReturnDate! < getManilaDate(),
  } as Book
}

export async function addBook(id: number, title: string, author: string, year: number, genre: string, coverImageKey?: string): Promise<{ success: boolean; message: string; book?: Book }> {
  await ensureDatabaseSchema()
  if (!Number.isInteger(id) || id < 1) {
    return { success: false, message: "Book ID must be a positive whole number." }
  }
  const existing = await sql`SELECT id FROM books WHERE id = ${id}`
  if (existing.length > 0) {
    return { success: false, message: `Book ID ${id} is already in use.` }
  }
  const [book] = await sql`
    INSERT INTO books (id, title, author, genre, year, status, borrowed_date, cover_image_key)
    VALUES (${id}, ${title}, ${author}, ${genre}, ${year}, 'Available', NULL, ${coverImageKey ?? null})
    RETURNING id, title, author, genre, year, status, borrowed_date
  `
  await sql`INSERT INTO transaction_history (transaction_type, book_id, book_title) VALUES ('arrival', ${id}, ${title})`
  return { success: true, message: `Book "${title}" added successfully with ID ${id}.`, book: book as Book }
}

export async function updateBook(id: number, updates: Partial<Pick<Book, "title" | "author" | "genre" | "year">> & { coverImageKey?: string }): Promise<{ success: boolean; message: string }> {
  await ensureDatabaseSchema()
  const existing = await sql`SELECT id FROM books WHERE id = ${id}`
  if (existing.length === 0) return { success: false, message: `Book with ID ${id} not found.` }
  await sql`
    UPDATE books
    SET title = COALESCE(${updates.title ?? null}, title),
        author = COALESCE(${updates.author ?? null}, author),
        genre = COALESCE(${updates.genre ?? null}, genre),
        year = COALESCE(${updates.year ?? null}, year),
        cover_image_key = COALESCE(${updates.coverImageKey ?? null}, cover_image_key)
    WHERE id = ${id}
  `
  return { success: true, message: `Book ID ${id} updated successfully.` }
}

export async function getBookCoverKey(id: number): Promise<string | null> {
  await ensureDatabaseSchema()
  const [book] = await sql`SELECT cover_image_key FROM books WHERE id = ${id}`
  return book?.cover_image_key ?? null
}

export async function deleteBook(id: number): Promise<{ success: boolean; message: string }> {
  await ensureDatabaseSchema()
  const [book] = await sql`SELECT title, status FROM books WHERE id = ${id}`
  if (!book) return { success: false, message: `Book with ID ${id} not found.` }
  if (book.status === "Checked Out") return { success: false, message: `Cannot delete book "${book.title}" - it is currently checked out.` }
  await sql`INSERT INTO transaction_history (transaction_type, book_id, book_title) VALUES ('removal', ${id}, ${book.title})`
  await sql`DELETE FROM loans WHERE book_id = ${id}`
  await sql`DELETE FROM books WHERE id = ${id}`
  return { success: true, message: `Book "${book.title}" deleted successfully.` }
}

export async function loadPatrons(): Promise<Patron[]> {
  await ensureDatabaseSchema()
  const rows = await sql`
    SELECT p.id, p.name,
           COALESCE(array_agg(l.book_id ORDER BY l.book_id) FILTER (WHERE l.book_id IS NOT NULL), ARRAY[]::integer[]) AS books_checked_out
    FROM patrons p
    LEFT JOIN loans l ON l.patron_id = p.id
    GROUP BY p.id, p.name
    ORDER BY p.id
  `
  return rows as Patron[]
}

export async function getPatronById(id: number): Promise<Patron | undefined> {
  const patrons = await loadPatrons()
  return patrons.find((patron) => patron.id === id)
}

export async function addPatron(id: number, name: string): Promise<{ success: boolean; message: string; patron?: Patron }> {
  await ensureDatabaseSchema()
  if (!Number.isInteger(id) || id < 1) {
    return { success: false, message: "Patron ID must be a positive whole number." }
  }
  const existing = await sql`SELECT id FROM patrons WHERE id = ${id}`
  if (existing.length > 0) {
    return { success: false, message: `Patron ID ${id} is already in use.` }
  }
  await sql`INSERT INTO patrons (id, name) VALUES (${id}, ${name})`
  await sql`
    INSERT INTO transaction_history (transaction_type, patron_id, patron_name)
    VALUES ('patron_add', ${id}, ${name})
  `
  return { success: true, message: `Patron "${name}" added successfully with ID ${id}.`, patron: { id, name, books_checked_out: [] } }
}

export async function updatePatron(id: number, name: string): Promise<{ success: boolean; message: string }> {
  await ensureDatabaseSchema()
  const result = await sql`UPDATE patrons SET name = ${name} WHERE id = ${id} RETURNING id`
  if (result.length === 0) return { success: false, message: `Patron with ID ${id} not found.` }
  return { success: true, message: `Patron ID ${id} updated successfully.` }
}

export async function deletePatron(id: number): Promise<{ success: boolean; message: string }> {
  await ensureDatabaseSchema()
  const [patron] = await sql`
    SELECT p.name, COUNT(l.book_id)::int AS loan_count
    FROM patrons p
    LEFT JOIN loans l ON l.patron_id = p.id
    WHERE p.id = ${id}
    GROUP BY p.id, p.name
  `
  if (!patron) return { success: false, message: `Patron with ID ${id} not found.` }
  if (patron.loan_count > 0) return { success: false, message: `Cannot delete patron "${patron.name}" - they have ${patron.loan_count} book(s) checked out.` }
  await sql`DELETE FROM patrons WHERE id = ${id}`
  await sql`
    INSERT INTO transaction_history (transaction_type, patron_id, patron_name)
    VALUES ('patron_remove', ${id}, ${patron.name})
  `
  return { success: true, message: `Patron "${patron.name}" deleted successfully.` }
}

export async function borrowBook(bookId: number, patronId: number, durationDays = 14): Promise<{ success: boolean; message: string }> {
  await ensureDatabaseSchema()
  if (!Number.isInteger(durationDays) || durationDays < 1) {
    return { success: false, message: "Borrowing duration must be a positive whole number of days." }
  }

  const borrowedDate = new Date().toISOString().replace("T", " ").slice(0, 19)
  const dueDate = addDaysToDate(getManilaDate(), durationDays)
  const [patronRows, loanCountRows, bookRows, loan] = await sql.transaction((tx) => [
    tx`SELECT id, name FROM patrons WHERE id = ${patronId} FOR UPDATE`,
    tx`SELECT COUNT(*)::int AS loan_count FROM loans WHERE patron_id = ${patronId}`,
    tx`SELECT title, status FROM books WHERE id = ${bookId}`,
    tx`
      WITH updated_book AS (
        UPDATE books
        SET status = 'Checked Out',
            borrowed_date = ${borrowedDate},
            borrow_count = borrow_count + 1
        WHERE id = ${bookId}
          AND status = 'Available'
          AND EXISTS (SELECT 1 FROM patrons WHERE id = ${patronId})
          AND (SELECT COUNT(*) FROM loans WHERE patron_id = ${patronId}) < ${MAX_BORROWED_BOOKS_PER_PATRON}
        RETURNING id
      )
      INSERT INTO loans (patron_id, book_id, borrowed_date, due_return_date)
      SELECT ${patronId}, id, ${borrowedDate}, ${dueDate}
      FROM updated_book
      RETURNING book_id
    `,
  ])
  const patron = patronRows[0]
  if (!patron) return { success: false, message: `Patron with ID ${patronId} not found.` }
  if (loanCountRows[0].loan_count >= MAX_BORROWED_BOOKS_PER_PATRON) {
    return {
      success: false,
      message: `Patron "${patron.name}" has reached the ${MAX_BORROWED_BOOKS_PER_PATRON}-book checkout limit.`,
    }
  }
  const book = bookRows[0]
  if (!book) return { success: false, message: `Book with ID ${bookId} not found.` }
  if (book.status === "Checked Out") return { success: false, message: `Book "${book.title}" is currently checked out.` }
  if (loan.length === 0) return { success: false, message: `Book "${book.title}" is currently checked out.` }
  await sql`INSERT INTO transaction_history (transaction_type, book_id, book_title, patron_id, patron_name) VALUES ('borrow', ${bookId}, ${book.title}, ${patronId}, ${patron.name})`
  return { success: true, message: `Book "${book.title}" borrowed successfully by ${patron.name}.` }
}

export async function returnBook(bookId: number, patronId: number): Promise<{ success: boolean; message: string }> {
  await ensureDatabaseSchema()
  const [book] = await sql`SELECT title FROM books WHERE id = ${bookId}`
  if (!book) return { success: false, message: `Book with ID ${bookId} not found.` }
  const [patron] = await sql`SELECT name FROM patrons WHERE id = ${patronId}`
  if (!patron) return { success: false, message: `Patron with ID ${patronId} not found.` }
  const loan = await sql`SELECT 1 FROM loans WHERE patron_id = ${patronId} AND book_id = ${bookId}`
  if (loan.length === 0) return { success: false, message: `Patron "${patron.name}" does not have book "${book.title}" checked out.` }

  await sql`DELETE FROM loans WHERE patron_id = ${patronId} AND book_id = ${bookId}`
  await sql`UPDATE books SET status = 'Available', borrowed_date = NULL WHERE id = ${bookId}`
  await sql`INSERT INTO transaction_history (transaction_type, book_id, book_title, patron_id, patron_name) VALUES ('return', ${bookId}, ${book.title}, ${patronId}, ${patron.name})`
  return { success: true, message: `Book "${book.title}" returned successfully by ${patron.name}.` }
}

export async function extendBookLoan(bookId: number, extensionDays = 1): Promise<{ success: boolean; message: string }> {
  await ensureDatabaseSchema()
  if (!Number.isInteger(extensionDays) || extensionDays < 1 || extensionDays > 7) {
    return { success: false, message: "Extension duration must be a whole number between 1 and 7 days." }
  }

  const [book] = await sql`SELECT title FROM books WHERE id = ${bookId}`
  if (!book) return { success: false, message: `Book with ID ${bookId} not found.` }

  const [loan] = await sql`
    WITH extended_loan AS (
      UPDATE loans
      SET due_return_date = GREATEST(
            due_return_date,
            (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Manila')::date
          ) + CAST(${extensionDays} AS INTEGER),
          extended_at = NOW()
      WHERE book_id = ${bookId}
      RETURNING patron_id, due_return_date::text AS due_return_date
    ), recorded_extension AS (
      INSERT INTO transaction_history (transaction_type, book_id, book_title, patron_id, patron_name, extension_days)
      SELECT 'extend', ${bookId}, ${book.title}, extended_loan.patron_id, patrons.name, ${extensionDays}
      FROM extended_loan
      JOIN patrons ON patrons.id = extended_loan.patron_id
    )
    SELECT patron_id, due_return_date FROM extended_loan
  `
  if (!loan) return { success: false, message: `Book "${book.title}" is not currently checked out.` }

  const dueDate = String(loan.due_return_date).slice(0, 10)
  return {
    success: true,
    message: `The due date for "${book.title}" was extended by ${extensionDays} days, through ${dueDate}.`,
  }
}

export async function getStatistics(): Promise<LibraryStats> {
  await ensureDatabaseSchema()
  const [[stats], [recentBook], [mostBorrowedBook]] = await Promise.all([
    sql`
    SELECT
      (SELECT COUNT(*)::int FROM books) AS total_books,
      (SELECT COUNT(*)::int FROM books WHERE status = 'Available') AS available_books,
      (SELECT COUNT(*)::int FROM patrons) AS total_patrons,
      (SELECT COUNT(DISTINCT patron_id)::int FROM loans) AS active_patrons
    `,
    sql`
      SELECT id, title, author, genre, year,
             CASE WHEN cover_image_key IS NULL THEN NULL ELSE '/api/books/' || id::text || '/cover?v=' || md5(cover_image_key) END AS cover_image
      FROM books
      ORDER BY created_at DESC, id DESC
      LIMIT 1
    `,
    sql`
      SELECT id, title, author, genre, year, borrow_count,
             CASE WHEN cover_image_key IS NULL THEN NULL ELSE '/api/books/' || id::text || '/cover?v=' || md5(cover_image_key) END AS cover_image
      FROM books
      WHERE borrow_count > 0
      ORDER BY borrow_count DESC, id ASC
      LIMIT 1
    `,
  ])
  return {
    total_books: stats.total_books,
    available_books: stats.available_books,
    checked_out_books: stats.total_books - stats.available_books,
    total_patrons: stats.total_patrons,
    active_patrons: stats.active_patrons,
    recent_book: recentBook
      ? {
          id: recentBook.id,
          title: recentBook.title,
          author: recentBook.author,
          genre: recentBook.genre,
          year: recentBook.year,
          cover_image: recentBook.cover_image,
        }
      : null,
    most_borrowed_book: mostBorrowedBook
      ? {
          id: mostBorrowedBook.id,
          title: mostBorrowedBook.title,
          author: mostBorrowedBook.author,
          genre: mostBorrowedBook.genre,
          year: mostBorrowedBook.year,
          cover_image: mostBorrowedBook.cover_image,
          borrow_count: mostBorrowedBook.borrow_count,
        }
      : null,
  }
}

export async function exportBooksToCSV(): Promise<string> {
  const books = await loadBooks()
  const headers = ["ID", "Title", "Author", "Genre", "Year", "Status", "Borrowed Date", "Due Return Date"]
  const rows = books.map((book) => [
    book.id,
    `"${book.title}"`,
    `"${book.author}"`,
    `"${book.genre}"`,
    book.year,
    book.is_overdue ? "Overdue" : book.status,
    book.borrowed_date || "N/A",
    book.due_return_date || "N/A",
  ])
  return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")
}

export async function exportPatronsToCSV(): Promise<string> {
  const patrons = await loadPatrons()
  const headers = ["ID", "Name", "Books Checked Out"]
  const rows = patrons.map((patron) => [patron.id, `"${patron.name}"`, patron.books_checked_out.length])
  return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")
}


export interface TransactionHistoryEntry {
  id: number
  transaction_type: "arrival" | "removal" | "borrow" | "return" | "extend" | "patron_add" | "patron_remove"
  book_id: number | null
  book_title: string | null
  patron_id: number | null
  patron_name: string | null
  extension_days: number | null
  quantity: number
  occurred_at: string
}

export async function loadTransactionHistory(): Promise<TransactionHistoryEntry[]> {
  await ensureDatabaseSchema()
  const rows = await sql`
    SELECT id, transaction_type, book_id, book_title, patron_id, patron_name, extension_days, quantity, occurred_at
    FROM transaction_history
    ORDER BY occurred_at DESC, id DESC
  `
  return rows as TransactionHistoryEntry[]
}
