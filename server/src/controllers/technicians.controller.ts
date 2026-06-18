import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { checkTechnicianWorkload, getConfirmedBookings, calculateCurrentWorkload, getWorkloadLimit } from '../services/workload.service';
import { getAvailableSlots } from '../services/slot.service';
import type { Technician, TimeSlot } from '../types';

const createTechnicianSchema = z.object({
  name: z.string().min(1, '姓名不能为空'),
  employee_no: z.string().min(1, '工号不能为空'),
  phone: z.string().optional(),
  avatar_url: z.string().optional(),
  rating: z.number().min(0).max(5).optional(),
  skills: z.string().min(1, '技能不能为空'),
});

const updateTechnicianSchema = createTechnicianSchema.partial();

export async function getAllTechnicians(req: Request, res: Response) {
  try {
    const { skill } = req.query;

    const where: any = { is_active: true };
    if (skill && typeof skill === 'string') {
      where.skills = {
        contains: skill,
      };
    }

    const technicians = await prisma.technician.findMany({ where });

    res.json({
      success: true,
      data: technicians as unknown as Technician[],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取技师列表失败',
    });
  }
}

export async function getTechnicianById(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const technician = await prisma.technician.findUnique({
      where: { id },
    });

    if (!technician) {
      return res.status(404).json({
        success: false,
        message: '技师不存在',
      });
    }

    res.json({
      success: true,
      data: technician as unknown as Technician,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取技师详情失败',
    });
  }
}

export async function getTechnicianWorkload(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { date } = req.query;

    const technician = await prisma.technician.findUnique({ where: { id } });
    if (!technician) {
      return res.status(404).json({
        success: false,
        message: '技师不存在',
      });
    }

    let targetDate: Date;
    if (date && typeof date === 'string') {
      targetDate = new Date(date);
    } else {
      targetDate = new Date();
    }

    const maxWorkload = await getWorkloadLimit();
    const confirmedBookings = await getConfirmedBookings(id, targetDate);
    const currentWorkload = calculateCurrentWorkload(confirmedBookings);

    res.json({
      success: true,
      data: {
        technician_id: id,
        date: targetDate.toISOString().split('T')[0],
        current_workload: currentWorkload,
        max_workload: maxWorkload,
        remaining_capacity: Math.max(0, maxWorkload - currentWorkload),
        bookings: confirmedBookings,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取工时负荷失败',
    });
  }
}

export async function getTechnicianAvailableSlots(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { date, duration } = req.query;

    const technician = await prisma.technician.findUnique({ where: { id } });
    if (!technician) {
      return res.status(404).json({
        success: false,
        message: '技师不存在',
      });
    }

    let targetDate: Date;
    if (date && typeof date === 'string') {
      targetDate = new Date(date);
    } else {
      targetDate = new Date();
    }

    let requiredDuration = 1;
    if (duration && typeof duration === 'string') {
      requiredDuration = parseFloat(duration);
    }

    const slots = await getAvailableSlots(id, targetDate, requiredDuration);

    res.json({
      success: true,
      data: {
        technician_id: id,
        date: targetDate.toISOString().split('T')[0],
        required_duration: requiredDuration,
        available_slots: slots as unknown as TimeSlot[],
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取可用时段失败',
    });
  }
}

export async function createTechnician(req: Request, res: Response) {
  try {
    const validated = createTechnicianSchema.parse(req.body);

    const existing = await prisma.technician.findUnique({
      where: { employee_no: validated.employee_no },
    });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: '工号已存在',
      });
    }

    const technician = await prisma.technician.create({
      data: {
        ...validated,
        rating: validated.rating ?? 0,
      },
    });

    res.status(201).json({
      success: true,
      data: technician as unknown as Technician,
      message: '技师创建成功',
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
      error: error instanceof Error ? error.message : '创建技师失败',
    });
  }
}

export async function updateTechnician(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const validated = updateTechnicianSchema.parse(req.body);

    const existing = await prisma.technician.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: '技师不存在',
      });
    }

    if (validated.employee_no && validated.employee_no !== existing.employee_no) {
      const duplicate = await prisma.technician.findUnique({
        where: { employee_no: validated.employee_no },
      });
      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: '工号已存在',
        });
      }
    }

    const technician = await prisma.technician.update({
      where: { id },
      data: validated,
    });

    res.json({
      success: true,
      data: technician as unknown as Technician,
      message: '技师更新成功',
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
      error: error instanceof Error ? error.message : '更新技师失败',
    });
  }
}
