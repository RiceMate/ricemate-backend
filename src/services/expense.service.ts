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
 * Returns top-level expense categories (parentId = null).
 */
export async function getRootCategories(includeInactive = false) {
  return prisma.expense.findMany({
    where: {
      parentId: null,
      ...(includeInactive ? {} : { isActive: true }),
    },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      nameSi: true,
      description: true,
      descriptionSi: true,
      isActive: true,
      _count: {
        select: {
          children: includeInactive ? true : { where: { isActive: true } },
        },
      },
      expenseTemplates: {
        where: includeInactive ? {} : { isActive: true },
        select: {
          id: true,
          unitId: true,
          defaultUnitPrice: true,
          isActive: true,
          unit: {
            select: {
              id: true,
              unitCategoryId: true,
              name: true,
              nameSi: true,
              symbol: true,
              symbolSi: true,
              unitCategory: {
                select: {
                  id: true,
                  name: true,
                  nameSi: true,
                },
              },
            },
          },
        },
      },
    },
  });
}

/**
 * Returns children of a given expense category.
 */
export async function getCategoryChildren(parentId: number, includeInactive = false) {
  const parent = await prisma.expense.findUnique({ where: { id: parentId } });
  if (!parent) throw new AppError(`Expense category ${parentId} not found.`, 404);

  return prisma.expense.findMany({
    where: {
      parentId,
      ...(includeInactive ? {} : { isActive: true }),
    },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      nameSi: true,
      description: true,
      descriptionSi: true,
      isActive: true,
      parentId: true,
      _count: {
        select: {
          children: includeInactive ? true : { where: { isActive: true } },
        },
      },
      expenseTemplates: {
        where: includeInactive ? {} : { isActive: true },
        select: {
          id: true,
          unitId: true,
          defaultUnitPrice: true,
          isActive: true,
          unit: {
            select: {
              id: true,
              unitCategoryId: true,
              name: true,
              nameSi: true,
              symbol: true,
              symbolSi: true,
              unitCategory: {
                select: {
                  id: true,
                  name: true,
                  nameSi: true,
                },
              },
            },
          },
        },
      },
    },
  });
}

/**
 * Creates a new expense category and optional expense_template.
 */
export async function createExpenseCategory(
  data: {
    name: string;
    nameSi?: string;
    description?: string;
    descriptionSi?: string;
    parentId?: number | null;
    unitId?: number;
    defaultUnitPrice?: number;
    isActive?: boolean;
  },
  userId: number
) {
  if (!data.name?.trim()) {
    throw new AppError('Category name is required.', 400);
  }

  if (data.parentId) {
    const parent = await prisma.expense.findUnique({ where: { id: data.parentId } });
    if (!parent) throw new AppError(`Parent category ${data.parentId} not found.`, 404);
  }

  const category = await prisma.expense.create({
    data: {
      name: data.name.trim(),
      nameSi: data.nameSi?.trim() || null,
      description: data.description?.trim() || null,
      descriptionSi: data.descriptionSi?.trim() || null,
      parentId: data.parentId ?? null,
      isActive: data.isActive ?? true,
      createdById: userId,
    },
  });

  if (data.unitId) {
    await prisma.expenseTemplate.create({
      data: {
        expenseId: category.id,
        name: category.name,
        unitId: Number(data.unitId),
        defaultUnitPrice: data.defaultUnitPrice ? Number(data.defaultUnitPrice) : 0,
        isActive: true,
        createdById: userId,
      },
    });
  }

  return category;
}

/**
 * Updates an existing expense category and updates expense_template accordingly.
 */
