import { Request, Response, NextFunction } from 'express';
import * as dashboardService from '../services/dashboard.service';
import { sendSuccess, sendError } from '../utils/response';

// GET /api/v1/dashboard/today
export async function getToday(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await dashboardService.getTodaySummary();
    sendSuccess(res, data);
  } catch (err) { next(err); }
}

// GET /api/v1/dashboard/daily?date=YYYY-MM-DD
export async function getDaily(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const date = req.query['date'] as string | undefined;
    const data = await dashboardService.getDailySummary(date);
    sendSuccess(res, data);
  } catch (err) { next(err); }
}

// GET /api/v1/dashboard/monthly?year=YYYY&month=MM
export async function getMonthly(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const year  = parseInt(req.query['year']  as string, 10);
    const month = parseInt(req.query['month'] as string, 10);
    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      sendError(res, 'Valid `year` and `month` (1–12) query parameters are required.', 400); return;
    }
    const data = await dashboardService.getMonthlySummary(year, month);
    sendSuccess(res, data);
  } catch (err) { next(err); }
}

// GET /api/v1/dashboard/yearly?year=YYYY
export async function getYearly(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const year = parseInt(req.query['year'] as string, 10);
    if (isNaN(year)) {
      sendError(res, 'Valid `year` query parameter is required.', 400); return;
    }
    const data = await dashboardService.getYearlySummary(year);
    sendSuccess(res, data);
  } catch (err) { next(err); }
}

// GET /api/v1/dashboard/income-sources?date=YYYY-MM-DD OR ?year=YYYY&month=MM OR ?year=YYYY
export async function getIncomeSources(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const date = req.query['date'] as string | undefined;
    const year = req.query['year'] ? parseInt(req.query['year'] as string, 10) : undefined;
    const month = req.query['month'] ? parseInt(req.query['month'] as string, 10) : undefined;

    const data = await dashboardService.getIncomeSourcesSummary({ date, year, month });
    sendSuccess(res, data);
  } catch (err) { next(err); }
}

// GET /api/v1/dashboard/expense-breakdown?date=YYYY-MM-DD OR ?year=YYYY&month=MM OR ?year=YYYY
export async function getExpenseBreakdown(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const date = req.query['date'] as string | undefined;
    const year = req.query['year'] ? parseInt(req.query['year'] as string, 10) : undefined;
    const month = req.query['month'] ? parseInt(req.query['month'] as string, 10) : undefined;

    const data = await dashboardService.getExpenseBreakdownSummary({ date, year, month });
    sendSuccess(res, data);
  } catch (err) { next(err); }
}

// GET /api/v1/dashboard/wastage-vs-sales?date=YYYY-MM-DD OR ?year=YYYY&month=MM OR ?year=YYYY
export async function getWastageVsSales(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const date = req.query['date'] as string | undefined;
    const year = req.query['year'] ? parseInt(req.query['year'] as string, 10) : undefined;
    const month = req.query['month'] ? parseInt(req.query['month'] as string, 10) : undefined;

    const data = await dashboardService.getWastageVsSalesSummary({ date, year, month });
    sendSuccess(res, data);
  } catch (err) { next(err); }
}
