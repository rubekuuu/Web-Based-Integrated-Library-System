"use client"

import { useEffect, useRef, useState, type FormEvent } from "react"
import type { Book } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { BookCover } from "./book-cover"

export interface BookFormValues {
  id: number
  title: string
  author: string
  genre: string
  year: number
  coverImage?: File
}

interface BookFormProps {
  book?: Book | null
  open: boolean
  onClose: () => void
  onSubmit: (data: BookFormValues) => Promise<boolean>
}

export function BookForm({ book, open, onClose, onSubmit }: BookFormProps) {
  const [id, setId] = useState(book?.id?.toString() || "")
  const [title, setTitle] = useState(book?.title || "")
  const [author, setAuthor] = useState(book?.author || "")
  const [genre, setGenre] = useState(book?.genre || "")
  const [year, setYear] = useState(book?.year?.toString() || "")
  const [coverImage, setCoverImage] = useState<File | null>(null)
  const [coverError, setCoverError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const coverInputRef = useRef<HTMLInputElement>(null)

  const isEdit = !!book

  const handleCoverChange = (file: File | undefined) => {
    setCoverError(null)
    if (!file) {
      setCoverImage(null)
      return
    }

    const supportedTypes = ["image/jpeg", "image/png", "image/webp", "image/avif"]
    if (!supportedTypes.includes(file.type)) {
      setCoverImage(null)
      setCoverError("Choose a JPEG, PNG, WebP, or AVIF image.")
      if (coverInputRef.current) coverInputRef.current.value = ""
      return
    }
    if (file.size === 0 || file.size > 5 * 1024 * 1024) {
      setCoverImage(null)
      setCoverError("Book cover images must be between 1 byte and 5 MB.")
      if (coverInputRef.current) coverInputRef.current.value = ""
      return
    }
    setCoverImage(file)
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    try {
      const saved = await onSubmit({
        id: Number(id),
        title,
        author,
        genre,
        year: parseInt(year),
        ...(coverImage ? { coverImage } : {}),
      })
      if (saved) onClose()
    } finally {
      setLoading(false)
    }
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onClose()
    }
  }

  useEffect(() => {
    setId(book?.id?.toString() || "")
    setTitle(book?.title || "")
    setAuthor(book?.author || "")
    setGenre(book?.genre || "")
    setYear(book?.year?.toString() || "")
    setCoverImage(null)
    setCoverError(null)
    if (coverInputRef.current) coverInputRef.current.value = ""
  }, [book, open])

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col overflow-hidden sm:max-w-md">
        <DialogHeader className="shrink-0">
          <DialogTitle>{isEdit ? "Edit Book" : "Add New Book"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update the book details below." : "Fill in the details to add a new book to the library."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-1 pb-2">
            <div className="space-y-2">
              <Label htmlFor="book-id">Book ID</Label>
              <Input
                id="book-id"
                type="number"
                min="1"
                step="1"
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder="Enter a unique book ID"
                readOnly={isEdit}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter book title"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="genre">Genre</Label>
              <Input
                id="genre"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                placeholder="Enter book genre"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="author">Author</Label>
              <Input
                id="author"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Enter author name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="year">Publication Year</Label>
              <Input
                id="year"
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="Enter publication year"
                min="1000"
                max={new Date().getFullYear()}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="book-cover">{isEdit ? "Replace Book Cover" : "Upload Book Cover"}</Label>
              <div className="flex min-w-0 flex-col items-start gap-3 sm:flex-row sm:items-center">
                {book?.cover_image && !coverImage && (
                  <BookCover
                    src={book.cover_image}
                    title={book.title}
                    author={book.author}
                    year={book.year}
                    genre={book.genre}
                    className="h-20 w-14 rounded-md"
                  />
                )}
                <Input
                  ref={coverInputRef}
                  id="book-cover"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  onChange={(event) => handleCoverChange(event.currentTarget.files?.[0])}
                  disabled={loading}
                  aria-invalid={!!coverError}
                  aria-describedby={coverError ? "book-cover-error" : "book-cover-help"}
                  className="w-full min-w-0"
                />
              </div>
              {coverImage ? (
                <p className="break-all text-sm text-muted-foreground">Selected: {coverImage.name}</p>
              ) : (
                <p id="book-cover-help" className="text-sm text-muted-foreground">
                  JPEG, PNG, WebP, or AVIF, up to 5 MB. {isEdit && "Leave empty to keep the current cover."}
                </p>
              )}
              {coverError && (
                <p id="book-cover-error" className="text-sm text-destructive" role="alert">
                  {coverError}
                </p>
              )}
            </div>
          </div>
          <DialogFooter className="shrink-0 border-t pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : isEdit ? "Update Book" : "Add Book"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
