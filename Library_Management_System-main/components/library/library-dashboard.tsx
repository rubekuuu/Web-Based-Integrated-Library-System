"use client"

import { useState, useCallback } from "react"
import useSWR, { mutate } from "swr"
import type { Book, Patron, LibraryStats } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { BookTable } from "./book-table"
import { PatronTable } from "./patron-table"
import { BookForm, type BookFormValues } from "./book-form"
import { BookCover } from "./book-cover"
import { PatronForm } from "./patron-form"
import { TransactionPanel } from "./transaction-panel"
import { TransactionHistory } from "./transaction-history"
import { StatsCards } from "./stats-cards"
import { ConfirmDialog } from "./confirm-dialog"
import { BrandFooter } from "./brand-footer"
import { LibraryNavigation } from "./library-navigation"
import { BookOpen, Download, Plus, TrendingUp } from "lucide-react"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { OrcaLoader } from "@/components/ui/orca-loader"

export type LibraryPage = "home" | "books" | "patrons" | "transactions"

const fetcher = async (url: string) => {
  const response = await fetch(url)
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data?.message || "Unable to load library data.")
  }
  return data
}

async function readApiResponse(response: Response) {
  const text = await response.text()
  if (!text) {
    return { success: false, message: `The server returned no response (${response.status}).` }
  }
  try {
    return JSON.parse(text)
  } catch {
    return { success: false, message: `The server returned an invalid response (${response.status}).` }
  }
}

function toBookFormData(data: BookFormValues) {
  const formData = new FormData()
  formData.append("id", String(data.id))
  formData.append("title", data.title)
  formData.append("author", data.author)
  formData.append("genre", data.genre)
  formData.append("year", String(data.year))
  if (data.coverImage) formData.append("coverImage", data.coverImage)
  return formData
}

