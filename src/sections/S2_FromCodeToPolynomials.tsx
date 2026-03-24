import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Section } from '../components/Section';
import { Math as InlineMath, MathBlock } from '../components/MathBlock';
import { StepNavigator } from '../components/ui/StepNavigator';

// A leanVM program (Example 2.1): assert x < 10, compute z = x*y + 100, assert z < 1000
const PROGRAM_CODE = `function checked_mul_add(x, y):
  assert x < 10          // range-check x
  z = x * y + 100        // compute result
  assert z < 1000         // range-check z
  return z`;

// Execution trace rows using leanVM's execution table columns
// Example: x = 3, y = 7 → z = 3*7 + 100 = 121
const TRACE_ROWS = [
  { step: 0, pc: 0, fp: 100, addr_a: 100, val_a: 3,   addr_b: 0, val_b: 0,   addr_c: 0,   val_c: 0,   instr: 'DEREF',  note: 'Load x = 3 from memory at fp+0. Range-check witness: x is "small".' },
  { step: 1, pc: 1, fp: 100, addr_a: 200, val_a: 9,   addr_b: 0, val_b: 6,   addr_c: 100, val_c: 3,   instr: 'ADD',    note: 'Compute 9 - x = 6. The ADD constraint enforces val_B = val_A + val_C, i.e. 6 = 9 - 3? Here: val_B - (val_A + val_C) = 0 rearranges so 9 = 6 + 3.' },
  { step: 2, pc: 2, fp: 100, addr_a: 200, val_a: 6,   addr_b: 0, val_b: 0,   addr_c: 0,   val_c: 0,   instr: 'DEREF',  note: 'Assert 9 - x = 6 is "small" by dereferencing it from a range-check table.' },
  { step: 3, pc: 3, fp: 100, addr_a: 201, val_a: 21,  addr_b: 100, val_b: 3, addr_c: 101, val_c: 7,   instr: 'MUL',    note: 'Compute x * y = 3 * 7 = 21. The MUL constraint enforces val_B - val_A * val_C = 0, i.e. 21 - 3 * 7 = 0? Rearranged: val_A = val_B * val_C? No: val_B = val_A, and constraint is val_B - val_A * val_C.' },
  { step: 4, pc: 4, fp: 100, addr_a: 202, val_a: 121, addr_b: 201, val_b: 21, addr_c: 203, val_c: 100, instr: 'ADD',    note: 'Compute x*y + 100 = 21 + 100 = 121. ADD constraint: val_B = val_A + val_C → 121 = 21 + 100.' },
  { step: 5, pc: 5, fp: 100, addr_a: 202, val_a: 121, addr_b: 0, val_b: 0,   addr_c: 0,   val_c: 0,   instr: 'DEREF',  note: 'Load z = 121. Range-check witness: z is "small".' },
  { step: 6, pc: 6, fp: 100, addr_a: 204, val_a: 999, addr_b: 0, val_b: 878, addr_c: 202, val_c: 121, instr: 'ADD',    note: 'Compute 999 - z = 999 - 121 = 878. ADD constraint: val_B = val_A + val_C → 878 + 121 = 999.' },
  { step: 7, pc: 7, fp: 100, addr_a: 204, val_a: 878, addr_b: 0, val_b: 0,   addr_c: 0,   val_c: 0,   instr: 'DEREF',  note: 'Assert 999 - z = 878 is "small", confirming z < 1000.' },
  { step: 8, pc: 8, fp: 100, addr_a: 0,   val_a: 0,   addr_b: 0, val_b: 0,   addr_c: 0,   val_c: 0,   instr: 'JUMP',   note: 'Return. Jump back to the caller. The wrapping-pair trick pairs this last row with itself for constraint checking.' },
];

