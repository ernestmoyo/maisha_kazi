import type { HTMLAttributes, ReactNode } from 'react';

type CardPadding = 'sm' | 'md' | 'lg';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padding?: CardPadding;
  hover?: boolean;
}

const paddingClasses: Record<CardPadding, string> = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export default function Card({
  children,
  className = '',
  padding = 'md',
  hover = false,
  ...rest
}: CardProps) {
  return (
    <div
      className={`
        bg-white rounded-xl
        shadow-[0_1px_3px_rgba(28,25,23,0.06),0_4px_12px_rgba(28,25,23,0.04)]
        ${paddingClasses[padding]}
        ${hover ? 'transition-all duration-200 ease-in-out hover:shadow-[0_4px_12px_rgba(28,25,23,0.1),0_8px_24px_rgba(28,25,23,0.06)] hover:-translate-y-0.5 cursor-pointer' : ''}
        ${className}
      `}
      {...rest}
    >
      {children}
    </div>
  );
}
