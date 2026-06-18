import { create } from 'zustand';
import type { Service, Technician, TimeSlot } from '@/types';

interface BookingStore {
  selectedServices: Service[];
  selectedTechnician: Technician | null;
  selectedDate: string;
  selectedTimeSlot: TimeSlot | null;
  totalDuration: number;
  estimatedPrice: number;
  addService: (service: Service) => void;
  removeService: (serviceId: string) => void;
  setTechnician: (technician: Technician | null) => void;
  setDate: (date: string) => void;
  setTimeSlot: (slot: TimeSlot | null) => void;
  clearAll: () => void;
}

const calculateTotalDuration = (services: Service[]): number => {
  return services.reduce((total, service) => total + service.standard_duration, 0);
};

const calculateEstimatedPrice = (services: Service[]): number => {
  return services.reduce((total, service) => total + service.standard_duration * service.hourly_rate, 0);
};

export const useBookingStore = create<BookingStore>((set, get) => ({
  selectedServices: [],
  selectedTechnician: null,
  selectedDate: '',
  selectedTimeSlot: null,
  totalDuration: 0,
  estimatedPrice: 0,

  addService: (service: Service) => {
    const services = [...get().selectedServices, service];
    set({
      selectedServices: services,
      totalDuration: calculateTotalDuration(services),
      estimatedPrice: calculateEstimatedPrice(services),
    });
  },

  removeService: (serviceId: string) => {
    const services = get().selectedServices.filter((s) => s.id !== serviceId);
    set({
      selectedServices: services,
      totalDuration: calculateTotalDuration(services),
      estimatedPrice: calculateEstimatedPrice(services),
    });
  },

  setTechnician: (technician: Technician | null) => {
    set({ selectedTechnician: technician });
  },

  setDate: (date: string) => {
    set({ selectedDate: date, selectedTimeSlot: null });
  },

  setTimeSlot: (slot: TimeSlot | null) => {
    set({ selectedTimeSlot: slot });
  },

  clearAll: () => {
    set({
      selectedServices: [],
      selectedTechnician: null,
      selectedDate: '',
      selectedTimeSlot: null,
      totalDuration: 0,
      estimatedPrice: 0,
    });
  },
}));
