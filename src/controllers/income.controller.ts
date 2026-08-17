import { Request, Response, NextFunction } from 'express';
import * as incomeService from '../services/income.service';
import { sendSuccess, sendCreated, sendError } from '../utils/response';
import { AppError } from '../utils/errors';

// GET /api/v1/income/sources
export async function listIncomeSources(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const sources = await incomeService.getActiveSources();
    sendSuccess(res, sources);
  } catch (err) { next(err); }
}

// GET /api/v1/income/check?date=YYYY-MM-DD
export async function checkIncome(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const date = req.query['date'] as string;
    if (!date) { sendError(res, 'date query parameter is required.', 400); return; }
    const result = await incomeService.checkIncomeForDate(date);
    sendSuccess(res, result);
  } catch (err) { next(err); }
}

// POST /api/v1/income
export async function submitIncome(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { date, entries } = req.body as {
      date: string;
      entries: { sourceId: number; parcelCount: number; description?: string }[];
    };
    if (!date || !Array.isArray(entries) || entries.length === 0) {
      sendError(res, '`date` and `entries` array are required.', 400); return;
    }
    const created = await incomeService.submitIncome({ date, entries }, req.userId);
    sendCreated(res, created, `Income for ${date} submitted successfully.`);
  } catch (err) {
    if (err instanceof AppError) { sendError(res, err.message, err.statusCode); return; }
    next(err);
  }
}

// PUT /api/v1/income/date/:date
export async function overrideIncome(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const date = req.params['date'] as string;
    const { entries } = req.body as {
      entries: { sourceId: number; parcelCount: number; description?: string }[];
    };
    if (!Array.isArray(entries) || entries.length === 0) {
      sendError(res, '`entries` array is required.', 400); return;
    }
    const updated = await incomeService.overrideIncome(date, { date, entries }, req.userId);
    sendSuccess(res, updated, `Income for ${date} overridden successfully.`);
  } catch (err) {
    if (err instanceof AppError) { sendError(res, err.message, err.statusCode); return; }
    next(err);
  }
}
