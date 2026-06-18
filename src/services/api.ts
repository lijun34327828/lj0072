import axios from 'axios';
import type {
  Service,
  Technician,
  Booking,
  Order,
  BookingFormData,
  WorkloadCheckResult,
  PriceCalculationResult,
  TimeSlot,
  StoreSettings,
  ServiceCategory,
  BookingStatus,
  OrderStatus,
} from '@/types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => {
    const data = response.data;
    if (data && data.success !== undefined && data.data !== undefined) {
      return data.data;
    }
    return data;
  },
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export const getServices = async (category?: ServiceCategory): Promise<Service[]> => {
  return api.get('/services', { params: { category } });
};

export const getService = async (id: string): Promise<Service> => {
  return api.get(`/services/${id}`);
};

export const getTechnicians = async (): Promise<Technician[]> => {
  return api.get('/technicians');
};

export const getTechnician = async (id: string): Promise<Technician> => {
  return api.get(`/technicians/${id}`);
};

export const getTechnicianWorkload = async (id: string, date: string): Promise<WorkloadCheckResult> => {
  return api.get(`/technicians/${id}/workload`, {
    params: { date },
  });
};

export const getAvailableSlots = async (id: string, date: string, duration: number): Promise<TimeSlot[]> => {
  return api.get(`/technicians/${id}/available-slots`, {
    params: { date, duration },
  });
};

export const createBooking = async (data: BookingFormData): Promise<Booking> => {
  return api.post('/bookings', data);
};

export const getBookings = async (params?: {
  customerId?: string;
  technicianId?: string;
  date?: string;
  status?: BookingStatus;
}): Promise<Booking[]> => {
  return api.get('/bookings', { params });
};

export const getBooking = async (id: string): Promise<Booking> => {
  return api.get(`/bookings/${id}`);
};

export const updateBookingStatus = async (id: string, status: BookingStatus): Promise<Booking> => {
  return api.patch(`/bookings/${id}/status`, { status });
};

export const cancelBooking = async (id: string): Promise<Booking> => {
  return api.post(`/bookings/${id}/cancel`);
};

export interface RescheduleData {
  technician_id: string;
  booking_date: string;
  start_time: string;
}

export const rescheduleBooking = async (id: string, data: RescheduleData): Promise<Booking> => {
  return api.post(`/bookings/${id}/reschedule`, data);
};

export const getOrders = async (params?: {
  customerId?: string;
  status?: OrderStatus;
  page?: number;
  limit?: number;
}): Promise<Order[]> => {
  return api.get('/orders', { params });
};

export const getOrder = async (id: string): Promise<Order> => {
  return api.get(`/orders/${id}`);
};

export const calculateOrder = async (id: string): Promise<PriceCalculationResult> => {
  return api.get(`/orders/${id}/calculate`);
};

export const applyDiscount = async (id: string, discountAmount: number): Promise<Order> => {
  return api.patch(`/orders/${id}/discount`, { discountAmount });
};

export const completeOrder = async (id: string): Promise<Order> => {
  return api.post(`/orders/${id}/complete`);
};

export const getSettings = async (): Promise<StoreSettings> => {
  return api.get('/settings');
};

export const updateSettings = async (data: Partial<StoreSettings>): Promise<StoreSettings> => {
  return api.patch('/settings', data);
};

export const getWorkloadLimit = async (): Promise<{ limit: number }> => {
  return api.get('/settings/workload-limit');
};

export const updateWorkloadLimit = async (limit: number): Promise<StoreSettings> => {
  return api.patch('/settings/workload-limit', { limit });
};

export default api;
