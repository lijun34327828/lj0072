import prisma from '../utils/prisma';
import type { PriceCalculationResult } from '../types';

export async function calculateOrderPrice(
  bookingId: string,
  discountAmount: number = 0
): Promise<PriceCalculationResult> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      bookingServices: {
        include: {
          service: true,
        },
      },
    },
  });

  if (!booking) {
    throw new Error(`Booking ${bookingId} not found`);
  }

  const breakdown = booking.bookingServices.map((bs) => ({
    service_name: bs.service.name,
    duration: bs.duration,
    unit_price: bs.service.hourly_rate,
    subtotal: bs.duration * bs.service.hourly_rate,
  }));

  const originalAmount = breakdown.reduce((total, item) => total + item.subtotal, 0);

  const settings = await prisma.storeSettings.findFirst();
  const maxDiscountPercent = settings?.max_discount_percent ?? 0;
  const maxDiscountAmount = settings?.max_discount_amount ?? 0;

  const percentBasedMax = originalAmount * (maxDiscountPercent / 100);
  const allowedMaxDiscount = Math.min(percentBasedMax, maxDiscountAmount);

  let finalDiscountAmount = discountAmount;
  if (finalDiscountAmount < 0) {
    finalDiscountAmount = 0;
  }
  if (finalDiscountAmount > allowedMaxDiscount) {
    finalDiscountAmount = allowedMaxDiscount;
  }
  if (finalDiscountAmount > originalAmount) {
    finalDiscountAmount = originalAmount;
  }

  const finalAmount = originalAmount - finalDiscountAmount;

  return {
    original_amount: originalAmount,
    discount_amount: finalDiscountAmount,
    final_amount: finalAmount,
    breakdown,
  };
}
