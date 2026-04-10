import { Section } from '../components/Section';
import { Math as InlineMath } from '../components/MathBlock';

export function S7_WhirIteration() {
  return (
    <Section
      id="one-iteration"
      number={6}
      title="One WHIR Iteration"
      subtitle="The core protocol: sumcheck, fold, sample, query, recurse."
    >
      <p>
        Here's what we've built up so far. The prover has a big table of numbers
        (the execution trace and related tables) and wants to convince the verifier of two things at once:
      </p>
      <ol className="list-decimal ml-6 my-4 space-y-1">
        <li><strong>Of low-degree polynomial</strong> — the trace hasn't been tampered.</li>
        <li><strong>Satisfies constraints</strong> — that polynomial satisfies the required equations, meaning the computation was executed correctly.</li>
      </ol>
      <p className="my-4">
        The previous sections gave us one piece each:
      </p>
      <ul className="list-disc ml-6 my-4 space-y-2">
        <li>
          <strong>Section 3 (CRS)</strong> — encoded the execution trace as a
          polynomial, defined the constraint each
          row must satisfy (e.g. <em>output − input₁ − input₂ = 0</em>), and
          checked it row by row. A Constrained Reed-Solomon code combines both: a
          low-degree polynomial that also satisfies the constraint.
        </li>
        <li>
          <strong>Section 4 (Sumcheck)</strong> — collapses the constraint check
          across all rows into a single evaluation.
        </li>
        <li>
          <strong>Section 5 (Folding)</strong> — shrinks the polynomial onto a
          half-sized domain, so the problem gets smaller each round.
        </li>
      </ul>
      <p className="my-4">
        Two new ideas appear here. The <strong>out-of-domain probe</strong>: a
        cheating prover could fake values that look correct at every domain point
        but diverge elsewhere — the verifier catches this by testing at a random
        surprise point outside the domain. And <strong>consistency queries</strong>: the
        verifier spot-checks a few positions from the original committed polynomial
        to verify the folding was done correctly, rather than re-doing the entire
        fold.
      </p>
      <p className="my-4">
        Each iteration follows the same five moves, alternating between prover and
        verifier:
      </p>
      <ol className="list-decimal ml-6 my-4 space-y-2">
        <li>
          <strong>Sumcheck rounds</strong> — the prover runs <InlineMath tex="k" /> rounds of sumcheck, collapsing the algebraic constraint one variable at a time.
        </li>
        <li>
          <strong>Send folded function</strong> — using the sumcheck challenges as folding randomness, the prover halves the polynomial's domain and sends the new evaluations.
        </li>
        <li>
          <strong>Out-of-domain probe</strong> — the prover evaluates the folded polynomial at a challenge point <em>outside</em> the domain.
        </li>
        <li>
          <strong>Consistency queries</strong> — the verifier opens a few Merkle positions from the committed polynomial and checks the fold was computed correctly.
        </li>
        <li>
          <strong>Rinse and repeat</strong> — the output becomes the input to the next iteration, now on a half-sized domain.
        </li>
      </ol>
      <p className="my-4">
        Note that <strong>CRS isn't one of the steps</strong> — it's the shape of
        the claim that flows in and out. Steps 1–2 transform the claim, steps 3–4
        check that the transformation was honest, and step 5 restates the result
        as a new (smaller) CRS claim for the next iteration.
      </p>
      {/* Shrinking CRS illustration with pipeline boxes */}
      {(() => {
        const circles = [
          { label: 'Start', points: 8, r: 48 },
          { label: 'After iter 1', points: 4, r: 36 },
          { label: 'After iter 2', points: 2, r: 24 },
        ];
        const maxR = 48;
        const ga = Math.PI * (3 - Math.sqrt(5));
        return (
          <div className="my-6">
            <div className="flex items-center justify-center gap-1">
              {circles.map((step, si) => {
                const size = step.r * 2 + 20;
                const cx = size / 2;
                const cy = size / 2;
                return (
                  <div key={si} className="flex items-center gap-1">
                    {si > 0 && (
                      <div className="flex flex-col items-center gap-0.5 shrink-0">
                        {/* Sumcheck: many dots funneling to one */}
                        <svg width="50" height="36" viewBox="0 0 50 36">
                          {[8, 16, 24, 32, 42].map((x, i) => (
                            <line key={i} x1={x} y1={4} x2={25} y2={28} stroke="#8b4513" strokeWidth={0.8} strokeOpacity={0.4} />
                          ))}
                          {[8, 16, 24, 32, 42].map((x, i) => (
                            <circle key={`d${i}`} cx={x} cy={4} r={2.5} fill="#8b4513" fillOpacity={0.4} />
                          ))}
                          <circle cx={25} cy={28} r={3.5} fill="#8b4513" />
                        </svg>
                        <span className="text-[7px] text-sienna font-mono">sumcheck</span>

                        <svg width="12" height="6" viewBox="0 0 12 6">
                          <polygon points="6,6 2,0 10,0" fill="#6b6375" />
                        </svg>

                        {/* Fold: pairs merging */}
                        <svg width="50" height="32" viewBox="0 0 50 32">
                          {Array.from({ length: circles[si - 1].points }).map((_, i) => {
                            const x = 6 + (i * 38) / (circles[si - 1].points - 1);
                            const tx = 6 + (Math.floor(i / 2) * 38) / Math.max(step.points - 1, 1);
                            return (
                              <g key={i}>
                                <circle cx={x} cy={4} r={2.5} fill="#1a365d" fillOpacity={0.4} />
                                <line x1={x} y1={7} x2={tx} y2={25} stroke="#1a365d" strokeWidth={0.8} strokeOpacity={0.3} />
                              </g>
                            );
                          })}
                          {Array.from({ length: step.points }).map((_, i) => {
                            const tx = 6 + (i * 38) / Math.max(step.points - 1, 1);
                            return <circle key={`f${i}`} cx={tx} cy={28} r={3} fill="#1a365d" fillOpacity={0.7} />;
                          })}
                        </svg>
                        <span className="text-[7px] text-navy font-mono">fold {circles[si - 1].points}→{step.points}</span>

                        <svg width="12" height="6" viewBox="0 0 12 6">
                          <polygon points="6,6 2,0 10,0" fill="#6b6375" />
                        </svg>

                        {/* OOD probe: circle with a dot outside */}
                        <svg width="50" height="32" viewBox="0 0 50 32">
                          <circle cx={20} cy={16} r={12} fill="#fefdfb" stroke="#1a365d" strokeWidth={1.5} />
                          {Array.from({ length: 3 }).map((_, i) => {
                            const a = (i * 2.4) + 0.5;
                            return <circle key={i} cx={20 + 6 * Math.cos(a)} cy={16 + 6 * Math.sin(a)} r={2} fill="#1a365d" fillOpacity={0.4} />;
                          })}
                          <circle cx={40} cy={10} r={3.5} fill="#2f855a" stroke="#2f855a" strokeWidth={1} />
                          <text x={40} y={23} textAnchor="middle" fontSize="7" fill="#2f855a" fontFamily="monospace">?</text>
                        </svg>
                        <span className="text-[7px] text-green font-mono">OOD probe</span>

                        <svg width="12" height="6" viewBox="0 0 12 6">
                          <polygon points="6,6 2,0 10,0" fill="#6b6375" />
                        </svg>

                        {/* Queries: circle with ringed sampled dots */}
                        <svg width="50" height="32" viewBox="0 0 50 32">
                          <circle cx={25} cy={16} r={12} fill="#fefdfb" stroke="#1a365d" strokeWidth={1.5} />
                          {Array.from({ length: 4 }).map((_, i) => {
                            const a = (i * 1.7) + 0.3;
                            const dx = 25 + 7 * Math.cos(a);
                            const dy = 16 + 7 * Math.sin(a);
                            const sampled = i < 2;
                            return (
                              <g key={i}>
                                <circle cx={dx} cy={dy} r={2} fill="#1a365d" fillOpacity={0.4} />
                                {sampled && <circle cx={dx} cy={dy} r={5} fill="none" stroke="#2f855a" strokeWidth={1.5} />}
                              </g>
                            );
                          })}
                        </svg>
                        <span className="text-[7px] text-green font-mono">queries</span>

                        <svg width="22" height="12" viewBox="0 0 22 12">
                          <line x1="1" y1="6" x2="15" y2="6" stroke="#6b6375" strokeWidth="1.5" />
                          <polygon points="15,2 21,6 15,10" fill="#6b6375" />
                        </svg>
                      </div>
                    )}
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex items-center justify-center" style={{ height: maxR * 2 + 20 }}>
                      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                        <circle cx={cx} cy={cy} r={step.r} fill="#fefdfb" stroke="#1a365d" strokeWidth={2} />
                        {Array.from({ length: step.points }).map((_, i) => {
                          const r = Math.sqrt((i + 0.5) / step.points) * (step.r - 6);
                          const angle = i * ga;
                          const dx = cx + r * Math.cos(angle);
                          const dy = cy + r * Math.sin(angle);
                          return (
                            <circle key={i} cx={dx} cy={dy} r={3.5} fill="#1a365d" fillOpacity={0.5} />
                          );
                        })}
                      </svg>
                      </div>
                      <span className="text-[10px] text-text-muted font-mono">{step.label}</span>
                      <span className="text-[10px] text-text-muted">{step.points} pts</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-center gap-5 mt-2 text-[10px] text-text-muted">
              <span className="flex items-center gap-1.5">
                <svg width="16" height="16" viewBox="0 0 20 20">
                  <circle cx="10" cy="10" r="8" fill="#fefdfb" stroke="#1a365d" strokeWidth="2" />
                </svg>
                domain (evaluation points)
              </span>
              <span className="flex items-center gap-1.5">
                <svg width="8" height="8" viewBox="0 0 8 8">
                  <circle cx="4" cy="4" r="3.5" fill="#1a365d" fillOpacity="0.5" />
                </svg>
                committed polynomial values
              </span>
            </div>
          </div>
        );
      })()}

      <p className="my-4">
        A single <em>WHIR iteration</em> runs these back-to-back: sumcheck
        collapses the constraint to a single evaluation, then folding cuts the
        table in half. The
        output is the same kind of problem — still "is this a CRS codeword?" — just
        on a smaller table. Repeat a few times and the table becomes small enough
        for the verifier to check directly.
      </p>

    </Section>
  );
}
