import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3"
import { randomUUID } from "crypto"

export const MAX_BOOK_COVER_SIZE = 5 * 1024 * 1024

const imageTypes = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
} as const

let client: S3Client | null = null

function getStorageConfig() {
  const { AWS_ENDPOINT_URL_S3, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, NEON_STORAGE_BUCKET } = process.env
  if (!AWS_ENDPOINT_URL_S3 || !AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !AWS_REGION || !NEON_STORAGE_BUCKET) {
    throw new Error("Neon Object Storage is not configured. Set AWS_ENDPOINT_URL_S3, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, and NEON_STORAGE_BUCKET.")
  }
  return { endpoint: AWS_ENDPOINT_URL_S3, accessKeyId: AWS_ACCESS_KEY_ID, secretAccessKey: AWS_SECRET_ACCESS_KEY, region: AWS_REGION, bucket: NEON_STORAGE_BUCKET }
}

function getStorageClient() {
  if (client) return client
  const config = getStorageConfig()
  client = new S3Client({
    region: config.region,
    endpoint: config.endpoint,
    credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey },
    forcePathStyle: true,
    requestChecksumCalculation: "WHEN_REQUIRED",
  })
  return client
}

export function validateBookCover(file: File): string | null {
  if (!Object.prototype.hasOwnProperty.call(imageTypes, file.type)) return "Choose a JPEG, PNG, WebP, or AVIF image."
  if (file.size === 0 || file.size > MAX_BOOK_COVER_SIZE) return "Book cover images must be between 1 byte and 5 MB."
  return null
}

export async function uploadBookCover(bookId: number, file: File) {
  const error = validateBookCover(file)
  if (error) throw new Error(error)

  const config = getStorageConfig()
  const key = `books/${bookId}/${randomUUID()}.${imageTypes[file.type as keyof typeof imageTypes]}`
  await getStorageClient().send(new PutObjectCommand({
    Bucket: config.bucket,
    Key: key,
    Body: Buffer.from(await file.arrayBuffer()),
    ContentType: file.type,
    CacheControl: "private, max-age=3600",
  }))
  return key
}

export async function readBookCover(key: string) {
  const config = getStorageConfig()
  const result = await getStorageClient().send(new GetObjectCommand({ Bucket: config.bucket, Key: key }))
  if (!result.Body) throw new Error("The stored book cover has no file content.")
  const extension = key.split(".").pop()?.toLowerCase()
  const inferredContentType = Object.entries(imageTypes).find(([, value]) => value === extension)?.[0]
  return {
    body: await result.Body.transformToByteArray(),
    contentType:
      result.ContentType && result.ContentType !== "application/octet-stream"
        ? result.ContentType
        : inferredContentType || "application/octet-stream",
  }
}

export async function deleteBookCover(key: string) {
  const config = getStorageConfig()
  await getStorageClient().send(new DeleteObjectCommand({ Bucket: config.bucket, Key: key }))
}
