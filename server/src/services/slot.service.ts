import prisma from '../utils/prisma';
import { parseTimeToFloat, isTimeInRange, addDurationToTime } from '../utils/time.utils';
import type { TimeSlot, Booking, AvailableSlot } from '../types';

export async function getBusinessHours(): Promise<{ start: string; end: string }> {
  const settings = await prisma.storeSettings.findFirst();
  return {
    start: settings?.business_start ?? '10:00',
    end: settings?.business_end ?? '20:00',
  };
}

export function generateTimeSlots(
  businessStart: string,
  businessEnd: string,
  slotMinutes: number = 30
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const startFloat = parseTimeToFloat(businessStart);
  const endFloat = parseTimeToFloat(businessEnd);
  const slotHours = slotMinutes / 60;

  let current = startFloat;
  while (current < endFloat) {
    const next = current + slotHours;
    if (next > endFloat) break;

    const startH = Math.floor(current);
    const startM = Math.round((current - startH) * 60);
    const endH = Math.floor(next);
    const endM = Math.round((next - endH) * 60);

    slots.push({
      start: `${startH.toString().padStart(2, '0')}:${startM.toString().padStart(2, '0')}`,
      end: `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`,
    });

    current = next;
  }

  return slots;
}

export function isSlotAvailable(slot: TimeSlot, bookings: Booking[]): boolean {
  for (const booking of bookings) {
    const bookingStart = parseTimeToFloat(booking.start_time);
    const bookingEnd = parseTimeToFloat(booking.end_time);
    const slotStart = parseTimeToFloat(slot.start);
    const slotEnd = parseTimeToFloat(slot.end);

    if (slotStart < bookingEnd && slotEnd > bookingStart) {
      return false;
    }
  }
  return true;
}

export async function getAvailableSlots(
  technicianId: string,
  date: Date,
  requiredDuration: number,
  excludeBookingId?: string
): Promise<TimeSlot[]> {
  const { start: businessStart, end: businessEnd } = await getBusinessHours();
  const allSlots = generateTimeSlots(businessStart, businessEnd, 30);

  const dateStr = date.toISOString().split('T')[0];
  const where: any = {
    technician_id: technicianId,
    booking_date: {
      gte: new Date(dateStr + 'T00:00:00.000Z'),
      lt: new Date(dateStr + 'T23:59:59.999Z'),
    },
    status: {
      in: ['pending', 'confirmed'],
    },
  };
  if (excludeBookingId) {
    where.id = { not: excludeBookingId };
  }
  const bookings = await prisma.booking.findMany({ where });

  const typedBookings = bookings as unknown as Booking[];
  const availableSlots: TimeSlot[] = [];

  for (let i = 0; i < allSlots.length; i++) {
    const slotsNeeded = Math.ceil(requiredDuration / 0.5);
    if (i + slotsNeeded > allSlots.length) break;

    const candidateSlot: TimeSlot = {
      start: allSlots[i].start,
      end: addDurationToTime(allSlots[i].start, requiredDuration),
    };

    if (!isTimeInRange(businessStart, candidateSlot.end, businessEnd)) {
      continue;
    }

    let available = true;
    for (let j = 0; j < slotsNeeded; j++) {
      if (!isSlotAvailable(allSlots[i + j], typedBookings)) {
        available = false;
        break;
      }
    }

    if (available) {
      availableSlots.push(candidateSlot);
    }
  }

  return availableSlots;
}

export async function findAvailableSlotsAllTechnicians(
  date: Date,
  requiredDuration: number
): Promise<AvailableSlot[]> {
  const technicians = await prisma.technician.findMany({
    where: { is_active: true },
  });

  const results: AvailableSlot[] = [];

  for (const tech of technicians) {
    const slots = await getAvailableSlots(tech.id, date, requiredDuration);
    for (const slot of slots) {
      results.push({
        ...slot,
        technician_id: tech.id,
        is_available: true,
      });
    }
  }

  return results;
}
