/**
 * Format a number as Tanzanian Shillings (TSH) with commas.
 */
export function formatCurrency(amount: number | string | null | undefined): string {
  const n = Number(amount ?? 0);
  return `TSH ${n.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

/**
 * Format a date string as a readable date (e.g., "Mar 7, 2026").
 */
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format a date string as date + time (e.g., "Mar 7, 2026, 2:30 PM").
 */
export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Format a date as relative time (e.g., "2 hours ago", "3 days ago").
 */
export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffSeconds < 60) return 'just now';
  if (diffMinutes < 60)
    return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
  if (diffHours < 24)
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  if (diffWeeks < 5)
    return `${diffWeeks} week${diffWeeks !== 1 ? 's' : ''} ago`;
  if (diffMonths < 12)
    return `${diffMonths} month${diffMonths !== 1 ? 's' : ''} ago`;

  return formatDate(date);
}

/**
 * Return a Tailwind color class for a given job status.
 */
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    open: 'text-blue-600 bg-blue-100',
    assigned: 'text-yellow-600 bg-yellow-100',
    in_progress: 'text-orange-600 bg-orange-100',
    pending_confirmation: 'text-purple-600 bg-purple-100',
    completed: 'text-green-600 bg-green-100',
    cancelled: 'text-red-600 bg-red-100',
    disputed: 'text-red-700 bg-red-200',
  };

  return colors[status.toLowerCase()] ?? 'text-gray-600 bg-gray-100';
}

/**
 * Return a human-readable label for a service type.
 */
export function getServiceTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    // Backend enum values (uppercase)
    car_wash: 'Car Wash',
    cleaning: 'Cleaning',
    gardening: 'Gardening',
    window_fix: 'Window Repair',
    handywork: 'Handywork',
    other: 'Other',
  };

  return labels[type.toLowerCase()] ?? type.charAt(0).toUpperCase() + type.slice(1).toLowerCase().replace(/_/g, ' ');
}
