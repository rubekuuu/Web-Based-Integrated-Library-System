"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { BookOpen } from "lucide-react"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"

interface BookCoverProps {
  src?: string | null
  title: string
  author: string
  year: number
  genre: string
  className?: string
}

function BookMetadata({ author, year, genre }: Pick<BookCoverProps, "author" | "year" | "genre">) {
  return (
    <dl className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1.5 text-sm">
      <dt className="text-muted-foreground">Author</dt>
      <dd className="min-w-0 break-words font-medium">{author}</dd>
      <dt className="text-muted-foreground">Year</dt>
      <dd className="font-medium">{year}</dd>
      <dt className="text-muted-foreground">Genre</dt>
      <dd className="min-w-0 break-words font-medium">{genre}</dd>
    </dl>
  )
}

export function BookCover({ src, title, author, year, genre, className }: BookCoverProps) {
  const [previewOpen, setPreviewOpen] = useState(false)
  const [hoverOpen, setHoverOpen] = useState(false)
  const [imageFailed, setImageFailed] = useState(false)

  useEffect(() => {
    setImageFailed(false)
  }, [src])

  const cover = (
    <div className={cn("relative flex h-full w-full shrink-0 items-center justify-center overflow-hidden rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300", className)}>
      {src && !imageFailed ? (
        <Image src={src} alt={`Cover of ${title}`} fill sizes="(max-width: 640px) 80px, 112px" className="object-cover" onError={() => setImageFailed(true)} />
      ) : (
        <BookOpen aria-hidden="true" className="h-7 w-7" />
      )}
    </div>
  )

  return (
    <>
      <HoverCard open={hoverOpen} onOpenChange={setHoverOpen} openDelay={250}>
        <HoverCardTrigger asChild>
          <button
            type="button"
            onClick={() => {
              setHoverOpen(false)
              setPreviewOpen(true)
            }}
            aria-label={`View cover and details for ${title}`}
            className={cn("block cursor-zoom-in rounded-lg border-0 bg-transparent p-0 text-left shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600", className)}
          >
            {cover}
          </button>
        </HoverCardTrigger>
        <HoverCardContent
          side="right"
          sideOffset={12}
          className="w-[min(24rem,calc(100vw-2rem))] border-emerald-100 bg-white p-3 shadow-xl dark:border-slate-700 dark:bg-slate-900"
        >
          <div className="flex min-w-0 items-start gap-3">
            {src && !imageFailed ? (
              <Image
                src={src}
                alt={`Cover of ${title}`}
                width={96}
                height={144}
                sizes="96px"
                className="h-36 w-24 shrink-0 rounded-sm object-cover"
                onError={() => setImageFailed(true)}
              />
            ) : (
              <div className="flex h-36 w-24 shrink-0 items-center justify-center rounded-sm bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                <BookOpen aria-hidden="true" className="h-8 w-8" />
              </div>
            )}
            <div className="min-w-0 space-y-2">
              <p className="line-clamp-2 break-words text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</p>
              <BookMetadata author={author} year={year} genre={genre} />
              <p className="text-xs text-muted-foreground sm:hidden">Tap the cover for a larger preview</p>
            </div>
          </div>
        </HoverCardContent>
      </HoverCard>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-h-[85dvh] w-[calc(100%-2rem)] overflow-y-auto sm:max-w-md">
          <DialogHeader className="pr-8">
            <DialogTitle className="break-words">{title}</DialogTitle>
            <DialogDescription>Book cover and details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {src && !imageFailed ? (
              <Image
                src={src}
                alt={`Cover of ${title}`}
                width={360}
                height={540}
                sizes="(max-width: 640px) 70vw, 360px"
                className="mx-auto max-h-[45dvh] w-auto max-w-full rounded-md object-contain"
                onError={() => setImageFailed(true)}
              />
            ) : (
              <div className="mx-auto flex h-48 w-32 items-center justify-center rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 sm:h-60 sm:w-40">
                <BookOpen aria-hidden="true" className="h-12 w-12" />
              </div>
            )}
            <BookMetadata author={author} year={year} genre={genre} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
