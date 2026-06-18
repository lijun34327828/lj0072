import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { formatDuration } from '@/utils/format';

interface WorkloadProgressProps {
  current: number;
  max: number;
  showLabel?: boolean;
  variant?: 'bar' | 'circle';
  size?: 'sm' | 'md' | 'lg';
}

export default function WorkloadProgress({
  current,
  max,
  showLabel = true,
  variant = 'bar',
  size = 'md',
}: WorkloadProgressProps) {
  const percentage = Math.min((current / max) * 100, 100);

  const getColor = () => {
    if (percentage >= 90) return 'text-red-500';
    if (percentage >= 70) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getBgColor = () => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const sizeClasses = {
    sm: { circle: 'w-12 h-12', stroke: 4, text: 'text-xs' },
    md: { circle: 'w-16 h-16', stroke: 6, text: 'text-sm' },
    lg: { circle: 'w-24 h-24', stroke: 8, text: 'text-lg' },
  };

  if (variant === 'circle') {
    const { circle, stroke, text } = sizeClasses[size];
    const radius = (parseInt(circle.split(' ')[0].slice(2)) - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    return (
      <div className="flex flex-col items-center gap-2">
        <div className={cn('relative', circle)}>
          <svg className="w-full h-full -rotate-90">
            <circle
              cx="50%"
              cy="50%"
              r={radius}
              fill="none"
              stroke="#e5e7eb"
              strokeWidth={stroke}
            />
            <motion.circle
              cx="50%"
              cy="50%"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className={getColor()}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={cn('font-bold', getColor(), text)}>
              {percentage.toFixed(0)}%
            </span>
          </div>
        </div>
        {showLabel && (
          <span className="text-sm text-gray-600">
            {current.toFixed(1)}/{max} 小时
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm text-gray-600">工时负荷</span>
          <span className={cn('text-sm font-medium', getColor())}>
            {current.toFixed(1)}/{max} 小时 ({percentage.toFixed(0)}%)
          </span>
        </div>
      )}
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={cn('h-full rounded-full', getBgColor())}
        />
      </div>
    </div>
  );
}
