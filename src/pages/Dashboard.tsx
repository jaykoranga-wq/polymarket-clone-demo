import { Counter } from "@/features/counter/Counter"

export function Dashboard() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      <p className="text-muted-foreground">
        Welcome to your protected workspace. Here you can manage your state.
      </p>
      <div className="rounded-xl border bg-card p-8 shadow-sm inline-block self-start">
        <Counter />
      </div>
    </div>
  )
}
