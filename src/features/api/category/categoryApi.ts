import { api } from "../api"

export type Category = {
  id: string
  name: string
  slug?: string
  description?: string
  createdAt?: string
  updatedAt?: string
}

type CategoryResponse = {
  status: boolean
  statusCode: number
  message: string
  type: string
  data: Category
}

type CategoryListResponse = {
  status: boolean
  statusCode: number
  message: string
  type: string
  data: {
    data: Category[]
    count: number
  }
}

type GetCategoriesParams = {
  page?: number
  limit?: number
  search?: string
}

const categoryApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getCategories: builder.query<string[], GetCategoriesParams | void>({
      query: (params) => ({
        url: "/v1/user/categories",
        method: "GET",
        params: params ?? {},
      }),
      transformResponse: (res: CategoryListResponse) =>
        res.data.data.map((category) => category.name), // ← returns string[]
      providesTags: (result) =>
        result
          ? [
              ...result.map((name) => ({ type: "Categories" as const, id: name })),
              { type: "Categories", id: "LIST" },
            ]
          : [{ type: "Categories", id: "LIST" }],
    }),

    getCategoryById: builder.query<CategoryResponse, string>({
      query: (id) => ({
        url: `/v1/user/categories/${id}`,
        method: "GET",
      }),
      providesTags: (_result, _err, id) => [{ type: "Categories", id }],
    }),
  }), // ✅ closes endpoints
}) // ✅ closes injectEndpoints

export const { useGetCategoriesQuery, useGetCategoryByIdQuery } = categoryApi
