import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  Eye,
  Calculator,
  CheckCircle,
  Calendar,
  User,
  Phone,
  Scissors,
} from 'lucide-react';
import { Tabs, Input, Modal, Form, InputNumber, message, Empty } from 'antd';
import dayjs from 'dayjs';
import type { Order, OrderStatus, Booking } from '@/types';
import {
  getOrders,
  getOrder,
  applyDiscount,
  completeOrder,
} from '@/services/api';
import {
  formatCurrency,
  formatDate,
  formatTime,
  getStatusLabel,
} from '@/utils/format';
import Layout from '@/components/Layout';
import { cn } from '@/lib/utils';

export default function AdminOrdersPage() {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);
  const [discountModal, setDiscountModal] = useState<{
    open: boolean;
    order: Order | null;
  }>({ open: false, order: null });
  const [form] = Form.useForm();
  const navigate = useNavigate();

  useEffect(() => {
    loadOrders();
  }, [activeTab]);

  useEffect(() => {
    filterOrders();
  }, [orders, searchText]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const params: { status?: OrderStatus } = {};
      if (activeTab !== 'all') {
        params.status = activeTab as OrderStatus;
      }
      const data = await getOrders(params);
      setOrders(data);
      setFilteredOrders(data);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    if (!searchText.trim()) {
      setFilteredOrders(orders);
      return;
    }
    const text = searchText.toLowerCase();
    const filtered = orders.filter(
      (o) =>
        o.id.toLowerCase().includes(text) ||
        o.customer?.name.toLowerCase().includes(text) ||
        o.customer?.phone.includes(text)
    );
    setFilteredOrders(filtered);
  };

  const handleApplyDiscount = async (values: { discountAmount: number }) => {
    if (!discountModal.order) return;

    try {
      await applyDiscount(discountModal.order.id, values.discountAmount);
      message.success('减免成功');
      setDiscountModal({ open: false, order: null });
      form.resetFields();
      loadOrders();
    } catch (error) {
      message.error('减免失败');
    }
  };

  const handleCompleteOrder = async (order: Order) => {
    Modal.confirm({
      title: '确认完成订单',
      content: '确定要将此订单标记为已完成吗？',
      onOk: async () => {
        try {
          await completeOrder(order.id);
          message.success('订单已完成');
          loadOrders();
        } catch (error) {
          message.error('操作失败');
        }
      },
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'paid':
        return 'bg-blue-100 text-blue-700';
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'refunded':
        return 'bg-gray-100 text-gray-500';
      default:
        return 'bg-gray-100 text-gray-500';
    }
  };

  const tabItems = [
    { key: 'all', label: '全部' },
    { key: 'pending', label: '待支付' },
    { key: 'paid', label: '已支付' },
    { key: 'completed', label: '已完成' },
    { key: 'refunded', label: '已退款' },
  ];

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            订单管理
          </h1>
          <p className="text-gray-500">管理所有订单</p>
        </motion.div>

        <div className="bg-white rounded-2xl p-4 shadow-md">
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabItems}
            size="large"
          />
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-md">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="搜索订单号、顾客姓名、手机号"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="pl-10"
                size="large"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-32 bg-gray-100 rounded-2xl animate-pulse"
              />
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 shadow-md">
            <Empty description="暂无订单" />
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-2xl p-6 shadow-md"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-800">
                        订单号: {order.id.slice(-12).toUpperCase()}
                      </h3>
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-full text-xs font-medium',
                          getStatusColor(order.status)
                        )}
                      >
                        {getStatusLabel(order.status)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      创建于 {formatDate(order.created_at)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {order.status === 'pending' && (
                      <button
                        onClick={() =>
                          setDiscountModal({ open: true, order })
                        }
                        className="flex items-center gap-1 px-3 py-1.5 text-sm bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors"
                      >
                        <Calculator className="w-4 h-4" />
                        录入减免
                      </button>
                    )}
                    {order.status === 'paid' && (
                      <button
                        onClick={() => handleCompleteOrder(order)}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" />
                        完成订单
                      </button>
                    )}
                    <button
                      onClick={() => navigate(`/orders/${order.booking_id}`)}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm bg-primary/10 text-primary-dark rounded-lg hover:bg-primary/20 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      详情
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User className="w-4 h-4" />
                    <span>{order.customer?.name || '-'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span>{order.customer?.phone || '-'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Scissors className="w-4 h-4" />
                    <span>{order.orderItems.length}项服务</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm text-gray-500">金额: </span>
                    <span className="text-lg font-bold text-primary-dark">
                      {formatCurrency(order.final_amount)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {order.orderItems.map((orderItem) => (
                    <span
                      key={orderItem.id}
                      className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                    >
                      {orderItem.service_name}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <Modal
        title="录入减免金额"
        open={discountModal.open}
        onCancel={() => {
          setDiscountModal({ open: false, order: null });
          form.resetFields();
        }}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleApplyDiscount}>
          <div className="mb-4 p-4 bg-gray-50 rounded-xl">
            <p className="text-sm text-gray-500 mb-1">订单金额</p>
            <p className="text-xl font-bold text-gray-800">
              {formatCurrency(discountModal.order?.original_amount || 0)}
            </p>
          </div>
          <Form.Item
            name="discountAmount"
            label="减免金额"
            rules={[{ required: true, message: '请输入减免金额' }]}
          >
            <InputNumber
              min={0}
              max={discountModal.order?.original_amount || 0}
              step={10}
              style={{ width: '100%' }}
              size="large"
              placeholder="请输入减免金额"
              prefix="¥"
            />
          </Form.Item>
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={() => {
                setDiscountModal({ open: false, order: null });
                form.resetFields();
              }}
              className="flex-1 py-2 px-4 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50"
            >
              取消
            </button>
            <motion.button
              type="submit"
              whileTap={{ scale: 0.98 }}
              className="flex-1 py-2 px-4 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl hover:opacity-90"
            >
              确认减免
            </motion.button>
          </div>
        </Form>
      </Modal>
    </Layout>
  );
}
