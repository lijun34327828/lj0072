import prisma from './prisma';
import {
  checkTechnicianWorkload,
  getWorkloadLimit,
  getConfirmedBookings,
  calculateCurrentWorkload,
} from '../services/workload.service';
import { calculateOrderPrice } from '../services/pricing.service';
import {
  getAvailableSlots,
  getBusinessHours,
  generateTimeSlots,
  isSlotAvailable,
} from '../services/slot.service';
import { addDurationToTime, parseTimeToFloat } from './time.utils';
import type { Booking, TimeSlot, WorkloadCheckResult, PriceCalculationResult } from '../types';

const TECH_IDS = {
  TECH_001: 'tech_001',
  TECH_002: 'tech_002',
  TECH_003: 'tech_003',
};

const SERVICE_IDS = {
  SVC_001: 'svc_001',
  SVC_006: 'svc_006',
  SVC_007: 'svc_007',
};

const CUSTOMER_ID = 'customer_001';

const COLORS = {
  GREEN: '\x1b[32m',
  RED: '\x1b[31m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  CYAN: '\x1b[36m',
  RESET: '\x1b[0m',
  BOLD: '\x1b[1m',
};

interface TestResult {
  testId: string;
  testName: string;
  testSteps: string[];
  expectedResult: string;
  actualResult: string;
  passed: boolean;
}

let testResults: TestResult[] = [];

function logTestResult(result: TestResult) {
  const status = result.passed
    ? `${COLORS.GREEN}✓ 通过${COLORS.RESET}`
    : `${COLORS.RED}✗ 失败${COLORS.RESET}`;

  console.log(`\n${COLORS.BOLD}${result.testId} - ${result.testName}${COLORS.RESET}`);
  console.log(`${COLORS.CYAN}测试步骤:${COLORS.RESET}`);
  result.testSteps.forEach((step, i) => {
    console.log(`  ${i + 1}. ${step}`);
  });
  console.log(`${COLORS.BLUE}预期结果:${COLORS.RESET} ${result.expectedResult}`);
  console.log(`${COLORS.YELLOW}实际结果:${COLORS.RESET} ${result.actualResult}`);
  console.log(`结果: ${status}`);
}

function logHeader(title: string) {
  console.log(`\n${COLORS.BOLD}${COLORS.CYAN}========== ${title} ==========${COLORS.RESET}`);
}

function logSummary() {
  const total = testResults.length;
  const passed = testResults.filter((r) => r.passed).length;
  const failed = total - passed;

  console.log(`\n${COLORS.BOLD}${COLORS.CYAN}========== 测试汇总 ==========${COLORS.RESET}`);
  console.log(`总测试数: ${total}`);
  console.log(`${COLORS.GREEN}通过数: ${passed}${COLORS.RESET}`);
  console.log(`${COLORS.RED}失败数: ${failed}${COLORS.RESET}`);

  if (failed > 0) {
    console.log(`\n${COLORS.RED}失败的测试:${COLORS.RESET}`);
    testResults
      .filter((r) => !r.passed)
      .forEach((r) => {
        console.log(`  ${r.testId} - ${r.testName}`);
      });
  }
}

async function cleanupTestData() {
  console.log(`${COLORS.YELLOW}清理测试数据...${COLORS.RESET}`);

  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.bookingService.deleteMany({});
  await prisma.booking.deleteMany({});

  console.log(`${COLORS.GREEN}测试数据清理完成${COLORS.RESET}`);
}

async function createTestBooking(
  technicianId: string,
  bookingDate: Date,
  startTime: string,
  serviceIds: string[],
  status: string = 'confirmed'
): Promise<Booking> {
  const services = await prisma.service.findMany({
    where: { id: { in: serviceIds } },
  });
  const totalDuration = services.reduce((sum, s) => sum + s.standard_duration, 0);
  const endTime = addDurationToTime(startTime, totalDuration);

  const booking = await prisma.booking.create({
    data: {
      customer_id: CUSTOMER_ID,
      technician_id: technicianId,
      booking_date: bookingDate,
      start_time: startTime,
      end_time: endTime,
      total_duration: totalDuration,
      status: status,
    },
  });

  await Promise.all(
    services.map((service) =>
      prisma.bookingService.create({
        data: {
          booking_id: booking.id,
          service_id: service.id,
          duration: service.standard_duration,
        },
      })
    )
  );

  return booking as unknown as Booking;
}

async function createTestBookingWithDuration(
  technicianId: string,
  bookingDate: Date,
  startTime: string,
  duration: number,
  status: string = 'confirmed'
): Promise<Booking> {
  const endTime = addDurationToTime(startTime, duration);

  const booking = await prisma.booking.create({
    data: {
      customer_id: CUSTOMER_ID,
      technician_id: technicianId,
      booking_date: bookingDate,
      start_time: startTime,
      end_time: endTime,
      total_duration: duration,
      status: status,
    },
  });

  return booking as unknown as Booking;
}

async function resetStoreSettings() {
  await prisma.storeSettings.update({
    where: { id: 'settings_001' },
    data: {
      daily_workload_limit: 8,
      max_discount_percent: 10,
      max_discount_amount: 100,
      business_start: '10:00',
      business_end: '20:00',
    },
  });
}

async function testTC01(testDate: Date): Promise<TestResult> {
  const testSteps = [
    '创建技师A在今日的2个预约，累计5小时工时',
    '尝试为技师A创建新的2小时预约',
    '验证工时校验结果',
  ];

  try {
    await createTestBookingWithDuration(TECH_IDS.TECH_001, testDate, '10:00', 2.5);
    await createTestBookingWithDuration(TECH_IDS.TECH_001, testDate, '13:00', 2.5);

    const confirmedBookings = await getConfirmedBookings(TECH_IDS.TECH_001, testDate);
    const currentWorkload = calculateCurrentWorkload(confirmedBookings);

    const workloadResult: WorkloadCheckResult = await checkTechnicianWorkload(
      TECH_IDS.TECH_001,
      testDate,
      2
    );

    const totalWorkload = currentWorkload + 2;
    const passed = !workloadResult.is_overloaded && totalWorkload === 7;

    return {
      testId: 'TC01',
      testName: '正常预约，工时未超限',
      testSteps,
      expectedResult: '预约提交成功，累计工时7小时',
      actualResult: `当前工时${currentWorkload}小时，新增2小时后共${totalWorkload}小时，${
        workloadResult.is_overloaded ? '被拦截' : '通过'
      }`,
      passed,
    };
  } catch (error) {
    return {
      testId: 'TC01',
      testName: '正常预约，工时未超限',
      testSteps,
      expectedResult: '预约提交成功，累计工时7小时',
      actualResult: `错误: ${error instanceof Error ? error.message : String(error)}`,
      passed: false,
    };
  }
}

async function testTC02(testDate: Date): Promise<TestResult> {
  const testSteps = [
    '创建技师A在今日的3个预约，累计7小时工时',
    '尝试为技师A创建新的2小时预约',
    '验证工时校验结果和推荐时段',
  ];

  try {
    await createTestBookingWithDuration(TECH_IDS.TECH_001, testDate, '10:00', 2.5);
    await createTestBookingWithDuration(TECH_IDS.TECH_001, testDate, '13:00', 2.5);
    await createTestBookingWithDuration(TECH_IDS.TECH_001, testDate, '16:00', 2);

    const confirmedBookings = await getConfirmedBookings(TECH_IDS.TECH_001, testDate);
    const currentWorkload = calculateCurrentWorkload(confirmedBookings);

    const workloadResult: WorkloadCheckResult = await checkTechnicianWorkload(
      TECH_IDS.TECH_001,
      testDate,
      2
    );

    const passed =
      workloadResult.is_overloaded &&
      workloadResult.available_slots.length > 0 &&
      currentWorkload === 7;

    return {
      testId: 'TC02',
      testName: '工时超限，拦截预约',
      testSteps,
      expectedResult: '预约被拦截，提示"该技师当日工时已达上限"，并推荐其他技师可用时段',
      actualResult: `当前工时${currentWorkload}小时，超限状态: ${workloadResult.is_overloaded}，推荐时段数: ${workloadResult.available_slots.length}`,
      passed,
    };
  } catch (error) {
    return {
      testId: 'TC02',
      testName: '工时超限，拦截预约',
      testSteps,
      expectedResult: '预约被拦截，提示"该技师当日工时已达上限"，并推荐其他技师可用时段',
      actualResult: `错误: ${error instanceof Error ? error.message : String(error)}`,
      passed: false,
    };
  }
}

async function testTC03(testDate: Date): Promise<TestResult> {
  const testSteps = [
    '创建技师A在今日的预约，累计7.5小时工时',
    '尝试为技师A创建新的0.5小时预约',
    '验证工时刚好达到上限',
  ];

  try {
    await createTestBookingWithDuration(TECH_IDS.TECH_001, testDate, '10:00', 3);
    await createTestBookingWithDuration(TECH_IDS.TECH_001, testDate, '14:00', 4.5);

    const confirmedBookings = await getConfirmedBookings(TECH_IDS.TECH_001, testDate);
    const currentWorkload = calculateCurrentWorkload(confirmedBookings);

    const workloadResult: WorkloadCheckResult = await checkTechnicianWorkload(
      TECH_IDS.TECH_001,
      testDate,
      0.5
    );

    const totalWorkload = currentWorkload + 0.5;
    const passed = !workloadResult.is_overloaded && totalWorkload === 8;

    return {
      testId: 'TC03',
      testName: '刚好达到上限',
      testSteps,
      expectedResult: '预约提交成功，累计工时8小时（达到上限）',
      actualResult: `当前工时${currentWorkload}小时，新增0.5小时后共${totalWorkload}小时，${
        workloadResult.is_overloaded ? '被拦截' : '通过'
      }`,
      passed,
    };
  } catch (error) {
    return {
      testId: 'TC03',
      testName: '刚好达到上限',
      testSteps,
      expectedResult: '预约提交成功，累计工时8小时（达到上限）',
      actualResult: `错误: ${error instanceof Error ? error.message : String(error)}`,
      passed: false,
    };
  }
}

async function testTC04(testDate: Date): Promise<TestResult> {
  const testSteps = [
    '将门店工时上限从8小时改为10小时',
    '创建技师A在今日的预约，累计9小时工时',
    '尝试为技师A创建新的1小时预约',
    '验证超限阈值已更新为10小时',
    '恢复原始设置',
  ];

  try {
    await prisma.storeSettings.update({
      where: { id: 'settings_001' },
      data: { daily_workload_limit: 10 },
    });

    await createTestBookingWithDuration(TECH_IDS.TECH_001, testDate, '10:00', 4.5);
    await createTestBookingWithDuration(TECH_IDS.TECH_001, testDate, '15:00', 4.5);

    const newLimit = await getWorkloadLimit();
    const confirmedBookings = await getConfirmedBookings(TECH_IDS.TECH_001, testDate);
    const currentWorkload = calculateCurrentWorkload(confirmedBookings);

    const workloadResult: WorkloadCheckResult = await checkTechnicianWorkload(
      TECH_IDS.TECH_001,
      testDate,
      1
    );

    const totalWorkload = currentWorkload + 1;
    const passed =
      newLimit === 10 && !workloadResult.is_overloaded && totalWorkload === 10;

    await resetStoreSettings();

    return {
      testId: 'TC04',
      testName: '修改门店工时上限',
      testSteps,
      expectedResult: '超限阈值自动更新为10小时',
      actualResult: `新上限${newLimit}小时，当前工时${currentWorkload}小时，新增1小时后共${totalWorkload}小时，${
        workloadResult.is_overloaded ? '被拦截' : '通过'
      }`,
      passed,
    };
  } catch (error) {
    await resetStoreSettings();
    return {
      testId: 'TC04',
      testName: '修改门店工时上限',
      testSteps,
      expectedResult: '超限阈值自动更新为10小时',
      actualResult: `错误: ${error instanceof Error ? error.message : String(error)}`,
      passed: false,
    };
  }
}

async function testTC05(testDate: Date, yesterday: Date): Promise<TestResult> {
  const testSteps = [
    '创建技师A昨日的预约，累计8小时（已满负荷）',
    '尝试为技师A创建今日的预约',
    '验证今日工时从零开始计算',
  ];

  try {
    await createTestBookingWithDuration(TECH_IDS.TECH_001, yesterday, '10:00', 4);
    await createTestBookingWithDuration(TECH_IDS.TECH_001, yesterday, '15:00', 4);

    const yesterdayBookings = await getConfirmedBookings(TECH_IDS.TECH_001, yesterday);
    const yesterdayWorkload = calculateCurrentWorkload(yesterdayBookings);

    const todayBookings = await getConfirmedBookings(TECH_IDS.TECH_001, testDate);
    const todayWorkload = calculateCurrentWorkload(todayBookings);

    const workloadResult: WorkloadCheckResult = await checkTechnicianWorkload(
      TECH_IDS.TECH_001,
      testDate,
      2
    );

    const passed =
      yesterdayWorkload === 8 &&
      todayWorkload === 0 &&
      !workloadResult.is_overloaded &&
      workloadResult.current_workload === 0;

    return {
      testId: 'TC05',
      testName: '跨日预约不影响',
      testSteps,
      expectedResult: '今日工时从零开始计算，不影响预约',
      actualResult: `昨日工时${yesterdayWorkload}小时，今日工时${todayWorkload}小时，新增2小时预约${
        workloadResult.is_overloaded ? '被拦截' : '通过'
      }`,
      passed,
    };
  } catch (error) {
    return {
      testId: 'TC05',
      testName: '跨日预约不影响',
      testSteps,
      expectedResult: '今日工时从零开始计算，不影响预约',
      actualResult: `错误: ${error instanceof Error ? error.message : String(error)}`,
      passed: false,
    };
  }
}

async function testTC06(testDate: Date): Promise<TestResult> {
  const testSteps = [
    '创建包含"基础美甲"服务的预约（1小时×128元）',
    '计算订单价格（无减免）',
    '验证原始总价和最终金额均为128元',
  ];

  try {
    const booking = await createTestBooking(
      TECH_IDS.TECH_001,
      testDate,
      '10:00',
      [SERVICE_IDS.SVC_001]
    );

    const priceResult: PriceCalculationResult = await calculateOrderPrice(booking.id, 0);

    const passed =
      priceResult.original_amount === 128 &&
      priceResult.final_amount === 128 &&
      priceResult.discount_amount === 0;

    return {
      testId: 'TC06',
      testName: '单个服务计价',
      testSteps,
      expectedResult: '原始总价128元，最终金额128元',
      actualResult: `原始总价${priceResult.original_amount}元，减免${priceResult.discount_amount}元，最终${priceResult.final_amount}元`,
      passed,
    };
  } catch (error) {
    return {
      testId: 'TC06',
      testName: '单个服务计价',
      testSteps,
      expectedResult: '原始总价128元，最终金额128元',
      actualResult: `错误: ${error instanceof Error ? error.message : String(error)}`,
      passed: false,
    };
  }
}

async function testTC07(testDate: Date): Promise<TestResult> {
  const testSteps = [
    '创建包含"基础美甲"+"自然款美睫"服务的预约（1×128 + 1.5×298）',
    '计算订单价格（无减免）',
    '验证原始总价为575元（128+447）',
  ];

  try {
    const booking = await createTestBooking(
      TECH_IDS.TECH_001,
      testDate,
      '10:00',
      [SERVICE_IDS.SVC_001, SERVICE_IDS.SVC_006]
    );

    const priceResult: PriceCalculationResult = await calculateOrderPrice(booking.id, 0);

    const expectedOriginal = 128 + 1.5 * 298;
    const passed = Math.abs(priceResult.original_amount - expectedOriginal) < 0.01;

    return {
      testId: 'TC07',
      testName: '多个服务合计',
      testSteps,
      expectedResult: `原始总价${expectedOriginal.toFixed(2)}元（128 + ${(1.5 * 298).toFixed(2)}）`,
      actualResult: `原始总价${priceResult.original_amount.toFixed(2)}元，最终${priceResult.final_amount.toFixed(2)}元`,
      passed,
    };
  } catch (error) {
    return {
      testId: 'TC07',
      testName: '多个服务合计',
      testSteps,
      expectedResult: '原始总价575元（128+447）',
      actualResult: `错误: ${error instanceof Error ? error.message : String(error)}`,
      passed: false,
    };
  }
}

async function testTC08(testDate: Date): Promise<TestResult> {
  const testSteps = [
    '创建总价约500元的预约',
    '录入减免30元',
    '验证最终金额为470元',
  ];

  try {
    const booking = await createTestBooking(
      TECH_IDS.TECH_001,
      testDate,
      '10:00',
      [SERVICE_IDS.SVC_001, SERVICE_IDS.SVC_006, SERVICE_IDS.SVC_007]
    );

    const discountResult: PriceCalculationResult = await calculateOrderPrice(
      booking.id,
      30
    );

    const expectedFinal = discountResult.original_amount - 30;
    const passed =
      discountResult.discount_amount === 30 &&
      Math.abs(discountResult.final_amount - expectedFinal) < 0.01;

    return {
      testId: 'TC08',
      testName: '正常减免金额',
      testSteps,
      expectedResult: `减免30元，最终金额${expectedFinal.toFixed(2)}元`,
      actualResult: `原始${discountResult.original_amount.toFixed(2)}元，减免${discountResult.discount_amount}元，最终${discountResult.final_amount.toFixed(2)}元`,
      passed,
    };
  } catch (error) {
    return {
      testId: 'TC08',
      testName: '正常减免金额',
      testSteps,
      expectedResult: '减免30元，最终金额470元',
      actualResult: `错误: ${error instanceof Error ? error.message : String(error)}`,
      passed: false,
    };
  }
}

async function testTC09(testDate: Date): Promise<TestResult> {
  const testSteps = [
    '创建总价500元的预约',
    '尝试减免100元（20%，超过10%上限）',
    '验证最多减免50元（10%），最终金额450元',
  ];

  try {
    const booking = await createTestBookingWithDuration(
      TECH_IDS.TECH_001,
      testDate,
      '10:00',
      4
    );

    await prisma.bookingService.create({
      data: {
        booking_id: booking.id,
        service_id: SERVICE_IDS.SVC_001,
        duration: 4,
      },
    });

    const priceResult: PriceCalculationResult = await calculateOrderPrice(
      booking.id,
      100
    );

    const maxDiscountPercent = 10;
    const expectedMaxDiscount = priceResult.original_amount * (maxDiscountPercent / 100);
    const expectedFinal = priceResult.original_amount - expectedMaxDiscount;

    const passed =
      priceResult.discount_amount === Math.min(expectedMaxDiscount, 100) &&
      Math.abs(priceResult.final_amount - expectedFinal) < 0.01;

    return {
      testId: 'TC09',
      testName: '减免超限（百分比）',
      testSteps,
      expectedResult: `最多减免${expectedMaxDiscount.toFixed(2)}元（10%），最终金额${expectedFinal.toFixed(2)}元`,
      actualResult: `原始${priceResult.original_amount.toFixed(2)}元，申请减免100元，实际减免${priceResult.discount_amount.toFixed(2)}元，最终${priceResult.final_amount.toFixed(2)}元`,
      passed,
    };
  } catch (error) {
    return {
      testId: 'TC09',
      testName: '减免超限（百分比）',
      testSteps,
      expectedResult: '最多减免50元（10%），最终金额450元',
      actualResult: `错误: ${error instanceof Error ? error.message : String(error)}`,
      passed: false,
    };
  }
}

async function testTC10(testDate: Date): Promise<TestResult> {
  const testSteps = [
    '创建总价2000元的预约',
    '尝试减免300元',
    '验证最多减免100元（金额上限），最终金额1900元',
  ];

  try {
    const booking = await createTestBookingWithDuration(
      TECH_IDS.TECH_001,
      testDate,
      '10:00',
      16
    );

    await prisma.bookingService.create({
      data: {
        booking_id: booking.id,
        service_id: SERVICE_IDS.SVC_007,
        duration: 16,
      },
    });

    const priceResult: PriceCalculationResult = await calculateOrderPrice(
      booking.id,
      300
    );

    const maxDiscountAmount = 100;
    const expectedFinal = priceResult.original_amount - maxDiscountAmount;

    const passed =
      priceResult.discount_amount === maxDiscountAmount &&
      Math.abs(priceResult.final_amount - expectedFinal) < 0.01;

    return {
      testId: 'TC10',
      testName: '减免超限（金额）',
      testSteps,
      expectedResult: `最多减免${maxDiscountAmount}元（金额上限），最终金额${expectedFinal.toFixed(2)}元`,
      actualResult: `原始${priceResult.original_amount.toFixed(2)}元，申请减免300元，实际减免${priceResult.discount_amount.toFixed(2)}元，最终${priceResult.final_amount.toFixed(2)}元`,
      passed,
    };
  } catch (error) {
    return {
      testId: 'TC10',
      testName: '减免超限（金额）',
      testSteps,
      expectedResult: '最多减免100元（金额上限），最终金额1900元',
      actualResult: `错误: ${error instanceof Error ? error.message : String(error)}`,
      passed: false,
    };
  }
}

async function testTC11(testDate: Date): Promise<TestResult> {
  const testSteps = [
    '创建总价500元的预约',
    '录入减免0元',
    '验证最终金额500元，无减免',
  ];

  try {
    const booking = await createTestBooking(
      TECH_IDS.TECH_001,
      testDate,
      '10:00',
      [SERVICE_IDS.SVC_001, SERVICE_IDS.SVC_006, SERVICE_IDS.SVC_007]
    );

    const priceResult: PriceCalculationResult = await calculateOrderPrice(booking.id, 0);

    const passed =
      priceResult.discount_amount === 0 &&
      priceResult.original_amount === priceResult.final_amount;

    return {
      testId: 'TC11',
      testName: '减免金额为0',
      testSteps,
      expectedResult: '最终金额等于原始金额，无减免',
      actualResult: `原始${priceResult.original_amount.toFixed(2)}元，减免${priceResult.discount_amount}元，最终${priceResult.final_amount.toFixed(2)}元`,
      passed,
    };
  } catch (error) {
    return {
      testId: 'TC11',
      testName: '减免金额为0',
      testSteps,
      expectedResult: '最终金额500元，无减免',
      actualResult: `错误: ${error instanceof Error ? error.message : String(error)}`,
      passed: false,
    };
  }
}

async function testTC12(testDate: Date): Promise<TestResult> {
  const testSteps = [
    '创建订单',
    '输入-50元减免',
    '验证系统自动修正为0元，不支持负数减免',
  ];

  try {
    const booking = await createTestBooking(
      TECH_IDS.TECH_001,
      testDate,
      '10:00',
      [SERVICE_IDS.SVC_001]
    );

    const priceResult: PriceCalculationResult = await calculateOrderPrice(
      booking.id,
      -50
    );

    const passed =
      priceResult.discount_amount === 0 &&
      priceResult.original_amount === priceResult.final_amount;

    return {
      testId: 'TC12',
      testName: '负数减免金额',
      testSteps,
      expectedResult: '系统自动修正为0元，不支持负数减免',
      actualResult: `申请减免-50元，实际减免${priceResult.discount_amount}元，最终${priceResult.final_amount.toFixed(2)}元`,
      passed,
    };
  } catch (error) {
    return {
      testId: 'TC12',
      testName: '负数减免金额',
      testSteps,
      expectedResult: '系统自动修正为0元，不支持负数减免',
      actualResult: `错误: ${error instanceof Error ? error.message : String(error)}`,
      passed: false,
    };
  }
}

async function testTC13(testDate: Date): Promise<TestResult> {
  const testSteps = [
    '查询技师A 14:00-15:00 时段的可用状态',
    '验证该时段显示为可用',
  ];

  try {
    const availableSlots: TimeSlot[] = await getAvailableSlots(
      TECH_IDS.TECH_001,
      testDate,
      1
    );

    const slotAvailable = availableSlots.some(
      (s) => s.start === '14:00' && s.end === '15:00'
    );

    const passed = slotAvailable;

    return {
      testId: 'TC13',
      testName: '空闲时段可选',
      testSteps,
      expectedResult: '14:00-15:00 时段显示为可用',
      actualResult: `14:00-15:00 时段${slotAvailable ? '可用' : '不可用'}，可用时段共${availableSlots.length}个`,
      passed,
    };
  } catch (error) {
    return {
      testId: 'TC13',
      testName: '空闲时段可选',
      testSteps,
      expectedResult: '14:00-15:00 时段显示为可用',
      actualResult: `错误: ${error instanceof Error ? error.message : String(error)}`,
      passed: false,
    };
  }
}

async function testTC14(testDate: Date): Promise<TestResult> {
  const testSteps = [
    '创建技师A 14:00-15:00 的预约',
    '查询该时段的可用状态',
    '验证该时段不可用',
  ];

  try {
    await createTestBookingWithDuration(TECH_IDS.TECH_001, testDate, '14:00', 1);

    const availableSlots: TimeSlot[] = await getAvailableSlots(
      TECH_IDS.TECH_001,
      testDate,
      1
    );

    const slotAvailable = availableSlots.some(
      (s) => s.start === '14:00' && s.end === '15:00'
    );

    const passed = !slotAvailable;

    return {
      testId: 'TC14',
      testName: '已预约时段不可选',
      testSteps,
      expectedResult: '14:00-15:00 时段不可用',
      actualResult: `14:00-15:00 时段${slotAvailable ? '可用' : '不可用'}，可用时段共${availableSlots.length}个`,
      passed,
    };
  } catch (error) {
    return {
      testId: 'TC14',
      testName: '已预约时段不可选',
      testSteps,
      expectedResult: '14:00-15:00 时段不可用',
      actualResult: `错误: ${error instanceof Error ? error.message : String(error)}`,
      passed: false,
    };
  }
}

async function testTC15(testDate: Date): Promise<TestResult> {
  const testSteps = [
    '选择14:00开始，时长1.5小时的预约',
    '验证14:00-15:30 时间段被占用',
    '查询15:00时段是否可用',
  ];

  try {
    await createTestBookingWithDuration(TECH_IDS.TECH_001, testDate, '14:00', 1.5);

    const availableSlots1h: TimeSlot[] = await getAvailableSlots(
      TECH_IDS.TECH_001,
      testDate,
      1
    );

    const slot14Available = availableSlots1h.some(
      (s) => s.start === '14:00'
    );
    const slot15Available = availableSlots1h.some(
      (s) => s.start === '15:00'
    );

    const passed = !slot14Available && !slot15Available;

    return {
      testId: 'TC15',
      testName: '跨时段预约',
      testSteps,
      expectedResult: '14:00-15:30 时间段被占用，15:00时段也不可用',
      actualResult: `14:00时段${slot14Available ? '可用' : '不可用'}，15:00时段${slot15Available ? '可用' : '不可用'}`,
      passed,
    };
  } catch (error) {
    return {
      testId: 'TC15',
      testName: '跨时段预约',
      testSteps,
      expectedResult: '14:00-15:30 时间段被占用',
      actualResult: `错误: ${error instanceof Error ? error.message : String(error)}`,
      passed: false,
    };
  }
}

async function testTC16(testDate: Date): Promise<TestResult> {
  const testSteps = [
    '查询营业时间',
    '生成所有时段',
    '验证09:00时段不显示在可选时段中',
  ];

  try {
    const { start: businessStart, end: businessEnd } = await getBusinessHours();
    const allSlots = generateTimeSlots(businessStart, businessEnd, 30);

    const has0900Slot = allSlots.some((s) => s.start === '09:00' || s.start === '09:30');
    const startsAt1000 = allSlots[0]?.start === '10:00';

    const availableSlots: TimeSlot[] = await getAvailableSlots(
      TECH_IDS.TECH_001,
      testDate,
      1
    );

    const availableHas0900 = availableSlots.some(
      (s) => parseTimeToFloat(s.start) < 10
    );

    const passed = !has0900Slot && startsAt1000 && !availableHas0900;

    return {
      testId: 'TC16',
      testName: '非营业时间',
      testSteps,
      expectedResult: `营业时间${businessStart}-${businessEnd}，不显示09:00等非营业时间选项`,
      actualResult: `营业时间${businessStart}-${businessEnd}，第一个时段${allSlots[0]?.start}，${availableHas0900 ? '存在' : '不存在'}早于10:00的可用时段`,
      passed,
    };
  } catch (error) {
    return {
      testId: 'TC16',
      testName: '非营业时间',
      testSteps,
      expectedResult: '不显示非营业时间选项',
      actualResult: `错误: ${error instanceof Error ? error.message : String(error)}`,
      passed: false,
    };
  }
}

async function testTC17(testDate: Date): Promise<TestResult> {
  const testSteps = [
    '创建技师A 14:00-15:00 的预约',
    '尝试创建同一技师同一时段的重复预约',
    '验证系统检测冲突，阻止提交',
  ];

  try {
    await createTestBookingWithDuration(TECH_IDS.TECH_001, testDate, '14:00', 1);

    const dateStr = testDate.toISOString().split('T')[0];
    const existingBookings = await prisma.booking.findMany({
      where: {
        technician_id: TECH_IDS.TECH_001,
        booking_date: {
          gte: new Date(dateStr + 'T00:00:00.000Z'),
          lt: new Date(dateStr + 'T23:59:59.999Z'),
        },
        status: { in: ['pending', 'confirmed'] },
      },
    });

    const startTimeFloat = parseTimeToFloat('14:00');
    const endTimeFloat = parseTimeToFloat('15:00');

    let hasConflict = false;
    for (const booking of existingBookings) {
      const bookingStart = parseTimeToFloat(booking.start_time);
      const bookingEnd = parseTimeToFloat(booking.end_time);
      if (startTimeFloat < bookingEnd && endTimeFloat > bookingStart) {
        hasConflict = true;
        break;
      }
    }

    const availableSlots: TimeSlot[] = await getAvailableSlots(
      TECH_IDS.TECH_001,
      testDate,
      1
    );
    const slotAvailable = availableSlots.some(
      (s) => s.start === '14:00'
    );

    const passed = hasConflict && !slotAvailable;

    return {
      testId: 'TC17',
      testName: '时段冲突检测',
      testSteps,
      expectedResult: '系统检测冲突，阻止提交',
      actualResult: `冲突检测: ${hasConflict ? '检测到冲突' : '未检测到冲突'}，14:00时段${slotAvailable ? '仍可用' : '已被占用'}`,
      passed,
    };
  } catch (error) {
    return {
      testId: 'TC17',
      testName: '时段冲突检测',
      testSteps,
      expectedResult: '系统检测冲突，阻止提交',
      actualResult: `错误: ${error instanceof Error ? error.message : String(error)}`,
      passed: false,
    };
  }
}

export async function runAllTests() {
  console.log(`${COLORS.BOLD}${COLORS.CYAN}========================================${COLORS.RESET}`);
  console.log(`${COLORS.BOLD}${COLORS.CYAN}  美甲店预约系统业务逻辑测试脚本${COLORS.RESET}`);
  console.log(`${COLORS.BOLD}${COLORS.CYAN}  TC01 - TC17 全场景测试${COLORS.RESET}`);
  console.log(`${COLORS.BOLD}${COLORS.CYAN}========================================${COLORS.RESET}`);

  const testDate = new Date();
  testDate.setHours(0, 0, 0, 0);

  const tomorrow = new Date(testDate);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const yesterday = new Date(testDate);
  yesterday.setDate(yesterday.getDate() - 1);

  await resetStoreSettings();
  await cleanupTestData();

  testResults = [];

  logHeader('7.1 工时负荷校验场景');
  let result;

  await cleanupTestData();
  result = await testTC01(testDate);
  testResults.push(result);
  logTestResult(result);

  await cleanupTestData();
  result = await testTC02(testDate);
  testResults.push(result);
  logTestResult(result);

  await cleanupTestData();
  result = await testTC03(testDate);
  testResults.push(result);
  logTestResult(result);

  await cleanupTestData();
  result = await testTC04(testDate);
  testResults.push(result);
  logTestResult(result);

  await cleanupTestData();
  result = await testTC05(testDate, yesterday);
  testResults.push(result);
  logTestResult(result);

  logHeader('7.2 订单计价场景');

  await cleanupTestData();
  result = await testTC06(testDate);
  testResults.push(result);
  logTestResult(result);

  await cleanupTestData();
  result = await testTC07(testDate);
  testResults.push(result);
  logTestResult(result);

  await cleanupTestData();
  result = await testTC08(testDate);
  testResults.push(result);
  logTestResult(result);

  await cleanupTestData();
  result = await testTC09(testDate);
  testResults.push(result);
  logTestResult(result);

  await cleanupTestData();
  result = await testTC10(testDate);
  testResults.push(result);
  logTestResult(result);

  await cleanupTestData();
  result = await testTC11(testDate);
  testResults.push(result);
  logTestResult(result);

  await cleanupTestData();
  result = await testTC12(testDate);
  testResults.push(result);
  logTestResult(result);

  logHeader('7.3 时段选择场景');

  await cleanupTestData();
  result = await testTC13(testDate);
  testResults.push(result);
  logTestResult(result);

  await cleanupTestData();
  result = await testTC14(testDate);
  testResults.push(result);
  logTestResult(result);

  await cleanupTestData();
  result = await testTC15(testDate);
  testResults.push(result);
  logTestResult(result);

  await cleanupTestData();
  result = await testTC16(testDate);
  testResults.push(result);
  logTestResult(result);

  await cleanupTestData();
  result = await testTC17(testDate);
  testResults.push(result);
  logTestResult(result);

  logSummary();

  await prisma.$disconnect();
}

if (import.meta.url.startsWith('file:')) {
  const modulePath = process.argv[1];
  const isMain = import.meta.url === `file://${modulePath}` || 
                 import.meta.url === `file:///${modulePath.replace(/\\/g, '/')}`;
  if (isMain) {
    runAllTests().catch((e) => {
      console.error(e);
      process.exit(1);
    });
  }
}
