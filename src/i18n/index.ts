import { createI18n } from 'vue-i18n';
import sv from './sv';

export const i18n = createI18n({
  legacy: false,
  locale: 'sv',
  fallbackLocale: 'sv',
  messages: { sv },
});
