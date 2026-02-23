import { clsx } from "clsx"
import type { FC } from "react"
import { useDispatch, useSelector } from "react-redux"

import { selectSelectedCategory } from "@/features/markets/marketSelectors"
import { setSelectedCategory } from "@/features/markets/marketSlice"
import { CATEGORIES } from "@/features/markets/mockData"

export const CategoryTabs: FC = () => {
  const dispatch = useDispatch()
  const selectedCategory = useSelector(selectSelectedCategory)

  return (
    <div className="w-full border-b border-border bg-background sticky top-16 z-40">
      <div className="container mx-auto px-4 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-6 min-w-max h-12">
          {CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => dispatch(setSelectedCategory(category))}
              className={clsx(
                "relative h-full flex items-center text-sm font-semibold transition-all duration-200 whitespace-nowrap",
                selectedCategory === category
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {category}
              {selectedCategory === category && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary shadow-[0_-2px_8px_rgba(22,199,132,0.4)] transition-all duration-300" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
