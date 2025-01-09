import type {Model, Optional} from 'sequelize';

import type {ModelAttributes} from './';

export type JSONValue = {[key: string]: string | number | boolean};

export interface ITranslationModelData extends ModelAttributes {
  language: string;
  data: JSONValue;
}

export interface ITranslationModel
  extends Model<ITranslationModelData, Optional<ITranslationModelData, 'id'>>,
    ITranslationModelData {}
