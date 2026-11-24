export interface Book {
  id: number
  title: string
  author: string
  genre: string
  year: number
  status: "Available" | "Checked Out"
  borrowed_date: string | null
  cover_image?: string | null
  due_return_date?: string | null
  is_overdue?: boolean
  is_extended?: boolean
}

export interface Patron {
  id: number
  name: string
  books_checked_out: number[]
}

export interface LibraryStats {
  total_books: number
  available_books: number
  checked_out_books: number
  total_patrons: number
  active_patrons: number
  recent_book: Pick<Book, "id" | "title" | "author" | "genre" | "year" | "cover_image"> | null
  most_borrowed_book: (Pick<Book, "id" | "title" | "author" | "genre" | "year" | "cover_image"> & { borrow_count: number }) | null
}