export function LibraryDashboard({ page }: { page: LibraryPage }) {
  const { toast } = useToast()
  
  // Fetch data
  const { data: booksData, isLoading: booksLoading } = useSWR<Book[]>("/api/books", fetcher)
  const { data: patronsData, isLoading: patronsLoading } = useSWR<Patron[]>("/api/patrons", fetcher)
  const books = Array.isArray(booksData) ? booksData : []
  const patrons = Array.isArray(patronsData) ? patronsData : []
  const { data: stats, isLoading: statsLoading } = useSWR<LibraryStats>("/api/stats", fetcher)
  
  // Form states
  const [bookFormOpen, setBookFormOpen] = useState(false)
  const [patronFormOpen, setPatronFormOpen] = useState(false)
  const [editingBook, setEditingBook] = useState<Book | null>(null)
  const [editingPatron, setEditingPatron] = useState<Patron | null>(null)
  
  // Confirm dialog states
  const [deleteBookConfirm, setDeleteBookConfirm] = useState<Book | null>(null)
  const [deletePatronConfirm, setDeletePatronConfirm] = useState<Patron | null>(null)

  // Refresh all data
  const refreshData = useCallback(() => {
    mutate("/api/books")
    mutate("/api/patrons")
    mutate("/api/stats")
    mutate("/api/transactions/history")
  }, [])

  // Book operations
  const handleAddBook = async (data: BookFormValues) => {
    const res = await fetch("/api/books", {
      method: "POST",
      body: toBookFormData(data),
    })
    const result = await readApiResponse(res)
    const isDuplicate = !result.success && res.status === 409
    toast({
      title: result.success ? "Success" : isDuplicate ? "Oops! Book already exists" : "Error",
      description: result.message,
      variant: result.success ? "default" : "destructive",
      className: isDuplicate
        ? "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100" : undefined,
    })
    if (result.success) refreshData()
    return result.success
  }

  const handleUpdateBook = async (data: BookFormValues) => {
    const res = await fetch("/api/books", {
      method: "PUT",
      body: toBookFormData(data),
    })
    const result = await readApiResponse(res)
    toast({
      title: result.success ? "Success" : "Error",
      description: result.message,
      variant: result.success ? "default" : "destructive",
    })
    if (result.success) refreshData()
    return result.success
  }

  const handleDeleteBook = async (book: Book) => {
    const res = await fetch(`/api/books?id=${book.id}`, { method: "DELETE" })
    const result = await readApiResponse(res)
    toast({
      title: result.success ? "Success" : "Error",
      description: result.message,
      variant: result.success ? "default" : "destructive",
    })
    if (result.success) refreshData()
    setDeleteBookConfirm(null)
  }

  const handleExtendBook = async (bookId: number, extensionDays: number) => {
    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "extend", bookId, extensionDays }),
    })
    const result = await readApiResponse(res)
    toast({
      title: result.success ? "Success" : "Error",
      description: result.message,
      variant: result.success ? "default" : "destructive",
    })
    if (result.success) refreshData()
    return result.success
  }

  // Patron operations
  const handleAddPatron = async (data: { id: number; name: string }) => {
    const res = await fetch("/api/patrons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    const result = await readApiResponse(res)
    const isDuplicate = !result.success && res.status === 409
    toast({
      title: result.success ? "Success" : isDuplicate ? "Oops! Patron already exists" : "Error",
      description: result.message,
      variant: result.success ? "default" : "destructive",
      className: isDuplicate
        ? "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100" : undefined,
    })
    if (result.success) refreshData()
    return result.success
  }

  const handleUpdatePatron = async (data: { id: number; name: string }) => {
    const res = await fetch("/api/patrons", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    const result = await readApiResponse(res)
    toast({
      title: result.success ? "Success" : "Error",
      description: result.message,
      variant: result.success ? "default" : "destructive",
    })
    if (result.success) refreshData()
    return result.success
  }

  const handleDeletePatron = async (patron: Patron) => {
    const res = await fetch(`/api/patrons?id=${patron.id}`, { method: "DELETE" })
    const result = await readApiResponse(res)
    toast({
      title: result.success ? "Success" : "Error",
      description: result.message,
      variant: result.success ? "default" : "destructive",
    })
    if (result.success) refreshData()
    setDeletePatronConfirm(null)
  }

  // Transaction operations
  const handleBorrow = async (bookId: number, patronId: number, durationDays: number) => {
    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "borrow", bookId, patronId, durationDays }),
    })
    const result = await readApiResponse(res)
    toast({
      title: result.success ? "Success" : "Error",
      description: result.message,
      variant: result.success ? "default" : "destructive",
    })
    if (result.success) refreshData()
    return result.success
  }

  const handleReturn = async (bookId: number, patronId: number) => {
    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "return", bookId, patronId }),
    })
    const result = await readApiResponse(res)
    toast({
      title: result.success ? "Success" : "Error",
      description: result.message,
      variant: result.success ? "default" : "destructive",
    })
    if (result.success) refreshData()
    return result.success
  }

  // Export functions
  const handleExport = (type: "books" | "patrons") => {
    window.open(`/api/export?type=${type}`, "_blank")
  }

  // Edit handlers
  const openEditBook = (book: Book) => {
    setEditingBook(book)
    setBookFormOpen(true)
  }

  const openEditPatron = (patron: Patron) => {
    setEditingPatron(patron)
    setPatronFormOpen(true)
  }

  const closeBookForm = () => {
    setBookFormOpen(false)
    setEditingBook(null)
  }

  const closePatronForm = () => {
    setPatronFormOpen(false)
    setEditingPatron(null)
  }

  const isLoading = booksLoading || patronsLoading

  return (
    <div className="flex min-h-screen flex-col bg-slate-50/40 pb-16 dark:bg-slate-950 md:pb-0">
      <header className="sticky top-0 z-40 border-b border-emerald-100 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
        <div className="container mx-auto px-4">
          <div className="flex min-h-20 items-center justify-between gap-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 p-1 ring-1 ring-emerald-100 dark:bg-emerald-950 dark:ring-emerald-900">
                <Image src="/ORCA-green.png" alt="ORCA logo" width={44} height={44} className="h-10 w-10 object-contain" priority />
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-sm font-bold tracking-tight sm:text-lg">
                  ORCA
                </h1>
                <p className="hidden text-xs text-slate-500 dark:text-slate-400 sm:block">
                  Organized Resource &amp; Catalog System
                </p>
              </div>
            </div>
            <LibraryNavigation />
          </div>
        </div>
      </header>

      <main className="container mx-auto w-full flex-1 px-4 py-6 sm:py-8">
        {page === "home" && (
          <section>
            <div className="mb-6">
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Dashboard</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">Library overview</h2>
            </div>
            {isLoading || statsLoading ? (
              <div className="space-y-4">
                <div className="flex min-h-32 items-center justify-center">
                  <OrcaLoader />
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-hidden="true">
                  {[0, 1, 2, 3].map((item) => (
                    <div key={item} className="h-32 animate-pulse rounded-xl border border-emerald-100 bg-emerald-50/40 dark:border-slate-800 dark:bg-slate-900" />
                  ))}
                </div>
              </div>
            ) : stats ? (
              <StatsCards stats={stats} />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[0, 1, 2, 3].map((item) => (
                  <div key={item} className="h-32 animate-pulse rounded-xl border border-emerald-100 bg-emerald-50/40 dark:border-slate-800 dark:bg-slate-900" />
                ))}
              </div>
            )}
            {stats && (
              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <Card className="border-emerald-100 shadow-sm dark:border-slate-800">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-sm font-medium">Most Recently Added</CardTitle>
                    <span className="rounded-lg bg-emerald-50 p-2 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      <BookOpen className="h-4 w-4" />
                    </span>
                  </CardHeader>
                  <CardContent>
                    {stats.recent_book ? (
                      <div className="flex items-center gap-4">
                        <BookCover
                          src={stats.recent_book.cover_image}
                          title={stats.recent_book.title}
                          author={stats.recent_book.author}
                          year={stats.recent_book.year}
                          genre={stats.recent_book.genre}
                          className="h-28 w-20"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-lg font-semibold text-slate-900 dark:text-slate-100">{stats.recent_book.title}</p>
                          <p className="mt-1 truncate text-sm text-muted-foreground">{stats.recent_book.author}</p>
                          <p className="mt-3 text-xs text-emerald-700 dark:text-emerald-300">
                            {stats.recent_book.genre} · {stats.recent_book.year} · ID {stats.recent_book.id}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="py-2 text-sm text-muted-foreground">No books have been added yet.</p>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-emerald-100 shadow-sm dark:border-slate-800">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-sm font-medium">Most Borrowed Book</CardTitle>
                    <span className="rounded-lg bg-emerald-50 p-2 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      <TrendingUp className="h-4 w-4" />
                    </span>
                  </CardHeader>
                  <CardContent>
                    {stats.most_borrowed_book ? (
                      <div className="flex items-center gap-4">
                        <BookCover
                          src={stats.most_borrowed_book.cover_image}
                          title={stats.most_borrowed_book.title}
                          author={stats.most_borrowed_book.author}
                          year={stats.most_borrowed_book.year}
                          genre={stats.most_borrowed_book.genre}
                          className="h-28 w-20"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-lg font-semibold text-slate-900 dark:text-slate-100">{stats.most_borrowed_book.title}</p>
                          <p className="mt-1 truncate text-sm text-muted-foreground">{stats.most_borrowed_book.author}</p>
                          <p className="mt-3 text-xs text-emerald-700 dark:text-emerald-300">
                            {stats.most_borrowed_book.borrow_count} checkout{stats.most_borrowed_book.borrow_count === 1 ? "" : "s"} recorded · ID {stats.most_borrowed_book.id}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="py-2 text-sm text-muted-foreground">No book checkouts have been recorded yet.</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </section>
        )}

        {page === "books" && (
          <section>
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Collection</p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">Books</h2>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 border-emerald-200 dark:border-slate-700 sm:flex-none" onClick={() => handleExport("books")}>
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
                <Button className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700 sm:flex-none" onClick={() => { setEditingBook(null); setBookFormOpen(true); }}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Book
                </Button>
              </div>
            </div>
            {isLoading ? (
              <div
                className="flex h-64 items-center justify-center rounded-xl border border-emerald-100 bg-white dark:border-slate-800 dark:bg-slate-900"
              >
                <OrcaLoader label="Loading books" />
              </div>
            ) : (
              <BookTable books={books} onEdit={openEditBook} onDelete={(book) => setDeleteBookConfirm(book)} />
            )}
          </section>
        )}

        {page === "patrons" && (
          <section>
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Members</p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">Patrons</h2>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 border-emerald-200 dark:border-slate-700 sm:flex-none" onClick={() => handleExport("patrons")}>
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
                <Button className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700 sm:flex-none" onClick={() => { setEditingPatron(null); setPatronFormOpen(true); }}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Patron
                </Button>
              </div>
            </div>
            {isLoading ? (
              <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-xl border border-emerald-100 bg-white text-muted-foreground dark:border-slate-800 dark:bg-slate-900">
                <OrcaLoader />
                <span>Loading patrons...</span>
              </div>
            ) : (
              <PatronTable
                patrons={patrons}
                books={books}
                onEdit={openEditPatron}
                onDelete={(patron) => setDeletePatronConfirm(patron)}
                onExtend={handleExtendBook}
              />
            )}
          </section>
        )}

        {page === "transactions" && (
          <section>
            <div className="mb-5">
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Circulation</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">Transactions</h2>
            </div>
            {isLoading ? (
              <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-xl border border-emerald-100 bg-white text-muted-foreground dark:border-slate-800 dark:bg-slate-900">
                <OrcaLoader />
                <span>Loading transactions...</span>
              </div>
            ) : (
              <div className="page-transition">
                <TransactionPanel books={books} patrons={patrons} onBorrow={handleBorrow} onReturn={handleReturn} />
                <TransactionHistory />
              </div>
            )}
          </section>
        )}
      </main>

      <BrandFooter />

      {/* Forms */}
      <BookForm
        book={editingBook}
        open={bookFormOpen}
        onClose={closeBookForm}
        onSubmit={editingBook ? handleUpdateBook : handleAddBook}
      />
      <PatronForm
        patron={editingPatron}
        open={patronFormOpen}
        onClose={closePatronForm}
        onSubmit={editingPatron ? handleUpdatePatron : handleAddPatron}
      />

      {/* Confirm Dialogs */}
      <ConfirmDialog
        open={!!deleteBookConfirm}
        title="Delete Book"
        description={`Are you sure you want to delete "${deleteBookConfirm?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="destructive"
        onConfirm={() => deleteBookConfirm && handleDeleteBook(deleteBookConfirm)}
        onCancel={() => setDeleteBookConfirm(null)}
      />
      <ConfirmDialog
        open={!!deletePatronConfirm}
        title="Delete Patron"
        description={`Are you sure you want to delete "${deletePatronConfirm?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="destructive"
        onConfirm={() => deletePatronConfirm && handleDeletePatron(deletePatronConfirm)}
        onCancel={() => setDeletePatronConfirm(null)}
      />

      <Toaster />
    </div>
  )
}
