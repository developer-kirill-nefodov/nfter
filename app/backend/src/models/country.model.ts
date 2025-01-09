import {DataTypes} from 'sequelize';

import {db} from '../db';
import type {ICountryModel} from '../interfaces/models/country';

const CountryModel = db.define<ICountryModel>(
  'country',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    countries: {
      type: DataTypes.STRING(30),
      allowNull: false,
      validate: {len: [1, 30]},
    },
    iso2: {
      type: DataTypes.STRING(2),
      allowNull: false,
      unique: true,
      validate: {len: [2, 2]},
    },
    iso3: {
      type: DataTypes.STRING(3),
      allowNull: false,
      unique: true,
      validate: {len: [3, 3]},
    },
    lang: {
      type: DataTypes.STRING(30),
      allowNull: false,
      validate: {len: [1, 30]},
    },
  },
  {
    tableName: 'countries',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
);

export default CountryModel;
