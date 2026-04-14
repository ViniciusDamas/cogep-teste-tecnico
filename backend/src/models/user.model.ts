import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface UserAttrs {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt?: Date;
  updatedAt?: Date;
}

type UserCreationAttrs = Optional<UserAttrs, 'id' | 'createdAt' | 'updatedAt'>;

export class UserModel extends Model<UserAttrs, UserCreationAttrs> implements UserAttrs {
  public id!: string;
  public name!: string;
  public email!: string;
  public passwordHash!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

UserModel.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING(120), allowNull: false },
    email: { type: DataTypes.STRING(160), allowNull: false, unique: true },
    passwordHash: { type: DataTypes.STRING(255), allowNull: false },
  },
  { sequelize, tableName: 'users', modelName: 'User' },
);
