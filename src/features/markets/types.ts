export interface Market {
  id: string;
  title: string;
  description?: string;
  category: string;
  thumbnailUrl: string;
  expiryDate: string;
  yesProbability: number; // 0 to 100
  noProbability: number; // 0 to 100
  volume: string;
  frequency: "Daily" | "Monthly" | "Event";
  isTrending?: boolean;
}

export interface MarketsState {
  list: Market[];
  loading: boolean;
  error: string | null;
  selectedCategory: string;
}
