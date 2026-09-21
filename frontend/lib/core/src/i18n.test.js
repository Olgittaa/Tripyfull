import { afterEach, describe, expect, it } from 'vitest';
import { LOCALES, locale, matchLocale, setLocale, t } from './i18n.js';
import { messages } from './i18n/index.js';
import { formatDateShort, formatDayDate, monthNames, weekdayNames } from './date.js';

afterEach(() => setLocale('en'));

describe('the tables', () => {
  it('speak every language the settings offer, and nothing else', () => {
    expect(Object.keys(messages).sort()).toEqual(LOCALES.map((l) => l.code).sort());
  });

  it('have exactly the keys English has — a missing word would fall back silently', () => {
    const reference = Object.keys(messages.en).sort();
    for (const [code, table] of Object.entries(messages)) {
      expect(Object.keys(table).sort(), `keys of ${code}`).toEqual(reference);
    }
  });

  it('keep every placeholder English uses — a dropped {title} would print a bare sentence', () => {
    const holders = (s) => (typeof s === 'string' ? (s.match(/\{\w+\}/g) || []).sort() : null);
    for (const [key, en] of Object.entries(messages.en)) {
      if (typeof en !== 'string') continue;
      for (const [code, table] of Object.entries(messages)) {
        expect(holders(table[key]), `${code} ${key}`).toEqual(holders(en));
      }
    }
  });
});

describe('t()', () => {
  it('answers in the current language and falls back to English, then to the key', () => {
    expect(t('nav.allTrips')).toBe('All trips');
    setLocale('de');
    expect(t('nav.allTrips')).toBe('Alle Reisen');
    expect(t('no.such.key')).toBe('no.such.key');
  });

  it('fills placeholders, and writes numbers in the language’s digits', () => {
    expect(t('trips.createdMsg', { title: 'Greece' })).toBe('Trip "Greece" added');
    expect(t('trips.createdMsg')).toBe('Trip "{title}" added');
    setLocale('bn');
    expect(t('ui.days', { count: 12 })).toBe('১২ দিন');
  });

  it('picks the plural form the language needs — English two, Russian four, Arabic six', () => {
    expect(t('ui.days', { count: 1 })).toBe('1 day');
    expect(t('ui.days', { count: 3 })).toBe('3 days');
    setLocale('ru');
    expect(t('ui.days', { count: 1 })).toBe('1 день');
    expect(t('ui.days', { count: 3 })).toBe('3 дня');
    expect(t('ui.days', { count: 5 })).toBe('5 дней');
    expect(t('ui.days', { count: 21 })).toBe('21 день');
    setLocale('ar');
    expect(t('ui.days', { count: 0 })).toBe('لا أيام');
    expect(t('ui.days', { count: 1 })).toBe('يوم واحد');
    expect(t('ui.days', { count: 2 })).toBe('يومان');
    expect(t('ui.days', { count: 3 })).toMatch(/أيام$/);
    expect(t('ui.days', { count: 11 })).toMatch(/يومًا$/);
    setLocale('ja');
    expect(t('ui.days', { count: 7 })).toBe('7日');
  });

  it('takes an unknown language as English', () => {
    expect(setLocale('xx')).toBe('en');
    expect(locale.value).toBe('en');
  });
});

describe('matchLocale', () => {
  it('finds ours in a browser’s preference, or settles for English', () => {
    expect(matchLocale('de-AT')).toBe('de');
    expect(matchLocale('zh-Hans-CN')).toBe('zh');
    expect(matchLocale('pt_BR')).toBe('pt');
    expect(matchLocale('fr-FR')).toBe('en');
    expect(matchLocale(undefined)).toBe('en');
  });
});

describe('dates in the language', () => {
  it('keep the British shape in English that every screen was built on', () => {
    expect(formatDateShort('2026-12-10')).toBe('10 Dec');
    expect(formatDayDate('2026-12-12')).toBe('Sat 12 Dec');
    expect(monthNames()[7]).toBe('Aug');
    expect(weekdayNames()).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
  });

  it('follow the language', () => {
    setLocale('de');
    expect(formatDateShort('2026-12-10')).toBe('10. Dez.');
    expect(weekdayNames()[0]).toBe('Mo');
    setLocale('ja');
    expect(formatDateShort('2026-12-10')).toBe('12月10日');
    setLocale('ru');
    expect(formatDayDate('2026-12-12')).toBe('сб, 12 дек.');
  });
});
