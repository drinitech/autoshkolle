import clsx from 'clsx';
import type { ButtonHTMLAttributes, HTMLAttributes } from 'react';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        'rounded-2xl border border-border-subtle bg-surface p-5 shadow-sm shadow-black/[0.03]',
        className
      )}
      {...props}
    />
  );
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
}

export function Button({ className, variant = 'primary', size = 'md', ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none',
        size === 'md' ? 'px-4 py-2.5 text-sm' : 'px-3 py-1.5 text-xs',
        variant === 'primary' && 'bg-brand-500 text-white hover:bg-brand-600 shadow-sm shadow-brand-500/20',
        variant === 'secondary' && 'bg-surface-muted text-ink border border-border-subtle hover:bg-brand-50',
        variant === 'ghost' && 'text-ink-muted hover:bg-surface-muted',
        variant === 'danger' && 'bg-danger-500 text-white hover:bg-red-600',
        className
      )}
      {...props}
    />
  );
}

export function Badge({ className, tone = 'brand', ...props }: HTMLAttributes<HTMLSpanElement> & { tone?: 'brand' | 'ok' | 'warn' | 'danger' | 'muted' }) {
  const tones: Record<string, string> = {
    brand: 'bg-brand-50 text-brand-700',
    ok: 'bg-ok-500/10 text-ok-500',
    warn: 'bg-warn-500/10 text-warn-500',
    danger: 'bg-danger-500/10 text-danger-500',
    muted: 'bg-surface-muted text-ink-muted',
  };
  return <span className={clsx('rounded-full px-2.5 py-1 text-xs font-semibold', tones[tone], className)} {...props} />;
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={clsx(
        'w-full rounded-xl border border-border-subtle bg-surface-muted px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-ink-muted focus:border-brand-500 focus:bg-surface focus:ring-2 focus:ring-brand-500/15',
        props.className
      )}
    />
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx('animate-pulse rounded-lg bg-border-subtle', className)} />;
}
