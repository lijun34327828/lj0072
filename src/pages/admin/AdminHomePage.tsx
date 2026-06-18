import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  DollarSign,
  Users,
  Clock,
  ShoppingBag,
  Scissors,
  Settings,
  BarChart3,
  TrendingUp,
} from 'lucide-react';
import dayjs from 'dayjs';
import type { Booking, Order, Technician, Service } from '@/types';
import { getBookings, getOrders, getTechnicians, getServices } from '@/services/api';
import { formatCurrency } from '@/utils/format';
import { cn } from '@/lib/utils';
import Layout from '@/components/Layout';

export default function AdminHomePage() {
  const [stats, setStats] = useState({
    todayBookings: 0,
    todayRevenue: 0,
    avgWorkload: 0,
    pendingOrders: 0,
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const today = dayjs().format('YYYY-MM-DD');
      const [bookings, orders, technicians, services] = await Promise.all([
        getBookings({ date: today }),
        getOrders(),
        getTechnicians(),
        getServices(),
      ]);

      const todayBookings = bookings.filter((b) => b.booking_date === today).length;
      const todayOrders = orders.filter(
        (o) => dayjs(o.created_at).format('YYYY-MM-DD') === today
      );
      const todayRevenue = todayOrders.reduce((sum, o) => sum + o.final_amount, 0);

      const activeTechnicians = technicians.filter((t) => t.is_active);

      setStats({
        todayBookings,
        todayRevenue,
        avgWorkload: activeTechnicians.length > 0 ? 65 : 0,
        pendingOrders: orders.filter((o) => o.status === 'pending').length,
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: '今日预约',
      value: stats.todayBookings,
      icon: Calendar,
      color: 'from-primary-light to-primary',
      textColor: 'text-primary-dark',
      suffix: '个',
    },
    {
      title: '今日营收',
      value: formatCurrency(stats.todayRevenue),
      icon: DollarSign,
      color: 'from-green-100 to-green-200',
      textColor: 'text-green-600',
      suffix: '',
    },
    {
      title: '技师负荷',
      value: `${stats.avgWorkload}%`,
      icon: Clock,
      color: 'from-yellow-100 to-yellow-200',
      textColor: 'text-yellow-600',
      suffix: '',
    },
    {
      title: '待处理订单',
      value: stats.pendingOrders,
      icon: ShoppingBag,
      color: 'from-blue-100 to-blue-200',
      textColor: 'text-blue-600',
      suffix: '个',
    },
  ];

  const quickActions = [
    {
      title: '订单管理',
      icon: ShoppingBag,
      path: '/admin/orders',
      color: 'bg-blue-500',
    },
    {
      title: '技师管理',
      icon: Users,
      path: '/admin/technicians',
      color: 'bg-green-500',
    },
    {
      title: '服务管理',
      icon: Scissors,
      path: '/admin/services',
      color: 'bg-purple-500',
    },
    {
      title: '门店配置',
      icon: Settings,
      path: '/admin/settings',
      color: 'bg-orange-500',
    },
  ];

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            管理后台
          </h1>
          <p className="text-gray-500">
            欢迎回来，今日是 {dayjs().format('YYYY年MM月DD日')}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading
            ? statCards.map((_, index) => (
                <div
                  key={index}
                  className="h-32 bg-gray-100 rounded-2xl animate-pulse"
                />
              ))
            : statCards.map((card, index) => (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-2xl p-6 shadow-md"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className={cn(
                        'w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br',
                        card.color
                      )}
                    >
                      <card.icon className="w-6 h-6 text-white" />
                    </div>
                    <TrendingUp className="w-5 h-5 text-green-500" />
                  </div>
                  <p className="text-sm text-gray-500 mb-1">{card.title}</p>
                  <p className={cn('text-2xl font-bold', card.textColor)}>
                    {typeof card.value === 'number'
                      ? card.value.toLocaleString()
                      : card.value}
                    {card.suffix}
                  </p>
                </motion.div>
              ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl p-6 shadow-md"
        >
          <h2 className="text-xl font-semibold text-gray-800 mb-6">
            快捷操作
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <motion.button
                key={action.title}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(action.path)}
                className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div
                  className={cn(
                    'w-14 h-14 rounded-xl flex items-center justify-center',
                    action.color
                  )}
                >
                  <action.icon className="w-7 h-7 text-white" />
                </div>
                <span className="font-medium text-gray-700">
                  {action.title}
                </span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
