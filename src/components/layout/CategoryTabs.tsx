import { clsx } from "clsx"
import { type FC, useMemo } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate } from "react-router"

import { useGetCategoriesQuery } from "@/features/api/category/categoryApi"
import { selectSelectedCategory } from "@/features/markets/marketSelectors"
import { setSelectedCategory } from "@/features/markets/marketSlice"
import { CATEGORIES } from "@/mocks/mockData"

export const CategoryTabs: FC = () => {
  const dispatch = useDispatch()
  const selectedCategory = useSelector(selectSelectedCategory)
  const navigate = useNavigate()
  const { data } = useGetCategoriesQuery()

  // ✅ useMemo — no useState, no useEffect, no cascading render error
  const allCategory = useMemo(() => {
    if (data && data.length > 0) return [...CATEGORIES, ...data]
    return CATEGORIES
  }, [data])

  return (
    <div className=" border-b border-border/70  bg-background sticky top-14 z-40 md:px-25 font-liberation">
      <div className="overflow-x-auto no-scrollbar">
        <div className=" container flex items-center gap-2  mb-1 h-9">
          {allCategory.map((category) => (
            <button
              key={category}
              onClick={() => {
                dispatch(setSelectedCategory(category))
                navigate(`/markets/${category}`)
              }}
              className={clsx(
                "relative h-full flex items-center text-xs font-bold transition-all duration-200 px-3 whitespace-nowrap",
                selectedCategory === category ? "text-white" : "text-secondary hover:text-white",
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
