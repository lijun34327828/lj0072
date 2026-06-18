import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { calculateOrderPrice } from '../services/pricing.service';
import type { Order, OrderItem } from '../types';

const applyDiscountSchema = z.object({
  discount_amount: z.number().min(0, '减免金额不能为负数'),
});

export async function getAllOrders(req: Request, res: Response) {
  try {
    const orders = await prisma.order.findMany({
      include: {
        orderItems: true,
        booking: {
          include: {
            customer: true,
            technician: true,
          },
        },
      },
      orderBy: {
        booking: {
          booking_date: 'desc',
        },
      },
    });

    res.json({
      success: true,
      data: orders as unknown as Order[],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取订单列表失败',
    });
  }
}

export async function getOrderById(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        orderItems: true,
        booking: {
          include: {
            customer: true,
            technician: true,
            bookingServices: {
              include: {
                service: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: '订单不存在',
      });
    }

    res.json({
      success: true,
      data: order as unknown as Order & { orderItems: OrderItem[] },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取订单详情失败',
    });
  }
}

export async function calculateOrder(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: '订单不存在',
      });
    }

    const result = await calculateOrderPrice(order.booking_id, order.discount_amount);

    res.json({
      success: true,
      data: result,
      message: '订单核算成功',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '订单核算失败',
    });
  }
}

export async function applyDiscount(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const validated = applyDiscountSchema.parse(req.body);

    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: '订单不存在',
      });
    }

    const calculation = await calculateOrderPrice(order.booking_id, validated.discount_amount);

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        discount_amount: calculation.discount_amount,
        final_amount: calculation.final_amount,
      },
      include: {
        orderItems: true,
      },
    });

    res.json({
      success: true,
      data: {
        ...updatedOrder,
        calculation,
      } as unknown as Order & { orderItems: OrderItem[] },
      message: '减免金额录入成功',
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
      error: error instanceof Error ? error.message : '录入减免金额失败',
    });
  }
}

export async function completeOrder(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        booking: {
          include: {
            bookingServices: {
              include: {
                service: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      const existingBooking = await prisma.booking.findUnique({
        where: { id },
        include: {
          bookingServices: {
            include: {
              service: true,
            },
          },
        },
      });

      if (!existingBooking) {
        return res.status(404).json({
          success: false,
          message: '订单或预约不存在',
        });
      }

      const calculation = await calculateOrderPrice(existingBooking.id, 0);

      const result = await prisma.$transaction(async (tx) => {
        const newOrder = await tx.order.create({
          data: {
            booking_id: existingBooking.id,
            original_amount: calculation.original_amount,
            discount_amount: calculation.discount_amount,
            final_amount: calculation.final_amount,
            status: 'completed',
            completed_at: new Date(),
          },
        });

        await Promise.all(
          calculation.breakdown.map((item) =>
            tx.orderItem.create({
              data: {
                order_id: newOrder.id,
                service_name: item.service_name,
                duration: item.duration,
                unit_price: item.unit_price,
                subtotal: item.subtotal,
              },
            })
          )
        );

        await tx.booking.update({
          where: { id: existingBooking.id },
          data: { status: 'completed' },
        });

        return tx.order.findUnique({
          where: { id: newOrder.id },
          include: {
            orderItems: true,
            booking: {
              include: {
                customer: true,
                technician: true,
              },
            },
          },
        });
      });

      return res.json({
        success: true,
        data: result as unknown as Order & { orderItems: OrderItem[] },
        message: '订单创建并完成成功',
      });
    }

    const calculation = await calculateOrderPrice(order.booking_id, order.discount_amount);

    const result = await prisma.$transaction(async (tx) => {
      if (order.orderItems.length === 0) {
        await Promise.all(
          calculation.breakdown.map((item) =>
            tx.orderItem.create({
              data: {
                order_id: order.id,
                service_name: item.service_name,
                duration: item.duration,
                unit_price: item.unit_price,
                subtotal: item.subtotal,
              },
            })
          )
        );
      }

      await tx.booking.update({
        where: { id: order.booking_id },
        data: { status: 'completed' },
      });

      return tx.order.update({
        where: { id },
        data: {
          status: 'completed',
          completed_at: new Date(),
          original_amount: calculation.original_amount,
          final_amount: calculation.final_amount,
        },
        include: {
          orderItems: true,
          booking: {
            include: {
              customer: true,
              technician: true,
            },
          },
        },
      });
    });

    res.json({
      success: true,
      data: result as unknown as Order & { orderItems: OrderItem[] },
      message: '订单完成成功',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '完成订单失败',
    });
  }
}
