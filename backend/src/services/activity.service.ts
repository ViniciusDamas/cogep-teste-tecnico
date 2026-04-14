import { z } from 'zod';
import { ActivityModel } from '../models/activity.model';
import { PersonModel } from '../models/person.model';
import { ReurbStageModel } from '../models/reurbStage.model';
import * as stageService from './stage.service';
import { record } from './audit.service';
import { BadRequest, NotFound } from '../utils/errors';
import { generateProtocol } from '../utils/protocol';
import { notify, buildStageChangeMessage } from './notification.service';
import { safeText } from '../utils/text';

export const activitySchema = z.object({
  name: safeText(2, 200),
  description: safeText(2, 2000),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  personId: z.string().uuid(),
  stageId: z.string().uuid().optional(),
});

export type ActivityInput = z.infer<typeof activitySchema>;

const INCLUDE = [
  { model: PersonModel, as: 'person' },
  { model: ReurbStageModel, as: 'stage' },
];

export async function list(filter: { stageId?: string; personId?: string } = {}) {
  const where: Record<string, unknown> = {};
  if (filter.stageId) where.stageId = filter.stageId;
  if (filter.personId) where.personId = filter.personId;
  return ActivityModel.findAll({ where, include: INCLUDE, order: [['createdAt', 'DESC']] });
}

export async function findById(id: string) {
  const a = await ActivityModel.findByPk(id, { include: INCLUDE });
  if (!a) throw NotFound('Activity not found');
  return a;
}

export async function findByProtocol(protocol: string) {
  return ActivityModel.findOne({ where: { protocol }, include: INCLUDE });
}

export async function create(input: ActivityInput, userId: string) {
  const parsed = activitySchema.safeParse(input);
  if (!parsed.success) throw BadRequest('Invalid payload', parsed.error.flatten());

  if (new Date(parsed.data.endDate) < new Date(parsed.data.startDate)) {
    throw BadRequest('endDate must be after startDate');
  }

  const stage = parsed.data.stageId
    ? await stageService.findById(parsed.data.stageId)
    : await stageService.findFirst();

  const a = await ActivityModel.create({
    protocol: generateProtocol(),
    name: parsed.data.name,
    description: parsed.data.description,
    startDate: new Date(parsed.data.startDate),
    endDate: new Date(parsed.data.endDate),
    personId: parsed.data.personId,
    stageId: stage.id,
    createdBy: userId,
  });

  await record({
    entityType: 'Activity',
    entityId: a.id,
    action: 'create',
    diff: { after: a.toJSON() },
    changedBy: userId,
  });

  return findById(a.id);
}

export async function update(id: string, input: Partial<ActivityInput>, userId: string) {
  const a = await findById(id);
  const before = a.toJSON();
  const patch: Record<string, unknown> = { ...input };
  if (input.startDate) patch.startDate = new Date(input.startDate);
  if (input.endDate) patch.endDate = new Date(input.endDate);
  await a.update(patch);
  await record({
    entityType: 'Activity',
    entityId: a.id,
    action: 'update',
    diff: { before, after: a.toJSON() },
    changedBy: userId,
  });
  return findById(id);
}

export async function moveStage(id: string, newStageId: string, userId: string) {
  const a = await findById(id);
  const stage = await stageService.findById(newStageId);
  if (a.stageId === stage.id) return a;
  const previousStageId = a.stageId;
  const previousStage = await stageService.findById(previousStageId);
  await a.update({ stageId: stage.id });
  await record({
    entityType: 'Activity',
    entityId: a.id,
    action: 'update',
    diff: { field: 'stageId', before: previousStageId, after: stage.id },
    changedBy: userId,
  });

  const fresh = await findById(id);
  const personRaw = fresh.get('person', { plain: true }) as
    | { name: string; phone: string }
    | undefined;
  if (personRaw?.phone) {
    // Fire-and-forget, mas com logging de resultado para observabilidade
    // (em produção real, trocar por job queue com retry exponencial).
    notify(
      personRaw.phone,
      buildStageChangeMessage({
        personName: personRaw.name,
        protocol: fresh.protocol,
        fromStage: previousStage.name,
        toStage: stage.name,
      }),
      { activityId: id, userId },
    )
      .then((result) => {
        if (!result.ok) {
          console.warn(
            `[activity.moveStage] notification failed activityId=${id} ` +
              `phone=${personRaw.phone} error=${result.error ?? 'unknown'}`,
          );
        }
      })
      .catch((err) =>
        console.error(`[activity.moveStage] notify threw activityId=${id}`, err),
      );
  }
  return fresh;
}

export async function remove(id: string, userId: string) {
  const a = await findById(id);
  const before = a.toJSON();
  await a.destroy();
  await record({
    entityType: 'Activity',
    entityId: id,
    action: 'delete',
    diff: { before },
    changedBy: userId,
  });
}
