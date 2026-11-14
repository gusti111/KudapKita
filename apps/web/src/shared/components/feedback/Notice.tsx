import type { ReactNode } from 'react';
export function Notice({ children, tone = 'info' }: { children: ReactNode; tone?: 'info' | 'warning' | 'error' | 'success' }) {
  const classes = { info: 'border-blue-200 bg-blue-50 text-blue-900', warning: 'border-amber-200 bg-amber-50 text-amber-900', error: 'border-rose-200 bg-rose-50 text-rose-900', success: 'border-green-200 bg-green-50 text-green-900' };
  return <div className={`rounded-xl border px-4 py-3 text-sm leading-6 ${classes[tone]}`} role="status">{children}</div>;
}
