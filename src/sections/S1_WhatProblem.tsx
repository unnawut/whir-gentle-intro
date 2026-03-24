import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Section } from '../components/Section';
import { Math as InlineMath } from '../components/MathBlock';

const stages = [
  {
    id: 'computation',
    label: 'Computation',
    color: '#1a365d',
    description:
      'The starting point: a computation someone performed. For example, "I correctly executed this smart contract" or "I know a solution to this puzzle." The computation could be enormous -- millions of steps -- but the prover wants to convince someone it was done correctly without making them redo the entire thing.',
  },
  {
    id: 'piop',
    label: 'Polynomial IOP',
    color: '#1a365d',
    description:
      'The computation is encoded as a set of polynomial equations. Instead of checking "did you run this program correctly?", we now ask "do these polynomials satisfy certain relationships?" This is a powerful transformation: polynomial math gives us algebraic structure we can exploit for efficiency.',
  },
  {
    id: 'iopp',
    label: 'IOP of Proximity',
    highlight: true,
    color: '#8b4513',
    description:
      'This is where WHIR fits in. We need to verify that a function the prover sends is "close" to a valid polynomial of low degree. This is called proximity testing. Rather than reading the entire function (which could be huge), WHIR uses a clever combination of sumcheck and folding to test proximity by reading only a tiny fraction of the data.',
  },
  {
    id: 'snarg',
    label: 'SNARG',
    color: '#1a365d',
    description:
      'The final product: a Succinct Non-interactive ARGument. This is a short proof (a few hundred kilobytes) that anyone can verify quickly (under a millisecond) without any interaction with the prover. The "succinct" part is key -- the proof is exponentially shorter than the original computation.',
  },
];

