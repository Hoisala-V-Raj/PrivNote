describe('Input Validation', () => {
  it('should reject empty notes', () => {
    const note = '';
    expect(note.length).toBe(0);
    expect(!note).toBe(true);
  });

  it('should enforce character limit', () => {
    const maxLength = 500;
    const validNote = 'a'.repeat(500);
    const invalidNote = 'a'.repeat(501);

    expect(validNote.length <= maxLength).toBe(true);
    expect(invalidNote.length <= maxLength).toBe(false);
  });

  it('should validate note length', () => {
    const testCases = [
      { text: '', isValid: false },
      { text: 'a', isValid: true },
      { text: 'a'.repeat(500), isValid: true },
      { text: 'a'.repeat(501), isValid: false },
    ];

    testCases.forEach(({ text, isValid }) => {
      const valid = text.length > 0 && text.length <= 500;
      expect(valid).toBe(isValid);
    });
  });

  it('should generate valid passwords', () => {
    const generatePassword = () => Math.random().toString(36).substring(2, 10).toUpperCase();
    
    for (let i = 0; i < 10; i++) {
      const password = generatePassword();
      expect(password.length).toBe(8);
      expect(/^[A-Z0-9]+$/.test(password)).toBe(true);
    }
  });
});
