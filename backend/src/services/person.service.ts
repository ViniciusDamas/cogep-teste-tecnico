import { z } from 'zod';
import { Op, WhereOptions } from 'sequelize';
import { PersonModel } from '../models/person.model';
import { geocode } from './geocoding.service';
import { record } from './audit.service';
import { BadRequest, NotFound } from '../utils/errors';
import { safeText, optionalSafeText } from '../utils/text';

const PHONE_REGEX = /^\(\d{2}\) 9\d{4}-\d{4}$/;

export const personSchema = z.object({
  name: safeText(2, 160),
  phone: z.string().regex(PHONE_REGEX, 'Formato inválido. Use (DDD) 9XXXX-XXXX'),
  email: z.string().email(),
  street: safeText(2, 200),
  number: safeText(1, 16),
  complement: optionalSafeText(120),
  city: safeText(2, 120),
  state: optionalSafeText(4),
  zipCode: optionalSafeText(12),
});

export type PersonInput = z.infer<typeof personSchema>;

export async function list(query: { q?: string } = {}) {
  const where: WhereOptions = query.q ? { name: { [Op.iLike]: `%${query.q}%` } } : {};
  return PersonModel.findAll({ where, order: [['createdAt', 'DESC']] });
}

export async function findById(id: string) {
  const p = await PersonModel.findByPk(id);
  if (!p) throw NotFound('Person not found');
  return p;
}

export async function create(input: PersonInput, userId: string) {
  const parsed = personSchema.safeParse(input);
  if (!parsed.success) throw BadRequest('Invalid payload', parsed.error.flatten());

  const fullAddress = [
    parsed.data.street,
    parsed.data.number,
    parsed.data.city,
    parsed.data.state,
    'Brasil',
  ]
    .filter(Boolean)
    .join(', ');

  const coords = await geocode(fullAddress);

  const p = await PersonModel.create({
    ...parsed.data,
    complement: parsed.data.complement ?? null,
    state: parsed.data.state ?? null,
    zipCode: parsed.data.zipCode ?? null,
    latitude: coords?.latitude ?? null,
    longitude: coords?.longitude ?? null,
    createdBy: userId,
  });

  await record({
    entityType: 'Person',
    entityId: p.id,
    action: 'create',
    diff: { after: p.toJSON() },
    changedBy: userId,
  });

  return p;
}

export async function update(id: string, input: Partial<PersonInput>, userId: string) {
  const p = await findById(id);
  const before = p.toJSON();
  await p.update(input);
  await record({
    entityType: 'Person',
    entityId: p.id,
    action: 'update',
    diff: { before, after: p.toJSON() },
    changedBy: userId,
  });
  return p;
}

export async function remove(id: string, userId: string) {
  const p = await findById(id);
  const before = p.toJSON();
  await p.destroy();
  await record({
    entityType: 'Person',
    entityId: id,
    action: 'delete',
    diff: { before },
    changedBy: userId,
  });
}
