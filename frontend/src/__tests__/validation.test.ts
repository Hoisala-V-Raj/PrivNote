import { describe, it, expect } from 'vitest';

describe('Input Validation', () => {
  it('should validate note length', () => {
    const maxLength = 500;
    const testCases = [
      { text: '', isValid: false },
      { text: 'a', isValid: true },
      { text: 'a'.repeat(500), isValid: true },
      { text: 'a'.repeat(501), isValid: false },
    ];

    testCases.forEach(({ text, isValid }) => {
      const valid = text.length > 0 && text.length <= maxLength;
      expect(valid).toBe(isValid);
    });
  });

  it('should validate password format', () => {
    const passwordRegex = /^[A-Z0-9]{8}$/;
    
    const validPasswords = ['A1B2C3D4', 'TEST1234', 'ZZZZZZZZ'];
    const invalidPasswords = ['test1234', 'A1B2C3D', 'A1B2C3D45', ''];

    validPasswords.forEach((pwd) => {
      expect(passwordRegex.test(pwd)).toBe(true);
    });

    invalidPasswords.forEach((pwd) => {
      expect(passwordRegex.test(pwd)).toBe(false);
    });
  });

  it('should validate note ID as UUID', () => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    const validUUID = '550e8400-e29b-41d4-a716-446655440000';
    const invalidUUID = 'not-a-uuid';

    expect(uuidRegex.test(validUUID)).toBe(true);
    expect(uuidRegex.test(invalidUUID)).toBe(false);
  });
});
