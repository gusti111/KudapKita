import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode; tone?: 'primary' | 'secondary' | 'quiet' };
export function PrimaryButton({ children, tone = 'primary', className = '', ...props }: Props) {
  const tones = {
    primary: 'bg-cocoa text-white hover:bg-cocoa/90',
    secondary: 'border border-stroke bg-white text-cocoa hover:bg-cream',
    quiet: 'text-cocoa hover:bg-cream',
  };
  return <button className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta disabled:cursor-not-allowed disabled:opacity-50 ${tones[tone]} ${className}`} {...props}>{children}</button>;
}
