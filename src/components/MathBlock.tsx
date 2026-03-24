import katex from 'katex';

interface MathProps {
  tex: string;
  display?: boolean;
}

function renderTeX(tex: string, displayMode: boolean): string {
  try {
    return katex.renderToString(tex, {
      displayMode,
      throwOnError: true,
      strict: false,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid TeX';
    return `<span class="text-red text-sm font-mono">${message}</span>`;
  }
}

/** Inline math (display=false by default) */
export function Math({ tex, display = false }: MathProps) {
  const html = renderTeX(tex, display);
  return (
    <span
      className={display ? 'block my-4' : 'inline'}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/** Block-level display math (display=true by default) */
export function MathBlock({ tex, display = true }: MathProps) {
  const html = renderTeX(tex, display);
  return (
    <div
      className="my-6 overflow-x-auto"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
