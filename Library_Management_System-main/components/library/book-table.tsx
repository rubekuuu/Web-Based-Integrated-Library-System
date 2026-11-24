"use client"

import { useState } from "react"
import type { Book } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { BookCover } from "./book-cover"
import { Pencil, Trash2, Search, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react"

const PAGE_SIZE = 20
interface BookTableProps {
  books: Book[]
  onEdit: (book: Book) => void
  onDelete: (book: Book) => void
}

type SortField = "id" | "title" | "author" | "genre" | "year" | "status" | "due_return_date"
type SortDirection = "asc" | "desc"

function formatBorrowedDate(value: string | null) {
  if (!value) return "-"

  const timestamp = /(?:Z|[+-]\d{2}:\d{2})$/i.test(value)
    ? value
    : `${value.replace(" ", "T")}Z`
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).format(date)
}

export function BookTable({ books, onEdit, onDelete }: BookTableProps) {
  const safeBooks = Array.isArray(books) ? books : []
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "Available" | "Checked Out" | "Overdue">("all")
  const [sortField, setSortField] = useState<SortField>("id")
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")
  const [page, setPage] = useState(1)

  const filteredBooks = safeBooks
    .filter((book) => {
      const matchesSearch =
        book.title.toLowerCase().includes(search.toLowerCase()) ||
        book.author.toLowerCase().includes(search.toLowerCase()) ||
        book.genre.toLowerCase().includes(search.toLowerCase()) ||
        book.id.toString().includes(search)
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "Overdue" ? book.is_overdue : book.status === statusFilter)
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      let comparison = 0
      if (sortField === "id") comparison = a.id - b.id
      else if (sortField === "year") comparison = a.year - b.year
      else if (sortField === "title") comparison = a.title.localeCompare(b.title)
      else if (sortField === "author") comparison = a.author.localeCompare(b.author)
      else if (sortField === "genre") comparison = a.genre.localeCompare(b.genre)
      else if (sortField === "status") comparison = a.status.localeCompare(b.status)
      else if (sortField === "due_return_date") comparison = (a.due_return_date || "").localeCompare(b.due_return_date || "")
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

  const pageCount = Math.max(1, Math.ceil(filteredBooks.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const pageBooks = filteredBooks.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const firstResult = filteredBooks.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
  const lastResult = Math.min(currentPage * PAGE_SIZE, filteredBooks.length)

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null
    return sortDirection === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by title, author, genre, or ID..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={statusFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setStatusFilter("all")
              setPage(1)
            }}
          >
            All
          </Button>
          <Button
            variant={statusFilter === "Available" ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setStatusFilter("Available")
              setPage(1)
            }}
          >
            Available
          </Button>
          <Button
            variant={statusFilter === "Checked Out" ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setStatusFilter("Checked Out")
              setPage(1)
            }}
          >
            Checked Out
          </Button>
          <Button
            variant={statusFilter === "Overdue" ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setStatusFilter("Overdue")
              setPage(1)
            }}
          >
            Overdue
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card text-card-foreground shadow-sm">
        <Table className="min-w-[68.5rem] table-fixed">
          <TableHeader>
            <TableRow>
              <TableHead className="w-16 cursor-pointer" onClick={() => handleSort("id")}>
                <div className="flex items-center gap-1">ID <SortIcon field="id" /></div>
              </TableHead>
              <TableHead className="w-[15rem] cursor-pointer" onClick={() => handleSort("title")}>
                <div className="flex items-center gap-1">Title <SortIcon field="title" /></div>
              </TableHead>
              <TableHead className="w-[8.5rem] cursor-pointer" onClick={() => handleSort("author")}>
                <div className="flex items-center gap-1">Author <SortIcon field="author" /></div>
              </TableHead>
              <TableHead className="w-[6.5rem] cursor-pointer" onClick={() => handleSort("genre")}>
                <div className="flex items-center gap-1">Genre <SortIcon field="genre" /></div>
              </TableHead>
              <TableHead className="w-16 cursor-pointer" onClick={() => handleSort("year")}>
                <div className="flex items-center gap-1">Year <SortIcon field="year" /></div>
              </TableHead>
              <TableHead className="w-28 cursor-pointer" onClick={() => handleSort("status")}>
                <div className="flex items-center gap-1">Status <SortIcon field="status" /></div>
              </TableHead>
              <TableHead className="w-[10.5rem]">Borrowed Date &amp; Time</TableHead>
              <TableHead className="w-[6.5rem] cursor-pointer" onClick={() => handleSort("due_return_date")}>
                <div className="flex items-center gap-1">Due Date <SortIcon field="due_return_date" /></div>
              </TableHead>
              <TableHead className="sticky right-0 z-20 w-[6.5rem] bg-muted/50 text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBooks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                  No books found.
                </TableCell>
              </TableRow>
            ) : (
              pageBooks.map((book) => (
                <TableRow key={book.id} className="group">
                  <TableCell className="w-16 font-medium">{book.id}</TableCell>
                  <TableCell className="w-[15rem] max-w-[15rem] overflow-hidden">
                    <div className="flex min-w-0 items-center gap-3">
                      <BookCover
                        src={book.cover_image}
                        title={book.title}
                        author={book.author}
                        year={book.year}
                        genre={book.genre}
                        className="h-14 w-10 rounded-md"
                      />
                      <span className="block min-w-0 flex-1 truncate font-medium" title={book.title}>
                        {book.title}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="w-[8.5rem] max-w-[8.5rem] overflow-hidden">
                    <span className="block truncate" title={book.author}>{book.author}</span>
                  </TableCell>
                  <TableCell className="w-[6.5rem] max-w-[6.5rem] overflow-hidden">
                    <span className="block truncate" title={book.genre}>{book.genre}</span>
                  </TableCell>
                  <TableCell className="w-16">{book.year}</TableCell>
                  <TableCell className="w-28">
                    <Badge
                      variant={book.status === "Available" && !book.is_overdue ? "default" : "secondary"}
                      className={
                        book.is_overdue
                          ? "bg-red-600 hover:bg-red-700 text-white"
                          : book.status === "Available"
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                            : "bg-amber-600 hover:bg-amber-700 text-white"
                      }
                    >
                      {book.is_overdue ? "Overdue" : book.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="w-[10.5rem] text-muted-foreground text-sm">
                    {formatBorrowedDate(book.borrowed_date)}
                  </TableCell>
                  <TableCell className={`w-[6.5rem] text-sm ${book.is_overdue ? "font-medium text-red-600" : "text-muted-foreground"}`}>
                    {book.due_return_date || "-"}
                  </TableCell>
                  <TableCell className="sticky right-0 z-10 w-[6.5rem] bg-card text-right group-hover:bg-zinc-100/70 dark:group-hover:bg-zinc-800/60">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => onEdit(book)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(book)}
                        disabled={book.status === "Checked Out"}
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
        Showing {firstResult}–{lastResult} of {filteredBooks.length} matching books ({safeBooks.length} total)
      </p>
      {pageCount > 1 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Page {currentPage} of {pageCount} · {PAGE_SIZE} books per page
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPage(currentPage - 1)}
              disabled={currentPage === 1}
              aria-label="Previous books page"
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
              aria-label="Next books page"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
