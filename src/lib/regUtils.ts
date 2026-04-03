// UK vehicle registration normalisation and validation.

// Standard UK registration formats (simplified patterns):
// New-style (2001+): AB12 CDE  → 7 chars after strip
// Old-style (prefix): A123 BCD → 7 chars after strip
// Old-style (suffix): ABC 123D → 7 chars after strip
// Cherished / dateless: various shorter patterns
// Northern Ireland: ABC 1234 or ABC 1234D

const UK_REG_PATTERNS = [
  /^[A-Z]{2}\d{2}[A-Z]{3}$/,           // New-style: AB12CDE
  /^[A-Z]\d{1,3}[A-Z]{3}$/,            // Prefix: A123BCD
  /^[A-Z]{3}\d{1,3}[A-Z]$/,            // Suffix: ABC123D
  /^[A-Z]{1,3}\d{1,4}$/,               // Dateless: A1234
  /^[A-Z]{2}\d{1,4}[A-Z]?$/,           // Older dateless
  /^[A-Z]{3}\d{4}[A-Z]?$/,             // Northern Ireland: ABC1234
];

/** Strips spaces, uppercases, and returns the normalised registration. */
export function normaliseReg(input: string): string {
  return input.replace(/\s+/g, "").toUpperCase();
}

/** Returns true if the normalised registration matches a known UK format. */
export function isValidReg(normalised: string): boolean {
  return UK_REG_PATTERNS.some((pattern) => pattern.test(normalised));
}

/** Normalise and validate in one step. Returns null if invalid. */
export function parseReg(input: string): string | null {
  const normalised = normaliseReg(input);
  if (normalised.length < 2 || normalised.length > 8) return null;
  if (!/^[A-Z0-9]+$/.test(normalised)) return null;
  // We do a loose check — reject obviously wrong but don't over-restrict
  // since the DVSA API is the authoritative validator
  return normalised;
}

/** Normalise, deduplicate, and validate a list of raw registrations.
 *  Returns { valid, invalid } arrays. */
export function processRegistrations(inputs: string[]): {
  valid: string[];
  invalid: string[];
} {
  const seen = new Set<string>();
  const valid: string[] = [];
  const invalid: string[] = [];

  for (const input of inputs) {
    const trimmed = input.trim();
    if (!trimmed) continue;

    const parsed = parseReg(trimmed);
    if (!parsed) {
      invalid.push(trimmed);
      continue;
    }

    if (seen.has(parsed)) continue; // deduplicate
    seen.add(parsed);
    valid.push(parsed);
  }

  return { valid, invalid };
}
