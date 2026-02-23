import { Counter } from "@/features/counter"
import { APP_NAME } from "@/lib/constants"

export function Home() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-8 bg-background text-foreground">
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-4xl font-bold tracking-tight">{APP_NAME}</h1>
        <p className="text-muted-foreground">
          Production-ready React scaffold with Redux Toolkit &amp; shadcn/ui
        </p>
      </div>
      <div className="rounded-xl border bg-card p-8 shadow-sm">
        <Counter />
      </div>
      <p className="text-sm text-muted-foreground">
        Built with React 19 • Vite 7 • TypeScript • Redux Toolkit • shadcn/ui
      </p>
    </div>
  )
}
