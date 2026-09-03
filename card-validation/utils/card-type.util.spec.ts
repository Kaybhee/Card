import { detectCard } from './card-type.utils';
import { expect, beforeAll, it, describe } from '@jest/globals'

describe('detectCardType', () => {
  it('detects Visa numbers', () => {
    expect(detectCard('4111111111111111')).toBe('Visa');
  });

  it('detects Mastercard numbers', () => {
    expect(detectCard('5555555555554444')).toBe('Mastercard');
  });

  it('detects American Express numbers', () => {
    expect(detectCard('378282246310005')).toBe('American Express');
  });

  it('falls back to Unknown for an unrecognised prefix', () => {
    expect(detectCard('9999999999999999')).toBe('Unknown');
  });
});