const CONSTRAINT_STEPS = [
  {
    title: 'The Execution Trace',
    description:
      'leanVM runs a program step by step, recording the machine state at every cycle. Each cycle captures the program counter (pc), frame pointer (fp), three address-value pairs (A, B, C), and an instruction selector. With up to 2^25 rows and 20 committed base-field columns per cycle, the full trace forms a large matrix over the KoalaBear field.',
  },
  {
    title: 'Transition Constraints',
    description:
      'For a trace to be valid, each row must follow from the previous row according to the leanISA rules. For ADD instructions, the constraint is val_B - (val_A + val_C) = 0. For MUL, it is val_B - val_A * val_C = 0. These are combined with instruction selector bits into degree-5 AIR transition constraints. The last row is paired with itself (the "wrapping pair" trick) so no special boundary logic is needed.',
  },
  {
    title: 'Encoding as Polynomials',
    description:
      'Each of the 20 committed columns becomes a multilinear polynomial. With 2^25 rows, each polynomial has 25 variables. These column polynomials are then "stacked" via simple stacking into a single large polynomial, which is committed using WHIR\'s multilinear polynomial commitment scheme.',
  },
  {
    title: 'From Polynomials to Proximity Testing',
    description:
      'leanVM produces these column polynomials from the execution of signature verification programs. The prover commits them via WHIR, which tests their proximity to valid low-degree (multilinear) polynomials. If the polynomials pass WHIR\'s proximity test and satisfy the AIR constraints, the verifier is convinced the computation was correct -- without re-executing it.',
  },
];

