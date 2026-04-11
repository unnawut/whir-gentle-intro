/**
 * Static performance data from the WHIR paper (Section 8) for comparison charts.
 *
 * All values are approximate, taken from the paper's benchmark tables
 * for degree 2^22 polynomials at rate 1/2.
 */

/** A single benchmark data point for one protocol configuration. */
export type BenchmarkEntry = {
  /** Protocol name (e.g., "WHIR", "FRI", "STIR", "BaseFold"). */
  protocol: string;
  /** Polynomial degree as a string (e.g., "2^22"). */
  degree: string;
  /** Target security level in bits. */
  securityBits: number;
  /** Proof size in kibibytes (KiB). */
  proofSizeKB: number;
  /** Verifier time in microseconds. */
  verifierTimeUs: number;
  /** Prover time in seconds. */
  proverTimeS: number;
};

/** Benchmark data at 100-bit security, rate 1/2, degree 2^22. */
export const benchmarks100bit: BenchmarkEntry[] = [
  {
    protocol: 'WHIR',
    degree: '2^22',
    securityBits: 100,
    proofSizeKB: 76,
    verifierTimeUs: 400,
    proverTimeS: 1.2,
  },
  {
    protocol: 'FRI',
    degree: '2^22',
    securityBits: 100,
    proofSizeKB: 149,
    verifierTimeUs: 1520,
    proverTimeS: 1.0,
  },
  {
    protocol: 'STIR',
    degree: '2^22',
    securityBits: 100,
    proofSizeKB: 76,
    verifierTimeUs: 830,
    proverTimeS: 1.1,
  },
  {
    protocol: 'BaseFold',
    degree: '2^22',
    securityBits: 100,
    proofSizeKB: 564,
    verifierTimeUs: 5200,
    proverTimeS: 3.0,
  },
];

/** Benchmark data at 128-bit security, rate 1/2, degree 2^22. */
export const benchmarks128bit: BenchmarkEntry[] = [
  {
    protocol: 'WHIR',
    degree: '2^22',
    securityBits: 128,
    proofSizeKB: 120,
    verifierTimeUs: 900,
    proverTimeS: 1.4,
  },
  {
    protocol: 'FRI',
    degree: '2^22',
    securityBits: 128,
    proofSizeKB: 234,
    verifierTimeUs: 3800,
    proverTimeS: 1.2,
  },
  {
    protocol: 'STIR',
    degree: '2^22',
    securityBits: 128,
    proofSizeKB: 120,
    verifierTimeUs: 1700,
    proverTimeS: 1.3,
  },
  {
    protocol: 'BaseFold',
    degree: '2^22',
    securityBits: 128,
    proofSizeKB: 880,
    verifierTimeUs: 12000,
    proverTimeS: 4.0,
  },
];

/** All benchmark entries combined. */
export const allBenchmarks: BenchmarkEntry[] = [
  ...benchmarks100bit,
  ...benchmarks128bit,
];

/**
 * Total verification hash complexity for each protocol.
 *
 * This is the total verifier work (in hash operations) across all rounds,
 * as a function of security parameter λ, rate ρ, and codeword length n.
 * WHIR's key claim: verification time is independent of n.
 */
export const queryComplexityFormulas: [string, string][] = [
  ['WHIR', 'O(λ / log(1/ρ))'],
  ['STIR', 'O(λ · log(n))'],
  ['FRI', 'O(λ · log²n / log(1/ρ))'],
  ['BaseFold', 'O(λ · n)'],
];

/**
 * Proof size scaling formulas for display.
 */
export const proofSizeFormulas: Record<string, string> = {
  WHIR: 'O(lambda^2 / log(1/rho))',
  FRI: 'O(lambda^2 / log(1/rho))',
  STIR: 'O(lambda^2 / log(n))',
  BaseFold: 'O(d * lambda)',
};

/**
 * Verifier time complexity formulas for display.
 */
export const verifierTimeFormulas: Record<string, string> = {
  WHIR: 'O(lambda^2 / log(1/rho) + n)',
  FRI: 'O(lambda^2 / log(1/rho) + n)',
  STIR: 'O(lambda^2 / log(n) + n)',
  BaseFold: 'O(d * lambda + n)',
};
