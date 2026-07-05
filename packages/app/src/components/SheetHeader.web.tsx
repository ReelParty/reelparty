"use client";

import { type ReactNode } from "react";

/** Title + subtitle block — part of the web sheet drag-to-dismiss zone. */
export function SheetHeader({ children }: { children: ReactNode }) {
  return (
    <div
      data-sheet-header
      className="rp-sheet-header -mx-5 mb-1 flex w-[calc(100%+40px)] flex-col items-center px-5 pb-6 pt-1"
    >
      {children}
    </div>
  );
}