export async function updateExpenseCategory(
  id: number,
  data: {
    name?: string;
    nameSi?: string;
    description?: string;
    descriptionSi?: string;
    parentId?: number | null;
    unitId?: number | null;
    defaultUnitPrice?: number;
    isActive?: boolean;
  },
  userId: number
) {
  const existing = await prisma.expense.findUnique({ where: { id } });
  if (!existing) throw new AppError(`Expense category ${id} not found.`, 404);

  const updatedCategory = await prisma.expense.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name.trim() } : {}),
      ...(data.nameSi !== undefined ? { nameSi: data.nameSi?.trim() || null } : {}),
      ...(data.description !== undefined ? { description: data.description?.trim() || null } : {}),
      ...(data.descriptionSi !== undefined ? { descriptionSi: data.descriptionSi?.trim() || null } : {}),
      ...(data.parentId !== undefined ? { parentId: data.parentId } : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      updatedById: userId,
    },
  });

  if (data.unitId !== undefined) {
    if (data.unitId) {
      const existingTemplate = await prisma.expenseTemplate.findFirst({
        where: { expenseId: id },
      });

      if (existingTemplate) {
        await prisma.expenseTemplate.update({
          where: { id: existingTemplate.id },
          data: {
            unitId: Number(data.unitId),
            name: data.name?.trim() || existing.name,
            ...(data.defaultUnitPrice !== undefined ? { defaultUnitPrice: Number(data.defaultUnitPrice) } : {}),
            updatedById: userId,
          },
        });
      } else {
        await prisma.expenseTemplate.create({
          data: {
            expenseId: id,
            name: data.name?.trim() || existing.name,
            unitId: Number(data.unitId),
            defaultUnitPrice: data.defaultUnitPrice ? Number(data.defaultUnitPrice) : 0,
            isActive: true,
            createdById: userId,
          },
        });
      }
    }
  } else if (data.defaultUnitPrice !== undefined) {
    const existingTemplate = await prisma.expenseTemplate.findFirst({
      where: { expenseId: id },
    });
    if (existingTemplate) {
      await prisma.expenseTemplate.update({
        where: { id: existingTemplate.id },
        data: {
          defaultUnitPrice: Number(data.defaultUnitPrice),
          updatedById: userId,
        },
      });
    }
  }

  return updatedCategory;
}

/**
 * Deletes an expense category, along with its templates and subcategories.
 */
export async function deleteExpenseCategory(id: number) {
  const existing = await prisma.expense.findUnique({
    where: { id },
    include: {
      children: true,
      expenseInstances: true,
    },
  });
  if (!existing) throw new AppError(`Expense category ${id} not found.`, 404);

  try {
    const allCategoryIds = [id, ...existing.children.map((c) => c.id)];

    // Delete templates for category and its children
    await prisma.expenseTemplate.deleteMany({
      where: { expenseId: { in: allCategoryIds } },
    });

    // Delete subcategories
    await prisma.expense.deleteMany({
      where: { parentId: id },
    });

    // Delete the category itself
    return await prisma.expense.delete({
      where: { id },
    });
  } catch (err: any) {
    if (err.code === 'P2003') {
      return await prisma.expense.update({
        where: { id },
        data: { isActive: false },
      });
    }
    throw err;
  }
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
 * Submits a single expense entry. If an entry already exists for the same date and category, updates it.
 */
export async function submitExpense(dto: SubmitExpenseDto, userId: number) {
  const date = parseDate(dto.date);

  const category = await prisma.expense.findUnique({ where: { id: dto.expenseId } });
  if (!category || !category.isActive) {
    throw new AppError(`Expense category ${dto.expenseId} not found or inactive.`, 404);
  }

  // Check if an expense entry already exists for this category on this date
  const existing = await prisma.expenseInstance.findFirst({
    where: {
      date,
      expenseId: dto.expenseId,
    },
  });

  if (existing) {
    return prisma.expenseInstance.update({
      where: { id: existing.id },
      data: {
        expenseTemplateId: dto.expenseTemplateId ?? existing.expenseTemplateId,
        quantity: dto.quantity,
        unitPrice: dto.unitPrice,
        amount: dto.amount,
        description: dto.description ?? existing.description,
        updatedById: userId,
      },
      include: {
        expense: { select: { id: true, name: true } },
      },
    });
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
