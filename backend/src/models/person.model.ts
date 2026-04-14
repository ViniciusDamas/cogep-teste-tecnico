import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { UserModel } from './user.model';

interface PersonAttrs {
  id: string;
  name: string;
  phone: string;
  email: string;
  street: string;
  number: string;
  complement: string | null;
  city: string;
  state: string | null;
  zipCode: string | null;
  latitude: number | null;
  longitude: number | null;
  createdBy: string;
  createdAt?: Date;
  updatedAt?: Date;
}

type PersonCreation = Optional<
  PersonAttrs,
  'id' | 'complement' | 'state' | 'zipCode' | 'latitude' | 'longitude' | 'createdAt' | 'updatedAt'
>;

export class PersonModel extends Model<PersonAttrs, PersonCreation> implements PersonAttrs {
  public id!: string;
  public name!: string;
  public phone!: string;
  public email!: string;
  public street!: string;
  public number!: string;
  public complement!: string | null;
  public city!: string;
  public state!: string | null;
  public zipCode!: string | null;
  public latitude!: number | null;
  public longitude!: number | null;
  public createdBy!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

PersonModel.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING(160), allowNull: false },
    phone: { type: DataTypes.STRING(32), allowNull: false },
    email: { type: DataTypes.STRING(160), allowNull: false },
    street: { type: DataTypes.STRING(200), allowNull: false },
    number: { type: DataTypes.STRING(16), allowNull: false },
    complement: { type: DataTypes.STRING(120), allowNull: true },
    city: { type: DataTypes.STRING(120), allowNull: false },
    state: { type: DataTypes.STRING(4), allowNull: true },
    zipCode: { type: DataTypes.STRING(12), allowNull: true },
    latitude: { type: DataTypes.DOUBLE, allowNull: true },
    longitude: { type: DataTypes.DOUBLE, allowNull: true },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: UserModel, key: 'id' },
    },
  },
  { sequelize, tableName: 'persons', modelName: 'Person' },
);

PersonModel.belongsTo(UserModel, { foreignKey: 'createdBy', as: 'creator' });
