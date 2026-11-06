import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/cn';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padded?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(({ className, padded = true, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        'bg-gray-900/60 border border-gray-700 rounded-xl backdrop-blur-sm',
        padded && 'p-6',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});

Card.displayName = 'Card';

export default Card;
