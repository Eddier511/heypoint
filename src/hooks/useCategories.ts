import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

const CATEGORY_STALE_TIME = 5 * 60_000;
const CATEGORY_CACHE_TIME = 15 * 60_000;

export type ApiCategory = {
  id: string;
  name: string;
  image?: string;
  imageUrl?: string;
  imagePath?: string;
  items?: number;
  productCount?: number;
  status?: "active" | "inactive" | boolean;
};

type ApiCategoriesResponse = ApiCategory[] | { categories: ApiCategory[] };

function normalizeCategories(data: ApiCategoriesResponse): ApiCategory[] {
  return Array.isArray(data) ? data : data?.categories || [];
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await api.get<ApiCategoriesResponse>("/categories");
      return normalizeCategories(data);
    },
    staleTime: CATEGORY_STALE_TIME,
    gcTime: CATEGORY_CACHE_TIME,
    refetchOnWindowFocus: false,
  });
}
