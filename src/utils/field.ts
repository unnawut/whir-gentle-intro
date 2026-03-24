/**
 * Finite field arithmetic over F_17 (the integers modulo 17).
 *
 * The multiplicative group of F_17 has order 16.
 * Element 3 is a primitive 16th root of unity: 3^16 ≡ 1 (mod 17).
 */

/** The prime modulus defining our field. */
export const P = 17;

/** A field element is an integer in the range [0, 16]. */
export type FieldElement = number;

/** Generator of the full multiplicative group of F_17. */
export const PRIMITIVE_ROOT: FieldElement = 3;

/**
 * Reduce any integer to the canonical representative in [0, P-1].
 * Correctly handles negative inputs.
 */
export function mod(a: number): FieldElement {
  return ((a % P) + P) % P;
}

/** Addition in F_17. */
export function add(a: FieldElement, b: FieldElement): FieldElement {
  return mod(a + b);
}

/** Subtraction in F_17. */
export function sub(a: FieldElement, b: FieldElement): FieldElement {
  return mod(a - b);
}

/** Multiplication in F_17. */
export function mul(a: FieldElement, b: FieldElement): FieldElement {
  return mod(a * b);
}

/** Additive negation in F_17. */
export function neg(a: FieldElement): FieldElement {
  return mod(-a);
}

/**
 * Fast modular exponentiation (binary method).
 * Handles n = 0 (returns 1) and negative exponents are not supported.
 */
export function pow(a: FieldElement, n: number): FieldElement {
  if (n === 0) return 1;
  let result: FieldElement = 1;
  let base = mod(a);
  let exp = n;
  while (exp > 0) {
    if (exp & 1) {
      result = mul(result, base);
    }
    base = mul(base, base);
    exp >>= 1;
  }
  return result;
}

/**
 * Multiplicative inverse using Fermat's little theorem: a^(p-2) ≡ a^(-1) (mod p).
 * @throws if a is 0 (zero has no multiplicative inverse).
 */
export function inv(a: FieldElement): FieldElement {
  if (mod(a) === 0) {
    throw new Error('Cannot invert zero in F_17');
  }
  return pow(a, P - 2);
}

/** Division in F_17: a / b = a * b^(-1). */
export function div(a: FieldElement, b: FieldElement): FieldElement {
  return mul(a, inv(b));
}

/**
 * Generate the unique multiplicative subgroup of F_17 with the given size.
 *
 * The multiplicative group has order 16, so valid subgroup sizes are
 * powers of 2: 1, 2, 4, 8, 16.
 *
 * For size k, the generator is PRIMITIVE_ROOT^(16/k).
 * The returned array is sorted in ascending order.
 */
export function generateSubgroup(size: number): FieldElement[] {
  if (size < 1 || size > 16 || (size & (size - 1)) !== 0) {
    throw new Error(`Subgroup size must be a power of 2 in [1, 16], got ${size}`);
  }
  const generator = pow(PRIMITIVE_ROOT, 16 / size);
  const elements: FieldElement[] = [];
  let current: FieldElement = 1;
  for (let i = 0; i < size; i++) {
    elements.push(current);
    current = mul(current, generator);
  }
  return elements.sort((a, b) => a - b);
}

/**
 * For each element x in the given domain, find its additive inverse -x (mod 17)
 * within the same domain and return the mapping x -> -x.
 */
export function findNegPair(domain: FieldElement[]): Map<FieldElement, FieldElement> {
  const domainSet = new Set(domain);
  const result = new Map<FieldElement, FieldElement>();
  for (const x of domain) {
    const negX = neg(x);
    if (domainSet.has(negX)) {
      result.set(x, negX);
    }
  }
  return result;
}
