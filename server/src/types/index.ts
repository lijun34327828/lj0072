export type ServiceCategory = 'manicure' | 'eyelash' | 'care';

export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export type OrderStatus = 'pending' | 'paid' | 'completed' | 'cancelled';

export interface Service {
  id: string;
  name: string;
  category: ServiceCategory;
  standard_duration: number;
  hourly_rate: number;
  description?: string | null;
  image_url?: string | null;
  is_active: boolean;
}

export interface Technician {
  id: string;
  name: string;
  employee_no: string;
  phone?: string | null;
  avatar_url?: string | null;
  rating: number;
  skills: string;
  is_active: boolean;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  avatar_url?: string | null;
  points: number;
}

export interface Booking {
  id: string;
  customer_id: string;
  technician_id: string;
  booking_date: Date;
  start_time: string;
  end_time: string;
  total_duration: number;
  status: BookingStatus;
  created_at: Date;
}

export interface BookingService {
  id: string;
  booking_id: string;
  service_id: string;
  duration: number;
}

export interface Order {
  id: string;
  booking_id: string;
  original_amount: number;
  discount_amount: number;
  final_amount: number;
  status: OrderStatus;
  completed_at?: Date | null;
}

export interface OrderItem {
  id: string;
  order_id: string;
  service_name: string;
  duration: number;
  unit_price: number;
  subtotal: number;
}

export interface StoreSettings {
  id: string;
  daily_workload_limit: number;
  max_discount_percent: number;
  max_discount_amount: number;
  business_start: string;
  business_end: string;
}

export interface TimeSlot {
  start: string;
  end: string;
}

export interface AvailableSlot extends TimeSlot {
  technician_id: string;
  is_available: boolean;
}

export interface WorkloadCheckResult {
  is_overloaded: boolean;
  current_workload: number;
  max_workload: number;
  available_slots: AvailableSlot[];
}

export interface PriceCalculationResult {
  original_amount: number;
  discount_amount: number;
  final_amount: number;
  breakdown: {
    service_name: string;
    duration: number;
    unit_price: number;
    subtotal: number;
  }[];
}
