import type { ReactNode } from 'react';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}

export default function ChartCard({ title, subtitle, children, action, className = '' }: ChartCardProps) {
  return (
    <div className={`card ${className}`}>
      <div className="card-header flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-surface-900">{title}</h3>
          {subtitle && (
            <p className="text-xs text-surface-500 mt-0.5">{subtitle}</p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>
      <div className="card-body">
        {children}
      </div>
    </div>
  );
}
