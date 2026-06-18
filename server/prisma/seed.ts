import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  console.log('Cleaning existing data...');
  try {
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.bookingService.deleteMany();
    await prisma.booking.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.service.deleteMany();
    await prisma.technician.deleteMany();
    await prisma.storeSettings.deleteMany();
  } catch (e) {
    console.log('Tables not exist, skipping cleanup...');
  }

  console.log('Seeding store settings...');
  await prisma.storeSettings.create({
    data: {
      id: 'settings_001',
      daily_workload_limit: 8,
      max_discount_percent: 10,
      max_discount_amount: 100,
      business_start: '10:00',
      business_end: '20:00',
    },
  });

  console.log('Seeding technicians...');
  await prisma.technician.createMany({
    data: [
      {
        id: 'tech_001',
        name: '李美美',
        employee_no: 'T001',
        skills: '美甲,美睫,手足护理',
        rating: 4.9,
        is_active: true,
      },
      {
        id: 'tech_002',
        name: '王芳芳',
        employee_no: 'T002',
        skills: '美甲,彩绘,光疗甲',
        rating: 4.8,
        is_active: true,
      },
      {
        id: 'tech_003',
        name: '张婷婷',
        employee_no: 'T003',
        skills: '美睫,纹绣,孕睫术',
        rating: 4.7,
        is_active: true,
      },
    ],
  });

  console.log('Seeding services...');
  await prisma.service.createMany({
    data: [
      {
        id: 'svc_001',
        name: '基础美甲',
        category: 'manicure',
        standard_duration: 1,
        hourly_rate: 128,
        description: '指甲修剪、去死皮、抛光、涂纯色甲油',
        is_active: true,
      },
      {
        id: 'svc_002',
        name: '光疗甲',
        category: 'manicure',
        standard_duration: 1.5,
        hourly_rate: 258,
        description: '持久光疗胶，色泽饱满，保持4-6周',
        is_active: true,
      },
      {
        id: 'svc_003',
        name: '法式美甲',
        category: 'manicure',
        standard_duration: 1.5,
        hourly_rate: 198,
        description: '经典法式微笑线，优雅大方',
        is_active: true,
      },
      {
        id: 'svc_004',
        name: '美甲彩绘',
        category: 'manicure',
        standard_duration: 2,
        hourly_rate: 328,
        description: '手绘图案、钻饰搭配，个性定制',
        is_active: true,
      },
      {
        id: 'svc_005',
        name: '足部美甲',
        category: 'manicure',
        standard_duration: 1.5,
        hourly_rate: 228,
        description: '足部指甲修剪、去死皮、涂甲油',
        is_active: true,
      },
      {
        id: 'svc_006',
        name: '自然款美睫',
        category: 'eyelash',
        standard_duration: 1.5,
        hourly_rate: 298,
        description: '80-100根/眼，自然纤长',
        is_active: true,
      },
      {
        id: 'svc_007',
        name: '浓密款美睫',
        category: 'eyelash',
        standard_duration: 2,
        hourly_rate: 398,
        description: '120-140根/眼，卷翘浓密',
        is_active: true,
      },
      {
        id: 'svc_008',
        name: '开花美睫',
        category: 'eyelash',
        standard_duration: 2.5,
        hourly_rate: 498,
        description: '3D开花技术，蓬松自然',
        is_active: true,
      },
      {
        id: 'svc_009',
        name: '睫毛修复',
        category: 'eyelash',
        standard_duration: 1,
        hourly_rate: 128,
        description: '修补掉落睫毛，保持完美效果',
        is_active: true,
      },
      {
        id: 'svc_010',
        name: '手部护理',
        category: 'care',
        standard_duration: 1,
        hourly_rate: 168,
        description: '去角质、手膜、按摩，滋润保湿',
        is_active: true,
      },
      {
        id: 'svc_011',
        name: '足部护理',
        category: 'care',
        standard_duration: 1.5,
        hourly_rate: 228,
        description: '去角质、足膜、按摩，舒缓疲劳',
        is_active: true,
      },
    ],
  });

  console.log('Seeding customer...');
  await prisma.customer.create({
    data: {
      id: 'customer_001',
      name: '张小姐',
      phone: '13800000001',
      points: 0,
    },
  });

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
