import fs from 'fs';
import path from 'path';
import { Dictionary } from './types';

const dictionaries: Record<string, () => Dictionary> = {
  en: () => JSON.parse(fs.readFileSync(path.join(process.cwd(), 'messages', 'en.json'), 'utf8')),
  'pt-BR': () => JSON.parse(fs.readFileSync(path.join(process.cwd(), 'messages', 'pt-BR.json'), 'utf8')),
};

export const getDictionary = (locale: string) => {
  const allowedLocales = ['en', 'pt-BR'];
  const safeLocale = allowedLocales.includes(locale) ? locale : 'en';
  return dictionaries[safeLocale]?.() ?? dictionaries.en();
};
