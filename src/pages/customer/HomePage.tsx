import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Scissors, ArrowRight, Clock, ShoppingBag } from 'lucide-react';
import { Tabs } from 'antd';
import type { Service, ServiceCategory } from '@/types';
import { getServices } from '@/services/api';
import { useBookingStore } from '@/store/bookingStore';
import { formatCurrency, formatDuration } from '@/utils/format';
import ServiceCard from '@/components/ServiceCard';
import Layout from '@/components/Layout';

export default function HomePage() {
  const [activeCategory, setActiveCategory] = useState<ServiceCategory | 'all'>('all');
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const {
    selectedServices,
    totalDuration,
    estimatedPrice,
    addService,
    removeService,
  } = useBookingStore();

  useEffect(() => {
    loadServices();
  }, [activeCategory]);

  const loadServices = async () => {
    setLoading(true);
    try {
      const data = await getServices(
        activeCategory === 'all' ? undefined : activeCategory
      );
      setServices(data);
    } catch (error) {
      console.error('Failed to load services:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectService = (service: Service) => {
    const isSelected = selectedServices.some((s) => s.id === service.id);
    if (isSelected) {
      removeService(service.id);
    } else {
      addService(service);
    }
  };

  const handleBook = (service: Service) => {
    if (!selectedServices.some((s) => s.id === service.id)) {
      addService(service);
    }
    navigate('/booking');
  };

  const handleNextStep = () => {
    navigate('/booking');
  };

  const tabItems = [
    { key: 'all', label: '全部' },
    { key: 'manicure', label: '美甲' },
    { key: 'eyelash', label: '美睫' },
    { key: 'care', label: '护理' },
  ];

  const filteredServices =
    activeCategory === 'all'
      ? services
      : services.filter((s) => s.category === activeCategory);

  return (
    <Layout>
      <div className="space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl h-64 md:h-80"
        >
          <img
            src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=elegant%20nail%20salon%20banner%2C%20rose%20pink%20and%20purple%20theme%2C%20beautiful%20manicure%20art%2C%20luxury%20beauty%20salon%20interior%2C%20soft%20lighting&image_size=landscape_16_9"
            alt="优雅美甲"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary-dark/70 to-primary/50" />
          <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-12">
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="text-3xl md:text-5xl font-bold text-white mb-2"
            >
              优雅美甲
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="text-white/90 text-lg md:text-xl max-w-md"
            >
              专业美甲美睫服务，让您的指尖绽放光彩
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex gap-4 mt-6"
            >
              <div className="flex items-center gap-2 text-white/90">
                <Scissors className="w-5 h-5" />
                <span>专业技师</span>
              </div>
              <div className="flex items-center gap-2 text-white/90">
                <Clock className="w-5 h-5" />
                <span>灵活预约</span>
              </div>
            </motion.div>
          </div>
        </motion.div>

        <div className="bg-white rounded-2xl p-4 shadow-md">
          <Tabs
            activeKey={activeCategory}
            onChange={(key) =>
              setActiveCategory(key as ServiceCategory | 'all')
            }
            items={tabItems}
            centered
            size="large"
            className="category-tabs"
          />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-72 bg-gray-100 rounded-2xl animate-pulse"
              />
            ))}
          </div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence mode="popLayout">
              {filteredServices.map((service, index) => (
                <motion.div
                  key={service.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <ServiceCard
                    service={service}
                    selected={selectedServices.some((s) => s.id === service.id)}
                    onSelect={handleSelectService}
                    showBookButton={true}
                    onBook={handleBook}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        <AnimatePresence>
          {selectedServices.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-2xl z-40 p-4"
            >
              <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                      <ShoppingBag className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">已选服务</p>
                      <p className="font-semibold text-gray-800">
                        {selectedServices.length} 项
                      </p>
                    </div>
                  </div>

                  <div className="hidden sm:block">
                    <p className="text-sm text-gray-500">总工时</p>
                    <p className="font-semibold text-gray-800">
                      {formatDuration(totalDuration)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">预估价格</p>
                    <p className="font-bold text-xl text-primary-dark">
                      {formatCurrency(estimatedPrice)}
                    </p>
                  </div>
                </div>

                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleNextStep}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
                >
                  下一步
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}
