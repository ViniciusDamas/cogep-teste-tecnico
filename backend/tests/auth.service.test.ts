import { registerSchema, loginSchema } from '../src/services/auth.service';

describe('auth schemas', () => {
  describe('registerSchema', () => {
    it('accepts a valid payload', () => {
      const r = registerSchema.safeParse({ name: 'Ada', email: 'ada@x.com', password: 'secret1' });
      expect(r.success).toBe(true);
    });

    it('rejects short passwords', () => {
      const r = registerSchema.safeParse({ name: 'Ada', email: 'a@b.com', password: '123' });
      expect(r.success).toBe(false);
    });

    it('rejects invalid emails', () => {
      const r = registerSchema.safeParse({ name: 'Ada', email: 'not-email', password: 'secret1' });
      expect(r.success).toBe(false);
    });
  });

  describe('loginSchema', () => {
    it('accepts minimum payload', () => {
      const r = loginSchema.safeParse({ email: 'a@b.com', password: 'x' });
      expect(r.success).toBe(true);
    });

    it('rejects missing email', () => {
      const r = loginSchema.safeParse({ password: 'x' });
      expect(r.success).toBe(false);
    });
  });
});
