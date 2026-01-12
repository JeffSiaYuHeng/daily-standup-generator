import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => {
  return (
    <div 
      className={`animate-pulse bg-slate-200 dark:bg-slate-700 rounded ${className}`}
      aria-hidden="true"
    />
  );
};

export const HistoryItemSkeleton: React.FC = () => (
  <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3 bg-white dark:bg-slate-800/50">
    <div className="flex justify-between items-center">
      <Skeleton className="h-4 w-20 rounded-md" />
      <Skeleton className="h-4 w-4 rounded-md" />
    </div>
    <div className="space-y-2">
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-[90%]" />
      <Skeleton className="h-3 w-[40%]" />
    </div>
    <Skeleton className="h-3 w-16" />
  </div>
);
