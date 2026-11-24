"use client"

import { useState } from "react"
import type { Book, Patron } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeftRight, BookOpen, UserCheck } from "lucide-react"
import { MAX_BORROWED_BOOKS_PER_PATRON } from "@/lib/constants"
import { SearchablePicker, type SearchablePickerOption } from "./searchable-picker"

interface TransactionPanelProps {
  books: Book[]
  patrons: Patron[]
  onBorrow: (bookId: number, patronId: number, durationDays: number) => Promise<boolean>
  onReturn: (bookId: number, patronId: number) => Promise<boolean>
}

export function TransactionPanel({ books, patrons, onBorrow, onReturn }: TransactionPanelProps) {
  const safeBooks = Array.isArray(books) ? books : []
  const safePatrons = Array.isArray(patrons) ? patrons : []
  const [borrowPatronId, setBorrowPatronId] = useState<string>("")
  const [borrowPatronQuery, setBorrowPatronQuery] = useState("")
  const [borrowBookId, setBorrowBookId] = useState<string>("")
  const [borrowBookQuery, setBorrowBookQuery] = useState("")
  const [borrowDurationDays, setBorrowDurationDays] = useState("14")
  const [returnPatronId, setReturnPatronId] = useState<string>("")
  const [returnPatronQuery, setReturnPatronQuery] = useState("")
  const [returnBookId, setReturnBookId] = useState<string>("")
  const [borrowLoading, setBorrowLoading] = useState(false)
  const [returnLoading, setReturnLoading] = useState(false)

  const availableBooks = safeBooks.filter((b) => b.status === "Available")
  const selectedBorrowPatron = safePatrons.find((patron) => patron.id.toString() === borrowPatronId)
  const borrowLimitReached = (selectedBorrowPatron?.books_checked_out.length ?? 0) >= MAX_BORROWED_BOOKS_PER_PATRON
  const selectedPatronForReturn = safePatrons.find((p) => p.id.toString() === returnPatronId)
  const booksToReturn = selectedPatronForReturn
    ? safeBooks.filter((b) => selectedPatronForReturn.books_checked_out.includes(b.id))
    : []

  const patronOptions = (items: Patron[]): SearchablePickerOption[] =>
    items.map((patron) => ({
      value: patron.id.toString(),
      label: patron.name,
      detail: `Patron ID: ${patron.id} · ${patron.books_checked_out.length}/${MAX_BORROWED_BOOKS_PER_PATRON} books checked out`,
      searchText: `${patron.name} ${patron.id}`,
    }))

  const availableBookOptions: SearchablePickerOption[] = availableBooks.map((book) => ({
    value: book.id.toString(),
    label: book.title,
    detail: `${book.genre} · ID: ${book.id} · ${book.author}`,
    searchText: `${book.title} ${book.genre} ${book.id} ${book.author}`,
  }))

  const handleBorrow = async () => {
    const durationDays = Number(borrowDurationDays)
    if (
      !borrowBookId ||
      !borrowPatronId ||
      !Number.isInteger(durationDays) ||
      durationDays < 1
    ) return
    setBorrowLoading(true)
    try {
      const succeeded = await onBorrow(Number(borrowBookId), Number(borrowPatronId), durationDays)
      if (succeeded) {
        setBorrowBookId("")
        setBorrowBookQuery("")
        setBorrowPatronId("")
        setBorrowPatronQuery("")
        setBorrowDurationDays("14")
      }
    } finally {
      setBorrowLoading(false)
    }
  }

  const handleReturn = async () => {
    if (!returnBookId || !returnPatronId) return
    setReturnLoading(true)
    try {
      const succeeded = await onReturn(Number(returnBookId), Number(returnPatronId))
      if (succeeded) {
        setReturnBookId("")
        setReturnPatronId("")
        setReturnPatronQuery("")
      }
    } finally {
      setReturnLoading(false)
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Borrow Book Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Borrow Book
          </CardTitle>
          <CardDescription>Check out a book for a patron</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <SearchablePicker
            id="borrow-patron"
            label="Patron"
            placeholder="Type a patron name or ID"
            query={borrowPatronQuery}
            selectedValue={borrowPatronId}
            options={patronOptions(safePatrons)}
            emptyMessage="No matching patrons."
            onQueryChange={setBorrowPatronQuery}
            onSelect={(value) => setBorrowPatronId(value)}
          />
          <p
            className={`-mt-2 text-sm ${borrowLimitReached ? "text-destructive" : "text-muted-foreground"}`}
            aria-live="polite"
          >
            {borrowLimitReached
              ? `This patron has reached the ${MAX_BORROWED_BOOKS_PER_PATRON}-book limit. Return a book before borrowing another.`
              : `Each patron may borrow up to ${MAX_BORROWED_BOOKS_PER_PATRON} books at a time.`}
          </p>
          <SearchablePicker
            id="borrow-book"
            label="Available book"
            placeholder="Search title, genre, or ID"
            query={borrowBookQuery}
            selectedValue={borrowBookId}
            options={availableBookOptions}
            emptyMessage={availableBooks.length ? "No matching available books." : "No books are currently available."}
            onQueryChange={setBorrowBookQuery}
            onSelect={(value) => setBorrowBookId(value)}
          />
          <div className="space-y-2">
            <Label htmlFor="borrow-duration">Borrowing duration (days)</Label>
            <Input
              id="borrow-duration"
              type="number"
              min="1"
              step="1"
              value={borrowDurationDays}
              onChange={(event) => setBorrowDurationDays(event.target.value)}
              placeholder="Enter number of days"
            />
          </div>
          <Button
            onClick={handleBorrow}
            disabled={
              !borrowBookId ||
              !borrowPatronId ||
              borrowLimitReached ||
              !borrowDurationDays ||
              !Number.isInteger(Number(borrowDurationDays)) ||
              Number(borrowDurationDays) < 1 ||
              borrowLoading
            }
            className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
          >
            <ArrowLeftRight className="mr-2 h-4 w-4" />
            {borrowLoading ? "Processing..." : "Borrow Book"}
          </Button>
        </CardContent>
      </Card>

      {/* Return Book Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Return Book
          </CardTitle>
          <CardDescription>Return a book from a patron</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <SearchablePicker
            id="return-patron"
            label="Patron"
            placeholder="Type a patron name or ID"
            query={returnPatronQuery}
            selectedValue={returnPatronId}
            options={patronOptions(safePatrons.filter((patron) => patron.books_checked_out.length > 0))}
            emptyMessage="No matching patrons with books to return."
            onQueryChange={setReturnPatronQuery}
            onSelect={(value) => {
              setReturnPatronId(value)
              setReturnBookId("")
            }}
          />
          <div className="space-y-2">
            <Label>Select book to return</Label>
            <Select value={returnBookId} onValueChange={setReturnBookId} disabled={!returnPatronId}>
              <SelectTrigger className="w-full min-w-0">
                <SelectValue placeholder="Choose a checked-out book" className="min-w-0 flex-1 truncate" />
              </SelectTrigger>
              <SelectContent className="w-[var(--radix-select-trigger-width)] max-w-[calc(100vw-2rem)]">
                {booksToReturn.length === 0 ? (
                  <SelectItem value="none" disabled>
                    Select a patron first
                  </SelectItem>
                ) : (
                  booksToReturn.map((book) => (
                    <SelectItem key={book.id} value={book.id.toString()} className="min-w-0">
                      <span className="block min-w-0 truncate" title={`${book.title} by ${book.author}`}>
                        {book.title} by {book.author}
                      </span>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handleReturn}
            disabled={!returnBookId || !returnPatronId || returnLoading}
            className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
          >
            <ArrowLeftRight className="mr-2 h-4 w-4" />
            {returnLoading ? "Processing..." : "Return Book"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
