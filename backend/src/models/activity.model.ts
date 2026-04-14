import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { UserModel } from './user.model';
import { PersonModel } from './person.model';
import { ReurbStageModel } from './reurbStage.model';

interface ActivityAttrs {
  id: string;
  protocol: string;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  stageId: string;
  personId: string;
  createdBy: string;
  createdAt?: Date;
  updatedAt?: Date;
}

type ActivityCreation = Optional<ActivityAttrs, 'id' | 'protocol' | 'createdAt' | 'updatedAt'>;

export class ActivityModel extends Model<ActivityAttrs, ActivityCreation> implements ActivityAttrs {
  public id!: string;
  public protocol!: string;
  public name!: string;
  public description!: string;
  public startDate!: Date;
  public endDate!: Date;
  public stageId!: string;
  public personId!: string;
  public createdBy!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ActivityModel.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    protocol: { type: DataTypes.STRING(32), allowNull: false, unique: true },
    name: { type: DataTypes.STRING(200), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    startDate: { type: DataTypes.DATEONLY, allowNull: false },
    endDate: { type: DataTypes.DATEONLY, allowNull: false },
    stageId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: ReurbStageModel, key: 'id' },
    },
    personId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: PersonModel, key: 'id' },
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: UserModel, key: 'id' },
    },
  },
  { sequelize, tableName: 'activities', modelName: 'Activity' },
);

ActivityModel.belongsTo(PersonModel, { foreignKey: 'personId', as: 'person' });
ActivityModel.belongsTo(ReurbStageModel, { foreignKey: 'stageId', as: 'stage' });
ActivityModel.belongsTo(UserModel, { foreignKey: 'createdBy', as: 'creator' });

PersonModel.hasMany(ActivityModel, { foreignKey: 'personId', as: 'activities' });
ReurbStageModel.hasMany(ActivityModel, { foreignKey: 'stageId', as: 'activities' });
