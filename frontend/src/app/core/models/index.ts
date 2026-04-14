export interface UserSummary {
  id: string;
  name: string;
  email: string;
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
  createdAt: string;
  updatedAt: string;
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
  startDate: string;
  endDate: string;
  stageId: string;
  personId: string;
  stage?: ReurbStage;
  person?: Person;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  entityType: string;
  entityId: string;
  action: 'create' | 'update' | 'delete';
  diff: Record<string, unknown>;
  changedBy: string | null;
  changedAt: string;
  changedByUser?: { id: string; name: string; email: string } | null;
}

export interface FunnelBucket {
  stageId: string;
  code: string;
  name: string;
  order: number;
  count: number;
}

export interface DashboardSummary {
  totalPersons: number;
  totalActivities: number;
  activitiesByStage: FunnelBucket[];
  overdueCount: number;
}

export interface ViaCepData {
  zipCode: string;
  street: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
}
