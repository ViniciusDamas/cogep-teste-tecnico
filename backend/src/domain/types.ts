export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Person {
  id: string;
  name: string;
  phone: string;
  email: string;
  street: string;
  number: string;
  complement?: string | null;
  city: string;
  state?: string | null;
  zipCode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReurbStage {
  id: string;
  order: number;
  code: string;
  name: string;
  description?: string | null;
  slaDays?: number | null;
}

export interface Activity {
  id: string;
  protocol: string;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  stageId: string;
  personId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditLog {
  id: string;
  entityType: string;
  entityId: string;
  action: 'create' | 'update' | 'delete';
  diff: Record<string, { before: unknown; after: unknown }>;
  changedBy: string | null;
  changedAt: Date;
}
