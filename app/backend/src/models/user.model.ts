import {DataTypes} from 'sequelize';

import {db} from '../db';
import type {IUserModel} from '../interfaces/models/user';

const UserModel = db.define<IUserModel>(
  'user',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true,
      validate: {isEmail: true},
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    wallet_address: {
      type: DataTypes.STRING(42),
      allowNull: true,
      unique: true,
      validate: {is: /^0x[a-f0-9]{40}$/},
    },
    role: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
  },
  {
    tableName: 'users',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    defaultScope: {
      attributes: {exclude: ['password']},
    },
    scopes: {
      // Opt in explicitly wherever the hash is genuinely needed (login, reset).
      withPassword: {attributes: {include: ['password']}},
    },
  },
);

export default UserModel;
