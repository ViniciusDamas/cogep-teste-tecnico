import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { UserModel } from './user.model';

interface AuditAttrs {
  id: string;
  entityType: string;
  entityId: string;
  action: 'create' | 'update' | 'delete';
  diff: Record<string, unknown>;
  changedBy: string | null;
  changedAt: Date;
}

type AuditCreation = Optional<AuditAttrs, 'id' | 'changedAt'>;

export class AuditLogModel extends Model<AuditAttrs, AuditCreation> implements AuditAttrs {
  public id!: string;
  public entityType!: string;
  public entityId!: string;
  public action!: 'create' | 'update' | 'delete';
  public diff!: Record<string, unknown>;
  public changedBy!: string | null;
  public changedAt!: Date;
}

AuditLogModel.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    entityType: { type: DataTypes.STRING(40), allowNull: false },
    entityId: { type: DataTypes.UUID, allowNull: false },
    action: { type: DataTypes.ENUM('create', 'update', 'delete'), allowNull: false },
    diff: { type: DataTypes.JSONB, allowNull: false },
    changedBy: { type: DataTypes.UUID, allowNull: true },
    changedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  { sequelize, tableName: 'audit_logs', modelName: 'AuditLog', timestamps: false },
);

AuditLogModel.belongsTo(UserModel, { foreignKey: 'changedBy', as: 'changedByUser' });
