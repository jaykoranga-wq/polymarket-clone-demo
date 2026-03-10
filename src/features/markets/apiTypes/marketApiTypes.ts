export interface ApiToken {
  id: string
  title: string
  volume: number
}

export interface ApiOptionGroup {
  id: string
  title: string
  tokens: ApiToken[]
}

export interface ApiCategory {
  id: string
  name: string
}

export interface ApiMarket {
  id: string
  title: string
  displayImageUrl: string | null
  categoryId: string
  resolutionTime: string
  createdAt: string
  status: number
  optionGroups: ApiOptionGroup[]
  category: ApiCategory
}

export interface ApiMarketListResponse {
  statusCode: number
  status: boolean
  message: string
  type: string
  data: {
    data: ApiMarket[] // ← double nested
    count: number
  }
}
