import bcrypt from 'bcryptjs';

describe('Password Hashing', () => {
  it('should hash password correctly', async () => {
    const password = 'TEST1234';
    const hash = await bcrypt.hash(password, 10);
    
    expect(hash).toBeDefined();
    expect(hash).not.toBe(password);
    expect(hash.length).toBeGreaterThan(20);
  });

  it('should validate correct password', async () => {
    const password = 'TEST1234';
    const hash = await bcrypt.hash(password, 10);
    const isValid = await bcrypt.compare(password, hash);
    
    expect(isValid).toBe(true);
  });

  it('should reject incorrect password', async () => {
    const password = 'TEST1234';
    const wrongPassword = 'WRONG5678';
    const hash = await bcrypt.hash(password, 10);
    const isValid = await bcrypt.compare(wrongPassword, hash);
    
    expect(isValid).toBe(false);
  });

  it('should generate different hashes for same password', async () => {
    const password = 'TEST1234';
    const hash1 = await bcrypt.hash(password, 10);
    const hash2 = await bcrypt.hash(password, 10);
    
    expect(hash1).not.toBe(hash2);
    expect(await bcrypt.compare(password, hash1)).toBe(true);
    expect(await bcrypt.compare(password, hash2)).toBe(true);
  });
});
