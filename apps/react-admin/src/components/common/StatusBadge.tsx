import clsx from 'clsx';

type StatusType = 'active' | 'inactive' | 'pending' | 'completed' | 'failed' | 'refunded' | 'approved' | 'rejected' | 'suspended' | 'unverified' | 'verified' | 'defaulted' | 'coming_soon' | 'discontinued';

interface StatusBadgeProps {
  status: StatusType;
  size?: 'sm' | 'md';
}

const statusStyles: Record<StatusType, string> = {
  active: 'badge-success',
  completed: 'badge-success',
  verified: 'badge-success',
  approved: 'badge-success',
  pending: 'badge-warning',
  inactive: 'badge-neutral',
  suspended: 'badge-danger',
  rejected: 'badge-danger',
  failed: 'badge-danger',
  defaulted: 'badge-danger',
  refunded: 'badge-info',
  unverified: 'badge-neutral',
  coming_soon: 'badge-info',
  discontinued: 'badge-neutral',
};

export default function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  return (
    <span
      className={clsx(
        statusStyles[status] || 'badge-neutral',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
      )}
    >
      {status.replace('_', ' ')}
    </span>
  );
}
