import { Request, Response, NextFunction } from 'express';
import * as wastageService from '../services/wastage.service';
import { sendSuccess, sendCreated, sendError } from '../utils/response';
import { AppError } from '../utils/errors';

// GET /api/v1/wastage/check?date=YYYY-MM-DD
export async function checkWastage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const date = req.query['date'] as string;
    if (!date) {
      sendError(res, 'date query parameter is required.', 400);
      return;
    }
    const result = await wastageService.checkWastageForDate(date);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

// POST /api/v1/wastage
export async function submitWastage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { date, entries } = req.body as {
      date: string;
      entries: wastageService.WastageEntry[];
    };
    if (!date || !Array.isArray(entries) || entries.length === 0) {
      sendError(res, '`date` and `entries` array are required.', 400);
      return;
    }
    const created = await wastageService.submitWastage({ date, entries }, req.userId);
    sendCreated(res, created, `Wastage for ${date} submitted successfully.`);
  } catch (err) {
    if (err instanceof AppError) {
      sendError(res, err.message, err.statusCode);
      return;
    }
    next(err);
  }
}

// PUT /api/v1/wastage/date/:date
export async function overrideWastage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const date = req.params['date'] as string;
    const { entries } = req.body as {
      entries: wastageService.WastageEntry[];
    };
    if (!Array.isArray(entries) || entries.length === 0) {
      sendError(res, '`entries` array is required.', 400);
      return;
    }
    const updated = await wastageService.overrideWastage(date, { date, entries }, req.userId);
    sendSuccess(res, updated, `Wastage for ${date} overridden successfully.`);
  } catch (err) {
    if (err instanceof AppError) {
      sendError(res, err.message, err.statusCode);
      return;
    }
    next(err);
  }
}

// GET /api/v1/wastage/history
export async function getWastageHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const limit = req.query['limit'] ? parseInt(req.query['limit'] as string, 10) : 30;
    const history = await wastageService.getWastageHistory(isNaN(limit) ? 30 : limit);
    sendSuccess(res, history);
  } catch (err) {
    next(err);
  }
}
