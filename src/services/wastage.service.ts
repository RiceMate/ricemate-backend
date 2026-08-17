import prisma from '../lib/prisma';
import { AppError } from '../utils/errors';
import { Decimal } from '@prisma/client/runtime/library';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WastageEntry {
  sourceId?: number;
  expenseId?: number;
  parcelCount?: number;
  quantity?: number;
  unitPrice?: number;
  amount?: number;
  reason?: string;
  description?: string;
}

export interface SubmitWastageDto {
  date: string; // YYYY-MM-DD
  entries: WastageEntry[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseDate(dateStr: string): Date {
  const parts = dateStr.slice(0, 10).split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) {
    throw new AppError(`Invalid date: ${dateStr}`, 400);
  }
  return new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
}

// ─── Service Functions ────────────────────────────────────────────────────────

/**
 * Checks whether wastage has already been submitted for a given date.
 */
export async function checkWastageForDate(dateStr: string) {
  const date = parseDate(dateStr);
  const entries = await prisma.wastage.findMany({
    where: { date },
    include: {
      source: { select: { id: true, name: true, nameSi: true, defaultParcelPrice: true } },
      expense: { select: { id: true, name: true, nameSi: true } },
    },
    orderBy: { id: 'asc' },
  });
  return { submitted: entries.length > 0, entries };
}

/**
 * Submits wastage entries for a given date.
 * Throws 409 if entries already exist for that date.
 */
export async function submitWastage(dto: SubmitWastageDto, userId: number) {
  const date = parseDate(dto.date);

  const existing = await prisma.wastage.findFirst({ where: { date } });
  if (existing) {
    throw new AppError(
      `Wastage for ${dto.date} has already been submitted. Use the override endpoint to update it.`,
      409
    );
  }

  // Fetch source prices if needed
  const sourceIds = dto.entries.map((e) => e.sourceId).filter((id): id is number => typeof id === 'number');
  const sources = sourceIds.length > 0
    ? await prisma.incomeSource.findMany({
        where: { id: { in: sourceIds } },
        select: { id: true, defaultParcelPrice: true },
      })
    : [];

  const priceMap = new Map(sources.map((s) => [s.id, s.defaultParcelPrice]));

  const data = dto.entries.map((entry) => {
    let amount = new Decimal(entry.amount ?? 0);
    if (entry.sourceId && priceMap.has(entry.sourceId) && entry.parcelCount) {
      const price = priceMap.get(entry.sourceId)!;
      amount = new Decimal(entry.parcelCount).mul(price);
    }

    return {
      date,
      sourceId: entry.sourceId ?? null,
      expenseId: entry.expenseId ?? null,
      parcelCount: entry.parcelCount ?? 0,
      quantity: entry.quantity !== undefined ? new Decimal(entry.quantity) : null,
      unitPrice: entry.unitPrice !== undefined ? new Decimal(entry.unitPrice) : null,
      amount,
      reason: entry.reason ?? null,
      description: entry.description ?? null,
      createdById: userId,
    };
  });

  // Insert all entries in a transaction
  const created = await prisma.$transaction(
    data.map((d) =>
      prisma.wastage.create({
        data: d,
        include: {
          source: { select: { id: true, name: true, nameSi: true } },
          expense: { select: { id: true, name: true, nameSi: true } },
        },
      })
    )
  );

  return created;
}

/**
 * Override (replace) all wastage entries for a given date.
 */
export async function overrideWastage(dateStr: string, dto: SubmitWastageDto, userId: number) {
  const date = parseDate(dateStr);

  const sourceIds = dto.entries.map((e) => e.sourceId).filter((id): id is number => typeof id === 'number');
  const sources = sourceIds.length > 0
    ? await prisma.incomeSource.findMany({
        where: { id: { in: sourceIds } },
        select: { id: true, defaultParcelPrice: true },
      })
    : [];

  const priceMap = new Map(sources.map((s) => [s.id, s.defaultParcelPrice]));

  const data = dto.entries.map((entry) => {
    let amount = new Decimal(entry.amount ?? 0);
    if (entry.sourceId && priceMap.has(entry.sourceId) && entry.parcelCount) {
      const price = priceMap.get(entry.sourceId)!;
      amount = new Decimal(entry.parcelCount).mul(price);
    }

    return {
      date,
      sourceId: entry.sourceId ?? null,
      expenseId: entry.expenseId ?? null,
      parcelCount: entry.parcelCount ?? 0,
      quantity: entry.quantity !== undefined ? new Decimal(entry.quantity) : null,
      unitPrice: entry.unitPrice !== undefined ? new Decimal(entry.unitPrice) : null,
      amount,
      reason: entry.reason ?? null,
      description: entry.description ?? null,
      createdById: userId,
    };
  });

  // Delete existing + insert new in one transaction
  const [, ...created] = await prisma.$transaction([
    prisma.wastage.deleteMany({ where: { date } }),
    ...data.map((d) =>
      prisma.wastage.create({
        data: d,
        include: {
          source: { select: { id: true, name: true, nameSi: true } },
          expense: { select: { id: true, name: true, nameSi: true } },
        },
      })
    ),
  ]);

  return created;
}

/**
 * Returns recent wastage logs.
 */
export async function getWastageHistory(limit = 30) {
  return prisma.wastage.findMany({
    take: limit,
    orderBy: [{ date: 'desc' }, { id: 'desc' }],
    include: {
      source: { select: { id: true, name: true, nameSi: true } },
      expense: { select: { id: true, name: true, nameSi: true } },
    },
  });
}
