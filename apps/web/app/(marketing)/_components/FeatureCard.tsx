import { type LucideIcon } from 'lucide-react';
import { clsx } from 'clsx';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
}

export function FeatureCard({
  icon: Icon,
  title,
  description,
  className,
}: FeatureCardProps) {
  return (
    <div
      className={clsx(
        'group relative rounded-2xl border border-gray-100 bg-white p-6 shadow-card',
        'transition-all duration-200 hover:border-brand-200 hover:shadow-card-hover',
        className,
      )}
    >
      <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 group-hover:bg-brand-100 transition-colors">
        <Icon size={22} aria-hidden />
      </div>
      <h3 className="mb-2 text-base font-semibold text-gray-900">{title}</h3>
      <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
    </div>
  );
}
