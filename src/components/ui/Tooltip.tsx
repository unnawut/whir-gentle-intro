import type { ReactNode } from 'react';

interface TooltipProps {
  content: string;
  children: ReactNode;
}

export function Tooltip({ content, children }: TooltipProps) {
  return (
    <span className="relative inline-block group">
      {children}

      {/* Tooltip bubble */}
      <span
        role="tooltip"
        className="
          pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2
          px-3 py-1.5 rounded-md
          bg-text text-bg text-xs leading-snug whitespace-nowrap
          opacity-0 scale-95 transition-all duration-150
          group-hover:opacity-100 group-hover:scale-100
        "
      >
        {content}

        {/* Arrow */}
        <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
          <span className="block w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-text" />
        </span>
      </span>
    </span>
  );
}
