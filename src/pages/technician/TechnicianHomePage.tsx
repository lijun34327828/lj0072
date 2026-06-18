import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, User, CalendarDays, History, Scissors } from 'lucide-react';
import dayjs from 'dayjs';
import type { Booking, WorkloadCheckResult } from '@/types';
import { getBookings, getTechnicianWorkload } from '@/services/api';
import { useUserStore } from '@/store/userStore';
import { formatTime, formatDate, getStatusLabel } from '@/utils/format';
import Layout from '@/components/Layout';
import WorkloadProgress from '@/components/WorkloadProgress';
import { cn } from '@/lib/utils';

export default function TechnicianHomePage() {
  const [todayBookings, setTodayBookings] = useState<Booking[]>([]);
  const [workload, setWorkload] = useState<WorkloadCheckResult | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { currentUser } = useUserStore();

  useEffect(() => {
    loadTodayData();
  }, [currentUser]);

  const loadTodayData = async () => {
    if (!currentUser?.id) return;

    setLoading(true);
    try {
      const today = dayjs().format('YYYY-MM-DD');
      const [bookingsData, workloadData] = await Promise.all([
        getBookings({
          technicianId: currentUser?.id,
          date: today,
        }),
        getTechnicianWorkload(currentUser?.id || '', today),
      ]);
      setTodayBookings(bookingsData);
      setWorkload(workloadData);
    } catch (error) {
      console.error('Failed to load technician data:', error);
    } finally {
      setLoading(false);
    }
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

  const upcomingBookings = todayBookings.filter(
    (b) => b.status !== 'cancelled' && b.status !== 'completed'
  );

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          技师工作台
        </h1>
        <p className="text-gray-500">
          {formatDate(dayjs().format('YYYY-MM-DD'))}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl p-6 shadow-md"
      >
        <h2 className="text-xl font-semibold text-gray-800 mb-6">
          今日工时统计
        </h2>
        {workload && (
          <div className="flex flex-col sm:flex-row items-center gap-8">
            <WorkloadProgress
              current={workload.current_workload}
              max={workload.max_workload}
              showLabel={true}
              variant="circle"
              size="lg"
            />
            <div className="flex-1 grid grid-cols-3 gap-4">
              <div className="p-4 bg-primary/10 rounded-xl text-center">
                <p className="text-3xl font-bold text-primary-dark">
                  {todayBookings.length}
                </p>
                <p className="text-sm text-gray-500">今日预约</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-xl text-center">
                <p className="text-3xl font-bold text-blue-600">
                  {upcomingBookings.length}
                </p>
                <p className="text-sm text-gray-500">待服务</p>
              </div>
              <div className="p-4 bg-green-50 rounded-xl text-center">
                <p className="text-3xl font-bold text-green-600">
                  {todayBookings.filter((b) => b.status === 'completed').length}
                </p>
                <p className="text-sm text-gray-500">已完成</p>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/technician/schedule')}
          className="bg-white rounded-2xl p-6 shadow-md text-left"
        >
          <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-light to-primary rounded-xl flex items-center justify-center">
            <CalendarDays className="w-6 h-6 text-primary-dark" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">查看排班</h3>
            <p className="text-sm text-gray-500">查看近期排班表</p>
          </div>
        </div>
        </motion.button>

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/technician/schedule')}
          className="bg-white rounded-2xl p-6 shadow-md text-left"
        >
          <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center">
            <History className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">历史记录</h3>
            <p className="text-sm text-gray-500">查看历史服务记录</p>
          </div>
        </div>
        </motion.button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-2xl p-6 shadow-md"
      >
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          今日待服务
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
        ) : upcomingBookings.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
          今日暂无待服务预约
          </div>
        ) : (
          <div className="space-y-4">
            {upcomingBookings.map((booking, index) => (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
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
                      'px-3 py-1 rounded-full text-xs font-medium',
                      getStatusColor(booking.status)
                    )}
                  >
                    {getStatusLabel(booking.status)}
                  </span>
                </div>
                <div className="flex items-center gap-6 text-sm text-gray-600">
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
          </div>
        )}
      </motion.div>
    </div>
    </Layout>
  );
}
