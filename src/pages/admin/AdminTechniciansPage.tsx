import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  User,
  Star,
  ToggleLeft,
  ToggleRight,
  Clock,
} from 'lucide-react';
import { Modal, Form, Input, Select, Switch, InputNumber, message, Empty } from 'antd';
import type { Technician, ServiceCategory } from '@/types';
import { getTechnicians } from '@/services/api';
import { getCategoryLabel } from '@/utils/format';
import Layout from '@/components/Layout';
import WorkloadProgress from '@/components/WorkloadProgress';
import { cn } from '@/lib/utils';

export default function AdminTechniciansPage() {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTech, setEditingTech] = useState<Technician | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadTechnicians();
  }, []);

  const loadTechnicians = async () => {
    setLoading(true);
    try {
      const data = await getTechnicians();
      setTechnicians(data);
    } catch (error) {
      console.error('Failed to load technicians:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingTech(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleEdit = (tech: Technician) => {
    setEditingTech(tech);
    form.setFieldsValue({
      name: tech.name,
      specialties: tech.skills.split(','),
      rating: tech.rating,
      isActive: tech.is_active,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (values: {
    name: string;
    specialties: ServiceCategory[];
    rating: number;
    isActive: boolean;
  }) => {
    try {
      message.success(editingTech ? '更新成功' : '创建成功');
      setModalOpen(false);
      loadTechnicians();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleToggleStatus = (tech: Technician) => {
    Modal.confirm({
      title: tech.is_active ? '禁用技师' : '启用技师',
      content: `确定要${tech.is_active ? '禁用' : '启用'}技师 ${tech.name} 吗？`,
      onOk: async () => {
        message.success('状态已更新');
        loadTechnicians();
      },
    });
  };

  const handleDelete = (tech: Technician) => {
    Modal.confirm({
      title: '删除技师',
      content: `确定要删除技师 ${tech.name} 吗？`,
      okText: '删除',
      okButtonProps: { danger: true },
      onOk: async () => {
        message.success('删除成功');
        loadTechnicians();
      },
    });
  };

  const categoryOptions = [
    { value: 'nail', label: '美甲' },
    { value: 'eyelash', label: '美睫' },
    { value: 'care', label: '护理' },
  ];

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
              技师管理
            </h1>
            <p className="text-gray-500">管理门店技师信息</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleAdd}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl hover:opacity-90"
          >
            <Plus className="w-5 h-5" />
            新增技师
          </motion.button>
        </motion.div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-24 bg-gray-100 rounded-2xl animate-pulse"
              />
            ))}
          </div>
        ) : technicians.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 shadow-md">
            <Empty description="暂无技师" />
          </div>
        ) : (
          <div className="space-y-4">
            {technicians.map((tech, index) => (
              <motion.div
                key={tech.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-2xl p-6 shadow-md"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-light to-primary flex items-center justify-center">
                      <User className="w-8 h-8 text-primary-dark" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-800">
                          {tech.name}
                        </h3>
                        <span className="text-xs text-gray-400">
                          工号: {tech.id.slice(-6).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="text-sm text-gray-600">
                          {tech.rating.toFixed(1)}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {tech.skills.split(',').map((s) => (
                          <span
                            key={s}
                            className="px-2 py-0.5 bg-primary/10 text-primary-dark text-xs rounded-full"
                          >
                            {getCategoryLabel(s)}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="hidden sm:block w-48">
                      <WorkloadProgress
                        current={4.5}
                        max={8}
                        showLabel={false}
                        variant="bar"
                        size="sm"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleStatus(tech)}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        {tech.is_active ? (
                          <ToggleRight className="w-6 h-6 text-green-500" />
                        ) : (
                          <ToggleLeft className="w-6 h-6 text-gray-400" />
                        )}
                      </button>
                      <button
                        onClick={() => handleEdit(tech)}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <Edit2 className="w-5 h-5 text-gray-600" />
                      </button>
                      <button
                        onClick={() => handleDelete(tech)}
                        className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-5 h-5 text-red-500" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <Modal
        title={editingTech ? '编辑技师' : '新增技师'}
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
            label="姓名"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input size="large" placeholder="请输入技师姓名" />
          </Form.Item>

          <Form.Item
            name="specialties"
            label="技能标签"
            rules={[{ required: true, message: '请选择技能标签' }]}
          >
            <Select
              mode="multiple"
              size="large"
              placeholder="请选择技能标签"
              options={categoryOptions}
            />
          </Form.Item>

          <Form.Item
            name="rating"
            label="评分"
            rules={[{ required: true, message: '请输入评分' }]}
          >
            <InputNumber
              min={0}
              max={5}
              step={0.1}
              size="large"
              style={{ width: '100%' }}
              placeholder="请输入评分"
            />
          </Form.Item>

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
              {editingTech ? '保存' : '创建'}
            </motion.button>
          </div>
        </Form>
      </Modal>
    </Layout>
  );
}
