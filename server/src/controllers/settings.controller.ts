import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import type { StoreSettings } from '../types';

const updateWorkloadLimitSchema = z.object({
  daily_workload_limit: z.number().positive('工时上限必须大于0'),
});

const updateSettingsSchema = z.object({
  daily_workload_limit: z.number().positive('工时上限必须大于0').optional(),
  max_discount_percent: z.number().min(0).max(100, '折扣比例不能超过100%').optional(),
  max_discount_amount: z.number().min(0, '减免金额不能为负数').optional(),
  business_start: z.string().regex(/^\d{2}:\d{2}$/, '营业时间格式应为 HH:MM').optional(),
  business_end: z.string().regex(/^\d{2}:\d{2}$/, '营业时间格式应为 HH:MM').optional(),
});

export async function getWorkloadLimit(req: Request, res: Response) {
  try {
    const settings = await prisma.storeSettings.findFirst();

    res.json({
      success: true,
      data: {
        daily_workload_limit: settings?.daily_workload_limit ?? 8,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取工时上限失败',
    });
  }
}

export async function updateWorkloadLimit(req: Request, res: Response) {
  try {
    const validated = updateWorkloadLimitSchema.parse(req.body);

    const existing = await prisma.storeSettings.findFirst();

    let settings;
    if (existing) {
      settings = await prisma.storeSettings.update({
        where: { id: existing.id },
        data: { daily_workload_limit: validated.daily_workload_limit },
      });
    } else {
      settings = await prisma.storeSettings.create({
        data: {
          daily_workload_limit: validated.daily_workload_limit,
          max_discount_percent: 10,
          max_discount_amount: 100,
          business_start: '10:00',
          business_end: '20:00',
        },
      });
    }

    res.json({
      success: true,
      data: settings as unknown as StoreSettings,
      message: '工时上限更新成功',
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
      error: error instanceof Error ? error.message : '更新工时上限失败',
    });
  }
}

export async function getAllSettings(req: Request, res: Response) {
  try {
    const settings = await prisma.storeSettings.findFirst();

    const defaultSettings: StoreSettings = {
      id: '',
      daily_workload_limit: 8,
      max_discount_percent: 10,
      max_discount_amount: 100,
      business_start: '10:00',
      business_end: '20:00',
    };

    res.json({
      success: true,
      data: (settings ?? defaultSettings) as unknown as StoreSettings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取门店配置失败',
    });
  }
}

export async function updateSettings(req: Request, res: Response) {
  try {
    const validated = updateSettingsSchema.parse(req.body);

    const existing = await prisma.storeSettings.findFirst();

    let settings;
    if (existing) {
      settings = await prisma.storeSettings.update({
        where: { id: existing.id },
        data: validated,
      });
    } else {
      settings = await prisma.storeSettings.create({
        data: {
          daily_workload_limit: validated.daily_workload_limit ?? 8,
          max_discount_percent: validated.max_discount_percent ?? 10,
          max_discount_amount: validated.max_discount_amount ?? 100,
          business_start: validated.business_start ?? '10:00',
          business_end: validated.business_end ?? '20:00',
        },
      });
    }

    res.json({
      success: true,
      data: settings as unknown as StoreSettings,
      message: '门店配置更新成功',
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
      error: error instanceof Error ? error.message : '更新门店配置失败',
    });
  }
}
