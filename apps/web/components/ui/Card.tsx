import { HTMLAttributes } from 'react';
import { clsx } from 'clsx';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Remove default padding */
  noPadding?: boolean;
  /** Subtle hover shadow lift */
  hoverable?: boolean;
}

export function Card({
  noPadding = false,
  hoverable = false,
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={clsx(
        'rounded-2xl border border-gray-100 bg-white shadow-card',
        !noPadding && 'p-6',
        hoverable && 'transition-shadow duration-200 hover:shadow-card-hover cursor-pointer',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {}

export function CardHeader({ className, children, ...props }: CardHeaderProps) {
  return (
    <div
      className={clsx('mb-4 flex items-center justify-between', className)}
      {...props}
    >
      {children}
    </div>
  );
}

interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {}

export function CardTitle({ className, children, ...props }: CardTitleProps) {
  return (
    <h3
      className={clsx('text-base font-semibold text-gray-900', className)}
      {...props}
    >
      {children}
    </h3>
  );
}
