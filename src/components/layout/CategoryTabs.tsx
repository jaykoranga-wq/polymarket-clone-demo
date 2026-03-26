import { clsx } from "clsx"
import { type FC, useMemo } from "react"
import { useNavigate, useParams } from "react-router"

import { useAppDispatch } from "@/app/hooks"
import { ROUTES } from "@/constants/routes"
import { useGetCategoriesQuery } from "@/features/api/category/categoryApi"
import { setSelectedCategoryById, setSelectedCategoryByName } from "@/features/markets/marketSlice"
import { CATEGORIES } from "@/mocks/mockData"

export const CategoryTabs: FC = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  // Read the current category name directly from the URL — survives refresh
  const { category: activeCategoryName } = useParams<{ category?: string }>()

  const { data } = useGetCategoriesQuery()

  // ✅ merge mock + API categories safely
  const allCategories = useMemo(() => {
    const apiCategories = data ?? []
    return [...CATEGORIES, ...apiCategories]
  }, [data])

  return (
    <div className="border-b border-white/[0.06] bg-[#0d0f13] sticky top-14 z-40 md:mx-20">
      <div className="container mx-auto px-4 overflow-x-auto no-scrollbar p-2">
        <div className="flex items-center gap-6 min-w-max h-11">
          {allCategories.map((category) => {
            // URL param is the category name (e.g. "Crypto"), not the id
            const isActive = activeCategoryName
              ? decodeURIComponent(activeCategoryName) === category.name
              : false

            return (
              <button
                key={category.id}
                onClick={() => {
                  dispatch(setSelectedCategoryById(category.id))
                  dispatch(setSelectedCategoryByName(category.name))
                  navigate(
                    ROUTES.MarketCategory.replace(
                      ":category",
                      // Use the name in the URL so MarketPage can filter mock markets by name
                      encodeURIComponent(category.name),
                    ),
                  )
                }}
                className={clsx(
                  "relative h-full flex items-center text-[13px] font-medium transition-colors duration-200 whitespace-nowrap",
                  isActive ? "text-[#f1f8f4]" : "text-white/50 hover:text-white",
                )}
              >
                {category.name}

                {isActive && (
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#00c853] shadow-[0_0_8px_rgba(0,200,83,0.5)]" />
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
