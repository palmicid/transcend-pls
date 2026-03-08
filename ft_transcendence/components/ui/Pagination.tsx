"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  page: number;
  total: number;
  setPage: (p: number) => void;
};

export default function Pagination({ page, total, setPage }: Props) {
  const isPrevDisabled = page <= 1;
  const isNextDisabled = page >= total;

  function goPrev() {
    if (!isPrevDisabled) setPage(page - 1);
  }

  function goNext() {
    if (!isNextDisabled) setPage(page + 1);
  }

  return (
    <div className="flex items-center justify-between mt-6 text-sm">

      {/* Prev button */}
      <button
        onClick={goPrev}
        disabled={isPrevDisabled}
        className="flex items-center justify-center w-9 h-9 rounded-lg border border-white/10 bg-white/[0.04]
          hover:bg-white/[0.08] disabled:opacity-40 disabled:cursor-not-allowed transition"
        aria-label="Previous page"
      >
        <ChevronLeft size={18} />
      </button>

      {/* Page indicator */}
      <div className="text-white/70">
        Page <span className="font-medium">{page}</span> of{" "}
        <span className="font-medium">{Math.max(total, 1)}</span>
      </div>

      {/* Next button */}
      <button
        onClick={goNext}
        disabled={isNextDisabled}
        className="flex items-center justify-center w-9 h-9 rounded-lg border border-white/10 bg-white/[0.04]
          hover:bg-white/[0.08] disabled:opacity-40 disabled:cursor-not-allowed transition"
        aria-label="Next page"
      >
        <ChevronRight size={18} />
      </button>
      
    </div>
  );
}
