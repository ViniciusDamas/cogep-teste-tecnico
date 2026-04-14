import { ReurbStageModel } from '../models/reurbStage.model';
import { NotFound } from '../utils/errors';

export async function list() {
  return ReurbStageModel.findAll({ order: [['order', 'ASC']] });
}

export async function findById(id: string) {
  const s = await ReurbStageModel.findByPk(id);
  if (!s) throw NotFound('Stage not found');
  return s;
}

export async function findFirst() {
  const s = await ReurbStageModel.findOne({ order: [['order', 'ASC']] });
  if (!s) throw NotFound('No stages configured — run seed');
  return s;
}
