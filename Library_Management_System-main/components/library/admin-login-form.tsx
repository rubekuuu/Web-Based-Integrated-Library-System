"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { ArrowRight, Eye, EyeOff, KeyRound, LockKeyhole, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { BrandFooter } from "./brand-footer"
import { ThemeToggle } from "./theme-toggle"

export function AdminLoginForm() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setIsSubmitting(true)

    const formData = new FormData(event.currentTarget)
    let response: Response
    try {
      response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: formData.get("adminId"),
          password: formData.get("password"),
        }),
      })
    } catch {
      setError("Unable to reach the sign-in service. Please try again.")
      setIsSubmitting(false)
      return
    }

    const result: unknown = await response.json().catch(() => null)
    const resultMessage =
      result && typeof result === "object" && "message" in result && typeof result.message === "string"
        ? result.message
        : null

    if (!response.ok) {
      setError(resultMessage || `Sign-in service returned an error (${response.status}). Please try again later.`)
      setIsSubmitting(false)
      return
    }

    router.replace("/")
    router.refresh()
    setIsSubmitting(false)
  }

  return (
    <main className="relative flex min-h-screen flex-col bg-gradient-to-br from-white via-white to-emerald-50 px-4 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 sm:px-6">
      <div className="absolute right-4 top-4 z-10">
        <ThemeToggle />
      </div>
      <div className="flex flex-1 items-center justify-center py-10">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-xl shadow-emerald-950/5 dark:border-slate-800 dark:bg-slate-900 lg:min-h-[610px] lg:grid-cols-[1fr_1.05fr]">
        <aside className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-white via-emerald-50/70 to-emerald-100/70 p-10 text-slate-900 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 dark:text-slate-100 lg:flex">
          <div aria-hidden="true" className="absolute -right-20 -top-20 h-80 w-80 rounded-full border border-emerald-200/70 dark:border-emerald-800/70" />
          <div aria-hidden="true" className="absolute -right-8 -top-8 h-56 w-56 rounded-full border border-emerald-200/60 dark:border-emerald-800/60" />
          <div aria-hidden="true" className="absolute -bottom-28 -left-20 h-80 w-80 rounded-full bg-emerald-200/60 blur-3xl" />

          <div className="relative flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white p-1 ring-1 ring-emerald-200 dark:bg-slate-800 dark:ring-slate-700">
              <Image src="/ORCA-green.png" alt="ORCA logo" width={44} height={44} className="h-10 w-10 object-contain" priority />
            </div>
            <div>
              <span className="block text-sm font-bold tracking-wide">ORCA</span>
              <span className="block max-w-[250px] text-xs leading-4 text-slate-600 dark:text-slate-300">Organized Resource &amp; Catalog System</span>
            </div>
          </div>

          <div className="relative max-w-md">
            <div className="mb-7 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/80 text-emerald-700 ring-1 ring-emerald-200 dark:bg-slate-800 dark:text-emerald-300 dark:ring-slate-700">
              <BookOpenIcon />
            </div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700 dark:text-emerald-300">A better way to manage</p>
            <h1 className="text-4xl font-semibold leading-tight tracking-tight">Every story starts with a well-run library.</h1>
            <p className="mt-5 text-sm leading-6 text-slate-600 dark:text-slate-300">
              Keep your collection organized, support your readers, and keep daily operations moving smoothly.
            </p>
          </div>

          <div className="relative flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
            <ShieldCheck className="h-4 w-4 text-emerald-700 dark:text-emerald-300" />
            Secure access for authorized administrators
          </div>
        </aside>

        <section className="flex items-center justify-center px-6 py-10 sm:px-12 lg:px-14">
          <div className="w-full max-w-sm">
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 p-1 ring-1 ring-emerald-200 dark:bg-emerald-950 dark:ring-emerald-900">
                <Image src="/ORCA-green.png" alt="ORCA logo" width={40} height={40} className="h-9 w-9 object-contain" priority />
              </div>
              <div>
                <span className="block text-sm font-bold">ORCA</span>
                <span className="block max-w-[250px] text-xs leading-4 text-slate-600 dark:text-slate-300">Organized Resource &amp; Catalog System</span>
              </div>
            </div>

            <div className="mb-8">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-900">
                <LockKeyhole className="h-5 w-5" />
              </div>
              <p className="mb-2 text-sm font-medium text-muted-foreground">Administrator portal</p>
              <h2 className="text-3xl font-semibold tracking-tight">Welcome back</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Sign in with the admin credentials provided to you.</p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label htmlFor="adminId" className="text-sm font-medium">Admin user ID</label>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="adminId"
                    name="adminId"
                    autoComplete="username"
                    placeholder="Enter your admin ID"
                    className="h-11 pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">Password</label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    className="h-11 pr-11"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <p role="alert" className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
                  {error}
                </p>
              )}

              <Button type="submit" className="h-11 w-full bg-emerald-600 text-white hover:bg-emerald-700" disabled={isSubmitting}>
                {isSubmitting ? "Signing in..." : "Sign in to dashboard"}
                {!isSubmitting && <ArrowRight className="ml-auto h-4 w-4" />}
              </Button>
            </form>

            <p className="mt-8 border-t pt-5 text-center text-xs leading-5 text-muted-foreground">
              Admin accounts are created and managed by your library administrator.
            </p>
          </div>
        </section>
      </div>
      </div>
      <BrandFooter />
    </main>
  )
}

function BookOpenIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-8 w-8" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 7v14m0-14C9.5 4.8 6.5 4 3 4v14c3.5 0 6.5.8 9 3m0-14c2.5-2.2 5.5-3 9-3v14c-3.5 0-6.5.8-9 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
