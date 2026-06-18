import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, User, Scissors, ChevronLeft, ChevronRight } from 'lucide-react';
import { Calendar as AntCalendar, Badge, Empty } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import type { Booking } from '@/types';
import { getBookings } from '@/services/api';
import { useUserStore } from '@/store/userStore';
import { formatTime, formatDate, getStatusLabel } from '@/utils/format';
import Layout from '@/components/Layout';
import { cn } from '@/lib/utils';

export default function SchedulePage() {
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedDateBookings, setSelectedDateBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { currentUser } = useUserStore();

  useEffect(() => {
    loadBookings();
  }, [currentUser, selectedDate]);

  const loadBookings = async () => {
    if (!currentUser?.id) return;

    setLoading(true);
    try {
      const startOfMonth = selectedDate.startOf('month').format('YYYY-MM-DD');
      const endOfMonth = selectedDate.endOf('month').format('YYYY-MM-DD');

      const allBookings: Booking[] = [];
      let currentDate = dayjs(startOfMonth);
      while (currentDate.isBefore(endOfMonth) || currentDate.isSame(endOfMonth, 'day')) {
        const dateStr = currentDate.format('YYYY-MM-DD');
        const dateBookings = await getBookings({
          technicianId: currentUser.id,
          date: dateStr,
        });
        allBookings.push(...dateBookings);
        currentDate = currentDate.add(1, 'day');
      }

      setBookings(allBookings);

      const selectedStr = selectedDate.format('YYYY-MM-DD');
      const dayBookings = allBookings.filter(
        (b) => b.booking_date === selectedStr
      );
      setSelectedDateBookings(dayBookings);
    } catch (error) {
      console.error('Failed to load schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDateBookingsCount = (date: Dayjs) => {
    const dateStr = date.format('YYYY-MM-DD');
    return bookings.filter((b) => b.booking_date === dateStr).length;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'confirmed':
        return 'bg-blue-100 text-blue-700';
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'cancelled':
        return 'bg-gray-100 text-gray-500';
      default:
        return 'bg-gray-100 text-gray-500';
    }
  };

  const dateCellRender = (value: Dayjs) => {
    const count = getDateBookingsCount(value);
    const isToday = value.isSame(dayjs(), 'day');
    const isSelected = value.isSame(selectedDate, 'day');

    return (
      <div
      className={cn(
        'w-full h-full flex flex-col items-center justify-center p-1',
        isToday && 'bg-primary/10 rounded-lg',
        isSelected && 'ring-2 ring-primary-dark rounded-lg'
      )}
      >
        <span className={cn(isToday ? 'text-primary-dark font-bold' : '')}>
          {value.date()}
        </span>
        {count > 0 && (
          <div className="flex gap-0.5 mt-1">
            {Array.from({ length: Math.min(count, 3) }).map((_, i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 bg-primary-dark rounded-full"
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  const handlePrevMonth = () => {
    setSelectedDate(selectedDate.subtract(1, 'month'));
  };

  const handleNextMonth = () => {
    setSelectedDate(selectedDate.add(1, 'month'));
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              排班表
            </h1>
            <p className="text-gray-500">查看您的工作安排</p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-6 shadow-md"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                {selectedDate.format('YYYY年MM月')}
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevMonth}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                <button
                  onClick={handleNextMonth}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
            <AntCalendar
              value={selectedDate}
              onChange={setSelectedDate}
              dateCellRender={dateCellRender}
              fullscreen={false}
              className="custom-calendar"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-6 shadow-md"
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              {formatDate(selectedDate.format('YYYY-MM-DD'))}
            </h2>

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-24 bg-gray-100 rounded-xl animate-pulse"
                />
              ))}
              </div>
            ) : selectedDateBookings.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center">
                <Empty description="当日暂无预约" />
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                <AnimatePresence mode="popLayout">
                  {selectedDateBookings.map((booking, index) => (
                <motion.div
                  key={booking.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 bg-gray-50 rounded-xl"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-primary-dark" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800">
                          {booking.customer?.name || '顾客'}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {booking.bookingServices?.map((s) => s.service.name).join('、')}
                        </p>
                      </div>
                    </div>
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded-full text-xs font-medium',
                        getStatusColor(booking.status)
                      )}
                    >
                      {getStatusLabel(booking.status)}
                    </span>
                  </div>
                  <div className="flex items-center gap-6 text-sm text-gray-600 mt-3 pt-3 border-t border-gray-200">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>
                        {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Scissors className="w-4 h-4" />
                      <span>{booking.total_duration.toFixed(1)}小时</span>
                    </div>
                  </div>
                </motion.div>
              ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
