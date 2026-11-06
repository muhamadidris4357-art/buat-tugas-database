import { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'gray';
}

const variants: Record<string, string> = {
  primary: 'bg-blue-900/30 text-blue-400 border border-blue-500/30',
  success: 'bg-green-900/30 text-green-400 border border-green-500/30',
  warning: 'bg-yellow-900/30 text-yellow-400 border border-yellow-500/30',
  danger: 'bg-red-900/30 text-red-400 border border-red-500/30',
  info: 'bg-purple-900/30 text-purple-400 border border-purple-500/30',
  gray: 'bg-gray-800 text-gray-400 border border-gray-700',
};

export default function Badge({ className, variant = 'gray', children, ...props }: BadgeProps) {
  return (
    <span
      className={cn('inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium border', variants[variant], className)}
      {...props}
    >
      {children}
    </span>
  );
}
