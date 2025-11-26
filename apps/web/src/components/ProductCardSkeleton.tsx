import { Card } from "./ui/card";

export function ProductCardSkeleton() {
  return (
    <Card className="flex flex-col rounded-2xl overflow-hidden bg-white border-none shadow-md p-4 h-full animate-pulse">
      {/* Image Skeleton */}
      <div className="relative h-48 rounded-xl bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 flex-shrink-0 bg-[length:200%_200%] animate-[shimmer_2s_ease-in-out_infinite]" />
      
      {/* Product Info */}
      <div className="flex-1 flex flex-col pt-3">
        {/* Product Name - 2 lines */}
        <div className="space-y-2 mb-3">
          <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-lg w-full bg-[length:200%_200%] animate-[shimmer_2s_ease-in-out_infinite]" />
          <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-lg w-3/4 bg-[length:200%_200%] animate-[shimmer_2s_ease-in-out_infinite]" />
        </div>
        
        {/* Spacer */}
        <div className="flex-1" />
        
        {/* Price */}
        <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-lg w-24 mb-3 bg-[length:200%_200%] animate-[shimmer_2s_ease-in-out_infinite]" />
      </div>
      
      {/* Quantity Selector and Button */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center flex-shrink-0">
        {/* Quantity Selector Skeleton */}
        <div className="flex justify-center sm:justify-start">
          <div className="inline-flex items-center gap-3 bg-gray-100 border border-gray-200 rounded-xl px-2 h-11 w-[140px]">
            <div className="w-11 h-11 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-lg bg-[length:200%_200%] animate-[shimmer_2s_ease-in-out_infinite]" />
            <div className="w-8 h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded bg-[length:200%_200%] animate-[shimmer_2s_ease-in-out_infinite]" />
            <div className="w-11 h-11 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-lg bg-[length:200%_200%] animate-[shimmer_2s_ease-in-out_infinite]" />
          </div>
        </div>
        
        {/* Button Skeleton */}
        <div className="flex-1 h-11 bg-gradient-to-r from-[#FFE5D3] via-[#FFD9BF] to-[#FFE5D3] rounded-full bg-[length:200%_200%] animate-[shimmer_2s_ease-in-out_infinite]" />
      </div>
    </Card>
  );
}
