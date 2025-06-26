import { CountryCode } from 'libphonenumber-js/max';
import { describe, it, expect } from 'vitest';

import {
  normalizeAndValidatePhone,
  generateTravelerHash,
} from '../phone';

describe('normalizeAndValidatePhone', () => {
  it('should return a valid result for a valid US phone number', () => {
    const result = normalizeAndValidatePhone('(212) 555-0123', 'US');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.e164).toBe('+12125550123');
      expect(result.phoneObject).not.toBeNull();
    }
  });

  it('should return an invalid result for a short phone number', () => {
    const result = normalizeAndValidatePhone('123', 'US' as CountryCode);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('TOO_SHORT');
    }
  });

  it('should return an error for an invalid phone number that is not a number', () => {
    const result = normalizeAndValidatePhone('not a number', 'US');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('NOT_A_NUMBER');
    }
  });

    it('should return an error for an invalid phone number', () => {
    const result = normalizeAndValidatePhone('(123) 456-7890', 'US');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('NOT_VALID');
    }
  });
});

describe('generateTravelerHash', () => {
  it('should generate a consistent hash for the same phone and email', async () => {
    const phone = '+12125550123';
    const email = 'test@example.com';
    const hash1 = await generateTravelerHash(phone, email);
    const hash2 = await generateTravelerHash(phone, email);
    expect(hash1).toBe(hash2);
    expect(hash1).toMatch(/^[0-9a-f]{64}$/);
  });

  it('should generate a different hash for different emails', async () => {
    const phone = '+12125550123';
    const email1 = 'test1@example.com';
    const email2 = 'test2@example.com';
    const hash1 = await generateTravelerHash(phone, email1);
    const hash2 = await generateTravelerHash(phone, email2);
    expect(hash1).not.toBe(hash2);
  });

  it('should generate a different hash for different phone numbers', async () => {
    const phone1 = '+12125550123';
    const phone2 = '+12125550124';
    const email = 'test@example.com';
    const hash1 = await generateTravelerHash(phone1, email);
    const hash2 = await generateTravelerHash(phone2, email);
    expect(hash1).not.toBe(hash2);
  });

  it('should be case-insensitive for email addresses', async () => {
    const phone = '+12125550123';
    const email1 = 'test@example.com';
    const email2 = 'TEST@EXAMPLE.COM';
    const hash1 = await generateTravelerHash(phone, email1);
    const hash2 = await generateTravelerHash(phone, email2);
    expect(hash1).toBe(hash2);
  });
}); 