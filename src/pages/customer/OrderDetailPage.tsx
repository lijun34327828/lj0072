import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button, Steps, message, Modal } from 'antd';
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  FileText,
  Scissors,
  CheckCircle,
  XCircle,
  Clock3,
  XOctagon,
  RefreshCw,
} from 'lucide-react';
import type { Booking, Order } from '@/types';
import { getBooking, getOrders, cancelBooking } from '@/services/api';
import {
  formatCurrency,
  formatDate,
  formatTime,
  getStatusLabel,
} from '@/utils/format';
import Layout from '@/components/Layout';
import RescheduleModal from '@/components/RescheduleModal';
import { cn } from '@/lib/utils';

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReschedule, setShowReschedule] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [bookingData, ordersData] = await Promise.all([
        getBooking(id!),
        getOrders(),
      ]);
      setBooking(bookingData);
      const matchedOrder = ordersData.find((o) => o.booking_id === id);
      if (matchedOrder) {
        setOrder(matchedOrder);
      }
    } catch (error) {
      console.error('Failed to load order detail:', error);
      message.error('加载订单详情失败');
    } finally {
      setLoading(false);
    }
  };

  const canModify = booking && (booking.status === 'pending' || booking.status === 'confirmed');

  const handleCancel = () => {
    if (!booking) return;
    Modal.confirm({
      title: '确认取消预约',
      content: '取消后该时段将被释放，您确定要取消预约吗？',
      okText: '确认取消',
      cancelText: '再想想',
      okButtonProps: { danger: true },
      onOk: async () => {
        setCancelling(true);
        try {
          await cancelBooking(booking.id);
          message.success('预约已取消，工时已回滚');
          loadData();
        } catch (error: any) {
          const errMsg = error?.response?.data?.message || '取消失败，请重试';
          message.error(errMsg);
        } finally {
          setCancelling(false);
        }
      },
    });
  };

  const handleRescheduleSuccess = () => {
    loadData();
  };

  const getStepStatus = () => {
    if (!booking) return 0;
    switch (booking.status) {
      case 'pending':
        return 0;
      case 'confirmed':
        return 1;
      case 'completed':
        return 2;
      case 'cancelled':
        return -1;
      default:
        return 0;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock3 className="w-5 h-5 text-yellow-500" />;
      case 'confirmed':
        return <CheckCircle className="w-5 h-5 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-gray-400" />;
      default:
        return <Clock3 className="w-5 h-5 text-gray-400" />;
    }
  };

  const steps = [
    { title: '提交预约', description: '等待确认' },
    { title: '预约确认', description: '技师已确认' },
    { title: '服务完成', description: '订单完成' },
  ];

  if (loading) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto">
          <div className="h-96 bg-gray-100 rounded-2xl animate-pulse" />
        </div>
      </Layout>
    );
  }

  if (!booking) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto text-center py-12">
          <p className="text-gray-500">订单不存在</p>
          <Button onClick={() => navigate('/orders')}>返回列表</Button>
        </div>
      </Layout>
    );
  }

  const subtotal = booking.bookingServices?.reduce((sum, s) => sum + (s.service.standard_duration * s.service.hourly_rate), 0) || 0;
  const discount = order?.discount_amount || 0;
  const total = order?.final_amount || subtotal;

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-4"
        >
          <button
            onClick={() => navigate('/orders')}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">预约详情</h1>
            <p className="text-sm text-gray-500">
              订单号: {booking.id.slice(-12).toUpperCase()}
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-6 shadow-md"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              {getStatusIcon(booking.status)}
              <div>
                <h2 className="text-lg font-semibold text-gray-800">
                  {getStatusLabel(booking.status)}
                </h2>
                <p className="text-sm text-gray-500">
                  创建于 {formatDate(booking.created_at)}
                </p>
              </div>
            </div>
            {canModify && (
              <div className="flex gap-2">
                <button
                  onClick={() => setShowReschedule(true)}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  改约
                </button>
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className={cn(
                    'flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg transition-colors',
                    cancelling
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-red-50 text-red-700 hover:bg-red-100'
                  )}
                >
                  <XOctagon className="w-4 h-4" />
                  {cancelling ? '取消中...' : '取消预约'}
                </button>
              </div>
            )}
          </div>

          {booking.status !== 'cancelled' && (
            <Steps
              current={getStepStatus()}
              items={steps}
              size="small"
              className="mb-8"
            />
          )}

          <div className="space-y-6">
            <div className="p-4 bg-gray-50 rounded-xl">
              <h3 className="font-medium text-gray-700 mb-4 flex items-center gap-2">
                <Scissors className="w-4 h-4 text-primary-dark" />
                服务项目
              </h3>
              <div className="space-y-3">
                {booking.bookingServices?.map((bookingService) => (
                  <div
                    key={bookingService.service.id}
                    className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0"
                  >
                    <div>
                      <p className="font-medium text-gray-800">
                        {bookingService.service.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {bookingService.service.standard_duration.toFixed(1)} 小时
                      </p>
                    </div>
                    <span className="text-primary-dark font-medium">
                      {formatCurrency(bookingService.service.standard_duration * bookingService.service.hourly_rate)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4 text-primary-dark" />
                  <span className="text-sm text-gray-500">技师</span>
                </div>
                <p className="font-medium text-gray-800">
                  {booking.technician?.name || '未分配'}
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-primary-dark" />
                  <span className="text-sm text-gray-500">日期</span>
                </div>
                <p className="font-medium text-gray-800">
                  {formatDate(booking.booking_date)}
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-primary-dark" />
                  <span className="text-sm text-gray-500">时段</span>
                </div>
                <p className="font-medium text-gray-800">
                  {formatTime(booking.start_time)} -{' '}
                  {formatTime(booking.end_time)}
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-primary-dark" />
                  <span className="text-sm text-gray-500">总时长</span>
                </div>
                <p className="font-medium text-gray-800">
                  {booking.total_duration.toFixed(1)} 小时
                </p>
              </div>
            </div>

            {booking.customer && (
              <div className="p-4 bg-gray-50 rounded-xl">
                <h3 className="font-medium text-gray-700 mb-4 flex items-center gap-2">
                  <User className="w-4 h-4 text-primary-dark" />
                  顾客信息
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">
                      {booking.customer.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">
                      {booking.customer.phone}
                    </span>
                  </div>
                  {booking.customer.email && (
                    <div className="flex items-center gap-2 col-span-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">
                        {booking.customer.email}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {booking.notes && (
              <div className="p-4 bg-gray-50 rounded-xl">
                <h3 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary-dark" />
                  备注
                </h3>
                <p className="text-gray-600">{booking.notes}</p>
              </div>
            )}

            <div className="p-6 bg-gradient-to-r from-primary/10 to-primary-dark/10 rounded-xl">
              <h3 className="font-medium text-gray-700 mb-4">费用明细</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">服务小计</span>
                  <span className="text-gray-800">{formatCurrency(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>优惠减免</span>
                    <span>-{formatCurrency(discount)}</span>
                  </div>
                )}
                <div className="h-px bg-gray-300 my-2" />
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-800">
                    实付金额
                  </span>
                  <span className="text-2xl font-bold text-primary-dark">
                    {formatCurrency(total)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {booking && (
        <RescheduleModal
          open={showReschedule}
          onClose={() => setShowReschedule(false)}
          booking={booking}
          onSuccess={handleRescheduleSuccess}
        />
      )}
    </Layout>
  );
}
