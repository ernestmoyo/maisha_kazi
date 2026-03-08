import {
  CircleDot,
  UserCheck,
  Loader,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  type LucideIcon,
} from 'lucide-react';

type JobStatus =
  | 'OPEN'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'DISPUTED'
  | 'CANCELLED';

interface StatusBadgeProps {
  status: JobStatus;
  className?: string;
}

interface StatusConfig {
  label: string;
  icon: LucideIcon;
  classes: string;
}

const statusMap: Record<JobStatus, StatusConfig> = {
  OPEN: {
    label: 'Open',
    icon: CircleDot,
    classes: 'bg-emerald-100 text-emerald-800 ring-emerald-600/20',
  },
  ASSIGNED: {
    label: 'Assigned',
    icon: UserCheck,
    classes: 'bg-sky-100 text-sky-800 ring-sky-600/20',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    icon: Loader,
    classes: 'bg-amber-100 text-amber-800 ring-amber-600/20',
  },
  COMPLETED: {
    label: 'Completed',
    icon: CheckCircle2,
    classes: 'bg-emerald-100 text-emerald-800 ring-emerald-600/20',
  },
  DISPUTED: {
    label: 'Disputed',
    icon: AlertTriangle,
    classes: 'bg-red-100 text-red-800 ring-red-600/20',
  },
  CANCELLED: {
    label: 'Cancelled',
    icon: XCircle,
    classes: 'bg-stone-100 text-stone-600 ring-stone-500/20',
  },
};

export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const config = statusMap[status];
  const Icon = config.icon;

  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        px-2.5 py-1 text-xs font-medium font-body
        rounded-full ring-1 ring-inset
        ${config.classes}
        ${className}
      `}
    >
      <Icon size={13} className={status === 'IN_PROGRESS' ? 'animate-spin' : ''} />
      {config.label}
    </span>
  );
}
