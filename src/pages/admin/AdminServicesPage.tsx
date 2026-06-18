import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Edit2,
  Trash2,
  Scissors,
  Clock,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { Modal, Form, Input, Select, InputNumber, Switch, message, Empty } from 'antd';
import type { Service, ServiceCategory } from '@/types';
import { getServices } from '@/services/api';
import {
  formatCurrency,
  formatDuration,
  getCategoryLabel,
} from '@/utils/format';
import Layout from '@/components/Layout';
import { cn } from '@/lib/utils';

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    setLoading(true);
    try {
      const data = await getServices();
      setServices(data);
    } catch (error) {
      console.error('Failed to load services:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingService(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    form.setFieldsValue({
      name: service.name,
      category: service.category,
      description: service.description || '',
      price: service.standard_duration * service.hourly_rate,
      duration: service.standard_duration,
      isActive: service.is_active,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (values: {
    name: string;
    category: ServiceCategory;
    description: string;
    price: number;
    duration: number;
    isActive: boolean;
  }) => {
    try {
      message.success(editingService ? '更新成功' : '创建成功');
      setModalOpen(false);
      loadServices();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleToggleStatus = (service: Service) => {
    Modal.confirm({
      title: service.is_active ? '下架服务' : '上架服务',
      content: `确定要${service.is_active ? '下架' : '上架'}服务 ${service.name} 吗？`,
      onOk: async () => {
        message.success('状态已更新');
        loadServices();
      },
    });
  };

  const handleDelete = (service: Service) => {
    Modal.confirm({
      title: '删除服务',
      content: `确定要删除服务 ${service.name} 吗？`,
      okText: '删除',
      okButtonProps: { danger: true },
      onOk: async () => {
        message.success('删除成功');
        loadServices();
      },
    });
  };

  const categoryOptions = [
    { value: 'nail', label: '美甲' },
    { value: 'eyelash', label: '美睫' },
    { value: 'care', label: '护理' },
  ];

  const getCategoryBg = (category: string) => {
    switch (category) {
      case 'nail':
        return 'bg-pink-100 text-pink-700';
      case 'eyelash':
        return 'bg-purple-100 text-purple-700';
      case 'care':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              服务管理
            </h1>
            <p className="text-gray-500">管理门店服务项目</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleAdd}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl hover:opacity-90"
          >
            <Plus className="w-5 h-5" />
            新增服务
          </motion.button>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-48 bg-gray-100 rounded-2xl animate-pulse"
              />
            ))}
          </div>
        ) : services.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 shadow-md">
            <Empty description="暂无服务" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, index) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-2xl overflow-hidden shadow-md"
              >
                <div className="relative h-32 overflow-hidden">
                  <img
                    src={
                      service.image_url ||
                      `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(
                        `${service.category} beauty service`
                      )}&image_size=square`
                    }
                    alt={service.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3">
                    <span
                      className={cn(
                        'px-3 py-1 rounded-full text-xs font-medium',
                        getCategoryBg(service.category)
                      )}
                    >
                      {getCategoryLabel(service.category)}
                    </span>
                  </div>
                  {!service.is_active && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="px-3 py-1 bg-gray-800 text-white rounded-full text-sm font-medium">
                        已下架
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-800">
                      {service.name}
                    </h3>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleToggleStatus(service)}
                        className="p-1 rounded hover:bg-gray-100"
                      >
                        {service.is_active ? (
                          <ToggleRight className="w-5 h-5 text-green-500" />
                        ) : (
                          <ToggleLeft className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                      <button
                        onClick={() => handleEdit(service)}
                        className="p-1 rounded hover:bg-gray-100"
                      >
                        <Edit2 className="w-4 h-4 text-gray-600" />
                      </button>
                      <button
                        onClick={() => handleDelete(service)}
                        className="p-1 rounded hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>

                  <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                    {service.description || '暂无描述'}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-primary-dark">
                      <Scissors className="w-4 h-4" />
                      <span className="text-lg font-bold">
                        {formatCurrency(service.standard_duration * service.hourly_rate)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-500">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">
                        {formatDuration(service.standard_duration)}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <Modal
        title={editingService ? '编辑服务' : '新增服务'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        destroyOnClose
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="space-y-4"
        >
          <Form.Item
            name="name"
            label="服务名称"
            rules={[{ required: true, message: '请输入服务名称' }]}
          >
            <Input size="large" placeholder="请输入服务名称" />
          </Form.Item>

          <Form.Item
            name="category"
            label="服务分类"
            rules={[{ required: true, message: '请选择服务分类' }]}
          >
            <Select
              size="large"
              placeholder="请选择服务分类"
              options={categoryOptions}
            />
          </Form.Item>

          <Form.Item
            name="description"
            label="服务描述"
            rules={[{ required: true, message: '请输入服务描述' }]}
          >
            <Input.TextArea
              size="large"
              rows={3}
              placeholder="请输入服务描述"
            />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="price"
              label="价格（元）"
              rules={[{ required: true, message: '请输入价格' }]}
            >
              <InputNumber
                min={0}
                step={10}
                size="large"
                style={{ width: '100%' }}
                placeholder="请输入价格"
                prefix="¥"
              />
            </Form.Item>

            <Form.Item
              name="duration"
              label="时长（小时）"
              rules={[{ required: true, message: '请输入时长' }]}
            >
              <InputNumber
                min={0}
                step={0.5}
                size="large"
                style={{ width: '100%' }}
                placeholder="请输入时长"
              />
            </Form.Item>
          </div>

          <Form.Item
            name="isActive"
            label="状态"
            valuePropName="checked"
          >
            <Switch defaultChecked />
          </Form.Item>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="flex-1 py-3 px-4 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50"
            >
              取消
            </button>
            <motion.button
              type="submit"
              whileTap={{ scale: 0.98 }}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl hover:opacity-90"
            >
              {editingService ? '保存' : '创建'}
            </motion.button>
          </div>
        </Form>
      </Modal>
    </Layout>
  );
}
