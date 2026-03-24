import { useState, useEffect, useCallback, type ReactNode } from 'react';

const sections = [
  { id: 'problem', label: 'What Problem Does WHIR Solve?' },
  { id: 'reed-solomon', label: 'Reed-Solomon Codes' },
  { id: 'constrained-rs', label: 'Constrained Reed-Solomon Codes' },
  { id: 'sumcheck', label: 'The Sumcheck Protocol' },
  { id: 'folding', label: 'Folding' },
  { id: 'one-iteration', label: 'One WHIR Iteration' },
  { id: 'full-protocol', label: 'The Full Protocol' },
  { id: 'why-fast', label: 'Why WHIR is Fast' },
];

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [activeId, setActiveId] = useState<string>(sections[0].id);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleIntersect = useCallback((entries: IntersectionObserverEntry[]) => {
    // Find the topmost visible section
    const visible = entries
      .filter((e) => e.isIntersecting)
      .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

    if (visible.length > 0) {
      setActiveId(visible[0].target.id);
    }
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(handleIntersect, {
      rootMargin: '-10% 0px -80% 0px',
      threshold: 0,
    });

    sections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [handleIntersect]);

  const navLinks = (
    <nav className="flex flex-col gap-0.5">
      {sections.map(({ id, label }, i) => {
        const isActive = activeId === id;
        return (
          <a
            key={id}
            href={`#${id}`}
            onClick={() => setMenuOpen(false)}
            className={`
              block px-4 py-2 text-sm leading-snug rounded-r-md transition-colors
              border-l-2
              ${
                isActive
                  ? 'border-sienna text-sienna font-medium bg-sienna/5'
                  : 'border-transparent text-text-muted hover:text-text hover:border-border'
              }
            `}
          >
            <span className="text-xs text-text-muted mr-1.5">{i + 1}.</span>
            {label}
          </a>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-bg">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed top-0 left-0 w-60 h-screen flex-col border-r border-border-light bg-bg-card z-30">
        <div className="px-6 pt-8 pb-6">
          <h1 className="font-heading text-3xl font-bold text-navy tracking-tight">
            WHIR
          </h1>
          <p className="text-xs text-text-muted mt-1">Protocol Visualizer</p>
        </div>
        <div className="flex-1 overflow-y-auto pb-8">{navLinks}</div>
      </aside>

      {/* Mobile top bar */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-bg-card border-b border-border-light z-30 flex items-center px-4">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-2 -ml-2 text-text hover:text-sienna transition-colors"
          aria-label="Toggle menu"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            {menuOpen ? (
              <>
                <line x1="6" y1="6" x2="18" y2="18" />
                <line x1="6" y1="18" x2="18" y2="6" />
              </>
            ) : (
              <>
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            )}
          </svg>
        </button>
        <h1 className="font-heading text-xl font-bold text-navy ml-3">WHIR</h1>
      </header>

      {/* Mobile menu overlay */}
      {menuOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/20"
          onClick={() => setMenuOpen(false)}
        >
          <div
            className="w-64 h-full bg-bg-card border-r border-border-light pt-16 pb-8 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {navLinks}
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="md:ml-60 pt-14 md:pt-0 min-h-screen">{children}</main>
    </div>
  );
}
