import { useAppDispatch, useAppSelector } from "@/app/hooks"
import { Button } from "@/components/ui/button"
import { decrement, increment, reset, selectCount } from "@/features/counter/counterSlice"

export function Counter() {
  const count = useAppSelector(selectCount)
  const dispatch = useAppDispatch()

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-6xl font-bold tabular-nums tracking-tight">{count}</div>
      <div className="flex gap-3">
        <Button variant="outline" size="lg" onClick={() => dispatch(decrement())}>
          −
        </Button>
        <Button variant="default" size="lg" onClick={() => dispatch(increment())}>
          +
        </Button>
        <Button variant="secondary" size="lg" onClick={() => dispatch(reset())}>
          Reset
        </Button>
      </div>
    </div>
  )
}
