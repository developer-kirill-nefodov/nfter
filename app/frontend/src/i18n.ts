import i18n from 'i18next';
import {initReactI18next} from 'react-i18next';

import {api} from './api/client';
import en from './locales/en.json';

const resources = {US: {translation: en}};

void i18n.use(initReactI18next).init({
  resources,
  lng: 'US',
  fallbackLng: 'US',
  interpolation: {escapeValue: true},
});

const loaded = new Set(['US']);

export const loadLanguage = async (code: string): Promise<void> => {
  if (loaded.has(code)) {
    return;
  }

  const {data} = await api.get<Record<string, unknown>>(`/translations/${code}`);

  i18n.addResourceBundle(code, 'translation', data, true, true);
  loaded.add(code);
};

i18n.on('languageChanged', (code) => {
  document.documentElement.lang = code.toLowerCase();
});

export default i18n;
