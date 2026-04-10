/**
 * Sumcheck protocol simulation for multilinear polynomials over F_17.
 *
 * A multilinear polynomial over m variables is represented by its 2^m
 * evaluations on the boolean hypercube {0,1}^m. The flat array is indexed
 * by the binary representation of the point: index bit i corresponds to
 * variable (i+1), i.e., the least significant bit is variable 1.
 */

import type { FieldElement } from './field';
import { mod, add, sub, mul } from './field';
import type { Poly } from './polynomial';
import { evaluate } from './polynomial';

/** A multilinear polynomial stored as its evaluations on {0,1}^m. */
export type MultilinearPoly = {
  /** Evaluations on the boolean hypercube, length 2^numVars. */
  values: FieldElement[];
  /** Number of variables. */
  numVars: number;
};

/**
 * Evaluate a multilinear polynomial at an arbitrary point in F_17^m
 * using the multilinear extension formula.
 *
 * MLE(r1, ..., rm) = sum over w in {0,1}^m of
 *   f(w) * prod_{i=1}^{m} ((1 - ri)(1 - wi) + ri * wi)
 *
 * Equivalently, we use iterative interpolation: for each variable,
 * we reduce the table size by half via linear interpolation.
 */
export function evaluateMultilinear(
  poly: MultilinearPoly,
  point: FieldElement[]
): FieldElement {
  if (point.length !== poly.numVars) {
    throw new Error(`Expected ${poly.numVars} coordinates, got ${point.length}`);
  }

  let table = poly.values.map((v) => mod(v));

  for (let i = 0; i < poly.numVars; i++) {
    const ri = mod(point[i]);
    const half = table.length / 2;
    const newTable: FieldElement[] = [];
    for (let j = 0; j < half; j++) {
      // table[j] is the value at bit i = 0, table[j + half] at bit i = 1
      // interpolation: (1 - ri) * table[j] + ri * table[j + half]
      const v0 = table[j];
      const v1 = table[j + half];
      newTable.push(add(mul(sub(1, ri), v0), mul(ri, v1)));
    }
    table = newTable;
  }

  return table[0];
}

/**
 * Compute the sum of all 2^m evaluations of the polynomial on the
 * boolean hypercube.
 */
export function sumOverHypercube(poly: MultilinearPoly): FieldElement {
  let total: FieldElement = 0;
  for (const v of poly.values) {
    total = add(total, v);
  }
  return total;
}

/**
 * Compute the univariate polynomial for a single sumcheck round.
 *
 * For round `roundIndex` (0-indexed), variables 0..roundIndex-1 have been
 * fixed to `previousChallenges`. We sum over all boolean assignments to
 * variables roundIndex+1..m-1, while leaving variable `roundIndex` free.
 *
 * The result is a degree-1 polynomial (since the original is multilinear).
 * We compute it by evaluating at variable_roundIndex = 0 and = 1, then
 * recovering the linear polynomial.
 */
