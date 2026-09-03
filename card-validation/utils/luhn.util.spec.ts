import { isValidLuhn } from "./luhn.utils";
import { describe, expect, it } from '@jest/globals'

describe('isValidLuhn', () => {
  it('returns true for a number that satisfies the Luhn checksum', () => {
    expect(isValidLuhn('4111111111111111')).toBe(true);
  });

  it('returns false for a number that fails the Luhn checksum', () => {
    expect(isValidLuhn('4111111111111112')).toBe(false);
  });

  it('returns true for a single valid check digit', () => {
    expect(isValidLuhn('0')).toBe(true);
  });
});
