import { NextResponse } from "next/server"
import { loadBooks, addBook, updateBook, deleteBook, getBookCoverKey } from "@/lib/library-data"
import { isAuthenticatedRequest, unauthorizedResponse } from "@/lib/auth"
import { deleteBookCover, uploadBookCover } from "@/lib/book-covers"

interface BookRequest {
  id?: unknown
  title?: unknown
  author?: unknown
  genre?: unknown
  year?: unknown
  coverImage?: unknown
}

function isBookRequest(value: unknown): value is BookRequest {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

async function readBookRequest(request: Request): Promise<BookRequest> {
  if (request.headers.get("content-type")?.includes("multipart/form-data")) {
    const formData = await request.formData()
    return {
      id: formData.get("id"),
      title: formData.get("title"),
      author: formData.get("author"),
      genre: formData.get("genre"),
      year: formData.get("year"),
      coverImage: formData.get("coverImage"),
    }
  }
  const body: unknown = await request.json()
  return isBookRequest(body) ? body : {}
}

function isValidBookDetails(
  body: BookRequest,
): body is BookRequest & { title: string; author: string; genre: string } {
  const id = Number(body.id)
  const year = Number(body.year)
  return (
    Number.isSafeInteger(id) && id > 0 &&
    typeof body.title === "string" && body.title.trim().length > 0 &&
    typeof body.author === "string" && body.author.trim().length > 0 &&
    typeof body.genre === "string" && body.genre.trim().length > 0 &&
    Number.isInteger(year) && year >= 1000 && year <= new Date().getFullYear()
  )
}

async function deleteStoredCover(key: string) {
  try {
    await deleteBookCover(key)
  } catch (error) {
    console.error("Unable to remove an unused book cover from Neon Object Storage:", error)
  }
}

export async function GET(request: Request) {
  if (!isAuthenticatedRequest(request)) return unauthorizedResponse()
  
  try {
    const books = await loadBooks()
    return NextResponse.json(books)
  } catch (error) {
    console.error("GET /api/books error:", error)
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  if (!isAuthenticatedRequest(request)) return unauthorizedResponse()
  
  try {
    const body = await readBookRequest(request)
    
    if (!isValidBookDetails(body)) {
      return NextResponse.json({ success: false, message: "A positive whole-number ID, title, author, genre, and valid publication year are required." }, { status: 400 })
    }

    if (
      body.coverImage !== undefined && body.coverImage !== null &&
      (typeof body.coverImage === "string" ? body.coverImage.length > 0 : !(body.coverImage instanceof File))
    ) {
      return NextResponse.json({ success: false, message: "The book cover upload is invalid." }, { status: 400 })
    }
    const coverFile = body.coverImage instanceof File ? body.coverImage : undefined
    const coverImageKey = coverFile ? await uploadBookCover(Number(body.id), coverFile) : undefined

    let result
    try {
      result = await addBook(
        Number(body.id),
        body.title.trim(),
        body.author.trim(),
        Number(body.year),
        body.genre.trim(),
        coverImageKey,
      )
    } catch (error) {
      if (coverImageKey) await deleteStoredCover(coverImageKey)
      throw error
    }
    if (!result.success && coverImageKey) await deleteStoredCover(coverImageKey)
    return NextResponse.json(result, { status: result.success ? 201 : 409 })
  } catch (error) {
    console.error("POST /api/books error:", error)
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  if (!isAuthenticatedRequest(request)) return unauthorizedResponse()
  
  try {
    const body = await readBookRequest(request)
    
    const id = Number(body.id)
    if (!Number.isSafeInteger(id) || id < 1) {
      return NextResponse.json({ success: false, message: "A valid book ID is required." }, { status: 400 })
    }

    if (
      (body.title !== undefined && (typeof body.title !== "string" || !body.title.trim())) ||
      (body.author !== undefined && (typeof body.author !== "string" || !body.author.trim())) ||
      (body.genre !== undefined && (typeof body.genre !== "string" || !body.genre.trim())) ||
      (body.year !== undefined && (!Number.isInteger(Number(body.year)) || Number(body.year) < 1000 || Number(body.year) > new Date().getFullYear()))
    ) {
      return NextResponse.json({ success: false, message: "Book details are invalid." }, { status: 400 })
    }
    if (
      body.coverImage !== undefined && body.coverImage !== null &&
      (typeof body.coverImage === "string" ? body.coverImage.length > 0 : !(body.coverImage instanceof File))
    ) {
      return NextResponse.json({ success: false, message: "The book cover upload is invalid." }, { status: 400 })
    }

    const coverFile = body.coverImage instanceof File ? body.coverImage : undefined
    const previousCoverKey = coverFile ? await getBookCoverKey(id) : null
    const coverImageKey = coverFile ? await uploadBookCover(id, coverFile) : undefined

    let result
    try {
      result = await updateBook(id, {
        title: typeof body.title === "string" ? body.title.trim() : undefined,
        author: typeof body.author === "string" ? body.author.trim() : undefined,
        genre: typeof body.genre === "string" ? body.genre.trim() : undefined,
        year: body.year !== undefined ? Number(body.year) : undefined,
        coverImageKey,
      })
    } catch (error) {
      if (coverImageKey) await deleteStoredCover(coverImageKey)
      throw error
    }
    if (!result.success && coverImageKey) {
      await deleteStoredCover(coverImageKey)
    } else if (result.success && coverImageKey && previousCoverKey) {
      await deleteStoredCover(previousCoverKey)
    }
    return NextResponse.json(result, { status: result.success ? 200 : 404 })
  } catch (error) {
    console.error("PUT /api/books error:", error)
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  if (!isAuthenticatedRequest(request)) return unauthorizedResponse()
  
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    
    if (!id || !Number.isSafeInteger(Number(id)) || Number(id) < 1) {
      return NextResponse.json({ success: false, message: "A valid book ID is required." }, { status: 400 })
    }
    
    const coverKey = await getBookCoverKey(Number(id))
    const result = await deleteBook(Number(id))
    if (result.success && coverKey) await deleteStoredCover(coverKey)
    return NextResponse.json(result, { status: result.success ? 200 : 400 })
  } catch (error) {
    console.error("DELETE /api/books error:", error)
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 })
  }
}