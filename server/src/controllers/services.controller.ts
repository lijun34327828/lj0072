import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import type { Service } from '../types';

const createServiceSchema = z.object({
  name: z.string().min(1, '服务名称不能为空'),
  category: z.enum(['manicure', 'eyelash', 'care'], {
    errorMap: () => ({ message: '分类必须是 manicure、eyelash 或 care' }),
  }),
  standard_duration: z.number().positive('时长必须大于0'),
  hourly_rate: z.number().positive('单价必须大于0'),
  description: z.string().optional(),
  image_url: z.string().optional(),
});

const updateServiceSchema = createServiceSchema.partial();

export async function getAllServices(req: Request, res: Response) {
  try {
    const { category } = req.query;

    const where: any = { is_active: true };
    if (category && typeof category === 'string') {
      where.category = category;
    }

    const services = await prisma.service.findMany({ where });

    res.json({
      success: true,
      data: services as unknown as Service[],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取服务列表失败',
    });
  }
}

export async function getServiceById(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const service = await prisma.service.findUnique({
      where: { id },
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: '服务不存在',
      });
    }

    res.json({
      success: true,
      data: service as unknown as Service,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取服务详情失败',
    });
  }
}

export async function createService(req: Request, res: Response) {
  try {
    const validated = createServiceSchema.parse(req.body);

    const service = await prisma.service.create({
      data: validated,
    });

    res.status(201).json({
      success: true,
      data: service as unknown as Service,
      message: '服务创建成功',
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
      error: error instanceof Error ? error.message : '创建服务失败',
    });
  }
}

export async function updateService(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const validated = updateServiceSchema.parse(req.body);

    const existing = await prisma.service.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: '服务不存在',
      });
    }

    const service = await prisma.service.update({
      where: { id },
      data: validated,
    });

    res.json({
      success: true,
      data: service as unknown as Service,
      message: '服务更新成功',
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
      error: error instanceof Error ? error.message : '更新服务失败',
    });
  }
}

export async function deleteService(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const existing = await prisma.service.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: '服务不存在',
      });
    }

    await prisma.service.update({
      where: { id },
      data: { is_active: false },
    });

    res.json({
      success: true,
      message: '服务删除成功',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '删除服务失败',
    });
  }
}
