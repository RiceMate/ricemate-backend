import prisma from '../lib/prisma';
import { AppError } from '../utils/errors';
import { Decimal } from '@prisma/client/runtime/library';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface IncomeEntry {
  sourceId: number;
  parcelCount: number;
  description?: string;
}

export interface SubmitIncomeDto {
  date: string; // YYYY-MM-DD
  entries: IncomeEntry[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseDate(dateStr: string): Date {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) throw new AppError(`Invalid date: ${dateStr}`, 400);
  // Normalize to midnight UTC to match @db.Date
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}

// ─── Service Functions ────────────────────────────────────────────────────────

/**
 * Returns all active income sources with their default parcel price.
 */
export async function getActiveSources() {
  return prisma.incomeSource.findMany({
    where: { isActive: true },
    orderBy: { id: 'asc' },
    select: {
      id: true,
      name: true,
      description: true,
      defaultParcelPrice: true,
    },
  });
}

/**
 * Checks whether income has already been submitted for a given date.
 */
export async function checkIncomeForDate(dateStr: string) {
  const date = parseDate(dateStr);
  const entries = await prisma.incomeInstance.findMany({
    where: { date },
    include: { source: { select: { id: true, name: true } } },
    orderBy: { sourceId: 'asc' },
  });
  return { submitted: entries.length > 0, entries };
}

/**
 * Submit income for a date.
 * Throws 409 if income already exists for that date (use override instead).
 */
export async function submitIncome(dto: SubmitIncomeDto, userId: number) {
  const date = parseDate(dto.date);

  // Guard: already submitted?
  const existing = await prisma.incomeInstance.findFirst({ where: { date } });
  if (existing) {
    throw new AppError(
      `Income for ${dto.date} has already been submitted. Use the override endpoint to update it.`,
      409
    );
  }

  // Fetch source prices
  const sources = await prisma.incomeSource.findMany({
    where: { id: { in: dto.entries.map((e) => e.sourceId) }, isActive: true },
    select: { id: true, defaultParcelPrice: true },
  });

  const priceMap = new Map(sources.map((s) => [s.id, s.defaultParcelPrice]));

  const data = dto.entries.map((entry) => {
    const price = priceMap.get(entry.sourceId);
    if (price === undefined) {
      throw new AppError(`Income source ${entry.sourceId} not found or inactive.`, 404);
    }
    const amount = new Decimal(entry.parcelCount).mul(price);
    return {
      date,
      sourceId: entry.sourceId,
      parcelCount: entry.parcelCount,
      amount,
      description: entry.description ?? null,
      createdById: userId,
    };
  });

  // Insert all entries in a transaction
  const created = await prisma.$transaction(
    data.map((d) => prisma.incomeInstance.create({ data: d }))
  );

  return created;
}

/**
 * Override (replace) all income entries for a given date.
 */
export async function overrideIncome(dateStr: string, dto: SubmitIncomeDto, userId: number) {
  const date = parseDate(dateStr);

  // Fetch source prices
  const sources = await prisma.incomeSource.findMany({
    where: { id: { in: dto.entries.map((e) => e.sourceId) }, isActive: true },
    select: { id: true, defaultParcelPrice: true },
  });
  const priceMap = new Map(sources.map((s) => [s.id, s.defaultParcelPrice]));

  const data = dto.entries.map((entry) => {
    const price = priceMap.get(entry.sourceId);
    if (price === undefined) {
      throw new AppError(`Income source ${entry.sourceId} not found or inactive.`, 404);
    }
    const amount = new Decimal(entry.parcelCount).mul(price);
    return {
      date,
      sourceId: entry.sourceId,
      parcelCount: entry.parcelCount,
      amount,
      description: entry.description ?? null,
      createdById: userId,
    };
  });

  // Delete existing + insert new in one transaction
  const [, ...created] = await prisma.$transaction([
    prisma.incomeInstance.deleteMany({ where: { date } }),
    ...data.map((d) => prisma.incomeInstance.create({ data: d })),
  ]);

  return created;
}
