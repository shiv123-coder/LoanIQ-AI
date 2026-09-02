/**
 * SkeletonLoaders.tsx
 * Reusable skeleton loading components for use across the app.
 * Replace "Loading..." text with these components to give a polished loading UX.
 */

import { cn } from '@/lib/utils';

// ─── Base Skeleton Pulse ───────────────────────────────────────────────────────
function Pulse({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-lg bg-secondary/70',
        className
      )}
    />
  );
}

// ─── Stat Card Skeleton ────────────────────────────────────────────────────────
export function StatCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Pulse className="w-4 h-4 rounded-full" />
        <Pulse className="h-3 w-24" />
      </div>
      <Pulse className="h-8 w-16" />
    </div>
  );
}

// ─── Table Row Skeleton ────────────────────────────────────────────────────────
export function TableRowSkeleton({ cols = 6 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-6 py-4">
          <div className="space-y-2">
            <Pulse className="h-4 w-3/4" />
            <Pulse className="h-3 w-1/2" />
          </div>
        </td>
      ))}
    </tr>
  );
}

// ─── Admin Table Skeleton ──────────────────────────────────────────────────────
export function AdminTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRowSkeleton key={i} cols={6} />
      ))}
    </>
  );
}

// ─── Loan Card Skeleton ────────────────────────────────────────────────────────
export function LoanCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="flex items-center gap-4 p-4">
        <Pulse className="h-7 w-20 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Pulse className="h-4 w-3/4" />
          <Pulse className="h-3 w-1/2" />
        </div>
        <Pulse className="h-4 w-4 rounded" />
      </div>
    </div>
  );
}

// ─── Loan History Skeleton ─────────────────────────────────────────────────────
export function LoanHistorySkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <LoanCardSkeleton key={i} />
      ))}
    </div>
  );
}

// ─── Profile / Header Skeleton ─────────────────────────────────────────────────
export function ProfileHeaderSkeleton() {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Pulse className="w-10 h-10 rounded-xl" />
        <div className="space-y-2">
          <Pulse className="h-5 w-32" />
          <Pulse className="h-3 w-48" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Pulse className="w-8 h-8 rounded-lg" />
        <Pulse className="w-8 h-8 rounded-lg" />
        <Pulse className="w-8 h-8 rounded-lg" />
      </div>
    </div>
  );
}

// ─── Dashboard Stats Skeleton ──────────────────────────────────────────────────
export function DashboardStatsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  );
}

// ─── Full Page Skeleton ────────────────────────────────────────────────────────
export function DashboardPageSkeleton() {
  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 space-y-6 animate-pulse">
      {/* Header */}
      <ProfileHeaderSkeleton />
      {/* Stats */}
      <DashboardStatsSkeleton />
      {/* List section label */}
      <div className="space-y-3">
        <Pulse className="h-4 w-40" />
        <LoanHistorySkeleton count={3} />
      </div>
    </div>
  );
}
