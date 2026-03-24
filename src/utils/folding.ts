/**
 * Folding operations for Reed-Solomon codes over F_17.
 *
 * The fold operation takes a function f evaluated on a domain D and a
 * challenge alpha, and produces a new function on the "squared" domain
 * D' = {x^2 : x in D} via:
 *
 *   Fold(f, alpha)(y) = (f(x) + f(-x))/2 + alpha * (f(x) - f(-x))/(2x)
 *
 * where y = x^2.
 */

import type { FieldElement } from './field';
import { mod, add, sub, mul, inv, neg } from './field';

/**
 * Compute the squared domain: {x^2 : x in domain}, deduplicated and sorted.
 * For a subgroup of size n, the squared domain has size n/2.
 */
export function squareDomain(domain: FieldElement[]): FieldElement[] {
  const seen = new Set<FieldElement>();
  const result: FieldElement[] = [];
  for (const x of domain) {
    const y = mul(x, x);
    if (!seen.has(y)) {
      seen.add(y);
      result.push(y);
    }
  }
  return result.sort((a, b) => a - b);
}

/**
 * Compute the folded value for a single (x, -x) pair.
 *
 * Fold(f, alpha)(x^2) = (f(x) + f(-x))/2 + alpha * (f(x) - f(-x))/(2x)
 */
export function foldSingle(
  fAtX: FieldElement,
  fAtNegX: FieldElement,
  x: FieldElement,
  alpha: FieldElement
): FieldElement {
  const sum = add(fAtX, fAtNegX);
  const diff = sub(fAtX, fAtNegX);
  const inv2 = inv(2);
  const even = mul(sum, inv2); // (f(x) + f(-x)) / 2
  const odd = mul(mul(diff, inv2), inv(x)); // (f(x) - f(-x)) / (2x)
  return add(even, mul(alpha, odd));
}

/**
 * Fold the entire function over the domain.
 *
 * Groups domain elements into (x, -x) pairs. For each pair, computes
 * the folded value at y = x^2 using the folding formula.
 *
 * @returns The folded evaluations and the squared domain.
 */
export function fold(
  evaluations: FieldElement[],
  domain: FieldElement[],
  alpha: FieldElement
): { foldedEvals: FieldElement[]; foldedDomain: FieldElement[] } {
  if (evaluations.length !== domain.length) {
    throw new Error('Evaluations and domain must have the same length');
  }

  // Build a map from domain element to its evaluation
  const evalMap = new Map<FieldElement, FieldElement>();
  for (let i = 0; i < domain.length; i++) {
    evalMap.set(domain[i], mod(evaluations[i]));
  }

  // Compute the squared domain
  const newDomain = squareDomain(domain);

  // For each y in the new domain, find x such that x^2 = y, then fold
  const processed = new Set<FieldElement>();
  const foldedMap = new Map<FieldElement, FieldElement>();

  for (const x of domain) {
    if (processed.has(x)) continue;
    const negX = neg(x);
    processed.add(x);
    processed.add(negX);

    const fAtX = evalMap.get(x)!;
    const fAtNegX = evalMap.get(negX)!;
    const y = mul(x, x);

    foldedMap.set(y, foldSingle(fAtX, fAtNegX, x, alpha));
  }

  // Produce evaluations in the same order as newDomain
  const foldedEvals = newDomain.map((y) => foldedMap.get(y)!);

  return { foldedEvals, foldedDomain: newDomain };
}

/** Detailed data for animating one fold pair. */
export type FoldStep = {
  /** The positive element of the pair. */
  x: FieldElement;
  /** The negative element: -x mod p. */
  negX: FieldElement;
  /** f(x). */
  fX: FieldElement;
  /** f(-x). */
  fNegX: FieldElement;
  /** The target point in the squared domain: y = x^2. */
  y: FieldElement;
  /** The computed folded value at y. */
  foldedValue: FieldElement;
};

/**
 * Fold the entire function with detailed step-by-step data for visualization.
 *
 * Same computation as `fold`, but additionally returns a `FoldStep` for
 * each (x, -x) pair processed.
 */
export function foldDetailed(
  evaluations: FieldElement[],
  domain: FieldElement[],
  alpha: FieldElement
): {
  steps: FoldStep[];
  foldedEvals: FieldElement[];
  foldedDomain: FieldElement[];
} {
  if (evaluations.length !== domain.length) {
    throw new Error('Evaluations and domain must have the same length');
  }

  const evalMap = new Map<FieldElement, FieldElement>();
  for (let i = 0; i < domain.length; i++) {
    evalMap.set(domain[i], mod(evaluations[i]));
  }

  const newDomain = squareDomain(domain);
  const processed = new Set<FieldElement>();
  const foldedMap = new Map<FieldElement, FieldElement>();
  const steps: FoldStep[] = [];

  for (const x of domain) {
    if (processed.has(x)) continue;
    const negX = neg(x);
    processed.add(x);
    processed.add(negX);

    const fAtX = evalMap.get(x)!;
    const fAtNegX = evalMap.get(negX)!;
    const y = mul(x, x);
    const foldedValue = foldSingle(fAtX, fAtNegX, x, alpha);

    foldedMap.set(y, foldedValue);

    steps.push({
      x,
      negX,
      fX: fAtX,
      fNegX: fAtNegX,
      y,
      foldedValue,
    });
  }

  const foldedEvals = newDomain.map((y) => foldedMap.get(y)!);

  return { steps, foldedEvals, foldedDomain: newDomain };
}
