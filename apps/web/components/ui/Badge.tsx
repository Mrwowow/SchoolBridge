import { HTMLAttributes } from 'react';
import { clsx } from 'clsx';

export type BadgeVariant =
  | 'blue'
  | 'green'
  | 'yellow'
  | 'red'
  | 'purple'
  | 'gray';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  dot?: boolean;
}

const variantClasses: Record<BadgeVariant, string> = {
  blue:   'bg-brand-50 text-brand-700 ring-brand-200',
  green:  'bg-emerald-50 text-emerald-700 ring-emerald-200',
  yellow: 'bg-amber-50 text-amber-700 ring-amber-200',
  red:    'bg-red-50 text-red-700 ring-red-200',
  purple: 'bg-violet-50 text-violet-700 ring-violet-200',
  gray:   'bg-gray-100 text-gray-600 ring-gray-200',
};

const dotClasses: Record<BadgeVariant, string> = {
  blue:   'bg-brand-500',
  green:  'bg-emerald-500',
  yellow: 'bg-amber-500',
  red:    'bg-red-500',
  purple: 'bg-violet-500',
  gray:   'bg-gray-400',
};

export function Badge({
  variant = 'gray',
  dot = false,
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5',
        'text-xs font-medium ring-1 ring-inset',
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {dot && (
        <span
          className={clsx('h-1.5 w-1.5 rounded-full', dotClasses[variant])}
          aria-hidden
        />
      )}
      {children}
    </span>
  );
}
