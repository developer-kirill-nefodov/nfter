import type {Request, Response} from 'express';

import CountryModel from '../../models/country.model';

export const getCountriesLangController = async (_req: Request, res: Response) => {
  const languages = await CountryModel.findAll({
    attributes: ['iso2', 'lang'],
    order: [['lang', 'ASC']],
  });

  res.status(200).json(languages);
};
