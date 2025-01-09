import {DataTypes} from 'sequelize';

import {db} from '../db';
import type {ITranslationModel} from '../interfaces/models/translation';

const TranslationModel = db.define<ITranslationModel>(
  'translation',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    language: {
      type: DataTypes.STRING(2),
      allowNull: false,
      unique: true,
    },
    data: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
  },
  {
    tableName: 'translations',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
);

export default TranslationModel;
