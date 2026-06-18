import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { checkTechnicianWorkload } from '../services/workload.service';
import { getAvailableSlots, getBusinessHours } from '../services/slot.service';
import { addDurationToTime, parseTimeToFloat } from '../utils/time.utils';
import type { Booking, BookingService } from '../types';

const createBookingSchema = z.object({
  customer_id: z.string().min(1, '顾客ID不能为空'),
  technician_id: z.string().min(1, '技师ID不能为空'),
  booking_date: z.string().min(1, '预约日期不能为空'),
  start_time: z.string().min(1, '开始时间不能为空'),
  service_ids: z.array(z.string()).min(1, '至少选择一个服务'),
  status: z.enum(['pending', 'confirmed', 'completed', 'cancelled']).optional(),
});

const updateBookingStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'completed', 'cancelled'], {
    errorMap: () => ({ message: '状态必须是 pending、confirmed、completed 或 cancelled' }),
  }),
});

const rescheduleBookingSchema = z.object({
  technician_id: z.string().min(1, '技师ID不能为空'),
  booking_date: z.string().min(1, '预约日期不能为空'),
  start_time: z.string().min(1, '开始时间不能为空'),
});

export async function getAllBookings(req: Request, res: Response) {
  try {
    const { technician_id, customer_id, date } = req.query;

    const where: any = {};
    if (technician_id && typeof technician_id === 'string') {
      where.technician_id = technician_id;
    }
    if (customer_id && typeof customer_id === 'string') {
      where.customer_id = customer_id;
    }
    if (date && typeof date === 'string') {
      const dateStr = new Date(date).toISOString().split('T')[0];
      where.booking_date = {
        gte: new Date(dateStr + 'T00:00:00.000Z'),
        lt: new Date(dateStr + 'T23:59:59.999Z'),
      };
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        bookingServices: {
          include: {
            service: true,
          },
        },
        customer: true,
        technician: true,
      },
      orderBy: [
        { booking_date: 'desc' },
        { start_time: 'asc' },
      ],
    });

    res.json({
      success: true,
      data: bookings as unknown as Booking[],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取预约列表失败',
    });
  }
}

export async function getBookingById(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        bookingServices: {
          include: {
            service: true,
          },
        },
        customer: true,
        technician: true,
      },
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: '预约不存在',
      });
    }

    res.json({
      success: true,
      data: booking as unknown as Booking & { bookingServices: BookingService[] },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取预约详情失败',
    });
  }
}

export async function createBooking(req: Request, res: Response) {
  try {
    const validated = createBookingSchema.parse(req.body);

    const customer = await prisma.customer.findUnique({
      where: { id: validated.customer_id },
    });
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: '顾客不存在',
      });
    }

    const technician = await prisma.technician.findUnique({
      where: { id: validated.technician_id },
    });
    if (!technician) {
      return res.status(404).json({
        success: false,
        message: '技师不存在',
      });
    }

    const services = await prisma.service.findMany({
      where: {
        id: { in: validated.service_ids },
        is_active: true,
      },
    });
    if (services.length !== validated.service_ids.length) {
      return res.status(400).json({
        success: false,
        message: '部分服务不存在或已下架',
      });
    }

    const totalDuration = services.reduce((sum, s) => sum + s.standard_duration, 0);
    const endTime = addDurationToTime(validated.start_time, totalDuration);

    const bookingDate = new Date(validated.booking_date);
    const { start: businessStart, end: businessEnd } = await getBusinessHours();

    const startTimeFloat = parseTimeToFloat(validated.start_time);
    const endTimeFloat = parseTimeToFloat(endTime);
    const businessStartFloat = parseTimeToFloat(businessStart);
    const businessEndFloat = parseTimeToFloat(businessEnd);

    if (startTimeFloat < businessStartFloat || endTimeFloat > businessEndFloat) {
      return res.status(400).json({
        success: false,
        message: `预约时间超出营业时间（${businessStart} - ${businessEnd}）`,
      });
    }

    const workloadResult = await checkTechnicianWorkload(
      validated.technician_id,
      bookingDate,
      totalDuration
    );
    if (workloadResult.is_overloaded) {
      return res.status(400).json({
        success: false,
        message: '该技师当日工时已超负荷',
        data: {
          current_workload: workloadResult.current_workload,
          max_workload: workloadResult.max_workload,
          available_slots: workloadResult.available_slots,
        },
      });
    }

    const dateStr = bookingDate.toISOString().split('T')[0];
    const existingBookings = await prisma.booking.findMany({
      where: {
        technician_id: validated.technician_id,
        booking_date: {
          gte: new Date(dateStr + 'T00:00:00.000Z'),
          lt: new Date(dateStr + 'T23:59:59.999Z'),
        },
        status: { in: ['pending', 'confirmed'] },
      },
    });

    for (const booking of existingBookings) {
      const bookingStart = parseTimeToFloat(booking.start_time);
      const bookingEnd = parseTimeToFloat(booking.end_time);
      if (startTimeFloat < bookingEnd && endTimeFloat > bookingStart) {
        const availableSlots = await getAvailableSlots(
          validated.technician_id,
          bookingDate,
          totalDuration
        );
        return res.status(400).json({
          success: false,
          message: '该时段已被预约',
          data: {
            conflicting_booking: {
              id: booking.id,
              start_time: booking.start_time,
              end_time: booking.end_time,
            },
            available_slots: availableSlots,
          },
        });
      }
    }

    let createdBookingId: string;
    await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.create({
        data: {
          customer_id: validated.customer_id,
          technician_id: validated.technician_id,
          booking_date: bookingDate,
          start_time: validated.start_time,
          end_time: endTime,
          total_duration: totalDuration,
          status: validated.status ?? 'pending',
        },
      });
      createdBookingId = booking.id;

      await Promise.all(
        services.map((service) =>
          tx.bookingService.create({
            data: {
              booking_id: booking.id,
              service_id: service.id,
              duration: service.standard_duration,
            },
          })
        )
      );
    });

    const result = await prisma.booking.findUnique({
      where: { id: createdBookingId },
      include: {
        bookingServices: {
          include: {
            service: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: result as unknown as Booking & { bookingServices: BookingService[] },
      message: '预约创建成功',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: '参数验证失败',
        message: error.errors.map(e => e.message).join(', '),
      });
    }
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '创建预约失败',
    });
  }
}

