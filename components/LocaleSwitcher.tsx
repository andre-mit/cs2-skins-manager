'use client';

import { useTransition } from 'react';
import { Globe, Loader2 } from 'lucide-react';
import { changeLocale } from '@/app/actions';

const AVAILABLE_LOCALES = [
  { code: 'en', label: 'English' },
  { code: 'pt-BR', label: 'Português (BR)' },
];

export function LocaleSwitcher({ locale }: { locale: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="relative flex items-center">
      <Globe className="absolute left-3 w-4 h-4 text-neutral-500 pointer-events-none" />
      {isPending && <Loader2 className="absolute right-3 w-3 h-3 text-neutral-500 animate-spin pointer-events-none" />}
      <select
        value={locale}
        disabled={isPending}
        onChange={(e) => {
          startTransition(() => {
            changeLocale(e.target.value);
          });
        }}
        className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium rounded-xl pl-9 pr-8 py-2 text-sm border border-neutral-700 focus:outline-none focus:ring-2 focus:ring-rose-500/50 cursor-pointer appearance-none disabled:opacity-50 transition-colors"
      >
        {AVAILABLE_LOCALES.map(loc => (
          <option key={loc.code} value={loc.code}>{loc.label}</option>
        ))}
      </select>
    </div>
  );
}
