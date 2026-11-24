"use client"

import type { LibraryStats } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, Users, BookCheck, UserCheck } from "lucide-react"

interface StatsCardsProps {
  stats: LibraryStats
}

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="relative overflow-hidden border-l-4 border-l-emerald-600 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Books</CardTitle>
          <div className="rounded-lg bg-emerald-50 p-2 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            <BookOpen className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold tracking-tight">{stats.total_books}</div>
          <p className="text-xs text-emerald-700 dark:text-emerald-300">
            {stats.available_books} available
          </p>
        </CardContent>
      </Card>
      <Card className="relative overflow-hidden border-l-4 border-l-emerald-600 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Checked Out</CardTitle>
          <div className="rounded-lg bg-emerald-50 p-2 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            <BookCheck className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold tracking-tight">{stats.checked_out_books}</div>
          <p className="text-xs text-muted-foreground">
            Currently borrowed
          </p>
        </CardContent>
      </Card>
      <Card className="relative overflow-hidden border-l-4 border-l-emerald-600 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Patrons</CardTitle>
          <div className="rounded-lg bg-emerald-50 p-2 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            <Users className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold tracking-tight">{stats.total_patrons}</div>
          <p className="text-xs text-muted-foreground">
            Registered members
          </p>
        </CardContent>
      </Card>
      <Card className="relative overflow-hidden border-l-4 border-l-emerald-600 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Patrons</CardTitle>
          <div className="rounded-lg bg-emerald-50 p-2 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            <UserCheck className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold tracking-tight">{stats.active_patrons}</div>
          <p className="text-xs text-muted-foreground">
            With borrowed books
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
