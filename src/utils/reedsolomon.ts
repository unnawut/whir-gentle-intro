/**
 * Reed-Solomon code helpers over F_17.
 *
 * Provides encoding, distance metrics, and proximity testing
 * for Reed-Solomon codes defined over multiplicative subgroups of F_17.
 */

import type { FieldElement } from './field';
import { P, mod, generateSubgroup } from './field';
import type { Poly } from './polynomial';
import { evaluateAll } from './polynomial';

/**
 * Encode a polynomial as a Reed-Solomon codeword by evaluating it
 * at every point in the given domain.
 */
export function encode(poly: Poly, domain: FieldElement[]): FieldElement[] {
  return evaluateAll(poly, domain);
}

/**
 * Compute the Hamming distance between two equal-length vectors:
 * the number of positions where the entries differ.
 */
export function hammingDistance(a: FieldElement[], b: FieldElement[]): number {
  if (a.length !== b.length) {
    throw new Error(`Length mismatch: ${a.length} vs ${b.length}`);
  }
  let dist = 0;
  for (let i = 0; i < a.length; i++) {
    if (mod(a[i]) !== mod(b[i])) dist++;
  }
  return dist;
}

/**
 * Fractional (relative) Hamming distance: hammingDistance / length.
 */
export function fractionalDistance(a: FieldElement[], b: FieldElement[]): number {
  if (a.length === 0) return 0;
  return hammingDistance(a, b) / a.length;
}

/**
 * Generate an evaluation domain as a multiplicative subgroup of F_17.
 * Wrapper around field.generateSubgroup.
 */
export function generateDomain(size: number): FieldElement[] {
  return generateSubgroup(size);
}

/**
 * Check whether `evaluations` is close (in Hamming distance) to some
 * Reed-Solomon codeword of degree < maxDegree over the given domain.
 *
 * Returns true if there exists a polynomial of degree < maxDegree whose
 * evaluations on `domain` differ from `evaluations` in at most `maxDist`
 * positions.
 *
 * For our tiny field F_17, we brute-force over all polynomials of the
 * required degree bound (at most P^maxDegree candidates).
 */
export function isCloseTo(
  evaluations: FieldElement[],
  maxDegree: number,
  domain: FieldElement[],
  maxDist: number
): boolean {
  if (evaluations.length !== domain.length) {
    throw new Error('Evaluations and domain must have the same length');
  }

  // Generate all polynomials of degree < maxDegree over F_17.
  // A polynomial of degree < d has d coefficients, each in [0, 16].
  const numCoeffs = maxDegree;
  const totalPolys = Math.pow(P, numCoeffs);

  for (let idx = 0; idx < totalPolys; idx++) {
    // Decode idx into coefficients
    const poly: Poly = [];
    let rem = idx;
    for (let c = 0; c < numCoeffs; c++) {
      poly.push(rem % P);
      rem = Math.floor(rem / P);
    }

    // Evaluate and check Hamming distance
    const codeword = evaluateAll(poly, domain);
    const dist = hammingDistance(codeword, evaluations);
    if (dist <= maxDist) {
      return true;
    }
  }

  return false;
}
