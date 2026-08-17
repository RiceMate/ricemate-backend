// ─────────────────────────────────────────────────────────────────────────────
// Re-exports of all Prisma-generated types for convenient imports
// throughout the application.
//
// Usage:
//   import type { User, IncomeInstance, AuditAction } from '../types';
// ─────────────────────────────────────────────────────────────────────────────

export type {
  User,
  IncomeSource,
  Expense,
  IncomeInstance,
  ExpenseTemplate,
  ExpenseInstance,
  UnitCategory,
  Unit,
  AuditLog,
  Prisma,
} from '@prisma/client';

export { AuditAction } from '@prisma/client';
