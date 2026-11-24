import Image from "next/image"

export function BrandFooter() {
  return (
    <footer className="relative mt-auto overflow-hidden border-t border-emerald-100 bg-white/90 dark:border-slate-800 dark:bg-slate-950/90">
      <div aria-hidden="true" className="pointer-events-none absolute -top-10 left-1/4 h-20 w-48 rounded-full bg-emerald-100/70 blur-2xl" />
      <div className="container relative mx-auto flex flex-col items-center justify-center gap-1 px-4 py-2 text-center">
        <div className="flex items-center justify-center gap-2">
          <Image src="/ORCA-green.png" alt="ORCA logo" width={28} height={28} className="h-7 w-7 object-contain" />
          <span className="text-sm font-semibold tracking-wide text-slate-800 dark:text-slate-200">ORCA</span>
        </div>
        <div className="text-[11px] font-medium text-emerald-700/80 dark:text-emerald-300">
          Organized Resource &amp; Catalog System
        </div>
      </div>
    </footer>
  )
}
