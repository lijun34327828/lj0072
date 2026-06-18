import prisma from '../utils/prisma';
import type { Booking, WorkloadCheckResult, AvailableSlot } from '../types';
import { findAvailableSlotsAllTechnicians } from './slot.service';

export async function getWorkloadLimit(): Promise<number> {
  const settings = await prisma.storeSettings.findFirst();
  return settings?.daily_workload_limit ?? 8;
}

export async function getConfirmedBookings(technicianId: string, date: Date): Promise<Booking[]> {
  const dateStr = date.toISOString().split('T')[0];
  const bookings = await prisma.booking.findMany({
    where: {
      technician_id: technicianId,
      booking_date: {
        gte: new Date(dateStr + 'T00:00:00.000Z'),
        lt: new Date(dateStr + 'T23:59:59.999Z'),
      },
      status: 'confirmed',
    },
  });
  return bookings as unknown as Booking[];
}

export function calculateCurrentWorkload(bookings: Booking[]): number {
  return bookings.reduce((total, booking) => total + booking.total_duration, 0);
}

export async function checkTechnicianWorkload(
  technicianId: string,
  bookingDate: Date,
  newDuration: number
): Promise<WorkloadCheckResult> {
  const maxWorkload = await getWorkloadLimit();
  const confirmedBookings = await getConfirmedBookings(technicianId, bookingDate);
  const currentWorkload = calculateCurrentWorkload(confirmedBookings);
  const totalWorkload = currentWorkload + newDuration;
  const isOverloaded = totalWorkload > maxWorkload;

  let availableSlots: AvailableSlot[] = [];
  if (isOverloaded) {
    availableSlots = await findAvailableSlotsAllTechnicians(bookingDate, newDuration);
  }

  return {
    is_overloaded: isOverloaded,
    current_workload: currentWorkload,
    max_workload: maxWorkload,
    available_slots: availableSlots,
  };
}
