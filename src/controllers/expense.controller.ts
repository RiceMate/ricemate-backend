import { Request, Response, NextFunction } from 'express';
import * as expenseService from '../services/expense.service';
import { sendSuccess, sendCreated, sendError } from '../utils/response';
import { AppError } from '../utils/errors';

// GET /api/v1/expenses/categories
export async function getRootCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const includeInactive = req.query['includeInactive'] === 'true';
    const categories = await expenseService.getRootCategories(includeInactive);
    sendSuccess(res, categories);
  } catch (err) { next(err); }
}

// GET /api/v1/expenses/categories/:id/children
export async function getCategoryChildren(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params['id'] as string, 10);
    if (isNaN(id)) { sendError(res, 'Invalid category ID.', 400); return; }
    const includeInactive = req.query['includeInactive'] === 'true';
    const children = await expenseService.getCategoryChildren(id, includeInactive);
    sendSuccess(res, children);
  } catch (err) { next(err); }
}

// POST /api/v1/expenses/categories
export async function createCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, nameSi, description, descriptionSi, parentId, isActive } = req.body;
    if (!name) {
      sendError(res, 'Category name is required.', 400);
      return;
    }
    const created = await expenseService.createExpenseCategory(
      {
        name,
        nameSi,
        description,
        descriptionSi,
        parentId: parentId ? Number(parentId) : null,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
      req.userId
    );
    sendCreated(res, created, 'Category created successfully.');
  } catch (err) {
    if (err instanceof AppError) { sendError(res, err.message, err.statusCode); return; }
    next(err);
  }
}

// PUT /api/v1/expenses/categories/:id
export async function updateCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params['id'] as string, 10);
    if (isNaN(id)) { sendError(res, 'Invalid category ID.', 400); return; }

    const { name, nameSi, description, descriptionSi, parentId, isActive } = req.body;
    const updated = await expenseService.updateExpenseCategory(
      id,
      {
        name,
        nameSi,
        description,
        descriptionSi,
        parentId: parentId !== undefined ? (parentId ? Number(parentId) : null) : undefined,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined,
      },
      req.userId
    );
    sendSuccess(res, updated, 'Category updated successfully.');
  } catch (err) {
    if (err instanceof AppError) { sendError(res, err.message, err.statusCode); return; }
    next(err);
  }
}

// GET /api/v1/expenses/check?date=YYYY-MM-DD
export async function checkExpenses(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const date = req.query['date'] as string;
    if (!date) { sendError(res, 'date query parameter is required.', 400); return; }
    const result = await expenseService.checkExpensesForDate(date);
    sendSuccess(res, result);
  } catch (err) { next(err); }
}

// POST /api/v1/expenses
export async function submitExpense(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { date, expenseId, expenseTemplateId, quantity, unitPrice, amount, description } = req.body;
    if (!date || !expenseId || quantity == null || unitPrice == null || amount == null) {
      sendError(res, 'date, expenseId, quantity, unitPrice, amount are required.', 400); return;
    }
    const created = await expenseService.submitExpense(
      {
        date,
        expenseId: Number(expenseId),
        expenseTemplateId: expenseTemplateId ? Number(expenseTemplateId) : undefined,
        quantity: Number(quantity),
        unitPrice: Number(unitPrice),
        amount: Number(amount),
        description,
      },
      req.userId
    );
    sendCreated(res, created, 'Expense created successfully.');
  } catch (err) {
    if (err instanceof AppError) { sendError(res, err.message, err.statusCode); return; }
    next(err);
  }
}

// PUT /api/v1/expenses/:id
export async function updateExpense(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params['id'] as string, 10);
    if (isNaN(id)) { sendError(res, 'Invalid ID.', 400); return; }
    const { date, expenseId, expenseTemplateId, quantity, unitPrice, amount, description } = req.body;
    const updated = await expenseService.updateExpense(
      id,
      {
        date,
        expenseId: expenseId ? Number(expenseId) : undefined,
        expenseTemplateId: expenseTemplateId ? Number(expenseTemplateId) : undefined,
        quantity: quantity != null ? Number(quantity) : undefined,
        unitPrice: unitPrice != null ? Number(unitPrice) : undefined,
        amount: amount != null ? Number(amount) : undefined,
        description,
      },
      req.userId
    );
    sendSuccess(res, updated, 'Expense updated successfully.');
  } catch (err) {
    if (err instanceof AppError) { sendError(res, err.message, err.statusCode); return; }
    next(err);
  }
}

// DELETE /api/v1/expenses/:id
export async function deleteExpense(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params['id'] as string, 10);
    if (isNaN(id)) { sendError(res, 'Invalid ID.', 400); return; }
    const result = await expenseService.deleteExpense(id);
    sendSuccess(res, result, 'Expense deleted successfully.');
  } catch (err) {
    if (err instanceof AppError) { sendError(res, err.message, err.statusCode); return; }
    next(err);
  }
}
