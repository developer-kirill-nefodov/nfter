import type {Request, Response} from 'express';

import {AppError} from '../../errors/app-error';
import TranslationModel from '../../models/translation.model';

export const getByLanguageController = async (req: Request, res: Response) => {
  const {lang} = req.params as {lang: string};

  if (!/^[A-Za-z]{2}$/.test(lang)) {
    throw AppError.badRequest('Language must be a two-letter code');
  }

  const translation = await TranslationModel.findOne({where: {language: lang.toUpperCase()}});

  if (!translation) {
    throw AppError.notFound(`No translations for language "${lang}"`);
  }

  res.status(200).json(translation.data);
};
