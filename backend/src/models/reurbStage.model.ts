import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface StageAttrs {
  id: string;
  order: number;
  code: string;
  name: string;
  description: string | null;
  slaDays: number | null;
}

type StageCreation = Optional<StageAttrs, 'id' | 'description' | 'slaDays'>;

export class ReurbStageModel extends Model<StageAttrs, StageCreation> implements StageAttrs {
  public id!: string;
  public order!: number;
  public code!: string;
  public name!: string;
  public description!: string | null;
  public slaDays!: number | null;
}

ReurbStageModel.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    order: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    code: { type: DataTypes.STRING(40), allowNull: false, unique: true },
    name: { type: DataTypes.STRING(160), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    slaDays: { type: DataTypes.INTEGER, allowNull: true },
  },
  { sequelize, tableName: 'reurb_stages', modelName: 'ReurbStage', timestamps: false },
);
