import { AuditLogModel } from '../models/auditLog.model';
import { UserModel } from '../models/user.model';

interface RecordInput {
  entityType: string;
  entityId: string;
  action: 'create' | 'update' | 'delete';
  diff: Record<string, unknown>;
  changedBy: string | null;
}

export async function record(input: RecordInput): Promise<void> {
  await AuditLogModel.create({
    entityType: input.entityType,
    entityId: input.entityId,
    action: input.action,
    diff: input.diff,
    changedBy: input.changedBy,
  });
}

export async function history(entityType: string, entityId: string) {
  return AuditLogModel.findAll({
    where: { entityType, entityId },
    include: [
      {
        model: UserModel,
        as: 'changedByUser',
        attributes: ['id', 'name', 'email'],
      },
    ],
    order: [['changedAt', 'DESC']],
  });
}
