/**
 * Polynomial operations in coefficient representation over F_17.
 *
 * A polynomial is stored as an array of coefficients where poly[i]
 * is the coefficient of x^i.
 */

import type { FieldElement } from './field';
import { mod, add, sub, mul, neg, div } from './field';

/** Coefficient representation: poly[i] is the coefficient of x^i. */
export type Poly = FieldElement[];

/**
 * Evaluate a polynomial at a single point using Horner's method.
 *
 * For poly = [a0, a1, ..., an], computes a0 + a1*x + ... + an*x^n.
 */
export function evaluate(poly: Poly, x: FieldElement): FieldElement {
  if (poly.length === 0) return 0;
  let result: FieldElement = 0;
  for (let i = poly.length - 1; i >= 0; i--) {
    result = add(mul(result, x), mod(poly[i]));
  }
  return result;
}

/** Evaluate a polynomial at every point in a domain. */
export function evaluateAll(poly: Poly, domain: FieldElement[]): FieldElement[] {
  return domain.map((x) => evaluate(poly, x));
}

/** Add two polynomials. */
export function addPoly(a: Poly, b: Poly): Poly {
  const len = Math.max(a.length, b.length);
  const result: Poly = [];
  for (let i = 0; i < len; i++) {
    const ai = i < a.length ? a[i] : 0;
    const bi = i < b.length ? b[i] : 0;
    result.push(add(ai, bi));
  }
  return trimPoly(result);
}

/** Subtract two polynomials: a - b. */
export function subPoly(a: Poly, b: Poly): Poly {
  const len = Math.max(a.length, b.length);
  const result: Poly = [];
  for (let i = 0; i < len; i++) {
    const ai = i < a.length ? a[i] : 0;
    const bi = i < b.length ? b[i] : 0;
    result.push(sub(ai, bi));
  }
  return trimPoly(result);
}

/** Multiply every coefficient of a polynomial by a scalar. */
export function scalePoly(poly: Poly, c: FieldElement): Poly {
  return trimPoly(poly.map((coeff) => mul(coeff, c)));
}

/** Multiply two polynomials (convolution of coefficient arrays). */
export function mulPoly(a: Poly, b: Poly): Poly {
  if (a.length === 0 || b.length === 0) return [0];
  const result: Poly = new Array(a.length + b.length - 1).fill(0);
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < b.length; j++) {
      result[i + j] = add(result[i + j], mul(a[i], b[j]));
    }
  }
  return trimPoly(result);
}

/**
 * Return the degree of a polynomial.
 * The degree is the index of the highest non-zero coefficient.
 * Returns -Infinity for the zero polynomial.
 */
export function degree(poly: Poly): number {
  for (let i = poly.length - 1; i >= 0; i--) {
    if (mod(poly[i]) !== 0) return i;
  }
  return -Infinity;
}

/**
 * Lagrange interpolation: given a set of (x, y) points, return the unique
 * polynomial of minimal degree passing through all of them.
 */
export function interpolate(points: [FieldElement, FieldElement][]): Poly {
  if (points.length === 0) return [0];

  const n = points.length;
  let result: Poly = [0];

  for (let i = 0; i < n; i++) {
    const [xi, yi] = points[i];

    // Build the Lagrange basis polynomial L_i(x) = prod_{j!=i} (x - xj) / (xi - xj)
    let basis: Poly = [1];
    let denom: FieldElement = 1;

    for (let j = 0; j < n; j++) {
      if (j === i) continue;
      const [xj] = points[j];
      // Multiply basis by (x - xj): multiply by [-xj, 1]
      basis = mulPoly(basis, [neg(xj), 1]);
      denom = mul(denom, sub(xi, xj));
    }

    // Scale basis by yi / denom
    const scale = div(yi, denom);
    basis = scalePoly(basis, scale);
    result = addPoly(result, basis);
  }

  return trimPoly(result);
}

/** Return the zero polynomial. */
export function zeroPoly(): Poly {
  return [0];
}

/** Return a constant polynomial. */
export function constantPoly(c: FieldElement): Poly {
  return [mod(c)];
}

/** Remove trailing zero coefficients, keeping at least one element. */
function trimPoly(poly: Poly): Poly {
  let end = poly.length - 1;
  while (end > 0 && mod(poly[end]) === 0) {
    end--;
  }
  return poly.slice(0, end + 1);
}
