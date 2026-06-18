export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export type OrderStatus = 'pending' | 'paid' | 'completed' | 'refunded';

export type ServiceCategory = 'manicure' | 'eyelash' | 'care';

export interface Service {
  id: string;
  name: string;
  category: ServiceCategory;
  standard_duration: number;
  hourly_rate: number;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Technician {
  id: string;
  name: string;
  employee_no: string;
  skills: string;
  rating: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  created_at: string;
  updated_at: string;
}

export interface BookingService {
  booking_id: string;
  service_id: string;
  duration: number;
  service: Service;
}

export interface Booking {
  id: string;
  customer_id: string;
  customer?: Customer;
  technician_id: string;
  technician?: Technician;
  bookingServices: BookingService[];
  booking_date: string;
  start_time: string;
  end_time: string;
  total_duration: number;
  status: BookingStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  service_name: string;
  duration: number;
  unit_price: number;
  subtotal: number;
}

export interface Order {
  id: string;
  booking_id: string;
  booking?: Booking;
  customer_id: string;
  customer?: Customer;
  orderItems: OrderItem[];
  original_amount: number;
  discount_amount: number;
  final_amount: number;
  status: OrderStatus;
  payment_method?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface BookingFormData {
  customer_id: string;
  technician_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  total_duration: number;
  service_ids: string[];
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  notes?: string;
}

export interface WorkloadCheckResult {
  is_overloaded: boolean;
  current_workload: number;
  max_workload: number;
  available_slots: TimeSlot[];
}

export interface PriceCalculationResult {
  original_amount: number;
  discount_amount: number;
  final_amount: number;
  breakdown: Array<{
    service_name: string;
    duration: number;
    unit_price: number;
    subtotal: number;
  }>;
}

export interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
}

export interface StoreSettings {
  id: string;
  daily_workload_limit: number;
  max_discount_percent: number;
  max_discount_amount: number;
  business_start: string;
  business_end: string;
}