export function S2_FromCodeToPolynomials() {
  const [step, setStep] = useState(0);
  const [highlightedRow, setHighlightedRow] = useState<number | null>(null);

  return (
    <Section
      id="code-to-polynomials"
      number={2}
      title="From Code to Polynomials"
      subtitle="How leanVM turns a program's execution into polynomial equations that WHIR can prove."
    >
      <h3 id="arithmetization" className="font-heading text-xl font-semibold text-text mb-3">
        Arithmetization
      </h3>
      <p>
        Before we can use polynomial proximity testing (the thing WHIR does), we need to understand
        how a <em>computation</em> becomes <em>polynomials</em> in the first place. This is the
        "arithmetization" step. In <strong>leanVM</strong> -- a minimal zkVM designed for
        post-quantum signature aggregation on Ethereum -- arithmetization turns the execution of
        signature verification into polynomials over the KoalaBear field{' '}
        <InlineMath tex="p = 2^{31} - 2^{24} + 1" />.
      </p>

      <h3 id="run-the-program" className="font-heading text-xl font-semibold text-text mt-10 mb-3">
        Step 1: Run the Program, Record Everything
      </h3>
      <p>
        Consider a leanVM function (based on Example 2.1 from the leanVM paper) that asserts{' '}
        <InlineMath tex="x < 10" />, computes <InlineMath tex="z = x \cdot y + 100" />,
        and asserts <InlineMath tex="z < 1000" />.
        When we run it, leanVM records the machine's state at every cycle in an{' '}
        <strong>execution trace</strong>. The leanISA has just four core instructions -- DEREF, ADD,
        MUL, and JUMP -- plus precompiles for POSEIDON2 and extension field operations:
      </p>

      {/* Code block */}
      <div className="bg-bg-card border border-border rounded-lg my-6 overflow-hidden">
        <div className="text-xs text-text-muted px-4 py-2 border-b border-border-light bg-border-light/30 font-mono">
          leanVM pseudocode
        </div>
        <pre className="px-4 py-3 text-sm font-mono text-text overflow-x-auto leading-relaxed">
          {PROGRAM_CODE}
        </pre>
      </div>

      {/* Execution trace table */}
      <div className="my-6 overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b-2 border-border">
              <th className="text-left py-2 px-2 font-heading font-semibold text-text-muted text-xs">Step</th>
              <th className="text-left py-2 px-2 font-heading font-semibold text-text-muted text-xs">PC</th>
              <th className="text-left py-2 px-2 font-heading font-semibold text-text-muted text-xs">FP</th>
              <th className="text-left py-2 px-2 font-heading font-semibold text-text-muted text-xs">addr_A</th>
              <th className="text-left py-2 px-2 font-heading font-semibold text-text-muted text-xs">val_A</th>
              <th className="text-left py-2 px-2 font-heading font-semibold text-text-muted text-xs">addr_B</th>
              <th className="text-left py-2 px-2 font-heading font-semibold text-text-muted text-xs">val_B</th>
              <th className="text-left py-2 px-2 font-heading font-semibold text-text-muted text-xs">addr_C</th>
              <th className="text-left py-2 px-2 font-heading font-semibold text-text-muted text-xs">val_C</th>
              <th className="text-left py-2 px-2 font-heading font-semibold text-text-muted text-xs">Instr</th>
            </tr>
          </thead>
          <tbody>
            {TRACE_ROWS.map((row) => (
              <tr
                key={row.step}
                className={`border-b border-border-light cursor-pointer transition-colors ${
                  highlightedRow === row.step ? 'bg-sienna/10' : 'hover:bg-bg-card'
                }`}
                onMouseEnter={() => setHighlightedRow(row.step)}
                onMouseLeave={() => setHighlightedRow(null)}
              >
                <td className="py-2 px-2 font-mono text-text-muted">{row.step}</td>
                <td className="py-2 px-2 font-mono">{row.pc}</td>
                <td className="py-2 px-2 font-mono">{row.fp}</td>
                <td className="py-2 px-2 font-mono">{row.addr_a}</td>
                <td className="py-2 px-2 font-mono">{row.val_a}</td>
                <td className="py-2 px-2 font-mono">{row.addr_b}</td>
                <td className="py-2 px-2 font-mono">{row.val_b}</td>
                <td className="py-2 px-2 font-mono">{row.addr_c}</td>
                <td className="py-2 px-2 font-mono">{row.val_c}</td>
                <td className="py-2 px-2 font-mono text-xs">{row.instr}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Hover note */}
      <AnimatePresence mode="wait">
        {highlightedRow !== null && (
          <motion.div
            key={highlightedRow}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="bg-bg-card border border-border rounded-lg px-4 py-3 mb-4 text-sm text-text-muted"
          >
            <span className="font-semibold text-sienna mr-2">Step {highlightedRow}:</span>
            {TRACE_ROWS[highlightedRow].note}
          </motion.div>
        )}
      </AnimatePresence>

      <p className="text-sm text-text-muted italic">
        Hover over any row to see what happens at that cycle. This table shows a simplified
        subset of leanVM's 20 committed columns per cycle.
      </p>

      {/* Step 2: Columns become polynomials */}
      <h3 id="columns-become-polynomials" className="font-heading text-xl font-semibold text-text mt-10 mb-3">
        Step 2: Columns Become Polynomials
      </h3>
      <p>
        Each column of the trace is a sequence of field values. In leanVM, each of the{' '}
        <strong>20 committed columns</strong> becomes a <strong>multilinear polynomial</strong>.
        With up to <InlineMath tex="2^{25}" /> rows, each polynomial has 25 variables.
        These column polynomials are then "stacked" into a single large polynomial committed
        via WHIR's multilinear polynomial commitment scheme.
      </p>
      <p className="mt-2">
        Here are three columns from our example trace, each encoded as a polynomial:
      </p>

      <div className="my-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { name: 'PC', values: TRACE_ROWS.map(r => r.pc), color: '#1a365d', tex: 'p_{\\mathrm{pc}}(x)' },
          { name: 'val_A', values: TRACE_ROWS.map(r => r.val_a), color: '#8b4513', tex: 'p_{\\nu_A}(x)' },
          { name: 'val_B', values: TRACE_ROWS.map(r => r.val_b), color: '#2f855a', tex: 'p_{\\nu_B}(x)' },
        ].map((col) => (
          <div key={col.name} className="bg-bg-card border border-border rounded-lg p-4">
            <div className="font-heading font-semibold text-sm mb-2" style={{ color: col.color }}>
              {col.name} → <InlineMath tex={col.tex} />
            </div>
            {/* Mini SVG chart */}
            <svg viewBox="0 0 200 80" className="w-full h-20">
              {/* Grid lines */}
              {TRACE_ROWS.map((_, i) => (
                <line
                  key={i}
                  x1={12 + i * 20}
                  y1={8}
                  x2={12 + i * 20}
                  y2={72}
                  stroke="#e0dcd4"
                  strokeWidth={0.5}
                />
              ))}
              {/* Points and connecting line */}
              {col.values.map((v, i) => {
                const maxVal = Math.max(...col.values, 1);
                const x = 12 + i * 20;
                const y = 68 - (v / Math.max(maxVal, 1)) * 56;
                return (
                  <g key={i}>
                    {i > 0 && (
                      <line
                        x1={12 + (i - 1) * 20}
                        y1={68 - (col.values[i - 1] / Math.max(maxVal, 1)) * 56}
                        x2={x}
                        y2={y}
                        stroke={col.color}
                        strokeWidth={1.5}
                        opacity={0.4}
                      />
                    )}
                    <circle cx={x} cy={y} r={3} fill={col.color} />
                    <text x={x} y={y - 6} textAnchor="middle" className="text-[7px]" fill="#6b6375">
                      {v}
                    </text>
                  </g>
                );
              })}
              {/* X-axis labels */}
              {col.values.map((_, i) => (
                <text key={i} x={12 + i * 20} y={79} textAnchor="middle" className="text-[7px]" fill="#6b6375">
                  {i}
                </text>
              ))}
            </svg>
            <p className="text-xs text-text-muted text-center mt-1">
              [{col.values.join(', ')}]
            </p>
          </div>
        ))}
      </div>

      <MathBlock tex="p_{\mathrm{pc}}(x), \; p_{\nu_A}(x), \; p_{\nu_B}(x), \; \ldots \quad \text{— 20 multilinear polys, each with 25 variables over } \mathbb{F}_p" />

      {/* Step 3: Constraints become polynomial identities */}
      <h3 id="constraints-become-identities" className="font-heading text-xl font-semibold text-text mt-10 mb-3">
        Step 3: Constraints Become Polynomial Identities
      </h3>
      <p className="mb-4">
        A valid execution trace isn't just any table of numbers -- each row must correctly follow from
        the previous row according to the leanISA. These rules become{' '}
        <strong>AIR (Algebraic Intermediate Representation) constraints</strong>:
      </p>

      <div className="bg-bg-card border border-border rounded-lg p-5 my-4">
        <p className="text-sm text-text-muted mb-3">
          leanVM's core constraints for each instruction type:
        </p>
        <div className="space-y-3">
          <div>
            <p className="text-sm font-semibold text-text">ADD constraint:</p>
            <MathBlock tex="\nu_B - (\nu_A + \nu_C) = 0" />
          </div>
          <div>
            <p className="text-sm font-semibold text-text">MUL constraint:</p>
            <MathBlock tex="\nu_B - \nu_A \cdot \nu_C = 0" />
          </div>
        </div>
        <p className="text-sm text-text-muted mt-4">
          These per-instruction constraints are combined with instruction selector bits into{' '}
          <strong>degree-5 transition constraints</strong> over the execution table
          (and degree-6 over the extension op table). A "wrapping pair" trick pairs the last row
          of the trace with itself, so no special boundary logic is needed -- every consecutive pair
          of rows satisfies the same polynomial identity.
        </p>
      </div>

      <p>
        The key insight is this: checking "did this leanVM program execute correctly?" reduces to checking
        "do these polynomials satisfy certain algebraic relationships?"
      </p>

      {/* Step 4: Interactive walkthrough */}
      <h3 id="big-picture" className="font-heading text-xl font-semibold text-text mt-10 mb-3">
        The Big Picture
      </h3>

      <div className="my-6">
        <StepNavigator
          step={step}
          totalSteps={CONSTRAINT_STEPS.length}
          onPrev={() => setStep(s => s - 1)}
          onNext={() => setStep(s => s + 1)}
          labels={CONSTRAINT_STEPS.map(s => s.title)}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {/* Visual for each step */}
          <div className="bg-bg-card border border-border rounded-lg p-6 my-4">
            <div className="font-heading font-semibold text-base text-text mb-3">
              {CONSTRAINT_STEPS[step].title}
            </div>
            <p className="text-sm text-text-muted mb-4">
              {CONSTRAINT_STEPS[step].description}
            </p>

            {/* Step-specific visuals */}
            {step === 0 && (
              <div className="flex items-center justify-center gap-3">
                <div className="bg-bg border border-border-light rounded p-3 text-center">
                  <div className="text-xs text-text-muted mb-1">leanVM Program</div>
                  <div className="font-mono text-sm">checked_mul_add()</div>
                </div>
                <div className="text-text-muted">→</div>
                <div className="bg-bg border border-border-light rounded p-3 text-center">
                  <div className="text-xs text-text-muted mb-1">Run cycle by cycle</div>
                  <div className="font-mono text-sm">T = {TRACE_ROWS.length} cycles</div>
                </div>
                <div className="text-text-muted">→</div>
                <div className="bg-sienna/10 border border-sienna/30 rounded p-3 text-center">
                  <div className="text-xs text-sienna mb-1">Execution Trace</div>
                  <div className="font-mono text-sm">{TRACE_ROWS.length} × 20 table</div>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-mono bg-bg border border-border-light rounded px-2 py-1 text-xs">Row i</span>
                  <span className="text-text-muted">+ instruction selector →</span>
                  <span className="font-mono bg-bg border border-border-light rounded px-2 py-1 text-xs">Row i+1</span>
                </div>
                <div className="text-xs text-text-muted mt-2 space-y-1">
                  <div>If <span className="font-mono">ADD</span>: <InlineMath tex="\nu_B - (\nu_A + \nu_C) = 0" /></div>
                  <div>If <span className="font-mono">MUL</span>: <InlineMath tex="\nu_B - \nu_A \cdot \nu_C = 0" /></div>
                  <div>If <span className="font-mono">DEREF</span>: memory read consistency via logup</div>
                  <div>If <span className="font-mono">JUMP</span>: <InlineMath tex="\mathrm{pc}' = \nu_A" /></div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="flex items-center justify-center gap-3 flex-wrap">
                {['p_{\\mathrm{pc}}', 'p_{\\nu_A}', 'p_{\\nu_B}', '\\ldots'].map((p, i) => (
                  <div key={p} className="bg-bg border border-border-light rounded p-3 text-center">
                    <div className="text-xs text-text-muted mb-1">{i < 3 ? `Column ${i + 1}` : '20 total'}</div>
                    <InlineMath tex={p} />
                    <div className="text-xs text-text-muted mt-1">25 variables</div>
                  </div>
                ))}
              </div>
            )}

            {step === 3 && (
              <div className="flex items-center justify-center gap-3">
                <div className="bg-bg border border-border-light rounded p-3 text-center">
                  <div className="text-xs text-text-muted mb-1">Signature verification</div>
                  <div className="font-mono text-xs">leanVM trace</div>
                </div>
                <div className="text-text-muted">→</div>
                <div className="bg-bg border border-border-light rounded p-3 text-center">
                  <div className="text-xs text-text-muted mb-1">Stack into one poly</div>
                  <InlineMath tex="\tilde{f}" />
                </div>
                <div className="text-text-muted">→</div>
                <div className="bg-sienna/10 border border-sienna/30 rounded p-3 text-center">
                  <div className="text-xs text-sienna mb-1">WHIR proximity test</div>
                  <div className="text-xs">Close to multilinear?</div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Summary */}
      <div className="bg-bg-card border border-border rounded-lg p-5 mt-8">
        <h4 className="font-heading font-semibold text-base text-text mb-2">
          Why This Matters for WHIR
        </h4>
        <p className="text-sm text-text-muted mb-3">
          This is exactly how leanVM works end to end: signature verification programs are executed
          on the leanISA, producing an execution trace with up to{' '}
          <InlineMath tex="2^{25}" /> rows and 20 columns. Each column becomes a multilinear
          polynomial, and the polynomials are stacked and committed via WHIR. The verifier's job
          is then to check:
        </p>
        <ol className="list-decimal list-inside text-sm text-text-muted space-y-1 mb-3">
          <li>Are the committed evaluations close to a valid multilinear polynomial? <strong>(proximity testing)</strong></li>
          <li>Do the polynomials satisfy the degree-5 AIR transition constraints? <strong>(constraint checking)</strong></li>
        </ol>
        <p className="text-sm text-text-muted">
          WHIR is special because it handles <em>both</em> of these in one shot through{' '}
          <strong>constrained Reed-Solomon codes</strong>, which we'll explore after understanding
          the basics of Reed-Solomon codes in the next section.
        </p>
      </div>
    </Section>
  );
}
