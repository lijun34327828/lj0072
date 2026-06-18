import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Tabs, Empty } from 'antd';
import { Calendar, Clock, User, Scissors, ChevronRight } from 'lucide-react';
import type { Booking, BookingStatus } from '@/types';
import { getBookings } from '@/services/api';
import { useUserStore } from '@/store/userStore';
import {
  formatCurrency,
  formatDate,
  formatTime,
  getStatusLabel,
} from '@/utils/format';
import Layout from '@/components/Layout';
import { cn } from '@/lib/utils';

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { currentUser } = useUserStore();

  useEffect(() => {
    loadBookings();
  }, [activeTab, currentUser]);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const params: { customerId?: string; status?: BookingStatus } = {};
      if (currentUser?.id) {
        params.customerId = currentUser.id;
      }
      if (activeTab !== 'all') {
        params.status = activeTab as BookingStatus;
      }
      const data = await getBookings(params);
      setBookings(data);
    } catch (error) {
      console.error('Failed to load bookings:', error);
      setBookings([]);
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

  const tabItems = [
    { key: 'all', label: '全部' },
    { key: 'pending', label: '待确认' },
    { key: 'confirmed', label: '待服务' },
    { key: 'completed', label: '已完成' },
    { key: 'cancelled', label: '已取消' },
  ];

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-gray-800 mb-2">我的预约</h1>
          <p className="text-gray-500">查看和管理您的预约记录</p>
        </motion.div>

        <div className="bg-white rounded-2xl p-4 shadow-md">
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabItems}
            size="large"
          />
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-40 bg-gray-100 rounded-2xl animate-pulse"
              />
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 shadow-md">
            <Empty description="暂无预约记录" />
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {bookings.map((booking, index) => (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.01 }}
                onClick={() => navigate(`/orders/${booking.id}`)}
                className="bg-white rounded-2xl p-6 shadow-md cursor-pointer transition-all hover:shadow-lg"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-light to-primary rounded-xl flex items-center justify-center">
                      <Scissors className="w-6 h-6 text-primary-dark" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">
                        {booking.bookingServices?.[0]?.service.name || '美甲服务'}
                        {booking.bookingServices && booking.bookingServices.length > 1 && (
                          <span className="text-sm text-gray-500 ml-2">
                            等{booking.bookingServices.length}项
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-gray-500">
                        订单号: {booking.id.slice(-8).toUpperCase()}
                      </p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      'px-3 py-1 rounded-full text-sm font-medium',
                      getStatusColor(booking.status)
                    )}
                  >
                    {getStatusLabel(booking.status)}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">{formatDate(booking.booking_date)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">
                      {formatTime(booking.start_time)} -{' '}
                      {formatTime(booking.end_time)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <User className="w-4 h-4" />
                    <span className="text-sm">
                      {booking.technician?.name || '未分配'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-primary-dark font-semibold">
                    <Scissors className="w-4 h-4" />
                    <span className="text-sm">
                      {booking.total_duration.toFixed(1)}小时
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div>
                    <span className="text-sm text-gray-500">预估金额 </span>
                    <span className="text-xl font-bold text-primary-dark">
                      {formatCurrency(
                        booking.bookingServices?.reduce(
                          (sum, s) => sum + (s.service.standard_duration * s.service.hourly_rate),
                          0
                        ) || 0
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-primary-dark">
                    <span className="text-sm">查看详情</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </Layout>
  );
}
