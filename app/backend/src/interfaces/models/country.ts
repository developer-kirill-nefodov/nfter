import type {Model, Optional} from 'sequelize';

import type {ModelAttributes} from './';

export interface ICountryModelData extends ModelAttributes {
  countries: string;
  iso2: string;
  iso3: string;
  lang: string;
}

export interface ICountryModel
  extends Model<ICountryModelData, Optional<ICountryModelData, 'id'>>,
    ICountryModelData {}