export function S1_WhatProblem() {
  const [activeStage, setActiveStage] = useState<string | null>(null);

  const boxWidth = 140;
  const boxHeight = 52;
  const gap = 36;
  const arrowLen = gap;
  const totalWidth = stages.length * boxWidth + (stages.length - 1) * gap;
  const svgWidth = totalWidth + 40;
  const svgHeight = 110;

  return (
    <Section
      id="problem"
      number={1}
      title="What Problem Does WHIR Solve?"
      subtitle="From computations to succinct proofs: where WHIR fits in the pipeline."
    >
      {/* Intro */}
      <p>
        Imagine you performed a long, expensive computation -- maybe executing a smart contract
        or verifying a complex transaction. You want to convince someone else that the result is correct,
        but you <em>don't</em> want them to redo the whole computation. This is the fundamental problem
        that <strong>SNARGs</strong> solve.
      </p>

      <div className="bg-bg-card border border-border rounded-lg p-5 my-6">
        <h3 className="font-heading text-lg font-semibold text-navy mb-2">
          What is a SNARG?
        </h3>
        <p className="text-sm text-text-muted mb-3">
          A <strong>Succinct Non-interactive ARGument</strong> is a proof system where:
        </p>
        <ul className="list-disc list-inside text-sm text-text-muted space-y-1">
          <li>
            <strong>Succinct</strong> -- the proof is tiny compared to the computation
          </li>
          <li>
            <strong>Non-interactive</strong> -- the prover sends one message; no back-and-forth needed
          </li>
          <li>
            <strong>Argument</strong> -- security holds against computationally bounded provers
          </li>
        </ul>
      </div>

      <p>
        Building a SNARG involves a pipeline of transformations. Each stage converts one kind of
        problem into another, until we arrive at a short, easily-checked proof. Click each stage
        below to learn more:
      </p>

      {/* Pipeline SVG */}
      <div className="my-8 overflow-x-auto">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full max-w-[700px] mx-auto"
          style={{ minWidth: 500 }}
        >
          {stages.map((stage, i) => {
            const x = 20 + i * (boxWidth + gap);
            const y = 20;
            const isHighlighted = stage.highlight;
            const isActive = activeStage === stage.id;

            return (
              <g key={stage.id}>
                {/* Glow filter for IOPP */}
                {isHighlighted && (
                  <defs>
                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="4" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                )}

                {/* Box */}
                <rect
                  x={x}
                  y={y}
                  width={boxWidth}
                  height={boxHeight}
                  rx={10}
                  fill={isActive ? (isHighlighted ? '#8b4513' : '#1a365d') : '#fefdfb'}
                  stroke={stage.color}
                  strokeWidth={isHighlighted ? 2.5 : 1.5}
                  filter={isHighlighted ? 'url(#glow)' : undefined}
                  className="cursor-pointer transition-all duration-200"
                  onClick={() =>
                    setActiveStage(activeStage === stage.id ? null : stage.id)
                  }
                />

                {/* Label */}
                <text
                  x={x + boxWidth / 2}
                  y={y + boxHeight / 2}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="text-[11px] font-medium pointer-events-none select-none"
                  fill={isActive ? '#fefdfb' : stage.color}
                >
                  {stage.label}
                </text>

                {/* "WHIR" badge */}
                {isHighlighted && (
                  <text
                    x={x + boxWidth / 2}
                    y={y + boxHeight + 16}
                    textAnchor="middle"
                    className="text-[10px] font-bold"
                    fill="#8b4513"
                  >
                    WHIR fits here
                  </text>
                )}

                {/* Arrow to next stage */}
                {i < stages.length - 1 && (
                  <g>
                    <line
                      x1={x + boxWidth + 4}
                      y1={y + boxHeight / 2}
                      x2={x + boxWidth + arrowLen - 8}
                      y2={y + boxHeight / 2}
                      stroke="#6b6375"
                      strokeWidth={1.5}
                    />
                    <polygon
                      points={`${x + boxWidth + arrowLen - 8},${y + boxHeight / 2 - 4} ${x + boxWidth + arrowLen - 8},${y + boxHeight / 2 + 4} ${x + boxWidth + arrowLen},${y + boxHeight / 2}`}
                      fill="#6b6375"
                    />
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Description panel */}
      <AnimatePresence mode="wait">
        {activeStage && (
          <motion.div
            key={activeStage}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="bg-bg-card border border-border rounded-lg p-5 mb-6"
          >
            <h4 className="font-heading text-base font-semibold text-text mb-2">
              {stages.find((s) => s.id === activeStage)?.label}
            </h4>
            <p className="text-sm text-text-muted leading-relaxed">
              {stages.find((s) => s.id === activeStage)?.description}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Prover-Verifier model */}
      <h3 className="font-heading text-xl font-semibold text-text mt-10 mb-3">
        The Prover-Verifier Model
      </h3>
      <p>
        At the heart of every proof system are two parties: the <strong>Prover</strong> and
        the <strong>Verifier</strong>. The prover has done some computation and wants to convince
        the verifier that the result is correct. The prover is powerful (can spend time and memory)
        but the verifier should be <em>fast</em> -- ideally doing far less work than the
        original computation.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 my-6">
        <div className="flex-1 bg-bg-card border border-border rounded-lg p-4">
          <div className="text-sienna font-heading font-semibold text-base mb-1">
            Prover
          </div>
          <p className="text-sm text-text-muted">
            Has the data and the computation. Willing to do heavy work to generate a proof.
            Might be dishonest -- tries to convince the verifier of false claims.
          </p>
        </div>
        <div className="flex-1 bg-bg-card border border-border rounded-lg p-4">
          <div className="text-navy font-heading font-semibold text-base mb-1">
            Verifier
          </div>
          <p className="text-sm text-text-muted">
            Wants to check the proof quickly. Must catch cheating provers with high
            probability while accepting honest provers.
          </p>
        </div>
      </div>

      {/* Why it matters */}
      <h3 className="font-heading text-xl font-semibold text-text mt-10 mb-3">
        Why Does Fast Verification Matter?
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-4">
        <div className="bg-bg-card border border-border rounded-lg p-5">
          <div className="font-heading font-semibold text-base text-text mb-2">
            Blockchain Verification
          </div>
          <p className="text-sm text-text-muted">
            On Ethereum, every node must verify proofs. Each operation costs gas -- real money.
            A verifier that reads less data and computes fewer operations translates directly
            into lower gas costs. WHIR's verification uses only{' '}
            <InlineMath tex="O(\lambda + \log n)" /> queries, which can save hundreds of
            thousands of gas per proof.
          </p>
        </div>
        <div className="bg-bg-card border border-border rounded-lg p-5">
          <div className="font-heading font-semibold text-base text-text mb-2">
            Recursive Proofs
          </div>
          <p className="text-sm text-text-muted">
            In recursive proof composition, a verifier runs <em>inside</em> another proof.
            The cost of verification directly multiplies the cost of the outer proof.
            Faster verification means smaller recursive circuits, enabling practical
            proof aggregation and incrementally verifiable computation.
          </p>
        </div>
      </div>

      <p className="text-sm text-text-muted mt-6 italic">
        In the sections that follow, we will build up the ideas behind WHIR step by step:
        Reed-Solomon codes, constrained codes, the sumcheck protocol, and folding -- all
        combining into a protocol with the fastest known verification time for proximity testing.
      </p>
    </Section>
  );
}
