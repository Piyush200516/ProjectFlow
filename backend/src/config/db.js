const prisma = require('./prisma');

const SELECT_STATEMENT = /^(SELECT|WITH|SHOW|EXPLAIN|VALUES|TABLE)\b/i;
const INSERT_STATEMENT = /^INSERT\b/i;
const ROW_RETURNING_STATEMENT = /\bRETURNING\b/i;

function normalizeSql(sql, params = []) {
  const text = String(sql || '').trim();
  if (!text.includes('?')) {
    return { sql: text, params };
  }

  let index = 0;
  const transformed = text.replace(/\?/g, () => `$${++index}`);
  return { sql: transformed, params };
}

function getCommand(sql) {
  const trimmed = String(sql || '').trim();
  const match = trimmed.match(/^[A-Z]+/i);
  return match ? match[0].toUpperCase() : 'QUERY';
}

function isSelectLike(sql) {
  return SELECT_STATEMENT.test(String(sql || '').trim());
}

function isInsert(sql) {
  return INSERT_STATEMENT.test(String(sql || '').trim());
}

function hasReturning(sql) {
  return ROW_RETURNING_STATEMENT.test(String(sql || '').trim());
}

function getInsertId(row) {
  if (!row || typeof row !== 'object') {
    return null;
  }

  return (
    row.id ??
    row.invite_id ??
    row.user_id ??
    row.session_id ??
    row.project_id ??
    row.registration_id ??
    row.submission_id ??
    row.milestone_id ??
    row.template_id ??
    row.document_id ??
    row.notification_id ??
    row.task_id ??
    row.role_id ??
    Object.values(row)[0] ??
    null
  );
}

async function runStatement(client, sql, params = []) {
  const normalized = normalizeSql(sql, params);
  const command = getCommand(normalized.sql);
  const statement = isInsert(normalized.sql) && !hasReturning(normalized.sql)
    ? `${normalized.sql} RETURNING *`
    : normalized.sql;

  if (command === 'BEGIN') {
    return { rows: [], rowCount: 0, affectedRows: 0, insertId: null, command };
  }

  if (command === 'COMMIT' || command === 'ROLLBACK') {
    return { rows: [], rowCount: 0, affectedRows: 0, insertId: null, command };
  }

  if (isSelectLike(statement) || hasReturning(statement) || isInsert(statement)) {
    const rows = await client.$queryRawUnsafe(statement, ...normalized.params);
    const rowCount = Array.isArray(rows) ? rows.length : 0;
    return {
      rows: Array.isArray(rows) ? rows : [],
      rowCount,
      affectedRows: rowCount,
      insertId: isInsert(statement) && rowCount > 0 ? getInsertId(rows[0]) : null,
      command,
    };
  }

  const rowCount = await client.$executeRawUnsafe(statement, ...normalized.params);
  return {
    rows: [],
    rowCount: Number(rowCount || 0),
    affectedRows: Number(rowCount || 0),
    insertId: null,
    command,
  };
}

function createExecuteResult(result) {
  if (result.command === 'SELECT' || result.command === 'WITH' || result.command === 'SHOW' || result.command === 'EXPLAIN' || result.command === 'VALUES' || result.command === 'TABLE') {
    return [result.rows, []];
  }

  return [
    {
      insertId: result.insertId ?? null,
      affectedRows: result.affectedRows ?? 0,
      rowCount: result.rowCount ?? 0,
      rows: result.rows ?? [],
      command: result.command,
    },
    [],
  ];
}

async function execute(sql, params = []) {
  const result = await runStatement(prisma, sql, params);
  return createExecuteResult(result);
}

async function query(sql, params = []) {
  return runStatement(prisma, sql, params);
}

class TransactionClient {
  constructor() {
    this.tx = null;
    this.active = false;
    this.completed = false;
    this.ready = null;
    this.readyResolve = null;
    this.control = null;
    this.controlResolve = null;
    this.controlReject = null;
    this.txPromise = null;
  }

  async begin() {
    if (this.active) {
      return { rows: [], rowCount: 0, affectedRows: 0, insertId: null, command: 'BEGIN' };
    }

    this.active = true;
    this.completed = false;
    this.ready = new Promise((resolve) => {
      this.readyResolve = resolve;
    });
    this.control = new Promise((resolve, reject) => {
      this.controlResolve = resolve;
      this.controlReject = reject;
    });

    this.txPromise = prisma.$transaction(async (tx) => {
      this.tx = tx;
      this.readyResolve(tx);
      await this.control;
      return true;
    });

    await this.ready;
    return { rows: [], rowCount: 0, affectedRows: 0, insertId: null, command: 'BEGIN' };
  }

  async commit() {
    if (!this.active) {
      return { rows: [], rowCount: 0, affectedRows: 0, insertId: null, command: 'COMMIT' };
    }

    this.completed = true;
    this.controlResolve(true);
    await this.txPromise;
    this.reset();
    return { rows: [], rowCount: 0, affectedRows: 0, insertId: null, command: 'COMMIT' };
  }

  async rollback() {
    if (!this.active) {
      return { rows: [], rowCount: 0, affectedRows: 0, insertId: null, command: 'ROLLBACK' };
    }

    this.completed = true;
    this.controlReject(new Error('__PRISMA_ROLLBACK__'));

    try {
      await this.txPromise;
    } catch (error) {
      if (error?.message !== '__PRISMA_ROLLBACK__') {
        throw error;
      }
    }

    this.reset();
    return { rows: [], rowCount: 0, affectedRows: 0, insertId: null, command: 'ROLLBACK' };
  }

  reset() {
    this.tx = null;
    this.active = false;
    this.completed = false;
    this.ready = null;
    this.readyResolve = null;
    this.control = null;
    this.controlResolve = null;
    this.controlReject = null;
    this.txPromise = null;
  }

  async query(sql, params = []) {
    const normalized = normalizeSql(sql, params);
    const command = getCommand(normalized.sql);

    if (command === 'BEGIN') {
      return this.begin();
    }

    if (command === 'COMMIT') {
      return this.commit();
    }

    if (command === 'ROLLBACK') {
      return this.rollback();
    }

    const client = this.active ? await this.ready.then(() => this.tx) : prisma;
    return runStatement(client, normalized.sql, normalized.params);
  }

  release() {
    if (this.active && !this.completed) {
      void this.rollback();
    }
  }
}

const pool = {
  query,
  connect: async () => new TransactionClient(),
  end: () => prisma.$disconnect(),
};

async function tableExists(tableName) {
  try {
    const rows = await prisma.$queryRawUnsafe(
      `SELECT to_regclass($1)::text AS table_name`,
      `public.${tableName}`
    );
    return Boolean(rows[0]?.table_name);
  } catch {
    return false;
  }
}

module.exports = {
  prisma,
  pool,
  execute,
  query,
  tableExists,
  end: () => prisma.$disconnect(),
};
