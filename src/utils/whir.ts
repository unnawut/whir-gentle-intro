/**
 * Full WHIR iteration simulation tying together sumcheck and folding.
 *
 * This module orchestrates a single WHIR iteration for the interactive demo,
 * combining the sumcheck protocol with Reed-Solomon folding over F_17.
 */

import type { FieldElement } from './field';
import { mod, add, mul } from './field';
import { evaluate, interpolate } from './polynomial';
import type { SumcheckRoundData, MultilinearPoly } from './sumcheck';
import { simulateFullSumcheck } from './sumcheck';
import { fold } from './folding';

/** The state of a WHIR protocol instance between iterations. */
export type WhirState = {
  /** Current function evaluations on the domain. */
  evaluations: FieldElement[];
  /** Current evaluation domain (a multiplicative subgroup). */
  domain: FieldElement[];
  /** log2 of domain size. */
  numVars: number;
  /** The claimed sum (commitment) associated with this function. */
  sigma: FieldElement;
};

/** The result of one WHIR iteration, containing all data for visualization. */
export type WhirIterationResult = {
  /** Data from each sumcheck round. */
  sumcheckRounds: SumcheckRoundData[];
  /** The folded function evaluations after this iteration. */
  foldedFunction: FieldElement[];
  /** The folded domain after this iteration. */
  foldedDomain: FieldElement[];
  /** The out-of-domain evaluation point. */
  outOfDomainPoint: FieldElement;
  /** The prover's answer at the out-of-domain point. */
  outOfDomainAnswer: FieldElement;
  /** Results of shift/consistency queries. */
  shiftQueries: {
    /** The domain point queried. */
    point: FieldElement;
    /** The evaluation from the original (pre-fold) function. */
    queryResult: FieldElement;
    /** The evaluation from the folded function. */
    foldedResult: FieldElement;
    /** Whether the two are consistent. */
    consistent: boolean;
  }[];
  /** The updated state for the next iteration. */
  newState: WhirState;
};

/**
 * Simulate one iteration of the WHIR protocol.
 *
 * Steps:
 * 1. Run the sumcheck protocol to reduce the claimed sum to a single evaluation.
 * 2. Fold the function using the folding challenge alpha.
 * 3. Evaluate the folded function at an out-of-domain point z.
 * 4. Perform shift/consistency queries to check prover honesty.
 *
 * For the interactive demo we use:
 * - Starting domain of size 8 (subgroup of F_17)
 * - A degree-3 polynomial as our initial function
 * - k=2 folding parameter (2 sumcheck rounds per iteration)
 *
 * @param state Current WHIR state.
 * @param sumcheckChallenges Challenges for the sumcheck rounds.
 * @param foldingAlpha The folding challenge.
 * @param outOfDomainZ The out-of-domain query point.
 * @param shiftQueryPoints Domain points to query for consistency checks.
 */
export function whirIteration(
  state: WhirState,
  sumcheckChallenges: FieldElement[],
  foldingAlpha: FieldElement,
  outOfDomainZ: FieldElement,
  shiftQueryPoints: FieldElement[]
): WhirIterationResult {
  const { evaluations, domain, numVars } = state;

  // Step 1: Build a multilinear polynomial from the evaluations for sumcheck.
  // We treat the evaluations as a multilinear polynomial over numSumcheckRounds variables.
  const numSumcheckRounds = sumcheckChallenges.length;
  const polySize = 1 << numSumcheckRounds;
  const mlValues: FieldElement[] = [];
  for (let i = 0; i < polySize; i++) {
    mlValues.push(i < evaluations.length ? mod(evaluations[i]) : 0);
  }

  const mlPoly: MultilinearPoly = {
    values: mlValues,
    numVars: numSumcheckRounds,
  };

  const sumcheckResult = simulateFullSumcheck(mlPoly, sumcheckChallenges);

  // Step 2: Fold the function.
  const { foldedEvals, foldedDomain } = fold(evaluations, domain, foldingAlpha);

  // Step 3: Out-of-domain evaluation.
  // Interpolate the folded function to get a polynomial, then evaluate at z.
  const foldedPoints: [FieldElement, FieldElement][] = foldedDomain.map(
    (x, i) => [x, foldedEvals[i]]
  );
  const foldedPoly = interpolate(foldedPoints);
  const outOfDomainAnswer = evaluate(foldedPoly, outOfDomainZ);

  // Step 4: Shift/consistency queries.
  const evalMap = new Map<FieldElement, FieldElement>();
  for (let i = 0; i < domain.length; i++) {
    evalMap.set(domain[i], mod(evaluations[i]));
  }
  const foldedEvalMap = new Map<FieldElement, FieldElement>();
  for (let i = 0; i < foldedDomain.length; i++) {
    foldedEvalMap.set(foldedDomain[i], mod(foldedEvals[i]));
  }

  const shiftQueries = shiftQueryPoints.map((point) => {
    const queryResult = evalMap.get(point) ?? 0;
    const foldedPoint = mul(point, point);
    const foldedResult = foldedEvalMap.get(foldedPoint) ?? 0;
    const consistent = foldedEvalMap.has(foldedPoint);
    return { point, queryResult, foldedResult, consistent };
  });

  // Compute new sigma: sum of folded evaluations
  let newSigma: FieldElement = 0;
  for (const v of foldedEvals) {
    newSigma = add(newSigma, v);
  }

  const newState: WhirState = {
    evaluations: foldedEvals,
    domain: foldedDomain,
    numVars: numVars - 1,
    sigma: newSigma,
  };

  return {
    sumcheckRounds: sumcheckResult.rounds,
    foldedFunction: foldedEvals,
    foldedDomain,
    outOfDomainPoint: outOfDomainZ,
    outOfDomainAnswer,
    shiftQueries,
    newState,
  };
}
