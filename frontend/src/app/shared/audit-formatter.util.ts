import { AuditLog, ReurbStage, Person } from '../core/models';

export interface FormattedChange {
  label: string;
  before?: string;
  after?: string;
}

export interface FormattedLog {
  id: string;
  action: 'create' | 'update' | 'delete';
  actionLabel: string;
  color: string;
  changedAt: string;
  changes: FormattedChange[];
  summary?: string;
  actor?: { name: string; email: string } | null;
}

const FIELD_LABELS: Record<string, string> = {
  name: 'Nome',
  description: 'Descrição',
  phone: 'Telefone',
  email: 'Email',
  street: 'Rua',
  number: 'Número',
  complement: 'Complemento',
  city: 'Cidade',
  state: 'UF',
  zipCode: 'CEP',
  startDate: 'Data de início',
  endDate: 'Data de término',
  stageId: 'Etapa',
  personId: 'Pessoa',
  protocol: 'Protocolo',
  latitude: 'Latitude',
  longitude: 'Longitude',
};

const IGNORED_FIELDS = new Set(['id', 'createdAt', 'updatedAt', 'createdBy']);

const ACTION_META: Record<string, { label: string; color: string }> = {
  create: { label: 'Criado', color: 'green' },
  update: { label: 'Alterado', color: 'blue' },
  delete: { label: 'Excluído', color: 'red' },
};

export interface FormatterContext {
  stages?: ReurbStage[];
  persons?: Person[];
}

function resolveValue(field: string, value: unknown, ctx: FormatterContext): string {
  if (value == null) return '—';
  if (field === 'stageId' && ctx.stages) {
    const s = ctx.stages.find((x) => x.id === value);
    return s ? `${s.order}. ${s.name}` : String(value);
  }
  if (field === 'personId' && ctx.persons) {
    const p = ctx.persons.find((x) => x.id === value);
    return p ? p.name : String(value);
  }
  if (field === 'startDate' || field === 'endDate') {
    const d = new Date(value as string);
    if (!isNaN(d.getTime())) return d.toLocaleDateString('pt-BR');
  }
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function labelFor(field: string): string {
  return FIELD_LABELS[field] ?? field;
}

function diffObjects(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  ctx: FormatterContext,
): FormattedChange[] {
  const keys = new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})]);
  const changes: FormattedChange[] = [];
  for (const k of keys) {
    if (IGNORED_FIELDS.has(k)) continue;
    const b = before?.[k];
    const a = after?.[k];
    if (JSON.stringify(b) === JSON.stringify(a)) continue;
    changes.push({
      label: labelFor(k),
      before: resolveValue(k, b, ctx),
      after: resolveValue(k, a, ctx),
    });
  }
  return changes;
}

export function formatAuditLog(log: AuditLog, ctx: FormatterContext = {}): FormattedLog {
  const meta = ACTION_META[log.action] ?? { label: log.action, color: 'default' };
  const base: FormattedLog = {
    id: log.id,
    action: log.action,
    actionLabel: meta.label,
    color: meta.color,
    changedAt: log.changedAt,
    changes: [],
    actor: log.changedByUser
      ? { name: log.changedByUser.name, email: log.changedByUser.email }
      : null,
  };

  const diff = log.diff ?? {};

  // Kanban-style: { field, before, after }
  if (typeof diff['field'] === 'string') {
    const f = diff['field'] as string;
    base.changes = [
      {
        label: labelFor(f),
        before: resolveValue(f, diff['before'], ctx),
        after: resolveValue(f, diff['after'], ctx),
      },
    ];
    return base;
  }

  // Form update: { before: {...}, after: {...} }
  if (diff['before'] && diff['after'] && typeof diff['before'] === 'object') {
    base.changes = diffObjects(
      diff['before'] as Record<string, unknown>,
      diff['after'] as Record<string, unknown>,
      ctx,
    );
    if (!base.changes.length) base.summary = 'Sem alterações relevantes';
    return base;
  }

  // Create: { after: {...} }
  if (log.action === 'create' && diff['after']) {
    base.summary = 'Registro criado';
    return base;
  }

  // Delete: { before: {...} }
  if (log.action === 'delete' && diff['before']) {
    base.summary = 'Registro excluído';
    return base;
  }

  base.summary = 'Alteração registrada';
  return base;
}
