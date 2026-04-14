import { signToken, verifyToken } from '../src/utils/jwt';

describe('jwt utils', () => {
  it('signs and verifies a token roundtrip', () => {
    const token = signToken({ sub: 'user-123', email: 'x@y.com' });
    expect(typeof token).toBe('string');
    const decoded = verifyToken(token);
    expect(decoded.sub).toBe('user-123');
    expect(decoded.email).toBe('x@y.com');
  });

  it('rejects tampered tokens', () => {
    const token = signToken({ sub: 'u1', email: 'a@b.com' });
    const tampered = token.slice(0, -4) + 'xxxx';
    expect(() => verifyToken(tampered)).toThrow();
  });
});
