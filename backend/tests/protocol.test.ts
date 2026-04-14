import { generateProtocol } from '../src/utils/protocol';

describe('generateProtocol', () => {
  it('generates string in REURB-YYYY-NNNNNN format', () => {
    const p = generateProtocol();
    expect(p).toMatch(/^REURB-\d{4}-\d{6}$/);
  });

  it('includes the current year', () => {
    const p = generateProtocol();
    const year = new Date().getFullYear();
    expect(p).toContain(`REURB-${year}-`);
  });

  it('produces different protocols on consecutive calls (collision resistance)', () => {
    const set = new Set<string>();
    for (let i = 0; i < 50; i++) set.add(generateProtocol());
    expect(set.size).toBeGreaterThan(45);
  });
});
