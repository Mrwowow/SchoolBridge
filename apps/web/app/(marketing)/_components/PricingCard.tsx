import Link from 'next/link';
import { clsx } from 'clsx';
import { Check } from 'lucide-react';

interface PricingCardProps {
  plan: string;
  price: string;
  period?: string;
  description: string;
  features: string[];
  cta: string;
  highlighted?: boolean;
  badge?: string;
}

export function PricingCard({
  plan,
  price,
  period = '/month',
  description,
  features,
  cta,
  highlighted = false,
  badge,
}: PricingCardProps) {
  return (
    <div
      className={clsx(
        'relative flex flex-col rounded-2xl border p-8',
        highlighted
          ? 'border-brand-400 bg-brand-500 text-white shadow-xl shadow-brand-500/25'
          : 'border-gray-100 bg-white shadow-card',
      )}
    >
      {badge && (
        <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-brand-500 px-4 py-1 text-xs font-semibold text-white shadow">
          {badge}
        </span>
      )}

      <div className="mb-6">
        <p
          className={clsx(
            'mb-1 text-sm font-semibold uppercase tracking-wider',
            highlighted ? 'text-brand-200' : 'text-brand-500',
          )}
        >
          {plan}
        </p>
        <div className="flex items-end gap-1">
          <span className={clsx('text-4xl font-extrabold', highlighted ? 'text-white' : 'text-gray-900')}>
            {price}
          </span>
          {period && (
            <span className={clsx('mb-1 text-sm', highlighted ? 'text-brand-200' : 'text-gray-400')}>
              {period}
            </span>
          )}
        </div>
        <p className={clsx('mt-2 text-sm leading-relaxed', highlighted ? 'text-brand-100' : 'text-gray-500')}>
          {description}
        </p>
      </div>

      <ul className="mb-8 flex flex-col gap-3 flex-1" role="list">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm">
            <Check
              size={16}
              className={clsx('mt-0.5 shrink-0', highlighted ? 'text-brand-200' : 'text-brand-500')}
              aria-hidden
            />
            <span className={highlighted ? 'text-brand-50' : 'text-gray-600'}>{f}</span>
          </li>
        ))}
      </ul>

      <Link
        href="/#"
        className={clsx(
          'block rounded-xl px-6 py-3 text-center text-sm font-semibold transition-all duration-150',
          highlighted
            ? 'bg-white text-brand-600 hover:bg-brand-50'
            : 'bg-brand-500 text-white hover:bg-brand-600',
        )}
      >
        {cta}
      </Link>
    </div>
  );
}