export async function updateBookingStatus(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const validated = updateBookingStatusSchema.parse(req.body);

    const existing = await prisma.booking.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: '预约不存在',
      });
    }

    const booking = await prisma.booking.update({
      where: { id },
      data: { status: validated.status },
      include: {
        bookingServices: {
          include: {
            service: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: booking as unknown as Booking & { bookingServices: BookingService[] },
      message: '预约状态更新成功',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: '参数验证失败',
        message: error.errors.map(e => e.message).join(', '),
      });
    }
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '更新预约状态失败',
    });
  }
}

export async function cancelBooking(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const existing = await prisma.booking.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: '预约不存在',
      });
    }

    if (existing.status === 'completed' || existing.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: existing.status === 'completed' ? '已完成的预约不能取消' : '该预约已取消，无需重复操作',
      });
    }

    const relatedOrder = await prisma.order.findUnique({
      where: { booking_id: id },
    });

    await prisma.booking.update({
      where: { id },
      data: { status: 'cancelled' },
    });

    if (relatedOrder && relatedOrder.status !== 'completed') {
      await prisma.order.update({
        where: { id: relatedOrder.id },
        data: { status: 'cancelled' },
      });
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        bookingServices: {
          include: {
            service: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: booking as unknown as Booking & { bookingServices: BookingService[] },
      message: '预约取消成功，工时已回滚',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '取消预约失败',
    });
  }
}

export async function rescheduleBooking(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const validated = rescheduleBookingSchema.parse(req.body);

    const existing = await prisma.booking.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: '预约不存在',
      });
    }

    if (existing.status === 'completed' || existing.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: existing.status === 'completed' ? '已完成的预约不能改约' : '已取消的预约不能改约',
      });
    }

    const technician = await prisma.technician.findUnique({
      where: { id: validated.technician_id },
    });
    if (!technician) {
      return res.status(404).json({
        success: false,
        message: '技师不存在',
      });
    }

    const totalDuration = existing.total_duration;
    const endTime = addDurationToTime(validated.start_time, totalDuration);
    const bookingDate = new Date(validated.booking_date);
    const { start: businessStart, end: businessEnd } = await getBusinessHours();

    const startTimeFloat = parseTimeToFloat(validated.start_time);
    const endTimeFloat = parseTimeToFloat(endTime);
    const businessStartFloat = parseTimeToFloat(businessStart);
    const businessEndFloat = parseTimeToFloat(businessEnd);

    if (startTimeFloat < businessStartFloat || endTimeFloat > businessEndFloat) {
      return res.status(400).json({
        success: false,
        message: `预约时间超出营业时间（${businessStart} - ${businessEnd}）`,
      });
    }

    const workloadResult = await checkTechnicianWorkload(
      validated.technician_id,
      bookingDate,
      totalDuration,
      id
    );
    if (workloadResult.is_overloaded) {
      return res.status(400).json({
        success: false,
        message: '该技师当日工时已超负荷，无法改约',
        data: {
          current_workload: workloadResult.current_workload,
          max_workload: workloadResult.max_workload,
          available_slots: workloadResult.available_slots,
        },
      });
    }

    const dateStr = bookingDate.toISOString().split('T')[0];
    const conflictWhere: any = {
      technician_id: validated.technician_id,
      booking_date: {
        gte: new Date(dateStr + 'T00:00:00.000Z'),
        lt: new Date(dateStr + 'T23:59:59.999Z'),
      },
      status: { in: ['pending', 'confirmed'] },
      id: { not: id },
    };
    const existingBookings = await prisma.booking.findMany({ where: conflictWhere });

    for (const booking of existingBookings) {
      const bookingStart = parseTimeToFloat(booking.start_time);
      const bookingEnd = parseTimeToFloat(booking.end_time);
      if (startTimeFloat < bookingEnd && endTimeFloat > bookingStart) {
        const availableSlots = await getAvailableSlots(
          validated.technician_id,
          bookingDate,
          totalDuration,
          id
        );
        return res.status(400).json({
          success: false,
          message: '该时段已被预约，请选择其他时段',
          data: {
            conflicting_booking: {
              id: booking.id,
              start_time: booking.start_time,
              end_time: booking.end_time,
            },
            available_slots: availableSlots,
          },
        });
      }
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        technician_id: validated.technician_id,
        booking_date: bookingDate,
        start_time: validated.start_time,
        end_time: endTime,
      },
      include: {
        bookingServices: {
          include: {
            service: true,
          },
        },
        technician: true,
      },
    });

    res.json({
      success: true,
      data: updatedBooking as unknown as Booking & { bookingServices: BookingService[] },
      message: '改约成功，原时段工时已释放、新时段工时已计入',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: '参数验证失败',
        message: error.errors.map(e => e.message).join(', '),
      });
    }
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '改约失败',
    });
  }
}
