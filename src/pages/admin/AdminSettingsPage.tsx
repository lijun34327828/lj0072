import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Settings,
  Clock,
  DollarSign,
  Calendar,
  Save,
} from 'lucide-react';
import { Form, Input, InputNumber, TimePicker, message, Card } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import type { StoreSettings } from '@/types';
import { getSettings, updateSettings } from '@/services/api';
import Layout from '@/components/Layout';

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [form] = Form.useForm();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await getSettings();
      form.setFieldsValue({
        workloadLimit: data.daily_workload_limit,
        maxDiscountRatio: data.max_discount_percent,
        maxDiscountAmount: data.max_discount_amount,
        businessHours: [
          dayjs(data.business_start, 'HH:mm'),
          dayjs(data.business_end, 'HH:mm'),
        ],
      });
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: {
    workloadLimit: number;
    maxDiscountRatio: number;
    maxDiscountAmount: number;
    businessHours: [Dayjs, Dayjs];
  }) => {
    try {
      await updateSettings({
        daily_workload_limit: values.workloadLimit,
        max_discount_percent: values.maxDiscountRatio,
        max_discount_amount: values.maxDiscountAmount,
        business_start: values.businessHours[0].format('HH:mm'),
        business_end: values.businessHours[1].format('HH:mm'),
      });
      message.success('保存成功');
    } catch (error) {
      message.error('保存失败');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto">
          <div className="h-96 bg-gray-100 rounded-2xl animate-pulse" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            门店配置
          </h1>
          <p className="text-gray-500">配置门店基本信息和运营参数</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="rounded-2xl shadow-md">
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              className="space-y-6"
            >
              <div className="flex items-center gap-3 py-4 border-b border-gray-100">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center">
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-800">
                  工时配置
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Form.Item
                  name="workloadLimit"
                  label="每日工时上限（小时）"
                  rules={[{ required: true, message: '请输入工时上限' }]}
                >
                  <InputNumber
                    min={1}
                    max={24}
                    step={0.5}
                    size="large"
                    style={{ width: '100%' }}
                    placeholder="请输入工时上限"
                  />
                </Form.Item>

                <Form.Item
                  name="businessHours"
                  label="营业时间"
                  rules={[{ required: true, message: '请选择营业时间' }]}
                >
                  <TimePicker.RangePicker
                    size="large"
                    style={{ width: '100%' }}
                    format="HH:mm"
                    minuteStep={30}
                  />
                </Form.Item>
              </div>

              <div className="flex items-center gap-3 py-4 border-t border-b border-gray-100">
                <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-800">
                  减免配置
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Form.Item
                  name="maxDiscountRatio"
                  label="最大减免比例（%）"
                  rules={[{ required: true, message: '请输入最大减免比例' }]}
                >
                  <InputNumber
                    min={0}
                    max={100}
                    step={5}
                    size="large"
                    style={{ width: '100%' }}
                    placeholder="请输入最大减免比例"
                    suffix="%"
                  />
                </Form.Item>

                <Form.Item
                  name="maxDiscountAmount"
                  label="最大减免金额（元）"
                  rules={[{ required: true, message: '请输入最大减免金额' }]}
                >
                  <InputNumber
                    min={0}
                    step={50}
                    size="large"
                    style={{ width: '100%' }}
                    placeholder="请输入最大减免金额"
                    prefix="¥"
                  />
                </Form.Item>
              </div>

              <div className="pt-6">
                <motion.button
                  type="submit"
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
                >
                  <Save className="w-5 h-5" />
                  保存配置
                </motion.button>
              </div>
            </Form>
          </Card>
        </motion.div>
      </div>
    </Layout>
  );
}
