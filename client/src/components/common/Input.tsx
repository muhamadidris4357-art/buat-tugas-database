import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  multiline?: boolean;
  rows?: number;
}

const Input = forwardRef<HTMLInputElement | HTMLTextAreaElement, InputProps>(
  ({ className, label, error, id, multiline, rows = 4, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const baseClass = 'w-full px-4 py-2.5 rounded-lg border bg-gray-900/50 border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200';
    return (
      <div className="mb-4">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-gray-300 mb-1">
            {label}
          </label>
        )}
        {multiline ? (
          <textarea
            ref={ref as any}
            id={inputId}
            rows={rows}
            className={cn(baseClass, error && 'border-red-500 focus:ring-red-500 focus:border-red-500', className)}
            {...props}
          />
        ) : (
          <input
            ref={ref}
            id={inputId}
            className={cn(baseClass, error && 'border-red-500 focus:ring-red-500 focus:border-red-500', className)}
            {...props}
          />
        )}
        {error && (
          <p className="mt-1 text-sm text-red-400">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
