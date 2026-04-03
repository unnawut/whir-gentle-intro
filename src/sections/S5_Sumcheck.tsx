import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Section } from '../components/Section';
import { Math as InlineMath, MathBlock } from '../components/MathBlock';
import { StepNavigator } from '../components/ui/StepNavigator';
import { Slider } from '../components/ui/Slider';
import { mod } from '../utils/field';
import { evaluate } from '../utils/polynomial';
import type { MultilinearPoly } from '../utils/sumcheck';
import { simulateFullSumcheck } from '../utils/sumcheck';

// Fixed example polynomial: f(X1, X2) on {0,1}^2
// Index mapping: 0 = (0,0), 1 = (0,1), 2 = (1,0), 3 = (1,1)
const POLY_VALUES = [3, 1, 5, 4]; // f(0,0)=3, f(0,1)=1, f(1,0)=5, f(1,1)=4 => sum=13
const POLY: MultilinearPoly = { values: POLY_VALUES, numVars: 2 };
const CHALLENGES = [6, 10]; // pre-selected verifier challenges

const stepLabels = [
  'The Claim',
  'Round 1: Collapse X\u2081',
  'Round 2: Collapse X\u2082',
  'Final Check',
];

export function S5_Sumcheck() {
  const [step, setStep] = useState(0);
  // Charlie's score slider — defaults to honest value (4)
  const [charlieOverride, setCharlieOverride] = useState<number | null>(null);
  const charlieScore = charlieOverride !== null ? charlieOverride : 4;

  // 3 referees: Alice=3, Bob=1, Charlie=4
  // Row 00: ADD: 0 + Alice(3) = 3
  // Row 01: ADD: 3 + Bob(1) = 4
  // Row 10: ADD: 4 + Charlie(4) = 8  (tamper target)
  // Row 11: padding (0)
  // Committed outputs: 3, 4, 8, 0
  const row10Error = ((8 - (4 + charlieScore) % 17) % 17 + 17) % 17;
  const totalWeightedSum = row10Error;

  const result = useMemo(
    () => simulateFullSumcheck(POLY, CHALLENGES),
    []
  );

  // Hypercube grid coordinates for visualization
  const gridVertices = [
    { label: '(0,0)', x: 60, y: 110, val: POLY_VALUES[0], xi: [0, 0] },
    { label: '(0,1)', x: 180, y: 110, val: POLY_VALUES[1], xi: [0, 1] },
    { label: '(1,0)', x: 60, y: 30, val: POLY_VALUES[2], xi: [1, 0] },
    { label: '(1,1)', x: 180, y: 30, val: POLY_VALUES[3], xi: [1, 1] },
  ];

  // Determine which vertices are "active" per step
  const getVertexOpacity = (_v: typeof gridVertices[0]) => {
    if (step === 0) return 1;
    if (step === 1) return 1; // all visible, dimension X1 being collapsed
    if (step === 2) return 0.3; // most dimmed, only the "line" along X2
    return 0.2;
  };

  // The dimension being collapsed in current step
  const collapsingDim = step === 1 ? 0 : step === 2 ? 1 : -1;

  return (
    <Section
      id="sumcheck"
      number={4}
      title="The Sumcheck Protocol"
      subtitle="Reduce an exponential-size sum to a single evaluation, one variable at a time."
    >
      <h3 id="how-sumcheck-works" className="font-heading text-xl font-semibold text-text mb-3">
        How Sumcheck Works
      </h3>
      <p>
        The <strong>sumcheck protocol</strong> is a core building block inside WHIR.
        Recall that a CRS constraint requires checking a weighted sum over <em>all</em>{' '}
        <InlineMath tex="2^m" /> points of the boolean hypercube — for large polynomials,
        that's millions of evaluations. Sumcheck solves this by reducing the exponential-size
        sum to a <em>single</em> random evaluation. WHIR uses sumcheck in each iteration
        to reduce the CRS constraint to a simpler one on a smaller domain.
      </p>

      <MathBlock tex="\sum_{b \in \{0,1\}^m} f(b) \stackrel{?}{=} H" />

      {/* Why exponential visualization */}
      <div className="bg-bg-card border border-border rounded-lg p-5 my-6">
        <h4 className="font-heading font-semibold text-base text-text mb-3">
          Why is this sum exponential?
        </h4>
        <p className="text-sm text-text-muted mb-4">
          The boolean hypercube <InlineMath tex="\{0,1\}^m" /> contains every binary
          string of length <InlineMath tex="m" />. Each additional variable doubles the
          number of points — the sum grows exponentially:
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-3 font-heading font-semibold text-text-muted text-xs">Variables (<InlineMath tex="m" />)</th>
                <th className="text-left py-2 px-3 font-heading font-semibold text-text-muted text-xs">Points (<InlineMath tex="2^m" />)</th>
                <th className="text-left py-2 px-3 font-heading font-semibold text-text-muted text-xs">Example program</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              <tr className="border-b border-border-light">
                <td className="py-2 px-3 font-mono">4</td>
                <td className="py-2 px-3 font-mono">16</td>
                <td className="py-2 px-3 text-text-muted">
                  Hash preimage — just a few rounds of a hash function, ~16 steps
                </td>
              </tr>
              <tr className="border-b border-border-light">
                <td className="py-2 px-3 font-mono">8</td>
                <td className="py-2 px-3 font-mono">256</td>
                <td className="py-2 px-3 text-text-muted">
                  Sudoku validity — 81 cells with row/column/box constraints, a few hundred checks
                </td>
              </tr>
              <tr className="border-b border-border-light">
                <td className="py-2 px-3 font-mono">12</td>
                <td className="py-2 px-3 font-mono">4,096</td>
                <td className="py-2 px-3 text-text-muted">
                  Merkle inclusion — ~32 hash computations for a tree of depth 32, each hash expands to ~100 trace rows
                </td>
              </tr>
              <tr className="border-b border-border-light">
                <td className="py-2 px-3 font-mono">16</td>
                <td className="py-2 px-3 font-mono">65,536</td>
                <td className="py-2 px-3 text-text-muted">
                  Token transfer — balance lookups, signature check, state update; each operation generates many trace rows
                </td>
              </tr>
              <tr className="border-b border-border-light">
                <td className="py-2 px-3 font-mono">20</td>
                <td className="py-2 px-3 font-mono">1,048,576</td>
                <td className="py-2 px-3 text-text-muted">
                  DEX swap — price oracle reads, AMM curve math, multiple token transfers, slippage checks
                </td>
              </tr>
              <tr className="border-b border-border-light">
                <td className="py-2 px-3 font-mono">22</td>
                <td className="py-2 px-3 font-mono">4,194,304</td>
                <td className="py-2 px-3 text-text-muted">
                  Rollup block — hundreds of transactions, each with its own signature verification and state transitions
                </td>
              </tr>
              <tr className="bg-navy/5 font-semibold">
                <td className="py-2 px-3 font-mono">25</td>
                <td className="py-2 px-3 font-mono">33,554,432</td>
                <td className="py-2 px-3">
                  leanMultisig — ~2,500 post-quantum signatures, each requiring thousands of hash evaluations
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <p>
        The protocol works in <InlineMath tex="m" /> rounds, collapsing one variable
        at a time. Using the same referee example from Section 3 — Alice, Bob,
        and Charlie with 3 ADD operations starting from 0. This requires 2 sumcheck rounds:
      </p>

      {/* Collapse visualization */}
      <div className="bg-bg-card border border-border rounded-lg p-5 my-6 space-y-4">
        {/* Start: trace table */}
        <div>
          <div className="text-xs font-semibold text-text-muted mb-2">
            Start: sum over all <InlineMath tex="2^2 = 4" /> points
          </div>

          <div className="overflow-x-auto mb-3">
            <table className="text-[10px] border-collapse font-mono mx-auto">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-1 px-2 text-left text-text-muted font-semibold">Row</th>
                  <th className="py-1 px-2 text-left text-text-muted font-semibold">Op</th>
                  <th className="py-1 px-2 text-left text-text-muted font-semibold">Input 1</th>
                  <th className="py-1 px-2 text-left text-text-muted font-semibold">Input 2</th>
                  <th className="py-1 px-2 text-left text-text-muted font-semibold">Output</th>
                  <th className="py-1 px-2 text-left text-text-muted font-semibold">Constraint check</th>
                  <th className="py-1 px-2 text-left text-text-muted font-semibold">Error</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { row: 0, bin: '00', in1: '0', in2: '3 (Alice)', out: 3, check: `3 − 0 − 3`, error: 0, pad: false },
                  { row: 1, bin: '01', in1: '3', in2: '1 (Bob)', out: 4, check: `4 − 3 − 1`, error: 0, pad: false },
                  { row: 2, bin: '10', in1: '4', in2: `${charlieScore} (Charlie)`, out: 8, check: `8 − 4 − ${charlieScore}`, error: row10Error, pad: false },
                  { row: 3, bin: '11', in1: '—', in2: '—', out: 0, check: '—', error: 0, pad: true },
                ].map((r, i) => (
                  <tr key={i} className={`${i < 3 ? 'border-b border-border-light' : ''} ${r.bin === '10' && row10Error !== 0 ? 'bg-red/5' : ''}`}>
                    <td className="py-1 px-2 text-text-muted">{r.row} <span className="text-text-muted/50">({r.bin})</span></td>
                    <td className={`py-1 px-2 text-text-muted ${r.pad ? 'text-text-muted/40' : ''}`}>{r.pad ? 'pad' : 'ADD'}</td>
                    <td className={`py-1 px-2 ${r.pad ? 'text-text-muted/40' : ''}`}>{r.in1}</td>
                    <td className={`py-1 px-2 ${r.pad ? 'text-text-muted/40' : ''} ${r.bin === '10' && row10Error !== 0 ? 'text-red font-bold' : ''}`}>{r.in2}</td>
                    <td className="py-1 px-2 font-bold" style={{ color: r.pad ? '#6b6375' : '#4f46e5' }}>{r.out}</td>
                    <td className="py-1 px-2 text-text-muted">{r.check}</td>
                    <td className={`py-1 px-2 font-bold ${r.error === 0 ? 'text-green' : 'text-red'}`}>{r.error}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex gap-1 justify-center mb-3">
            {[{pt:'00',v:0},{pt:'01',v:0},{pt:'10',v:row10Error},{pt:'11',v:0}].map(({pt,v}) => (
              <div key={pt} className="flex flex-col items-center gap-0.5">
                <div className="w-10 h-7 rounded bg-navy/10 text-navy text-[10px] font-mono flex items-center justify-center">{pt}</div>
                <div className={`text-[9px] font-mono font-bold ${v === 0 ? 'text-green' : 'text-red'}`}>{v}</div>
              </div>
            ))}
          </div>

          <div className="text-xs text-text-muted mb-3">
            Each row is indexed by a 2-bit
            string <InlineMath tex="X_1 X_2" />.
            Since <InlineMath tex="\{0,1\}^2" /> has 4 points but we only have 3
            operations, the last row (11) is unused and filled with zeros — it doesn't
            affect the weighted sum.
            Try changing Charlie's score — the prover already committed to the
            outputs, so tampering creates an error:
          </div>

          <div className="max-w-[300px] mx-auto mb-3">
            <Slider
              label={`Charlie's score (honest = 4)`}
              value={charlieOverride !== null ? charlieOverride : 4}
              min={0}
              max={5}
              onChange={setCharlieOverride}
            />
          </div>

        </div>

        {/* Round 1 */}
        <div className="border-t border-border-light pt-4">
          <div className="text-xs font-semibold text-sienna mb-1">
            Round 1: collapse <InlineMath tex="X_1" />
          </div>
          <div className="text-xs text-text-muted mb-2">
            Group by the first bit (<InlineMath tex="X_1" />): sum the 2
            points starting
            with <span className="font-mono font-bold">0</span> and the 2
            starting with <span className="font-mono font-bold">1</span>.
            This produces a univariate
            polynomial <InlineMath tex="p_1(X_1)" />.
          </div>
          <div className="flex items-center justify-center gap-3">
            <div className="flex gap-1">
              {[{pt:'00',v:0},{pt:'01',v:0}].map(({pt,v}) => (
                <div key={pt} className="flex flex-col items-center gap-0.5">
                  <div className="w-10 h-7 rounded bg-navy/10 text-navy text-[10px] font-mono flex items-center justify-center">{pt}</div>
                  <div className={`text-[9px] font-mono font-bold ${v === 0 ? 'text-green' : 'text-red'}`}>{v}</div>
                </div>
              ))}
            </div>
            <div className="text-xs text-text-muted">
              → 0+0 = <strong className="text-green">0</strong> = <InlineMath tex="p_1(0)" />
            </div>
          </div>
          <div className="flex items-center justify-center gap-3 mt-2">
            <div className="flex gap-1">
              {[{pt:'10',v:row10Error},{pt:'11',v:0}].map(({pt,v}) => (
                <div key={pt} className="flex flex-col items-center gap-0.5">
                  <div className="w-10 h-7 rounded bg-sienna/10 text-sienna text-[10px] font-mono flex items-center justify-center">{pt}</div>
                  <div className={`text-[9px] font-mono font-bold ${v === 0 ? 'text-green' : 'text-red'}`}>{v}</div>
                </div>
              ))}
            </div>
            <div className="text-xs text-text-muted">
              → {row10Error}+0 = <strong className={row10Error === 0 ? 'text-green' : 'text-red'}>{row10Error}</strong> = <InlineMath tex="p_1(1)" />
            </div>
          </div>

          <div className="text-xs text-text-muted mt-3">
            <strong>What's checked:</strong> <InlineMath tex={`p_1(0) + p_1(1) = 0 + ${row10Error} = ${row10Error}`} /> — this
            must match the claimed weighted sum.
          </div>
          <div className="text-xs text-text-muted mt-1">
            <strong>What's NOT checked:</strong> The individual values within each group
            (e.g. whether row 00 = 0 and row 01 = 0 separately).
          </div>
          {/* Fiat-Shamir: compute α₁, evaluate, continue */}
          <div className="flex items-center justify-center gap-2 mt-3 text-[10px] font-mono flex-wrap">
            <span className="text-text-muted">Hash</span>
            <span className="text-text-muted">→</span>
            <span className="rounded px-2 py-1 font-bold" style={{ background: 'rgba(99,102,241,0.1)', color: '#4f46e5' }}>
              <InlineMath tex="\alpha_1" />
            </span>
            <span className="text-text-muted">→ evaluate</span>
            <span className="rounded px-2 py-1 font-bold" style={{ background: 'rgba(99,102,241,0.1)', color: '#4f46e5' }}>
              <InlineMath tex={`p_1(\\alpha_1) = ${row10Error}`} />
            </span>
            <span className="text-text-muted">→ new claimed sum for round 2</span>
          </div>
          <div className="text-[9px] text-text-muted/50 text-center mt-1">
            Fiat-Shamir: <InlineMath tex="\alpha_1" /> is derived by hashing the transcript — no interaction needed.
            {row10Error !== 0
              ? <span className="italic"> The error is hiding in the <InlineMath tex="X_1 = 1" /> group.</span>
              : <span className="italic"> All errors are 0 — trace is honest.</span>}
          </div>
        </div>

        {/* Round 2 */}
        <div className="border-t border-border-light pt-4">
          <div className="text-xs font-semibold text-sienna mb-1">
            Round 2: collapse <InlineMath tex="X_2" />
          </div>
          <div className="text-xs text-text-muted mb-2">
            2 points remain. Each is now a single value:
          </div>
          <div className="flex items-center justify-center gap-6">
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-center gap-0.5">
                <div className="w-10 h-7 rounded bg-navy/10 text-navy text-[10px] font-mono flex items-center justify-center">α0</div>
                <div className={`text-[9px] font-mono font-bold ${row10Error === 0 ? 'text-green' : 'text-red'}`}>{row10Error}</div>
              </div>
              <div className="text-xs text-text-muted">= <InlineMath tex="p_2(0)" /></div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-center gap-0.5">
                <div className="w-10 h-7 rounded bg-sienna/10 text-sienna text-[10px] font-mono flex items-center justify-center">α1</div>
                <div className="text-[9px] font-mono font-bold text-green">0</div>
              </div>
              <div className="text-xs text-text-muted">= <InlineMath tex="p_2(1)" /></div>
            </div>
          </div>
          <div className="text-xs text-text-muted mt-2">
            Consistency check: <InlineMath tex={`p_2(0) + p_2(1) = ${row10Error} + 0 = ${row10Error}`} /> must match.
            Fiat-Shamir determines <InlineMath tex="\alpha_2" /> to
            lock in <InlineMath tex="X_2" />.
            {row10Error !== 0
              ? <span className="italic"> The error at row <span className="font-mono">10</span> (Charlie's tampered score) is caught!</span>
              : <span className="italic"> All values are 0 — the trace is valid.</span>}
          </div>
        </div>

        {/* Final */}
        <div className="border-t border-border-light pt-4 text-center">
          <div className="inline-flex items-center gap-3 bg-green/5 border border-green/20 rounded-lg px-4 py-2">
            <div className="w-10 h-8 rounded bg-green/15 text-green text-[10px] font-mono font-bold flex items-center justify-center">
              αα
            </div>
            <div className="text-sm text-text">
              <strong>Done!</strong> Only 1 point: <InlineMath tex="f(\alpha_1, \alpha_2)" />
            </div>
          </div>
          <p className="text-xs text-text-muted mt-2">
            4 points → 2 → 1. Each round halved the problem.
          </p>
        </div>

        <div className="border-t border-border-light pt-4 mt-4">
          <p className="text-xs text-text-muted">
            <strong className="text-text">Sumcheck ≠ folding.</strong> This
            variable-collapsing reduces the <em>constraint check</em> (the weighted sum)
            to a single-point claim. WHIR also uses <strong>folding</strong> (covered in
            the next section) to reduce the <em>polynomial itself</em> to a smaller one
            on a smaller domain. In each WHIR iteration, sumcheck happens first to shrink
            the claim, then folding shrinks the data. They're complementary.
          </p>
        </div>
      </div>

      <h3 id="sumcheck-step-by-step" className="font-heading text-xl font-semibold text-text mt-10 mb-4">
        Step-by-Step Example
      </h3>
      <p className="mb-4">
        Below we walk through sumcheck on a tiny 2-variable polynomial in{' '}
        <InlineMath tex="\mathbb{F}_{17}" />. In practice, WHIR runs this same protocol on
        polynomials with 25+ variables, reducing <InlineMath tex="2^{25}" /> constraint
        checks to a single evaluation. Use the arrows to step through.
      </p>

      <div className="bg-bg-card border border-border rounded-lg p-5 space-y-5">
        <StepNavigator
          step={step}
          totalSteps={4}
          onPrev={() => setStep((s) => Math.max(0, s - 1))}
          onNext={() => setStep((s) => Math.min(3, s + 1))}
          labels={stepLabels}
        />

        {/* Hypercube visualization */}
        <div className="flex justify-center">
          <svg viewBox="0 0 240 150" className="w-full max-w-[280px]">
            {/* Edges */}
            {[
              [0, 1], [2, 3], [0, 2], [1, 3],
            ].map(([a, b], i) => {
              const va = gridVertices[a];
              const vb = gridVertices[b];
              // Highlight the dimension being collapsed
              const isCollapsing =
                collapsingDim === 0
                  ? va.xi[1] === vb.xi[1] && va.xi[0] !== vb.xi[0]
                  : collapsingDim === 1
                  ? va.xi[0] === vb.xi[0] && va.xi[1] !== vb.xi[1]
                  : false;

              return (
                <motion.line
                  key={i}
                  x1={va.x}
                  y1={va.y}
                  x2={vb.x}
                  y2={vb.y}
                  stroke={isCollapsing ? '#8b4513' : '#e0dcd4'}
                  strokeWidth={isCollapsing ? 2.5 : 1.5}
                  animate={{
                    strokeOpacity: step >= 3 ? 0.2 : isCollapsing ? 1 : 0.5,
                  }}
                  transition={{ duration: 0.4 }}
                />
              );
            })}

            {/* Vertices */}
            {gridVertices.map((v, i) => (
              <motion.g
                key={i}
                animate={{
                  opacity: getVertexOpacity(v),
                }}
                transition={{ duration: 0.4 }}
              >
                <circle
                  cx={v.x}
                  cy={v.y}
                  r={20}
                  fill="#fefdfb"
                  stroke="#8b4513"
                  strokeWidth={1.5}
                />
                <text
                  x={v.x}
                  y={v.y - 2}
                  textAnchor="middle"
                  className="text-[13px] font-mono font-bold"
                  fill="#8b4513"
                >
                  {v.val}
                </text>
                <text
                  x={v.x}
                  y={v.y + 12}
                  textAnchor="middle"
                  className="text-[8px]"
                  fill="#6b6375"
                >
                  {v.label}
                </text>
              </motion.g>
            ))}

            {/* Collapsing arrow */}
            {collapsingDim >= 0 && (
              <motion.text
                x={120}
                y={145}
                textAnchor="middle"
                className="text-[10px] font-semibold"
                fill="#8b4513"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                Collapsing X{collapsingDim + 1}
              </motion.text>
            )}
          </svg>
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="bg-bg border border-border-light rounded-md p-4"
          >
            {step === 0 && (
              <div className="space-y-3">
                <h4 className="font-heading font-semibold text-base text-text">
                  The Claim
                </h4>
                <p className="text-sm text-text-muted">
                  The prover claims:
                </p>
                <MathBlock tex={`\\sum_{b \\in \\{0,1\\}^2} f(b) = ${POLY_VALUES[0]} + ${POLY_VALUES[1]} + ${POLY_VALUES[2]} + ${POLY_VALUES[3]} = ${result.targetSum} \\pmod{17}`} />
                <p className="text-sm text-text-muted">
                  The verifier wants to check this without looking at all 4 values. In 2
                  rounds, the verifier will reduce this to checking a single evaluation.
                </p>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-3">
                <h4 className="font-heading font-semibold text-base text-text">
                  Round 1: Collapse <InlineMath tex="X_1" />
                </h4>
                <p className="text-sm text-text-muted">
                  The prover computes <InlineMath tex="p_1(X_1)" /> by summing over{' '}
                  <InlineMath tex="X_2 \in \{0,1\}" />:
                </p>
                {(() => {
                  const rd = result.rounds[0];
                  const [c0, c1] = rd.univariate;
                  const g0 = evaluate(rd.univariate, 0);
                  const g1 = evaluate(rd.univariate, 1);
                  return (
                    <>
                      <MathBlock tex={`p_1(X_1) = ${c0} + ${c1 >= 0 ? c1 : `(${c1})`}\\cdot X_1 \\pmod{17}`} />
                      <div className="bg-bg-card rounded p-3 space-y-1 text-sm font-mono text-text-muted">
                        <p>p{'\u2081'}(0) = {g0}</p>
                        <p>p{'\u2081'}(1) = {g1}</p>
                        <p>
                          p{'\u2081'}(0) + p{'\u2081'}(1) = {mod(g0 + g1)}{' '}
                          {rd.check ? (
                            <span className="text-green">{'\u2713'} = {rd.claimedSum}</span>
                          ) : (
                            <span className="text-red">{'\u2717'} {'\u2260'} {rd.claimedSum}</span>
                          )}
                        </p>
                      </div>
                      <p className="text-sm text-text-muted">
                        Verifier sends random challenge{' '}
                        <InlineMath tex={`\\alpha_1 = ${rd.challenge}`} />. New claimed sum:{' '}
                        <InlineMath tex={`p_1(${rd.challenge}) = ${evaluate(rd.univariate, rd.challenge)}`} />.
                      </p>
                    </>
                  );
                })()}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-3">
                <h4 className="font-heading font-semibold text-base text-text">
                  Round 2: Collapse <InlineMath tex="X_2" />
                </h4>
                <p className="text-sm text-text-muted">
                  Now with <InlineMath tex={`X_1`} /> fixed to{' '}
                  <InlineMath tex={`\\alpha_1 = ${CHALLENGES[0]}`} />, the prover
                  computes <InlineMath tex="p_2(X_2)" />:
                </p>
                {(() => {
                  const rd = result.rounds[1];
                  const [c0, c1] = rd.univariate;
                  const g0 = evaluate(rd.univariate, 0);
                  const g1 = evaluate(rd.univariate, 1);
                  return (
                    <>
                      <MathBlock tex={`p_2(X_2) = ${c0} + ${c1 >= 0 ? c1 : `(${c1})`}\\cdot X_2 \\pmod{17}`} />
                      <div className="bg-bg-card rounded p-3 space-y-1 text-sm font-mono text-text-muted">
                        <p>p{'\u2082'}(0) = {g0}</p>
                        <p>p{'\u2082'}(1) = {g1}</p>
                        <p>
                          p{'\u2082'}(0) + p{'\u2082'}(1) = {mod(g0 + g1)}{' '}
                          {rd.check ? (
                            <span className="text-green">{'\u2713'} = {rd.claimedSum}</span>
                          ) : (
                            <span className="text-red">{'\u2717'} {'\u2260'} {rd.claimedSum}</span>
                          )}
                        </p>
                      </div>
                      <p className="text-sm text-text-muted">
                        Verifier sends random challenge{' '}
                        <InlineMath tex={`\\alpha_2 = ${rd.challenge}`} />. New claimed value:{' '}
                        <InlineMath tex={`p_2(${rd.challenge}) = ${evaluate(rd.univariate, rd.challenge)}`} />.
                      </p>
                    </>
                  );
                })()}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-3">
                <h4 className="font-heading font-semibold text-base text-text">
                  Final Check
                </h4>
                <p className="text-sm text-text-muted">
                  All variables have been fixed. The verifier now evaluates{' '}
                  <InlineMath tex={`f(${CHALLENGES[0]}, ${CHALLENGES[1]})`} /> directly
                  and checks:
                </p>
                {(() => {
                  const lastRound = result.rounds[result.rounds.length - 1];
                  const lastClaim = evaluate(lastRound.univariate, lastRound.challenge);
                  const pass = mod(result.finalValue) === mod(lastClaim);
                  return (
                    <>
                      <MathBlock tex={`f(${CHALLENGES[0]}, ${CHALLENGES[1]}) = ${result.finalValue}`} />
                      <div
                        className={`p-3 rounded-lg border text-sm font-semibold flex items-center gap-2 ${
                          pass
                            ? 'bg-green/5 border-green/30 text-green'
                            : 'bg-red/5 border-red/30 text-red'
                        }`}
                      >
                        <span className="text-lg">{pass ? '\u2713' : '\u2717'}</span>
                        <span>
                          f({CHALLENGES[0]}, {CHALLENGES[1]}) = {result.finalValue}{' '}
                          {pass ? '=' : '\u2260'} p{'\u2082'}({CHALLENGES[1]}) = {lastClaim}
                        </span>
                      </div>
                      <p className="text-sm text-text-muted mt-2">
                        {pass
                          ? 'The protocol succeeds. The verifier is convinced that the original sum was correct, having only evaluated the polynomial at a single random point.'
                          : 'The protocol detected an inconsistency!'}
                      </p>
                    </>
                  );
                })()}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="bg-bg-card border border-border rounded-lg p-5 my-6">
        <h4 className="font-heading font-semibold text-base text-text mb-2">
          Why is this efficient?
        </h4>
        <p className="text-sm text-text-muted">
          Instead of checking <InlineMath tex="2^m" /> evaluations, the verifier only
          exchanges <InlineMath tex="m" /> messages and evaluates{' '}
          <InlineMath tex="f" /> at <strong>one</strong> point. With{' '}
          <InlineMath tex="m = 25" /> variables, that means 1 evaluation instead of over 33 million.
          Sumcheck is the engine that powers WHIR's constraint reduction — it is what
          makes each WHIR iteration efficient, turning an exponential check into a
          linear-round interactive protocol.
        </p>
      </div>
    </Section>
  );
}
