import en from '@/messages/en.json';
import ja from '@/messages/ja.json';

export type Locale = 'en' | 'ja';

export function getTranslation(locale: Locale) {
  return locale === 'en' ? en : ja;
}

export function getMessages(locale: Locale) {
  const t = getTranslation(locale);
  return {
    homepage: t.homepage,
    experiences: t.experiences,
    about: t.about,
  };
}

export function getCoffeeMessages(locale: Locale) {
  const t = getTranslation(locale);
  return t.homepage.coffee.beans || {};
}
