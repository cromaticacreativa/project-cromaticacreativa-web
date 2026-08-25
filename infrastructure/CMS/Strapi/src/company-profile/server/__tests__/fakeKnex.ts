import type { KnexLike, QueryBuilderLike, Row } from '../database';

/** Almacén en memoria por tabla, para probar el repositorio sin MySQL. */
export type FakeStore = Record<string, Row[]>;

export interface FakeCall {
  table: string;
  op: 'select' | 'first' | 'insert' | 'update' | 'del';
  args?: unknown;
}

export function createFakeKnex(store: FakeStore): { knex: KnexLike; calls: FakeCall[] } {
  const calls: FakeCall[] = [];

  const knex: KnexLike = (table: string): QueryBuilderLike => {
    const rows = (store[table] ??= []);
    let filter: Partial<Row> = {};
    let orderColumn: string | undefined;

    const matches = (row: Row): boolean =>
      Object.entries(filter).every(([k, v]) => row[k] === v);

    const builder: QueryBuilderLike = {
      where(condition) {
        filter = { ...filter, ...condition };
        return builder;
      },
      orderBy(column) {
        orderColumn = column;
        return builder;
      },
      async first() {
        return rows.find(matches);
      },
      async select() {
        const result = rows.filter(matches);
        if (orderColumn) {
          result.sort((a, b) => Number(a[orderColumn!]) - Number(b[orderColumn!]));
        }
        calls.push({ table, op: 'select' });
        return [...result];
      },
      async insert(row) {
        rows.push(row as Row);
        calls.push({ table, op: 'insert', args: row });
        return [1];
      },
      async update(row) {
        // Semántica de mysql2 por defecto: devuelve filas *cambiadas* (no las
        // coincidentes). Un update idempotente (mismo valor) devuelve 0.
        const target = rows.filter(matches);
        let changed = 0;
        for (const r of target) {
          const differs = Object.entries(row as Record<string, unknown>).some(([k, v]) => r[k] !== v);
          if (differs) changed += 1;
          Object.assign(r, row);
        }
        calls.push({ table, op: 'update', args: row });
        return changed;
      },
      async del() {
        const before = rows.length;
        const remaining = rows.filter((r) => !matches(r));
        rows.length = 0;
        rows.push(...remaining);
        calls.push({ table, op: 'del' });
        return before - rows.length;
      },
    };
    return builder;
  };

  return { knex, calls };
}
