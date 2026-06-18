import { useState, useEffect } from 'react';
import { Modal, DatePicker, Select, message, Spin } from 'antd';
import { motion } from 'framer-motion';
import {
  User,
  Calendar,
  Clock,
  X,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import dayjs, { Dayjs } from 'dayjs';
import type { Technician, TimeSlot, Booking } from '@/types';
import {
  formatDate,
  formatTime,
  formatDuration,
} from '@/utils/format';
import { cn } from '@/lib/utils';
import {
  getTechnicians,
  getAvailableSlots,
  rescheduleBooking,
  getTechnicianWorkload,
} from '@/services/api';

interface RescheduleModalProps {
  open: boolean;
  onClose: () => void;
  booking: Booking;
  onSuccess: () => void;
}

export default function RescheduleModal({
  open,
  onClose,
  booking,
  onSuccess,
}: RescheduleModalProps) {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<string>(booking.technician_id);
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(dayjs(booking.booking_date));
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [loadingTechnicians, setLoadingTechnicians] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [workloadInfo, setWorkloadInfo] = useState<{
    current: number;
    max: number;
    willExceed: boolean;
  } | null>(null);

  useEffect(() => {
    if (open) {
      loadTechnicians();
    }
  }, [open]);

  useEffect(() => {
    if (open && selectedTechnicianId && selectedDate) {
      loadSlots();
      loadWorkload();
    }
  }, [open, selectedTechnicianId, selectedDate]);

  const loadTechnicians = async () => {
    setLoadingTechnicians(true);
    try {
      const data = await getTechnicians();
      setTechnicians(data.filter(t => t.is_active));
    } catch (error) {
      message.error('加载技师列表失败');
    } finally {
      setLoadingTechnicians(false);
    }
  };

  const loadSlots = async () => {
    if (!selectedTechnicianId || !selectedDate) return;
    setLoadingSlots(true);
    try {
      const dateStr = selectedDate.format('YYYY-MM-DD');
      const data = await getAvailableSlots(
        selectedTechnicianId,
        dateStr,
        booking.total_duration
      );
      setSlots(data.map(s => ({ ...s, available: true })));
      setSelectedSlot(null);
    } catch (error) {
      console.error('Failed to load slots:', error);
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const loadWorkload = async () => {
    if (!selectedTechnicianId || !selectedDate) return;
    try {
      const dateStr = selectedDate.format('YYYY-MM-DD');
      const data = await getTechnicianWorkload(selectedTechnicianId, dateStr);
      const newTotal = data.current_workload + booking.total_duration;
      setWorkloadInfo({
        current: data.current_workload,
        max: data.max_workload,
        willExceed: newTotal > data.max_workload,
      });
    } catch (error) {
      setWorkloadInfo(null);
    }
  };

  const handleSubmit = async () => {
    if (!selectedTechnicianId || !selectedDate || !selectedSlot) {
      message.error('请选择技师、日期和时段');
      return;
    }

    setSubmitting(true);
    try {
      await rescheduleBooking(booking.id, {
        technician_id: selectedTechnicianId,
        booking_date: selectedDate.format('YYYY-MM-DD'),
        start_time: selectedSlot.start,
      });
      message.success('改约成功，工时已实时更新');
      onSuccess();
      handleClose();
    } catch (error: any) {
      const errMsg = error?.response?.data?.message || '改约失败，请重试';
      message.error(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedTechnicianId(booking.technician_id);
    setSelectedDate(dayjs(booking.booking_date));
    setSlots([]);
    setSelectedSlot(null);
    setWorkloadInfo(null);
    onClose();
  };

  const generateAllSlots = () => {
    const allSlots: { time: string; label: string }[] = [];
    const startHour = 10;
    const endHour = 20;

    let currentHour = startHour;
    let currentMin = 0;

    while (currentHour < endHour || (currentHour === endHour && currentMin < 60)) {
      const time = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;
      allSlots.push({
        time,
        label: formatTime(time),
      });
      currentMin += 30;
      if (currentMin >= 60) {
        currentHour += 1;
        currentMin = 0;
      }
    }
    return allSlots;
  };

  const allSlots = generateAllSlots();

  const getSlotStatus = (time: string) => {
    const slot = slots.find((s) => s.start === time);
    if (!slot) return 'busy';
    if (selectedSlot?.start === time) return 'selected';
    return 'available';
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'selected':
        return 'bg-primary-dark text-white border-primary-dark shadow-lg shadow-primary-dark/30';
      case 'available':
        return 'bg-green-50 text-green-700 border-green-300 hover:bg-green-100 cursor-pointer';
      case 'busy':
        return 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-50';
      default:
        return '';
    }
  };

  const selectedTechnician = technicians.find(t => t.id === selectedTechnicianId);

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      footer={null}
      width={680}
      destroyOnClose
      closeIcon={<X className="w-5 h-5" />}
      title={
        <div className="flex items-center gap-2 py-2">
          <Calendar className="w-6 h-6 text-primary-dark" />
          <span className="text-xl font-bold text-gray-800">改约</span>
        </div>
      }
    >
      <div className="px-2 space-y-6">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <p className="text-sm text-blue-700">
            <span className="font-medium">当前预约：</span>
            {booking.technician?.name || '原技师'} · {formatDate(booking.booking_date)} · {formatTime(booking.start_time)}-{formatTime(booking.end_time)} · {formatDuration(booking.total_duration)}
          </p>
        </div>

        {workloadInfo?.willExceed && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-700">工时超限</p>
                <p className="text-sm text-red-600 mt-1">
                  该技师当日工时将达到 {(workloadInfo.current + booking.total_duration).toFixed(1)}/{workloadInfo.max} 小时，超过上限
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4 inline mr-1" />
              选择技师
            </label>
            <Spin spinning={loadingTechnicians}>
              <Select
                value={selectedTechnicianId}
                onChange={setSelectedTechnicianId}
                style={{ width: '100%' }}
                size="large"
                placeholder="请选择技师"
                options={technicians.map(t => ({
                  value: t.id,
                  label: t.name,
                }))}
              />
            </Spin>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              选择日期
            </label>
            <DatePicker
              value={selectedDate}
              onChange={(date) => setSelectedDate(date)}
              style={{ width: '100%' }}
              size="large"
              minDate={dayjs()}
              placeholder="请选择日期"
              format="YYYY年MM月DD日"
            />
          </div>
        </div>

        {workloadInfo && !workloadInfo.willExceed && (
          <div className="p-3 bg-gray-50 rounded-xl">
            <p className="text-sm text-gray-600">
              <span className="font-medium">{selectedTechnician?.name || '该技师'}</span> 当日已排工时：
              <span className="text-primary-dark font-medium ml-1">
                {workloadInfo.current.toFixed(1)}h
              </span>
              <span className="mx-1">/</span>
              <span>{workloadInfo.max}h</span>
              <span className="mx-2 text-gray-400">|</span>
              改约后合计：
              <span className="text-green-600 font-medium ml-1">
                {(workloadInfo.current + booking.total_duration).toFixed(1)}h
              </span>
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            <Clock className="w-4 h-4 inline mr-1" />
            选择时段（总时长 {formatDuration(booking.total_duration)}）
          </label>
          <Spin spinning={loadingSlots}>
            {slots.length === 0 && !loadingSlots ? (
              <div className="p-6 bg-yellow-50 rounded-xl text-center">
                <AlertTriangle className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                <p className="text-yellow-700">该日期暂无可用时段，请更换技师或日期</p>
              </div>
            ) : (
              <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-2">
                {allSlots.map((slot) => {
                  const status = getSlotStatus(slot.time);
                  const isDisabled = status === 'busy';

                  return (
                    <motion.button
                      key={slot.time}
                      whileHover={!isDisabled ? { scale: 1.05 } : {}}
                      whileTap={!isDisabled ? { scale: 0.95 } : {}}
                      onClick={() => {
                        if (!isDisabled) {
                          const found = slots.find(s => s.start === slot.time);
                          if (found) setSelectedSlot(found);
                        }
                      }}
                      disabled={isDisabled}
                      className={cn(
                        'py-2 px-1 text-xs font-medium rounded-lg border-2 transition-all duration-200',
                        getStatusStyles(status)
                      )}
                    >
                      {slot.label}
                    </motion.button>
                  );
                })}
              </div>
            )}
          </Spin>
        </div>

        {selectedSlot && (
          <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-green-700 font-medium">
                已选时段：{formatTime(selectedSlot.start)} - {formatTime(selectedSlot.end)}
              </span>
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 py-3 px-6 border-2 border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={handleSubmit}
            disabled={submitting || !selectedSlot || workloadInfo?.willExceed}
            className={cn(
              'flex-1 py-3 px-6 rounded-xl font-medium text-white transition-all',
              (submitting || !selectedSlot || workloadInfo?.willExceed)
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-primary to-primary-dark hover:opacity-90'
            )}
          >
            {submitting ? '提交中...' : '确认改约'}
          </motion.button>
        </div>
      </div>
    </Modal>
  );
}
