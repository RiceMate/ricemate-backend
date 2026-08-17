import prisma from '../lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toNum(d: Decimal | null): number {
  return d ? Number(d) : 0;
}

/** Returns UTC midnight Date for a YYYY-MM-DD string */
function utcDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/** Format YYYY-MM-DD from a Date */
function fmt(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// ─── Aggregation Helpers ──────────────────────────────────────────────────────

async function sumIncome(gte: Date, lte: Date): Promise<number> {
  const result = await prisma.incomeInstance.aggregate({
    where: { date: { gte, lte } },
    _sum: { amount: true },
  });
  return toNum(result._sum.amount);
}

async function sumExpenses(gte: Date, lte: Date): Promise<number> {
  const result = await prisma.expenseInstance.aggregate({
    where: { date: { gte, lte } },
    _sum: { amount: true },
  });
  return toNum(result._sum.amount);
}

// ─── Service Functions ────────────────────────────────────────────────────────

/**
 * Today's income, expenses, and profit.
 */
export async function getTodaySummary() {
  const today = utcDate(new Date().toISOString().slice(0, 10));
  const income   = await sumIncome(today, today);
  const expenses = await sumExpenses(today, today);
  return {
    date: fmt(today),
    income,
    expenses,
    profit: income - expenses,
  };
}

/**
 * Daily profit for the 7 days ending on `dateStr` (or today if omitted).
 * Returns an array of { date, income, expenses, profit } — one entry per day.
 */
export async function getDailySummary(dateStr?: string) {
  const endDate = utcDate(dateStr ?? new Date().toISOString().slice(0, 10));
  const days: { date: string; income: number; expenses: number; profit: number }[] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(endDate);
    d.setUTCDate(d.getUTCDate() - i);
    const income   = await sumIncome(d, d);
    const expenses = await sumExpenses(d, d);
    days.push({ date: fmt(d), income, expenses, profit: income - expenses });
  }

  return days;
}

/**
 * Weekly breakdown for a given month.
 * Returns [W1, W2, W3, W4] — each week is a 7-day range within the month.
 */
export async function getMonthlySummary(year: number, month: number) {
  // month is 1-indexed
  const weeks: { week: string; startDate: string; endDate: string; income: number; expenses: number; profit: number }[] = [];

  const monthStart = new Date(Date.UTC(year, month - 1, 1));
  const monthEnd   = new Date(Date.UTC(year, month, 0)); // last day of month

  let weekStart = new Date(monthStart);
  let weekNum = 1;

  while (weekStart <= monthEnd) {
    const weekEnd = new Date(weekStart);
    weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);
    if (weekEnd > monthEnd) weekEnd.setTime(monthEnd.getTime());

    const income   = await sumIncome(weekStart, weekEnd);
    const expenses = await sumExpenses(weekStart, weekEnd);

    weeks.push({
      week: `W${weekNum}`,
      startDate: fmt(weekStart),
      endDate: fmt(weekEnd),
      income,
      expenses,
      profit: income - expenses,
    });

    weekStart = new Date(weekEnd);
    weekStart.setUTCDate(weekStart.getUTCDate() + 1);
    weekNum++;
  }

  return weeks;
}

/**
 * Monthly breakdown for a given year.
 * Returns Jan–Dec — each month's total income, expenses, and profit.
 */
export async function getYearlySummary(year: number) {
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const result = [];

  for (let m = 0; m < 12; m++) {
    const start = new Date(Date.UTC(year, m, 1));
    const end   = new Date(Date.UTC(year, m + 1, 0)); // last day

    const income   = await sumIncome(start, end);
    const expenses = await sumExpenses(start, end);

    result.push({
      month: MONTHS[m],
      monthNum: m + 1,
      income,
      expenses,
      profit: income - expenses,
    });
  }

  return result;
}
