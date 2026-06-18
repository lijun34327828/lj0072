import { motion } from 'framer-motion';
import { Star, Check, User } from 'lucide-react';
import type { Technician } from '@/types';
import { getCategoryLabel } from '@/utils/format';
import { cn } from '@/lib/utils';
import WorkloadProgress from './WorkloadProgress';

interface TechnicianCardProps {
  technician: Technician;
  selected?: boolean;
  workload?: { current: number; max: number };
  onSelect?: (technician: Technician) => void;
}

export default function TechnicianCard({
  technician,
  selected = false,
  workload,
  onSelect,
}: TechnicianCardProps) {
  return (
    <motion.div
      layout
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      onClick={() => onSelect?.(technician)}
      className={cn(
        'relative p-5 rounded-2xl cursor-pointer transition-all duration-300',
        'bg-white border-2',
        selected
          ? 'border-primary-dark shadow-lg shadow-primary-dark/20'
          : 'border-transparent shadow-md hover:shadow-xl'
      )}
    >
      {selected && (
        <div className="absolute top-3 right-3 w-6 h-6 bg-primary-dark rounded-full flex items-center justify-center">
          <Check className="w-4 h-4 text-white" />
        </div>
      )}

      <div className="flex items-start gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-light to-primary flex items-center justify-center">
            <User className="w-8 h-8 text-primary-dark" />
          </div>
          {technician.is_active && (
            <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold text-gray-800 truncate">
              {technician.name}
            </h3>
            <span className="text-xs text-gray-500">
              工号: {technician.id.slice(-6).toUpperCase()}
            </span>
          </div>

          <div className="flex items-center gap-1 mb-2">
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            <span className="text-sm font-medium text-gray-700">
              {technician.rating.toFixed(1)}
            </span>
          </div>

          <div className="flex flex-wrap gap-1 mb-3">
            {technician.skills.split(',').map((skill) => (
              <span
                key={skill}
                className="px-2 py-0.5 bg-primary/20 text-primary-dark text-xs rounded-full"
              >
                {getCategoryLabel(skill)}
              </span>
            ))}
          </div>
        </div>
      </div>

      {workload && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <WorkloadProgress
            current={workload.current}
            max={workload.max}
            showLabel={true}
            variant="bar"
            size="sm"
          />
        </div>
      )}
    </motion.div>
  );
}
