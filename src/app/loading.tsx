import Skeleton from '@/components/Skeleton';

export default function Loading() {
  return (
    <div className="min-h-[100dvh] bg-[#f5f7fa] flex items-center justify-center">
      <div className="space-y-3 w-64">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}
