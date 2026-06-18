import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatTime } from '@/utils/format';
import type { TimeSlot } from '@/types';

interface TimeSlotPickerProps {
  slots: TimeSlot[];
  duration: number;
  selectedSlot: TimeSlot | null;
  onSelect: (slot: TimeSlot) => void;
  businessHours?: { start: string; end: string };
}

export default function TimeSlotPicker({
  slots,
  duration,
  selectedSlot,
  onSelect,
  businessHours = { start: '09:00', end: '21:00' },
}: TimeSlotPickerProps) {
  const [hoveredSlot, setHoveredSlot] = useState<string | null>(null);

  const generateAllSlots = useMemo(() => {
    const allSlots: { time: string; label: string }[] = [];
    const [startHour, startMin] = businessHours.start.split(':').map(Number);
    const [endHour, endMin] = businessHours.end.split(':').map(Number);

    let currentHour = startHour;
    let currentMin = startMin;

    while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
      const time = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;
      allSlots.push({
        time,
        label: formatTime(time),
      });
      currentMin += 30;
      if (currentMin >= 60) {
        currentHour += 1;
        currentMin = 0;
      }
    }

    return allSlots;
  }, [businessHours]);

  const getSlotStatus = (time: string) => {
    const slot = slots.find((s) => s.start === time);
    if (!slot) return 'busy';
    if (selectedSlot?.start === time) return 'selected';
    if (hoveredSlot) {
      const hoveredIndex = generateAllSlots.findIndex((s) => s.time === hoveredSlot);
      const currentIndex = generateAllSlots.findIndex((s) => s.time === time);
      const slotsNeeded = Math.ceil(duration * 2);
      if (
        currentIndex >= hoveredIndex &&
        currentIndex < hoveredIndex + slotsNeeded &&
        isConsecutiveAvailable(hoveredSlot, duration)
      ) {
        return 'hovered';
      }
    }
    return slot.available ? 'available' : 'busy';
  };

  const isConsecutiveAvailable = (startTime: string, dur: number) => {
    const startIndex = generateAllSlots.findIndex((s) => s.time === startTime);
    const slotsNeeded = Math.ceil(dur * 2);

    for (let i = startIndex; i < startIndex + slotsNeeded; i++) {
      if (i >= generateAllSlots.length) return false;
      const slot = slots.find((s) => s.start === generateAllSlots[i].time);
      if (!slot || !slot.available) return false;
    }
    return true;
  };

  const handleSlotClick = (time: string) => {
    if (!isConsecutiveAvailable(time, duration)) return;

    const endTime = calculateEndTime(time, duration);
    onSelect({
      start: time,
      end: endTime,
      available: true,
    });
  };

  const calculateEndTime = (start: string, dur: number) => {
    const [hour, min] = start.split(':').map(Number);
    const totalMin = hour * 60 + min + dur * 60;
    const endHour = Math.floor(totalMin / 60);
    const endMin = totalMin % 60;
    return `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'selected':
        return 'bg-primary-dark text-white border-primary-dark shadow-lg shadow-primary-dark/30';
      case 'hovered':
        return 'bg-primary-light text-primary-dark border-primary';
      case 'available':
        return 'bg-green-50 text-green-700 border-green-300 hover:bg-green-100 cursor-pointer';
      case 'busy':
        return 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
        <Clock className="w-4 h-4" />
        <span>所需时长：{duration} 小时</span>
        {duration > 0 && (
          <span className="text-primary-dark">
            (自动选择连续 {Math.ceil(duration * 2)} 个时段)
          </span>
        )}
      </div>

      {slots.length === 0 && (
        <div className="flex items-center gap-2 p-4 bg-yellow-50 rounded-xl text-yellow-700">
          <AlertCircle className="w-5 h-5" />
          <span>请先选择技师和日期以查看可用时段</span>
        </div>
      )}

      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
        {generateAllSlots.map((slot, index) => {
          const status = getSlotStatus(slot.time);
          const isDisabled = status === 'busy';

          return (
            <motion.button
              key={slot.time}
              whileHover={!isDisabled ? { scale: 1.05 } : {}}
              whileTap={!isDisabled ? { scale: 0.95 } : {}}
              onClick={() => !isDisabled && handleSlotClick(slot.time)}
              onMouseEnter={() => !isDisabled && setHoveredSlot(slot.time)}
              onMouseLeave={() => setHoveredSlot(null)}
              disabled={isDisabled}
              className={cn(
                'py-2 px-1 text-xs font-medium rounded-lg border-2 transition-all duration-200',
                getStatusStyles(status)
              )}
            >
              {slot.label}
            </motion.button>
          );
        })}
      </div>

      <div className="flex items-center gap-6 mt-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-50 border-2 border-green-300" />
          <span className="text-gray-600">可预约</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gray-100 border-2 border-gray-200" />
          <span className="text-gray-600">已预约</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-primary-dark border-2 border-primary-dark" />
          <span className="text-gray-600">已选择</span>
        </div>
      </div>
    </div>
  );
}
