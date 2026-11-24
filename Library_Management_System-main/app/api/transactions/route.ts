import { NextResponse } from "next/server"
import { borrowBook, extendBookLoan, returnBook } from "@/lib/library-data"
import { isAuthenticatedRequest, unauthorizedResponse } from "@/lib/auth"

export async function POST(request: Request) {
  if (!isAuthenticatedRequest(request)) return unauthorizedResponse()
  try {
    const body = await request.json()
    const { action, bookId, patronId, durationDays, extensionDays } = body

    if (!action || !bookId) {
      return NextResponse.json({ success: false, message: "Action and bookId are required." }, { status: 400 })
    }

    if (action === "borrow") {
      if (!patronId) {
        return NextResponse.json({ success: false, message: "patronId is required to borrow a book." }, { status: 400 })
      }
      const requestedDuration = durationDays === undefined || durationDays === null
        ? 14
        : Number(durationDays)
      const result = await borrowBook(Number(bookId), Number(patronId), requestedDuration)
      return NextResponse.json(result, { status: result.success ? 200 : 400 })
    }
    if (action === "return") {
      if (!patronId) {
        return NextResponse.json({ success: false, message: "patronId is required to return a book." }, { status: 400 })
      }
      const result = await returnBook(Number(bookId), Number(patronId))
      return NextResponse.json(result, { status: result.success ? 200 : 400 })
    }
    if (action === "extend") {
      const requestedDuration = extensionDays === undefined || extensionDays === null
        ? 1
        : Number(extensionDays)
      const result = await extendBookLoan(Number(bookId), requestedDuration)
      return NextResponse.json(result, { status: result.success ? 200 : 400 })
    }

    return NextResponse.json({ success: false, message: "Invalid action. Use 'borrow', 'return', or 'extend'." }, { status: 400 })
  } catch (error: any) {
    console.error("POST /api/transactions error:", error)
    return NextResponse.json(
      { success: false, message: error?.message || "Unable to complete the transaction." },
      { status: 500 },
    )
  }
}
