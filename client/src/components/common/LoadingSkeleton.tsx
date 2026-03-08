type SkeletonVariant = 'text' | 'circle' | 'card' | 'table-row';

interface LoadingSkeletonProps {
  width?: string;
  height?: string;
  className?: string;
  variant?: SkeletonVariant;
}

const baseClasses = 'animate-pulse bg-stone-200 shrink-0';

export default function LoadingSkeleton({
  width,
  height,
  className = '',
  variant = 'text',
}: LoadingSkeletonProps) {
  const style: React.CSSProperties = {};
  if (width) style.width = width;
  if (height) style.height = height;

  switch (variant) {
    case 'circle':
      return (
        <div
          className={`${baseClasses} rounded-full ${className}`}
          style={{ width: width ?? '2.5rem', height: height ?? '2.5rem', ...style }}
        />
      );

    case 'card':
      return (
        <div
          className={`${baseClasses} rounded-xl ${className}`}
          style={{ width: width ?? '100%', height: height ?? '10rem', ...style }}
        />
      );

    case 'table-row':
      return (
        <div className={`flex items-center gap-4 py-3 ${className}`}>
          <div className={`${baseClasses} rounded-full`} style={{ width: '2rem', height: '2rem' }} />
          <div className="flex-1 space-y-2">
            <div className={`${baseClasses} rounded h-4 w-3/4`} />
            <div className={`${baseClasses} rounded h-3 w-1/2`} />
          </div>
          <div className={`${baseClasses} rounded h-6 w-16`} />
        </div>
      );

    case 'text':
    default:
      return (
        <div
          className={`${baseClasses} rounded ${className}`}
          style={{ width: width ?? '100%', height: height ?? '1rem', ...style }}
        />
      );
  }
}
