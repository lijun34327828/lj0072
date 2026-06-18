import { useState } from 'react';
import { Modal, Form, Input, message } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Scissors,
  User,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  X,
} from 'lucide-react';
import type { Service, Technician, TimeSlot } from '@/types';
import {
  formatCurrency,
  formatDuration,
  formatDate,
  formatTime,
} from '@/utils/format';
import { cn } from '@/lib/utils';
import { createBooking } from '@/services/api';
import { useBookingStore } from '@/store/bookingStore';
import { useUserStore } from '@/store/userStore';
import { useNavigate } from 'react-router-dom';

interface BookingModalProps {
  open: boolean;
  onClose: () => void;
  services: Service[];
  technician: Technician | null;
  date: string;
  timeSlot: TimeSlot | null;
  totalDuration: number;
  estimatedPrice: number;
  workloadWarning?: {
    current: number;
    max: number;
    willExceed: boolean;
    recommendedSlots?: TimeSlot[];
  };
}

export default function BookingModal({
  open,
  onClose,
  services,
  technician,
  date,
  timeSlot,
  totalDuration,
  estimatedPrice,
  workloadWarning,
}: BookingModalProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const clearAll = useBookingStore((state) => state.clearAll);
  const currentUser = useUserStore((state) => state.currentUser);

  const handleSubmit = async (values: {
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    notes?: string;
  }) => {
    if (!technician || !timeSlot || services.length === 0) {
      message.error('请完善预约信息');
      return;
    }

    if (workloadWarning?.willExceed) {
      Modal.confirm({
        title: '工时超限警告',
        content: '该技师当日工时将超过上限，是否继续提交？',
        okText: '继续提交',
        cancelText: '返回修改',
        onOk: async () => {
          await submitBooking(values);
        },
      });
    } else {
      await submitBooking(values);
    }
  };

  const submitBooking = async (values: {
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    notes?: string;
  }) => {
    setLoading(true);
    try {
      await createBooking({
        customer_id: currentUser?.id || '',
        service_ids: services.map((s) => s.id),
        technician_id: technician!.id,
        booking_date: date,
        start_time: timeSlot!.start,
        end_time: timeSlot!.end,
        total_duration: totalDuration,
        customer_name: values.customerName,
        customer_phone: values.customerPhone,
        customer_email: values.customerEmail,
        notes: values.notes,
      });

      message.success('预约成功！');
      clearAll();
      onClose();
      navigate('/orders');
    } catch (error) {
      message.error('预约失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={600}
      destroyOnClose
      closeIcon={<X className="w-5 h-5" />}
    >
      <div className="px-2">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <CheckCircle className="w-7 h-7 text-primary-dark" />
          确认预约信息
        </h2>

        <AnimatePresence>
          {workloadWarning?.willExceed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-red-700">工时超限警告</p>
                  <p className="text-sm text-red-600 mt-1">
                    该技师当日工时将达到{' '}
                    {(workloadWarning.current + totalDuration).toFixed(1)}/
                    {workloadWarning.max} 小时，超过上限
                  </p>
                  {workloadWarning.recommendedSlots &&
                    workloadWarning.recommendedSlots.length > 0 && (
                      <p className="text-sm text-red-600 mt-2">
                        推荐其他时段：
                        {workloadWarning.recommendedSlots
                          .map(
                            (slot) =>
                              `${formatTime(slot.start)}-${formatTime(slot.end)}`
                          )
                          .join('、')}
                      </p>
                    )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-4 mb-6">
          <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
            <Scissors className="w-5 h-5 text-primary-dark mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-gray-500 mb-1">已选服务</p>
              <div className="space-y-1">
                {services.map((service) => (
                  <div
                    key={service.id}
                    className="flex justify-between items-center"
                  >
                    <span className="font-medium text-gray-800">
                      {service.name}
                    </span>
                    <span className="text-primary-dark">
                      {formatCurrency(service.standard_duration * service.hourly_rate)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
              <User className="w-5 h-5 text-primary-dark mt-0.5" />
              <div>
                <p className="text-sm text-gray-500 mb-1">技师</p>
                <p className="font-medium text-gray-800">
                  {technician?.name || '未选择'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
              <Calendar className="w-5 h-5 text-primary-dark mt-0.5" />
              <div>
                <p className="text-sm text-gray-500 mb-1">日期</p>
                <p className="font-medium text-gray-800">
                  {date ? formatDate(date) : '未选择'}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
              <Clock className="w-5 h-5 text-primary-dark mt-0.5" />
              <div>
                <p className="text-sm text-gray-500 mb-1">时段</p>
                <p className="font-medium text-gray-800">
                  {timeSlot
                    ? `${formatTime(timeSlot.start)} - ${formatTime(timeSlot.end)}`
                    : '未选择'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
              <Clock className="w-5 h-5 text-primary-dark mt-0.5" />
              <div>
                <p className="text-sm text-gray-500 mb-1">总工时</p>
                <p className="font-medium text-gray-800">
                  {formatDuration(totalDuration)}
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-gradient-to-r from-primary/20 to-primary-dark/20 rounded-xl">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-800">预估总价</span>
              <span className="text-2xl font-bold text-primary-dark">
                {formatCurrency(estimatedPrice)}
              </span>
            </div>
          </div>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="customerName"
              label="您的姓名"
              rules={[{ required: true, message: '请输入姓名' }]}
            >
              <Input placeholder="请输入姓名" size="large" />
            </Form.Item>
            <Form.Item
              name="customerPhone"
              label="联系电话"
              rules={[
                { required: true, message: '请输入手机号' },
                { pattern: /^1\d{10}$/, message: '请输入正确的手机号' },
              ]}
            >
              <Input placeholder="请输入手机号" size="large" />
            </Form.Item>
          </div>

          <Form.Item name="customerEmail" label="邮箱（选填）">
            <Input placeholder="请输入邮箱" size="large" />
          </Form.Item>

          <Form.Item name="notes" label="备注（选填）">
            <Input.TextArea
              placeholder="有什么特殊需求吗？"
              rows={3}
              size="large"
            />
          </Form.Item>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-6 border-2 border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <motion.button
              type="submit"
              whileTap={{ scale: 0.98 }}
              disabled={loading}
              className={cn(
                'flex-1 py-3 px-6 rounded-xl font-medium text-white transition-all',
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-primary to-primary-dark hover:opacity-90'
              )}
            >
              {loading ? '提交中...' : '确认预约'}
            </motion.button>
          </div>
        </Form>
      </div>
    </Modal>
  );
}
