import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

let pool: any;
let db: any;

if (!process.env.DATABASE_URL) {
  console.warn('[AI Studio] Database not connected — using mock');
  const noOp = { findMany: async () => [], findFirst: async () => null,
    findUnique: async () => null, create: async (d: any) => d?.data ?? {},
    update: async (d: any) => d?.data ?? {}, delete: async () => ({}) };
  const chainableMock = (): any => {
    return new Proxy({}, {
      get: (_, prop) => {
        if (prop === 'then') return undefined; // don't act like a promise until awaited
        return chainableMock;
      },
      apply: () => chainableMock(),
    });
  };

  db = new Proxy({}, {
    get: (_, prop) => {
      if (prop === 'query') return new Proxy({}, { get: () => noOp });
      if (prop === 'select' || prop === 'insert' || prop === 'update' || prop === 'delete') {
        // Return a mock object that supports chaining and can be awaited to yield []
        const chain = () => {
          const proxy = new Proxy(() => {}, {
            get: (target, p) => {
              if (p === 'then') {
                return (resolve: any) => resolve([]);
              }
              return chain;
            },
            apply: () => proxy
          });
          return proxy;
        };
        return chain;
      }
      return async () => [];
    },
  }) as any;
  pool = { query: async () => ({ rows: [] }), connect: async () =>
    ({ query: async () => ({ rows: [] }), release: () => {} }) } as any;
} else {
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzle(pool, { schema });
}

export { pool, db };
export * from "./schema";
