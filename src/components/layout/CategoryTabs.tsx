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

  const allCategory = useMemo(() => {
    if (data && data.length > 0) return [...CATEGORIES, ...data]
    return CATEGORIES
  }, [data])

  return (
    <div className="border-b border-white/[0.06] bg-[#0d0f13] sticky top-14 z-40 md:mx-20">
      <div className="container mx-auto px-4 overflow-x-auto no-scrollbar p-2">
        <div className="flex items-center gap-6 min-w-max h-11">
          {allCategory.map((category) => (
            <button
              key={category}
              onClick={() => {
                dispatch(setSelectedCategory(category))
                navigate(`/markets/${category}`)
              }}
              className={clsx(
                // FIX 7+8: text-[13px], font-medium always (no bold on active)
                // active = green color + underline only, NOT bold
                "relative h-full flex items-center text-[13px] font-medium transition-colors duration-200 whitespace-nowrap",
                selectedCategory === category ? "text-[#f1f8f4]" : "text-white/50 hover:text-white",
              )}
            >
              {category}
              {selectedCategory === category && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#00c853] shadow-[0_0_8px_rgba(0,200,83,0.5)]" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
