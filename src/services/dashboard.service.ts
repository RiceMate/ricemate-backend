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

/**
 * Resolves Date range { start, end } based on params (date OR year+month OR year)
 */
function resolveDateRange(params: { date?: string; year?: number; month?: number }): { start: Date; end: Date } {
  if (params.date) {
    const d = utcDate(params.date);
    return { start: d, end: d };
  }
  if (params.year && params.month) {
    const start = new Date(Date.UTC(params.year, params.month - 1, 1));
    const end = new Date(Date.UTC(params.year, params.month, 0));
    return { start, end };
  }
  if (params.year) {
    const start = new Date(Date.UTC(params.year, 0, 1));
    const end = new Date(Date.UTC(params.year, 11, 31));
    return { start, end };
  }
  // Default to today
  const today = utcDate(new Date().toISOString().slice(0, 10));
  return { start: today, end: today };
}

/**
 * Returns income broken down by income sources for a given period.
 */
export async function getIncomeSourcesSummary(params: { date?: string; year?: number; month?: number }) {
  const { start, end } = resolveDateRange(params);

  const instances = await prisma.incomeInstance.findMany({
    where: {
      date: { gte: start, lte: end },
    },
    include: {
      source: {
        select: {
          id: true,
          name: true,
          nameSi: true,
          unit: {
            select: {
              symbol: true,
              symbolSi: true,
            },
          },
        },
      },
    },
  });

  const map = new Map<number, {
    sourceId: number;
    name: string;
    nameSi: string | null;
    amount: number;
    parcelCount: number;
    unitSymbol: string;
    unitSymbolSi: string | null;
  }>();

  for (const inst of instances) {
    const sourceId = inst.sourceId;
    const existing = map.get(sourceId);
    const amt = toNum(inst.amount);
    const count = inst.parcelCount;

    if (existing) {
      existing.amount += amt;
      existing.parcelCount += count;
    } else {
      map.set(sourceId, {
        sourceId,
        name: inst.source.name,
        nameSi: inst.source.nameSi,
        amount: amt,
        parcelCount: count,
        unitSymbol: inst.source.unit?.symbol || 'parcel',
        unitSymbolSi: inst.source.unit?.symbolSi || 'පාර්සල්',
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => b.amount - a.amount);
}

/**
 * Returns expenses broken down by categories for a given period.
 */
export async function getExpenseBreakdownSummary(params: { date?: string; year?: number; month?: number }) {
  const { start, end } = resolveDateRange(params);

  const instances = await prisma.expenseInstance.findMany({
    where: {
      date: { gte: start, lte: end },
    },
    include: {
      expense: {
        select: {
          id: true,
          name: true,
          nameSi: true,
        },
      },
      expenseTemplate: {
        select: {
          unit: {
            select: {
              symbol: true,
              symbolSi: true,
            },
          },
        },
      },
    },
  });

  const map = new Map<number, {
    expenseId: number;
    name: string;
    nameSi: string | null;
    amount: number;
    quantity: number;
    unitSymbol: string;
    unitSymbolSi: string | null;
  }>();

  for (const inst of instances) {
    const expenseId = inst.expenseId;
    const existing = map.get(expenseId);
    const amt = toNum(inst.amount);
    const qty = toNum(inst.quantity);

    if (existing) {
      existing.amount += amt;
      existing.quantity += qty;
    } else {
      map.set(expenseId, {
        expenseId,
        name: inst.expense.name,
        nameSi: inst.expense.nameSi,
        amount: amt,
        quantity: qty,
        unitSymbol: inst.expenseTemplate?.unit?.symbol || '',
        unitSymbolSi: inst.expenseTemplate?.unit?.symbolSi || null,
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => b.amount - a.amount);
}
