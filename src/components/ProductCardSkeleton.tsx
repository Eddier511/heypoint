import { Card } from "./ui/card";

interface ProductCardSkeletonProps {
  mobileLayout?: "grid" | "list";
}

export function ProductCardSkeleton({
  mobileLayout = "grid",
}: ProductCardSkeletonProps) {
  const isListMobile = mobileLayout === "list";

  return (
    <Card
      className={`rounded-2xl overflow-hidden bg-white border-none shadow-sm p-3 h-full animate-pulse ${
        isListMobile
          ? "flex flex-row sm:flex-col gap-3 sm:gap-0 sm:min-h-[320px]"
          : "flex flex-col min-h-[300px] sm:min-h-[320px]"
      }`}
    >
      {/* Image Skeleton */}
      <div
        className={`relative rounded-xl bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 flex-shrink-0 bg-[length:200%_200%] animate-[shimmer_2s_ease-in-out_infinite] ${
          isListMobile
            ? "w-32 h-32 sm:w-auto sm:h-auto sm:aspect-square"
            : "aspect-[4/3] sm:aspect-square"
        }`}
      />
      
      {/* Product Info */}
      <div className="flex-1 flex flex-col pt-2 min-w-0">
        {/* Product Name - 2 lines */}
        <div className="space-y-2 mb-2">
          <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-lg w-full bg-[length:200%_200%] animate-[shimmer_2s_ease-in-out_infinite]" />
          <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-lg w-3/4 bg-[length:200%_200%] animate-[shimmer_2s_ease-in-out_infinite]" />
        </div>

        <div className={`${isListMobile ? "mb-1.5" : "mb-1.5 min-h-[3.5rem]"}`}>
          <div className="h-5 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-lg w-24 mb-2 bg-[length:200%_200%] animate-[shimmer_2s_ease-in-out_infinite]" />
          <div className="h-3.5 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-lg w-20 bg-[length:200%_200%] animate-[shimmer_2s_ease-in-out_infinite]" />
        </div>

        <div className="mb-2 min-h-[14px]">
          <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-lg w-16 bg-[length:200%_200%] animate-[shimmer_2s_ease-in-out_infinite]" />
        </div>

        {/* Quantity Selector and Button */}
        <div className={`${isListMobile ? "flex" : "mt-auto flex"} flex-col sm:flex-row sm:items-center gap-2 flex-shrink-0`}>
          <div className="flex justify-center sm:justify-start">
            <div className="inline-flex items-center gap-1 bg-gray-100 border border-gray-200 rounded-xl px-1 h-10 w-[112px]">
              <div className="w-9 h-9 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-md bg-[length:200%_200%] animate-[shimmer_2s_ease-in-out_infinite]" />
              <div className="w-7 h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded bg-[length:200%_200%] animate-[shimmer_2s_ease-in-out_infinite]" />
              <div className="w-9 h-9 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-md bg-[length:200%_200%] animate-[shimmer_2s_ease-in-out_infinite]" />
            </div>
          </div>
          <div className="flex-1 h-11 bg-gradient-to-r from-[#FFE5D3] via-[#FFD9BF] to-[#FFE5D3] rounded-full bg-[length:200%_200%] animate-[shimmer_2s_ease-in-out_infinite]" />
        </div>
      </div>
    </Card>
  );
}
