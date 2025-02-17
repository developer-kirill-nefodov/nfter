import i18n from 'i18next';
import {initReactI18next} from 'react-i18next';

import {api} from './api/client';
import en from './locales/en.json';

/**
 * English ships in the bundle so the very first paint is never untranslated;
 * every other locale is fetched from the API on demand. The old setup fetched
 * *all* locales, including the default, which meant the UI rendered raw keys
 * until the network answered.
 */
const resources = {US: {translation: en}};

void i18n.use(initReactI18next).init({
  resources,
  lng: 'US',
  fallbackLng: 'US',
  // Dotted keys like `auth.login` are nested lookups, not literal flat keys —
  // the old `keySeparator: false` quietly made them the latter.
  interpolation: {escapeValue: true},
});

const loaded = new Set(['US']);

/** Loads a locale from the database the first time the user selects it. */
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
