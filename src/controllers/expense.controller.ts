import { Request, Response, NextFunction } from 'express';
import * as expenseService from '../services/expense.service';
import { sendSuccess, sendCreated, sendError } from '../utils/response';
import { AppError } from '../utils/errors';

// GET /api/v1/expenses/categories
export async function getRootCategories(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const categories = await expenseService.getRootCategories();
    sendSuccess(res, categories);
  } catch (err) { next(err); }
}

// GET /api/v1/expenses/categories/:id/children
export async function getCategoryChildren(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params['id'] as string, 10);
    if (isNaN(id)) { sendError(res, 'Invalid category id.', 400); return; }
    const children = await expenseService.getCategoryChildren(id);
    sendSuccess(res, children);
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
    const dto = req.body as {
      date: string; expenseId: number; quantity: number; unitPrice: number; amount: number; description?: string;
    };
    if (!dto.date || !dto.expenseId || dto.quantity === undefined || dto.unitPrice === undefined || dto.amount === undefined) {
      sendError(res, '`date`, `expenseId`, `quantity`, `unitPrice`, and `amount` are required.', 400); return;
    }
    const created = await expenseService.submitExpense(dto, req.userId);
    sendCreated(res, created, 'Expense submitted successfully.');
  } catch (err) {
    if (err instanceof AppError) { sendError(res, err.message, err.statusCode); return; }
    next(err);
  }
}

// PUT /api/v1/expenses/:id
export async function updateExpense(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params['id'] as string, 10);
    if (isNaN(id)) { sendError(res, 'Invalid expense id.', 400); return; }
    const updated = await expenseService.updateExpense(id, req.body, req.userId);
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
    if (isNaN(id)) { sendError(res, 'Invalid expense id.', 400); return; }
    const result = await expenseService.deleteExpense(id);
    sendSuccess(res, result, 'Expense deleted successfully.');
  } catch (err) {
    if (err instanceof AppError) { sendError(res, err.message, err.statusCode); return; }
    next(err);
  }
}
