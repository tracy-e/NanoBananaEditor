import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-lg text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40',
  {
    variants: {
      variant: {
        default: 'bg-amber-600 text-white hover:bg-amber-500 focus-visible:ring-amber-500 shadow-sm',
        secondary: 'bg-stone-100 text-stone-700 hover:bg-stone-200 focus-visible:ring-stone-400',
        outline: 'border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 hover:text-stone-800',
        ghost: 'text-stone-500 hover:bg-stone-100 hover:text-stone-700',
        destructive: 'bg-red-500 text-white hover:bg-red-600 focus-visible:ring-red-500',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-7 px-2.5 text-xs',
        lg: 'h-11 px-8',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';
