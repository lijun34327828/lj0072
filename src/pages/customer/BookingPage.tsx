import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Calendar, Check, ChevronRight } from 'lucide-react';
import { Steps, Calendar as AntCalendar, message } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import type {
  Service,
  Technician,
  TimeSlot,
  WorkloadCheckResult,
} from '@/types';
import {
  getTechnicians,
  getTechnicianWorkload,
  getAvailableSlots,
} from '@/services/api';
import { useBookingStore } from '@/store/bookingStore';
import {
  formatCurrency,
  formatDuration,
  formatDate,
  formatTime,
} from '@/utils/format';
import Layout from '@/components/Layout';
import TechnicianCard from '@/components/TechnicianCard';
import TimeSlotPicker from '@/components/TimeSlotPicker';
import BookingModal from '@/components/BookingModal';
import { cn } from '@/lib/utils';

export default function BookingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [workloads, setWorkloads] = useState<Record<string, WorkloadCheckResult>>({});
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const {
    selectedServices,
    selectedTechnician,
    selectedDate,
    selectedTimeSlot,
    totalDuration,
    estimatedPrice,
    setTechnician,
    setDate,
    setTimeSlot,
  } = useBookingStore();

  useEffect(() => {
    if (selectedServices.length === 0) {
      message.warning('请先选择服务项目');
      navigate('/');
      return;
    }
    loadTechnicians();
  }, [selectedServices.length]);

  useEffect(() => {
    if (selectedTechnician && selectedDate) {
      loadAvailableSlots();
    }
  }, [selectedTechnician, selectedDate]);

  const loadTechnicians = async () => {
    setLoading(true);
    try {
      const data = await getTechnicians();
      setTechnicians(data);

      const today = dayjs().format('YYYY-MM-DD');
      const workloadPromises = data.map((tech) =>
        getTechnicianWorkload(tech.id, today).then((wl) => ({
          id: tech.id,
          workload: wl,
        }))
      );
      const workloadResults = await Promise.all(workloadPromises);
      const workloadMap: Record<string, WorkloadCheckResult> = {};
      workloadResults.forEach(({ id, workload }) => {
        workloadMap[id] = workload;
      });
      setWorkloads(workloadMap);
    } catch (error) {
      console.error('Failed to load technicians:', error);
      message.error('加载技师列表失败');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableSlots = async () => {
    if (!selectedTechnician || !selectedDate) return;

    try {
      const data = await getAvailableSlots(
        selectedTechnician.id,
        selectedDate,
        totalDuration
      );
      setSlots(data);
    } catch (error) {
      console.error('Failed to load slots:', error);
      setSlots([]);
    }
  };

  const handleSelectTechnician = async (technician: Technician) => {
    setTechnician(technician);
    const wl = await getTechnicianWorkload(
      technician.id,
      selectedDate || dayjs().format('YYYY-MM-DD')
    );
    setWorkloads((prev) => ({ ...prev, [technician.id]: wl }));
  };

  const handleSelectDate = (date: Dayjs) => {
    const formatted = date.format('YYYY-MM-DD');
    setDate(formatted);
    if (selectedTechnician) {
      getTechnicianWorkload(selectedTechnician.id, formatted).then((wl) => {
        setWorkloads((prev) => ({ ...prev, [selectedTechnician.id]: wl }));
      });
    }
  };

  const handleSelectSlot = (slot: TimeSlot) => {
    setTimeSlot(slot);
  };

  const handleNext = () => {
    if (currentStep === 0 && !selectedTechnician) {
      message.warning('请选择技师');
      return;
    }
    if (currentStep === 1 && (!selectedDate || !selectedTimeSlot)) {
      message.warning('请选择日期和时段');
      return;
    }
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
    } else {
      setShowModal(true);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getWorkloadWarning = () => {
    if (!selectedTechnician) return undefined;
    const wl = workloads[selectedTechnician.id];
    if (!wl) return undefined;

    const newWorkload = wl.current_workload + totalDuration;
    return {
      current: wl.current_workload,
      max: wl.max_workload,
      willExceed: wl.is_overloaded,
    };
  };

  const disabledDate = (current: Dayjs) => {
    return current && current < dayjs().startOf('day');
  };

  const steps = [
    { title: '选择技师', icon: <Check className="w-4 h-4" /> },
    { title: '选择时间', icon: <Calendar className="w-4 h-4" /> },
    { title: '确认预约', icon: <Check className="w-4 h-4" /> },
  ];

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-gray-800 mb-2">预约服务</h1>
          <p className="text-gray-500">完成以下步骤，轻松预约您的专属服务</p>
        </motion.div>

        <div className="bg-white rounded-2xl p-6 shadow-md">
          <Steps
            current={currentStep}
            items={steps}
            size="small"
            className="mb-8"
          />

          {currentStep === 0 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                选择技师
              </h2>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-32 bg-gray-100 rounded-2xl animate-pulse"
                    />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {technicians.map((tech) => (
                    <TechnicianCard
                      key={tech.id}
                      technician={tech}
                      selected={selectedTechnician?.id === tech.id}
                      workload={
                        workloads[tech.id] && {
                          current: workloads[tech.id].current_workload,
                          max: workloads[tech.id].max_workload,
                        }
                      }
                      onSelect={handleSelectTechnician}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {currentStep === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8"
            >
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  选择日期
                </h2>
                <div className="bg-gray-50 rounded-2xl p-4">
                  <AntCalendar
                    value={selectedDate ? dayjs(selectedDate) : undefined}
                    onChange={handleSelectDate}
                    disabledDate={disabledDate}
                    fullscreen={false}
                  />
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  选择时段
                </h2>
                <div className="bg-gray-50 rounded-2xl p-4">
                  <TimeSlotPicker
                    slots={slots}
                    duration={totalDuration}
                    selectedSlot={selectedTimeSlot}
                    onSelect={handleSelectSlot}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                确认预约信息
              </h2>

              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <h3 className="font-medium text-gray-700 mb-3">已选服务</h3>
                  <div className="space-y-2">
                    {selectedServices.map((service) => (
                      <div
                        key={service.id}
                        className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0"
                      >
                        <span className="text-gray-800">{service.name}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-gray-500 text-sm">
                            {formatDuration(service.standard_duration)}
                          </span>
                          <span className="text-primary-dark font-medium">
                            {formatCurrency(service.standard_duration * service.hourly_rate)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-500 mb-1">技师</p>
                    <p className="font-medium text-gray-800">
                      {selectedTechnician?.name || '未选择'}
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-500 mb-1">日期</p>
                    <p className="font-medium text-gray-800">
                      {selectedDate ? formatDate(selectedDate) : '未选择'}
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-500 mb-1">时段</p>
                    <p className="font-medium text-gray-800">
                      {selectedTimeSlot
                        ? `${formatTime(selectedTimeSlot.start)} - ${formatTime(selectedTimeSlot.end)}`
                        : '未选择'}
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-500 mb-1">总工时</p>
                    <p className="font-medium text-gray-800">
                      {formatDuration(totalDuration)}
                    </p>
                  </div>
                </div>

                <div className="p-6 bg-gradient-to-r from-primary/20 to-primary-dark/20 rounded-xl">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-800">
                      预估总价
                    </span>
                    <span className="text-3xl font-bold text-primary-dark">
                      {formatCurrency(estimatedPrice)}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
            <button
              onClick={handlePrev}
              disabled={currentStep === 0}
              className={cn(
                'px-6 py-3 rounded-xl font-medium transition-all',
                currentStep === 0
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              上一步
            </button>
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleNext}
              className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
            >
              {currentStep === 2 ? '确认预约' : '下一步'}
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </div>

      <BookingModal
        open={showModal}
        onClose={() => setShowModal(false)}
        services={selectedServices}
        technician={selectedTechnician}
        date={selectedDate}
        timeSlot={selectedTimeSlot}
        totalDuration={totalDuration}
        estimatedPrice={estimatedPrice}
        workloadWarning={getWorkloadWarning()}
      />
    </Layout>
  );
}
