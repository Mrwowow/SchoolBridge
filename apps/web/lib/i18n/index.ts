'use client';

/**
 * Minimal dependency-free i18n. English is the baseline; SessionUser.locale
 * selects the active dictionary. Designed so Hausa/Yoruba/Igbo/Pidgin can be
 * added as sibling dictionaries without changing call sites.
 *
 * Usage:  const t = useT(); t('analytics.ackRate')
 */
import { useMemo } from 'react';
import { en, type Messages } from './en';
import { useSession } from '../session';

export type Locale = 'en';

const messages: Record<Locale, Messages> = {
  en,
};

const SUPPORTED: Locale[] = ['en'];

/** Resolve a dotted key path ("analytics.ackRate") against a dictionary. */
function resolve(dict: Messages, key: string): string {
  const value = key.split('.').reduce<unknown>((acc, part) => {
    if (acc && typeof acc === 'object' && part in acc) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, dict);
  return typeof value === 'string' ? value : key;
}

export function useT() {
  const { user } = useSession();
  const locale: Locale = SUPPORTED.includes(user?.locale as Locale)
    ? (user?.locale as Locale)
    : 'en';
  const dict = messages[locale];
  return useMemo(() => (key: string) => resolve(dict, key), [dict]);
}
