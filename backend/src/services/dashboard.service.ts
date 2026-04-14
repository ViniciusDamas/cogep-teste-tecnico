import { Op } from 'sequelize';
import { ActivityModel } from '../models/activity.model';
import { ReurbStageModel } from '../models/reurbStage.model';

export interface FunnelBucket {
  stageId: string;
  code: string;
  name: string;
  order: number;
  count: number;
}

export async function funnel(): Promise<FunnelBucket[]> {
  const stages = await ReurbStageModel.findAll({ order: [['order', 'ASC']] });
  const activities = await ActivityModel.findAll({ attributes: ['stageId'] });
  const counts = new Map<string, number>();
  for (const a of activities) {
    counts.set(a.stageId, (counts.get(a.stageId) ?? 0) + 1);
  }
  return stages.map((s) => ({
    stageId: s.id,
    code: s.code,
    name: s.name,
    order: s.order,
    count: counts.get(s.id) ?? 0,
  }));
}

export interface DashboardSummary {
  totalPersons: number;
  totalActivities: number;
  activitiesByStage: FunnelBucket[];
  overdueCount: number;
}

export async function summary(): Promise<DashboardSummary> {
  const [{ count: totalActivities }, funnelData] = await Promise.all([
    ActivityModel.findAndCountAll({ limit: 0 }),
    funnel(),
  ]);

  const { PersonModel } = await import('../models/person.model');
  const totalPersons = await PersonModel.count();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const overdueCount = await ActivityModel.count({
    where: { endDate: { [Op.lt]: today } },
  });

  return {
    totalPersons,
    totalActivities,
    activitiesByStage: funnelData,
    overdueCount,
  };
}