export function sumcheckRound(
  poly: MultilinearPoly,
  roundIndex: number,
  previousChallenges: FieldElement[]
): Poly {
  if (previousChallenges.length !== roundIndex) {
    throw new Error(
      `Round ${roundIndex} expects ${roundIndex} previous challenges, got ${previousChallenges.length}`
    );
  }

  // First, partially evaluate the table by fixing variables 0..roundIndex-1.
  // LSB convention: variable i corresponds to bit i of the table index, so when
  // we fix variable 0, entries with bit 0 = 0 are at even indices and entries
  // with bit 0 = 1 are at odd indices. After peeling variable 0, the newly
  // exposed variable (variable 1 in the original numbering) is again at bit 0
  // of the reduced table, so the same indexing pattern applies every round.
  let table = poly.values.map((v) => mod(v));
  for (let i = 0; i < roundIndex; i++) {
    const ri = mod(previousChallenges[i]);
    const half = table.length / 2;
    const newTable: FieldElement[] = [];
    for (let j = 0; j < half; j++) {
      const v0 = table[2 * j];       // variable i = 0 (LSB)
      const v1 = table[2 * j + 1];   // variable i = 1
      newTable.push(add(mul(sub(1, ri), v0), mul(ri, v1)));
    }
    table = newTable;
  }

  // Now table has size 2^(m - roundIndex).
  // Variable `roundIndex` is the first remaining variable (bit 0 of current table indices).
  // We need to sum over variables roundIndex+1..m-1 (bits 1..end of current indices)
  // for variable_roundIndex = 0 and variable_roundIndex = 1.

  const tableSize = table.length; // = 2^(m - roundIndex)

  // Indices where bit 0 (variable roundIndex) = 0: even indices
  // Indices where bit 0 (variable roundIndex) = 1: odd indices
  // Wait -- let me reconsider. After partial evaluation, the table has
  // 2^(m - roundIndex) entries. The first variable in this reduced table
  // corresponds to roundIndex. The indexing is: index bit 0 = variable roundIndex.

  let sumAt0: FieldElement = 0;
  let sumAt1: FieldElement = 0;

  for (let idx = 0; idx < tableSize; idx++) {
    const bit0 = idx & 1; // value of variable roundIndex
    if (bit0 === 0) {
      sumAt0 = add(sumAt0, table[idx]);
    } else {
      sumAt1 = add(sumAt1, table[idx]);
    }
  }

  // The univariate polynomial g(t) satisfies g(0) = sumAt0, g(1) = sumAt1.
  // g(t) = sumAt0 + (sumAt1 - sumAt0) * t
  const c0 = sumAt0;
  const c1 = sub(sumAt1, sumAt0);

  return [c0, c1];
}

/** Data for one round of the sumcheck protocol. */
export type SumcheckRoundData = {
  /** The univariate polynomial sent by the prover. */
  univariate: Poly;
  /** The claimed sum that this round's polynomial should satisfy: g(0) + g(1) = claimedSum. */
  claimedSum: FieldElement;
  /** Whether the verifier's check passed for this round. */
  check: boolean;
  /** The random challenge chosen for this round. */
  challenge: FieldElement;
};

/**
 * Simulate the full sumcheck protocol.
 *
 * The prover claims that the sum of `poly` over {0,1}^m equals some target.
 * In each round, the prover sends a univariate polynomial; the verifier checks
 * that g(0) + g(1) equals the running claimed sum, then sends a random challenge.
 *
 * @param poly The multilinear polynomial.
 * @param challenges Pre-determined challenges (one per variable), for deterministic simulation.
 * @returns All round data plus the final evaluation and the true target sum.
 */
export function simulateFullSumcheck(
  poly: MultilinearPoly,
  challenges: FieldElement[]
): {
  rounds: SumcheckRoundData[];
  finalValue: FieldElement;
  targetSum: FieldElement;
} {
  if (challenges.length !== poly.numVars) {
    throw new Error(
      `Need ${poly.numVars} challenges, got ${challenges.length}`
    );
  }

  const targetSum = sumOverHypercube(poly);
  const rounds: SumcheckRoundData[] = [];
  let currentClaimedSum = targetSum;

  for (let round = 0; round < poly.numVars; round++) {
    const previousChallenges = challenges.slice(0, round);
    const univariate = sumcheckRound(poly, round, previousChallenges);

    // Verifier checks: g(0) + g(1) should equal the current claimed sum
    const g0 = evaluate(univariate, 0);
    const g1 = evaluate(univariate, 1);
    const checkSum = add(g0, g1);
    const check = checkSum === currentClaimedSum;

    const challenge = mod(challenges[round]);

    rounds.push({
      univariate,
      claimedSum: currentClaimedSum,
      check,
      challenge,
    });

    // The next round's claimed sum is g(challenge)
    currentClaimedSum = evaluate(univariate, challenge);
  }

  // Final check: the last claimed sum should equal the MLE evaluated at the full challenge point
  const finalValue = evaluateMultilinear(poly, challenges);

  return { rounds, finalValue, targetSum };
}
