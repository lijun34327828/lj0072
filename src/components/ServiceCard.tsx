import { motion } from 'framer-motion';
import { Check, Clock, Scissors } from 'lucide-react';
import type { Service } from '@/types';
import { formatCurrency, formatDuration, getCategoryLabel } from '@/utils/format';
import { cn } from '@/lib/utils';

interface ServiceCardProps {
  service: Service;
  selected?: boolean;
  onSelect?: (service: Service) => void;
  showBookButton?: boolean;
  onBook?: (service: Service) => void;
}

export default function ServiceCard({
  service,
  selected = false,
  onSelect,
  showBookButton = false,
  onBook,
}: ServiceCardProps) {
  const handleClick = () => {
    onSelect?.(service);
  };

  const handleBook = (e: React.MouseEvent) => {
    e.stopPropagation();
    onBook?.(service);
  };

  return (
    <motion.div
      layout
      whileHover={{ scale: 1.02, y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      onClick={handleClick}
      className={cn(
        'relative overflow-hidden rounded-2xl cursor-pointer transition-all duration-300',
        'bg-white border-2',
        selected
          ? 'border-primary-dark shadow-lg shadow-primary-dark/20'
          : 'border-transparent shadow-md hover:shadow-xl'
      )}
    >
      {selected && (
        <div className="absolute top-3 right-3 z-10 w-6 h-6 bg-primary-dark rounded-full flex items-center justify-center">
          <Check className="w-4 h-4 text-white" />
        </div>
      )}

      <div className="relative h-40 overflow-hidden">
        <img
          src={
            service.image_url ||
            `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(
              `elegant ${service.category} beauty service, professional nail salon, soft lighting, rose pink and purple theme`
            )}&image_size=square`
          }
          alt={service.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute bottom-3 left-3">
          <span className="px-3 py-1 bg-primary/90 text-primary-dark text-xs font-medium rounded-full">
            {getCategoryLabel(service.category)}
          </span>
        </div>
      </div>

      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">{service.name}</h3>
        <p className="text-sm text-gray-500 mb-3 line-clamp-2">{service.description || ''}</p>

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1 text-primary-dark">
            <Scissors className="w-4 h-4" />
            <span className="text-xl font-bold">{formatCurrency(service.standard_duration * service.hourly_rate)}</span>
          </div>
          <div className="flex items-center gap-1 text-gray-600">
            <Clock className="w-4 h-4" />
            <span className="text-sm">{formatDuration(service.standard_duration)}</span>
          </div>
        </div>

        {showBookButton && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleBook}
            className="w-full py-2 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
          >
            立即预约
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
