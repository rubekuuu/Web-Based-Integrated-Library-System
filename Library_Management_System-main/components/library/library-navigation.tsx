"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowLeftRight, BookOpen, Home, Library, LogOut, Users } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ThemeToggle } from "./theme-toggle"

const navigation = [
  { name: "Home", href: "/", icon: Home },
  { name: "Books", href: "/books", icon: BookOpen },
  { name: "Patrons", href: "/patrons", icon: Users },
  { name: "Transactions", href: "/transactions", icon: ArrowLeftRight },
]

export function LibraryNavigation() {
  const pathname = usePathname()
  const { toast } = useToast()

  const handleSignOut = async () => {
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" })
      if (!response.ok) throw new Error("Sign out request failed.")
      window.location.assign("/login")
    } catch {
      toast({
        title: "Unable to sign out",
        description: "Please try again.",
        variant: "destructive",
      })
    }
  }

  const linkClass = (href: string) =>
    `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
      pathname === href
        ? "bg-emerald-600 text-white shadow-sm"
        : "text-slate-600 hover:bg-emerald-50 hover:text-emerald-800 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-emerald-300"
    }`

  return (
    <>
      <nav className="hidden items-center gap-1 md:flex" aria-label="Primary navigation">
        {navigation.map((item) => {
          const Icon = item.icon
          return (
            <Link key={item.href} href={item.href} className={linkClass(item.href)}>
              <Icon className="h-4 w-4" />
              {item.name}
            </Link>
          )
        })}
        <ThemeToggle />
        <button
          type="button"
          onClick={handleSignOut}
          className="ml-1 flex items-center gap-2 rounded-lg border border-emerald-200 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800 dark:hover:text-emerald-300"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </nav>

      <nav
        className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-6 border-t border-emerald-100 bg-white/95 px-1 py-1 shadow-[0_-4px_18px_rgba(15,23,42,0.06)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 md:hidden"
        aria-label="Mobile navigation"
      >
        {navigation.map((item) => {
          const Icon = item.icon
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg text-[10px] font-medium ${
                active ? "text-emerald-700 dark:text-emerald-300" : "text-slate-500 dark:text-slate-400"
              }`}
            >
              <span className={`rounded-md p-1.5 ${active ? "bg-emerald-100 dark:bg-emerald-950" : ""}`}>
                <Icon className="h-4 w-4" />
              </span>
              {item.name}
            </Link>
          )
        })}
        <ThemeToggle compact />
        <button
          type="button"
          onClick={handleSignOut}
          className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg text-[10px] font-medium text-slate-500 dark:text-slate-400"
        >
          <span className="rounded-md p-1.5">
            <LogOut className="h-4 w-4" />
          </span>
          Sign Out
        </button>
      </nav>
    </>
  )
}

