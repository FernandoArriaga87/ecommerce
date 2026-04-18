import { Skeleton } from "@/components/ui/skeleton";

export function ProductGridSkeleton() {
  return (
    <div className="container mx-auto px-6 md:px-12 py-24">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
        <div className="max-w-2xl w-full">
          <Skeleton className="h-12 w-3/4 mb-4" />
          <Skeleton className="h-12 w-1/2 mb-6" />
          <Skeleton className="h-6 w-1/3" />
        </div>
        <div className="flex gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-10 w-24 rounded-full" />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="flex flex-col">
            <Skeleton className="aspect-[4/5] w-full rounded-[2.5rem] mb-6" />
            <div className="px-2">
              <div className="flex justify-between mb-2">
                <Skeleton className="h-3 w-1/4" />
                <Skeleton className="h-3 w-1/4 rounded-full" />
              </div>
              <Skeleton className="h-6 w-3/4 mb-2" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-1/4" />
                <Skeleton className="h-5 w-1/4" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
