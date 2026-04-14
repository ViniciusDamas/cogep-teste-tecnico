import { activitySchema } from '../src/services/activity.service';

describe('activitySchema', () => {
  const valid = {
    name: 'Regularização lote 42',
    description: 'Processo REURB-S no bairro Vila Liberdade',
    startDate: '2026-04-01',
    endDate: '2026-12-31',
    personId: '00000000-0000-0000-0000-000000000001',
  };

  it('accepts a valid payload', () => {
    const r = activitySchema.safeParse(valid);
    expect(r.success).toBe(true);
  });

  it('rejects malformed dates', () => {
    const r = activitySchema.safeParse({ ...valid, startDate: '01/04/2026' });
    expect(r.success).toBe(false);
  });

  it('rejects non-uuid personId', () => {
    const r = activitySchema.safeParse({ ...valid, personId: 'abc' });
    expect(r.success).toBe(false);
  });

  it('accepts optional stageId when valid UUID', () => {
    const r = activitySchema.safeParse({
      ...valid,
      stageId: '00000000-0000-0000-0000-000000000002',
    });
    expect(r.success).toBe(true);
  });
});
