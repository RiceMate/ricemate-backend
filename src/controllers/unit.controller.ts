import { Request, Response, NextFunction } from 'express';
import * as unitService from '../services/unit.service';
import { sendSuccess, sendCreated, sendError } from '../utils/response';
import { AppError } from '../utils/errors';

// GET /api/v1/units/categories
export async function listUnitCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const includeInactive = req.query['includeInactive'] === 'true';
    const categories = await unitService.getUnitCategories(includeInactive);
    sendSuccess(res, categories);
  } catch (err) { next(err); }
}

// POST /api/v1/units/categories
export async function createUnitCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, nameSi, description, descriptionSi, isActive } = req.body;
    const created = await unitService.createUnitCategory({
      name,
      nameSi,
      description,
      descriptionSi,
      isActive,
    });
    sendCreated(res, created, 'Unit category created successfully.');
  } catch (err) {
    if (err instanceof AppError) { sendError(res, err.message, err.statusCode); return; }
    next(err);
  }
}

// PUT /api/v1/units/categories/:id
export async function updateUnitCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params['id'] as string, 10);
    if (isNaN(id)) { sendError(res, 'Invalid category ID.', 400); return; }
    const { name, nameSi, description, descriptionSi, isActive } = req.body;
    const updated = await unitService.updateUnitCategory(id, {
      name,
      nameSi,
      description,
      descriptionSi,
      isActive,
    });
    sendSuccess(res, updated, 'Unit category updated successfully.');
  } catch (err) {
    if (err instanceof AppError) { sendError(res, err.message, err.statusCode); return; }
    next(err);
  }
}

// GET /api/v1/units
export async function listUnits(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const includeInactive = req.query['includeInactive'] === 'true';
    const categoryId = req.query['categoryId'] ? parseInt(req.query['categoryId'] as string, 10) : undefined;
    const units = await unitService.getUnits(includeInactive, categoryId);
    sendSuccess(res, units);
  } catch (err) { next(err); }
}

// POST /api/v1/units
export async function createUnit(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { unitCategoryId, name, nameSi, symbol, symbolSi, isActive } = req.body;
    const created = await unitService.createUnit({
      unitCategoryId: Number(unitCategoryId),
      name,
      nameSi,
      symbol,
      symbolSi,
      isActive,
    });
    sendCreated(res, created, 'Unit created successfully.');
  } catch (err) {
    if (err instanceof AppError) { sendError(res, err.message, err.statusCode); return; }
    next(err);
  }
}

// PUT /api/v1/units/:id
export async function updateUnit(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params['id'] as string, 10);
    if (isNaN(id)) { sendError(res, 'Invalid unit ID.', 400); return; }
    const { unitCategoryId, name, nameSi, symbol, symbolSi, isActive } = req.body;
    const updated = await unitService.updateUnit(id, {
      unitCategoryId: unitCategoryId !== undefined ? Number(unitCategoryId) : undefined,
      name,
      nameSi,
      symbol,
      symbolSi,
      isActive,
    });
    sendSuccess(res, updated, 'Unit updated successfully.');
  } catch (err) {
    if (err instanceof AppError) { sendError(res, err.message, err.statusCode); return; }
    next(err);
  }
}

// DELETE /api/v1/units/categories/:id
export async function deleteUnitCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params['id'] as string, 10);
    if (isNaN(id)) { sendError(res, 'Invalid category ID.', 400); return; }
    await unitService.deleteUnitCategory(id);
    sendSuccess(res, null, 'Unit category deleted successfully.');
  } catch (err) {
    if (err instanceof AppError) { sendError(res, err.message, err.statusCode); return; }
    next(err);
  }
}

// DELETE /api/v1/units/:id
export async function deleteUnit(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params['id'] as string, 10);
    if (isNaN(id)) { sendError(res, 'Invalid unit ID.', 400); return; }
    await unitService.deleteUnit(id);
    sendSuccess(res, null, 'Unit deleted successfully.');
  } catch (err) {
    if (err instanceof AppError) { sendError(res, err.message, err.statusCode); return; }
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Unit Quantity Presets Controller
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/v1/units/presets
export async function listUnitPresets(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const includeInactive = req.query['includeInactive'] === 'true';
    const unitId = req.query['unitId'] ? parseInt(req.query['unitId'] as string, 10) : undefined;
    const presets = await unitService.getUnitPresets(unitId, includeInactive);
    sendSuccess(res, presets);
  } catch (err) { next(err); }
}

// POST /api/v1/units/presets
export async function createUnitPreset(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { unitId, value, label, labelSi, sortOrder, isActive } = req.body;
    const created = await unitService.createUnitPreset({
      unitId: Number(unitId),
      value: Number(value),
      label,
      labelSi,
      sortOrder: sortOrder !== undefined ? Number(sortOrder) : undefined,
      isActive,
    });
    sendCreated(res, created, 'Unit preset created successfully.');
  } catch (err) {
    if (err instanceof AppError) { sendError(res, err.message, err.statusCode); return; }
    next(err);
  }
}

// PUT /api/v1/units/presets/:id
export async function updateUnitPreset(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params['id'] as string, 10);
    if (isNaN(id)) { sendError(res, 'Invalid preset ID.', 400); return; }
    const { unitId, value, label, labelSi, sortOrder, isActive } = req.body;
    const updated = await unitService.updateUnitPreset(id, {
      unitId: unitId !== undefined ? Number(unitId) : undefined,
      value: value !== undefined ? Number(value) : undefined,
      label,
      labelSi,
      sortOrder: sortOrder !== undefined ? Number(sortOrder) : undefined,
      isActive,
    });
    sendSuccess(res, updated, 'Unit preset updated successfully.');
  } catch (err) {
    if (err instanceof AppError) { sendError(res, err.message, err.statusCode); return; }
    next(err);
  }
}

// DELETE /api/v1/units/presets/:id
export async function deleteUnitPreset(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params['id'] as string, 10);
    if (isNaN(id)) { sendError(res, 'Invalid preset ID.', 400); return; }
    await unitService.deleteUnitPreset(id);
    sendSuccess(res, null, 'Unit preset deleted successfully.');
  } catch (err) {
    if (err instanceof AppError) { sendError(res, err.message, err.statusCode); return; }
    next(err);
  }
}
