import prisma from '../lib/prisma';
import { AppError } from '../utils/errors';

export async function getUnitCategories(includeInactive = false) {
  return prisma.unitCategory.findMany({
    where: includeInactive ? {} : { isActive: true },
    orderBy: { id: 'asc' },
    include: {
      units: {
        where: includeInactive ? {} : { isActive: true },
        orderBy: { id: 'asc' },
        include: {
          quantityPresets: {
            where: includeInactive ? {} : { isActive: true },
            orderBy: { sortOrder: 'asc' },
          },
        },
      },
    },
  });
}

export async function getUnits(includeInactive = false, unitCategoryId?: number) {
  return prisma.unit.findMany({
    where: {
      ...(includeInactive ? {} : { isActive: true }),
      ...(unitCategoryId ? { unitCategoryId } : {}),
    },
    orderBy: { id: 'asc' },
    include: {
      unitCategory: {
        select: { id: true, name: true, nameSi: true },
      },
      quantityPresets: {
        where: includeInactive ? {} : { isActive: true },
        orderBy: { sortOrder: 'asc' },
      },
    },
  });
}

export async function createUnitCategory(
  data: { name: string; nameSi?: string; description?: string; descriptionSi?: string; isActive?: boolean }
) {
  if (!data.name?.trim()) {
    throw new AppError('Unit category name is required.', 400);
  }
  return prisma.unitCategory.create({
    data: {
      name: data.name.trim(),
      nameSi: data.nameSi?.trim() || null,
      description: data.description?.trim() || null,
      descriptionSi: data.descriptionSi?.trim() || null,
      isActive: data.isActive ?? true,
    },
  });
}

export async function updateUnitCategory(
  id: number,
  data: { name?: string; nameSi?: string; description?: string; descriptionSi?: string; isActive?: boolean }
) {
  const existing = await prisma.unitCategory.findUnique({ where: { id } });
  if (!existing) throw new AppError(`Unit category ${id} not found.`, 404);

  return prisma.unitCategory.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name.trim() } : {}),
      ...(data.nameSi !== undefined ? { nameSi: data.nameSi?.trim() || null } : {}),
      ...(data.description !== undefined ? { description: data.description?.trim() || null } : {}),
      ...(data.descriptionSi !== undefined ? { descriptionSi: data.descriptionSi?.trim() || null } : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
    },
  });
}

export async function createUnit(
  data: { unitCategoryId: number; name: string; nameSi?: string; symbol: string; symbolSi?: string; isActive?: boolean }
) {
  if (!data.name?.trim() || !data.symbol?.trim() || !data.unitCategoryId) {
    throw new AppError('name, symbol, and unitCategoryId are required.', 400);
  }
  return prisma.unit.create({
    data: {
      unitCategoryId: data.unitCategoryId,
      name: data.name.trim(),
      nameSi: data.nameSi?.trim() || null,
      symbol: data.symbol.trim(),
      symbolSi: data.symbolSi?.trim() || null,
      isActive: data.isActive ?? true,
    },
  });
}

export async function updateUnit(
  id: number,
  data: { unitCategoryId?: number; name?: string; nameSi?: string; symbol?: string; symbolSi?: string; isActive?: boolean }
) {
  const existing = await prisma.unit.findUnique({ where: { id } });
  if (!existing) throw new AppError(`Unit ${id} not found.`, 404);

  return prisma.unit.update({
    where: { id },
    data: {
      ...(data.unitCategoryId !== undefined ? { unitCategoryId: data.unitCategoryId } : {}),
      ...(data.name !== undefined ? { name: data.name.trim() } : {}),
      ...(data.nameSi !== undefined ? { nameSi: data.nameSi?.trim() || null } : {}),
      ...(data.symbol !== undefined ? { symbol: data.symbol.trim() } : {}),
      ...(data.symbolSi !== undefined ? { symbolSi: data.symbolSi?.trim() || null } : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
    },
  });
}

export async function deleteUnitCategory(id: number) {
  const existing = await prisma.unitCategory.findUnique({
    where: { id },
    include: { units: true },
  });
  if (!existing) throw new AppError(`Unit category ${id} not found.`, 404);

  try {
    // Delete units under this category
    await prisma.unit.deleteMany({
      where: { unitCategoryId: id },
    });
    return await prisma.unitCategory.delete({
      where: { id },
    });
  } catch (err: any) {
    if (err.code === 'P2003') {
      return await prisma.unitCategory.update({
        where: { id },
        data: { isActive: false },
      });
    }
    throw err;
  }
}

export async function deleteUnit(id: number) {
  const existing = await prisma.unit.findUnique({ where: { id } });
  if (!existing) throw new AppError(`Unit ${id} not found.`, 404);

  try {
    return await prisma.unit.delete({
      where: { id },
    });
  } catch (err: any) {
    if (err.code === 'P2003') {
      return await prisma.unit.update({
        where: { id },
        data: { isActive: false },
      });
    }
    throw err;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Unit Presets CRUD
// ─────────────────────────────────────────────────────────────────────────────

export async function getUnitPresets(unitId?: number, includeInactive = false) {
  return prisma.unitQuantityPreset.findMany({
    where: {
      ...(includeInactive ? {} : { isActive: true }),
      ...(unitId ? { unitId } : {}),
    },
    orderBy: [
      { unitId: 'asc' },
      { sortOrder: 'asc' },
      { value: 'asc' },
    ],
    include: {
      unit: {
        select: {
          id: true,
          name: true,
          nameSi: true,
          symbol: true,
          symbolSi: true,
          unitCategoryId: true,
        },
      },
    },
  });
}

export async function createUnitPreset(data: {
  unitId: number;
  value: number;
  label?: string;
  labelSi?: string;
  sortOrder?: number;
  isActive?: boolean;
}) {
  if (!data.unitId || data.value === undefined || data.value === null || data.value <= 0) {
    throw new AppError('unitId and a positive value are required.', 400);
  }

  const unit = await prisma.unit.findUnique({ where: { id: data.unitId } });
  if (!unit) throw new AppError(`Unit ${data.unitId} not found.`, 404);

  return prisma.unitQuantityPreset.create({
    data: {
      unitId: data.unitId,
      value: data.value,
      label: data.label?.trim() || null,
      labelSi: data.labelSi?.trim() || null,
      sortOrder: data.sortOrder ?? 0,
      isActive: data.isActive ?? true,
    },
    include: {
      unit: true,
    },
  });
}

export async function updateUnitPreset(
  id: number,
  data: {
    unitId?: number;
    value?: number;
    label?: string;
    labelSi?: string;
    sortOrder?: number;
    isActive?: boolean;
  }
) {
  const existing = await prisma.unitQuantityPreset.findUnique({ where: { id } });
  if (!existing) throw new AppError(`Unit preset ${id} not found.`, 404);

  return prisma.unitQuantityPreset.update({
    where: { id },
    data: {
      ...(data.unitId !== undefined ? { unitId: data.unitId } : {}),
      ...(data.value !== undefined ? { value: data.value } : {}),
      ...(data.label !== undefined ? { label: data.label?.trim() || null } : {}),
      ...(data.labelSi !== undefined ? { labelSi: data.labelSi?.trim() || null } : {}),
      ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
    },
    include: {
      unit: true,
    },
  });
}

export async function deleteUnitPreset(id: number) {
  const existing = await prisma.unitQuantityPreset.findUnique({ where: { id } });
  if (!existing) throw new AppError(`Unit preset ${id} not found.`, 404);

  return prisma.unitQuantityPreset.delete({
    where: { id },
  });
}
