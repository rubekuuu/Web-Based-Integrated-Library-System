"use client"

import { useState } from "react"
import type { Patron, Book } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Pencil, Trash2, Search, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, BookOpen, Clock3 } from "lucide-react"
import { MAX_BORROWED_BOOKS_PER_PATRON } from "@/lib/constants"

const PAGE_SIZE = 20
interface PatronTableProps {
  patrons: Patron[]
  books: Book[]
  onEdit: (patron: Patron) => void
  onDelete: (patron: Patron) => void
  onExtend: (bookId: number, extensionDays: number) => Promise<boolean>
}

type SortField = "id" | "name" | "books"
type SortDirection = "asc" | "desc"

export function PatronTable({ patrons, books, onEdit, onDelete, onExtend }: PatronTableProps) {
  const safePatrons = Array.isArray(patrons) ? patrons : []
  const safeBooks = Array.isArray(books) ? books : []
  const [search, setSearch] = useState("")
  const [sortField, setSortField] = useState<SortField>("id")
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")
  const [page, setPage] = useState(1)
  const [selectedPatron, setSelectedPatron] = useState<Patron | null>(null)
  const [extensionDaysByBookId, setExtensionDaysByBookId] = useState<Record<number, string>>({})
  const [extendingBookId, setExtendingBookId] = useState<number | null>(null)

  const handleExtend = async (bookId: number, extensionDays: number) => {
    setExtendingBookId(bookId)
    try {
      await onExtend(bookId, extensionDays)
    } finally {
      setExtendingBookId(null)
    }
  }

  const filteredPatrons = safePatrons
    .filter((patron) => {
      return (
        patron.name.toLowerCase().includes(search.toLowerCase()) ||
        patron.id.toString().includes(search)
      )
    })
    .sort((a, b) => {
      let comparison = 0
      if (sortField === "id") comparison = a.id - b.id
      else if (sortField === "name") comparison = a.name.localeCompare(b.name)
      else if (sortField === "books") comparison = a.books_checked_out.length - b.books_checked_out.length
      return sortDirection === "asc" ? comparison : -comparison
    })

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
    setPage(1)
  }

  const pageCount = Math.max(1, Math.ceil(filteredPatrons.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const pagePatrons = filteredPatrons.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const firstResult = filteredPatrons.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
  const lastResult = Math.min(currentPage * PAGE_SIZE, filteredPatrons.length)

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null
    return sortDirection === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name or ID..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          className="pl-9"
        />
      </div>

      <div className="rounded-lg border border-border bg-card text-card-foreground shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer" onClick={() => handleSort("id")}>
                <div className="flex items-center gap-1">ID <SortIcon field="id" /></div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("name")}>
                <div className="flex items-center gap-1">Name <SortIcon field="name" /></div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("books")}>
                <div className="flex items-center gap-1">Books Checked Out <SortIcon field="books" /></div>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPatrons.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  No patrons found.
                </TableCell>
              </TableRow>
            ) : (
              pagePatrons.map((patron) => (
                <TableRow key={patron.id}>
                  <TableCell className="font-medium">{patron.id}</TableCell>
                  <TableCell className="font-medium">{patron.name}</TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-emerald-200 text-emerald-800 hover:border-zinc-300 hover:bg-zinc-100 hover:text-emerald-900 dark:border-slate-700 dark:text-emerald-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
                      onClick={() => setSelectedPatron(patron)}
                      aria-label={`View borrowed books for ${patron.name}: ${patron.books_checked_out.length} of ${MAX_BORROWED_BOOKS_PER_PATRON} checked out`}
                      aria-haspopup="dialog"
                    >
                      <BookOpen className="h-4 w-4" />
                      <span>{patron.books_checked_out.length} / {MAX_BORROWED_BOOKS_PER_PATRON}</span>
                      <span>View</span>
                    </Button>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => onEdit(patron)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(patron)}
                        disabled={patron.books_checked_out.length > 0}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <p className="text-sm text-muted-foreground">
        Showing {firstResult}–{lastResult} of {filteredPatrons.length} matching patrons ({safePatrons.length} total)
      </p>
      {pageCount > 1 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Page {currentPage} of {pageCount} · {PAGE_SIZE} patrons per page
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPage(currentPage - 1)}
              disabled={currentPage === 1}
              aria-label="Previous patrons page"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPage(currentPage + 1)}
              disabled={currentPage === pageCount}
              aria-label="Next patrons page"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <Dialog open={selectedPatron !== null} onOpenChange={(open) => !open && setSelectedPatron(null)}>
        <DialogContent className="flex max-h-[85dvh] w-[calc(100%-1rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-xl">
          <DialogHeader className="shrink-0 border-b px-5 py-5 pr-12 text-left sm:px-6 sm:pr-12">
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 shrink-0 text-emerald-700 dark:text-emerald-300" />
              <span className="min-w-0 break-words">
                Borrowed Books{selectedPatron ? ` - ${selectedPatron.name}` : ""}
              </span>
            </DialogTitle>
            <DialogDescription>
              {selectedPatron
                ? `${selectedPatron.books_checked_out.length} of ${MAX_BORROWED_BOOKS_PER_PATRON} books checked out · Patron ID ${selectedPatron.id} · Extension defaults to 1 day`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-0 overflow-y-auto p-4 sm:p-6">
            {selectedPatron && selectedPatron.books_checked_out.length > 0 ? (
              <ul className="divide-y rounded-md border">
                {selectedPatron.books_checked_out.map((bookId) => {
                  const book = safeBooks.find((item) => item.id === bookId)
                  const title = book?.title ?? `Book #${bookId}`
                  const extensionDays = extensionDaysByBookId[bookId] ?? "1"
                  const extensionDuration = Number(extensionDays)
                  const canExtend = Number.isInteger(extensionDuration) && extensionDuration > 0
                  const status = book?.is_overdue ? "Overdue" : book?.is_extended ? "Extended" : "Checked Out"

                  return (
                    <li key={bookId} className="flex min-w-0 flex-col gap-3 p-3 sm:flex-row sm:items-center sm:p-4">
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="shrink-0 rounded bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                            ID {bookId}
                          </span>
                          <span className="min-w-0 truncate text-sm font-medium" title={title}>
                            {title}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            variant="outline"
                            className={
                              status === "Overdue"
                                ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
                                : status === "Extended"
                                  ? "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-300"
                                  : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300"
                            }
                          >
                            {status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Due {book?.due_return_date || "date unavailable"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-end gap-2 sm:shrink-0">
                        <div className="space-y-1">
                          <Label htmlFor={`extend-days-${selectedPatron.id}-${bookId}`} className="text-xs">
                            Days
                          </Label>
                          <Input
                            id={`extend-days-${selectedPatron.id}-${bookId}`}
                            type="number"
                            min="1"
                            step="1"
                            value={extensionDays}
                            onChange={(event) =>
                              setExtensionDaysByBookId((current) => ({
                                ...current,
                                [bookId]: event.target.value,
                              }))
                            }
                            className="h-9 w-20"
                            aria-label={`Days to extend book ${bookId}`}
                          />
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleExtend(bookId, extensionDuration)}
                          disabled={!book || !canExtend || extendingBookId !== null}
                          className="bg-emerald-600 text-white hover:bg-emerald-700"
                          title="Extend the due date by the number of days entered"
                        >
                          <Clock3 className="h-4 w-4" />
                          {extendingBookId === bookId ? "Extending..." : "Extend"}
                        </Button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p className="rounded-md border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
                This patron has no books checked out.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
