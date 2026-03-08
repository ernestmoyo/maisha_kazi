import type { LucideIcon } from 'lucide-react';
import Button from '@/components/common/Button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`
        flex flex-col items-center justify-center text-center
        py-16 px-6
        ${className}
      `}
    >
      <div className="w-16 h-16 rounded-2xl bg-surface-warm flex items-center justify-center mb-5">
        <Icon size={28} className="text-dark-subtle" />
      </div>

      <h3 className="text-lg font-heading font-semibold text-dark mb-1.5">
        {title}
      </h3>

      {description && (
        <p className="text-sm text-dark-subtle max-w-sm mb-6 leading-relaxed">
          {description}
        </p>
      )}

      {actionLabel && onAction && (
        <Button variant="primary" size="md" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
