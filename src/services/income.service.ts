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
 * Returns income sources with their default parcel price.
 */
export async function getActiveSources(includeInactive = false) {
  return prisma.incomeSource.findMany({
    where: includeInactive ? {} : { isActive: true },
    orderBy: { id: 'asc' },
    select: {
      id: true,
      name: true,
      nameSi: true,
      description: true,
      descriptionSi: true,
      defaultParcelPrice: true,
      isActive: true,
    },
  });
}

/**
 * Creates a new income source.
 */
export async function createIncomeSource(
  data: {
    name: string;
    nameSi?: string;
    description?: string;
    descriptionSi?: string;
    defaultParcelPrice?: number;
    isActive?: boolean;
  },
  userId: number
) {
  if (!data.name?.trim()) {
    throw new AppError('Income source name is required.', 400);
  }

  return prisma.incomeSource.create({
    data: {
      name: data.name.trim(),
      nameSi: data.nameSi?.trim() || null,
      description: data.description?.trim() || null,
      descriptionSi: data.descriptionSi?.trim() || null,
      defaultParcelPrice: new Decimal(data.defaultParcelPrice ?? 170),
      isActive: data.isActive ?? true,
      createdById: userId,
    },
  });
}

/**
 * Updates an existing income source.
 */
export async function updateIncomeSource(
  id: number,
  data: {
    name?: string;
    nameSi?: string;
    description?: string;
    descriptionSi?: string;
    defaultParcelPrice?: number;
    isActive?: boolean;
  },
  userId: number
) {
  const existing = await prisma.incomeSource.findUnique({ where: { id } });
  if (!existing) throw new AppError(`Income source ${id} not found.`, 404);

  return prisma.incomeSource.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name.trim() } : {}),
      ...(data.nameSi !== undefined ? { nameSi: data.nameSi?.trim() || null } : {}),
      ...(data.description !== undefined ? { description: data.description?.trim() || null } : {}),
      ...(data.descriptionSi !== undefined ? { descriptionSi: data.descriptionSi?.trim() || null } : {}),
      ...(data.defaultParcelPrice !== undefined ? { defaultParcelPrice: new Decimal(data.defaultParcelPrice) } : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      updatedById: userId,
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
