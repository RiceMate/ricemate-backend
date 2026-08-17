import prisma from '../lib/prisma';
import { AppError } from '../utils/errors';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SubmitExpenseDto {
  date: string; // YYYY-MM-DD
  expenseId: number;
  expenseTemplateId?: number;
  quantity: number;
  unitPrice: number;
  amount: number;
  description?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseDate(dateStr: string): Date {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) throw new AppError(`Invalid date: ${dateStr}`, 400);
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}

// ─── Service Functions ────────────────────────────────────────────────────────

/**
 * Returns top-level expense categories (parentId = null, isActive = true).
 */
export async function getRootCategories() {
  return prisma.expense.findMany({
    where: { parentId: null, isActive: true },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      description: true,
      _count: { select: { children: { where: { isActive: true } } } },
    },
  });
}

/**
 * Returns active children of a given expense category.
 * The `hasChildren` flag tells the frontend whether to drill down further.
 */
export async function getCategoryChildren(parentId: number) {
  const parent = await prisma.expense.findUnique({ where: { id: parentId } });
  if (!parent) throw new AppError(`Expense category ${parentId} not found.`, 404);

  return prisma.expense.findMany({
    where: { parentId, isActive: true },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      description: true,
      _count: { select: { children: { where: { isActive: true } } } },
    },
  });
}

/**
 * Checks whether any expense entries exist for a given date.
 */
export async function checkExpensesForDate(dateStr: string) {
  const date = parseDate(dateStr);
  const entries = await prisma.expenseInstance.findMany({
    where: { date },
    include: {
      expense: { select: { id: true, name: true } },
    },
    orderBy: { id: 'asc' },
  });
  return { submitted: entries.length > 0, entries };
}

/**
 * Submits a single expense entry.
 */
export async function submitExpense(dto: SubmitExpenseDto, userId: number) {
  const date = parseDate(dto.date);

  const category = await prisma.expense.findUnique({ where: { id: dto.expenseId } });
  if (!category || !category.isActive) {
    throw new AppError(`Expense category ${dto.expenseId} not found or inactive.`, 404);
  }

  return prisma.expenseInstance.create({
    data: {
      date,
      expenseId: dto.expenseId,
      expenseTemplateId: dto.expenseTemplateId ?? null,
      quantity: dto.quantity,
      unitPrice: dto.unitPrice,
      amount: dto.amount,
      description: dto.description ?? null,
      createdById: userId,
    },
    include: {
      expense: { select: { id: true, name: true } },
    },
  });
}

/**
 * Updates an existing expense entry.
 */
export async function updateExpense(
  id: number,
  dto: Partial<SubmitExpenseDto>,
  userId: number
) {
  const existing = await prisma.expenseInstance.findUnique({ where: { id } });
  if (!existing) throw new AppError(`Expense entry ${id} not found.`, 404);

  return prisma.expenseInstance.update({
    where: { id },
    data: {
      ...(dto.date
        ? { date: parseDate(dto.date) }
        : {}),
      ...(dto.expenseId !== undefined ? { expenseId: dto.expenseId } : {}),
      ...(dto.quantity !== undefined ? { quantity: dto.quantity } : {}),
      ...(dto.unitPrice !== undefined ? { unitPrice: dto.unitPrice } : {}),
      ...(dto.amount !== undefined ? { amount: dto.amount } : {}),
      ...(dto.description !== undefined ? { description: dto.description } : {}),
      updatedById: userId,
    },
    include: {
      expense: { select: { id: true, name: true } },
    },
  });
}

/**
 * Deletes an expense entry.
 */
export async function deleteExpense(id: number) {
  const existing = await prisma.expenseInstance.findUnique({ where: { id } });
  if (!existing) throw new AppError(`Expense entry ${id} not found.`, 404);
  await prisma.expenseInstance.delete({ where: { id } });
  return { deleted: true, id };
}
