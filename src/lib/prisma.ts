import { PrismaClient } from '@prisma/client';

// ─────────────────────────────────────────────────────────────────────────────
// Singleton PrismaClient
//
// In development, hot-reloads with tsx/ts-node would create multiple Prisma
// instances and exhaust the connection pool. This pattern prevents that by
// caching the instance on the global object in development only.
// ─────────────────────────────────────────────────────────────────────────────

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export function getColomboNow(): Date {
  return new Date(Date.now() + 5.5 * 3600000);
}

const basePrisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'info', 'warn', 'error']
        : ['warn', 'error'],
  });

const MODELS_WITH_TIMESTAMPS = new Set([
  'User',
  'IncomeSource',
  'Expense',
  'ExpenseTemplate',
  'ExpenseInstance',
  'IncomeInstance',
  'UnitQuantityPreset',
  'Wastage',
]);
const MODELS_WITH_CREATED_ONLY = new Set(['AuditLog']);

// Automatically stamp all create and update operations with Colombo local time (+05:30)
const prisma = (basePrisma as any).$extends({
  query: {
    $allModels: {
      async create({ model, args, query }: any) {
        const colomboNow = getColomboNow();
        if (args.data) {
          if (MODOLDS_HAS_CREATED(model) && args.data.createdAt === undefined) {
            args.data.createdAt = colomboNow;
          }
          if (MODELS_WITH_TIMESTAMPS.has(model) && args.data.updatedAt === undefined) {
            args.data.updatedAt = colomboNow;
          }
        }
        return query(args);
      },
      async createMany({ model, args, query }: any) {
        const colomboNow = getColomboNow();
        if (Array.isArray(args.data)) {
          args.data.forEach((item: any) => {
            if (MODOLDS_HAS_CREATED(model) && item.createdAt === undefined) {
              item.createdAt = colomboNow;
            }
            if (MODELS_WITH_TIMESTAMPS.has(model) && item.updatedAt === undefined) {
              item.updatedAt = colomboNow;
            }
          });
        }
        return query(args);
      },
      async update({ model, args, query }: any) {
        const colomboNow = getColomboNow();
        if (args.data && MODELS_WITH_TIMESTAMPS.has(model)) {
          args.data.updatedAt = colomboNow;
        }
        return query(args);
      },
      async updateMany({ model, args, query }: any) {
        const colomboNow = getColomboNow();
        if (args.data && MODELS_WITH_TIMESTAMPS.has(model)) {
          args.data.updatedAt = colomboNow;
        }
        return query(args);
      },
      async upsert({ model, args, query }: any) {
        const colomboNow = getColomboNow();
        if (args.create) {
          if (MODOLDS_HAS_CREATED(model) && args.create.createdAt === undefined) {
            args.create.createdAt = colomboNow;
          }
          if (MODELS_WITH_TIMESTAMPS.has(model) && args.create.updatedAt === undefined) {
            args.create.updatedAt = colomboNow;
          }
        }
        if (args.update && MODELS_WITH_TIMESTAMPS.has(model)) {
          args.update.updatedAt = colomboNow;
        }
        return query(args);
      },
    },
  },
});

function MODOLDS_HAS_CREATED(model: string): boolean {
  return MODELS_WITH_TIMESTAMPS.has(model) || MODELS_WITH_CREATED_ONLY.has(model);
}

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = basePrisma;
}

export default prisma as unknown as PrismaClient;
