const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'projectflow_edu',
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Convert ? to $1, $2, $3...
function convertPlaceholders(sql) {
  let index = 1;
  return sql.replace(/\?/g, () => `$${index++}`);
}

const checkConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ PostgreSQL Database connected successfully');
    client.release();
    return true;
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    return false;
  }
};

const executeQuery = async (sql, params = []) => {
  let modifiedSql = convertPlaceholders(sql);
  
  const isInsert = /^\s*insert\s+into/i.test(sql);
  const isWriteQuery = /^\s*(insert|update|delete)/i.test(sql);
  
  // For inserts, automatically append RETURNING id if it doesn't already have RETURNING
  if (isInsert && !/returning\s+/i.test(modifiedSql)) {
    // Check if the target table is students or mentors which don't have 'id' but have 'user_id' as PK
    if (/insert\s+into\s+students/i.test(sql)) {
      modifiedSql += ' RETURNING user_id';
    } else if (/insert\s+into\s+mentors/i.test(sql)) {
      modifiedSql += ' RETURNING user_id';
    } else {
      modifiedSql += ' RETURNING id';
    }
  }

  // Support ON DUPLICATE KEY UPDATE translation to ON CONFLICT
  if (modifiedSql.includes('ON DUPLICATE KEY UPDATE')) {
    if (modifiedSql.includes('students')) {
      modifiedSql = modifiedSql.replace(/ON DUPLICATE KEY UPDATE.*/i, 'ON CONFLICT (user_id) DO NOTHING');
    }
  }

  try {
    const res = await pool.query(modifiedSql, params);
    
    if (isWriteQuery) {
      let insertId = null;
      if (isInsert && res.rows && res.rows.length > 0) {
        // Return user_id or id depending on what PostgreSQL returned
        insertId = res.rows[0].id || res.rows[0].user_id || null;
      }
      
      const resultHeader = {
        affectedRows: res.rowCount,
        insertId: insertId,
        warningStatus: 0
      };
      return [resultHeader, res.fields];
    } else {
      return [res.rows, res.fields];
    }
  } catch (err) {
    console.error('Error executing query:', sql);
    console.error('Modified query was:', modifiedSql);
    console.error('Parameters:', params);
    console.error('Database Error details:', err.message);
    throw err;
  }
};

module.exports = {
  execute: executeQuery,
  query: executeQuery,
  getConnection: async () => {
    const client = await pool.connect();
    return {
      execute: async (sql, params = []) => {
        let modifiedSql = convertPlaceholders(sql);
        if (/^\s*insert\s+into/i.test(sql) && !/returning\s+/i.test(modifiedSql)) {
          if (/insert\s+into\s+students/i.test(sql) || /insert\s+into\s+mentors/i.test(sql)) {
            modifiedSql += ' RETURNING user_id';
          } else {
            modifiedSql += ' RETURNING id';
          }
        }
        if (modifiedSql.includes('ON DUPLICATE KEY UPDATE')) {
          if (modifiedSql.includes('students')) {
            modifiedSql = modifiedSql.replace(/ON DUPLICATE KEY UPDATE.*/i, 'ON CONFLICT (user_id) DO NOTHING');
          }
        }
        const res = await client.query(modifiedSql, params);
        if (/^\s*(insert|update|delete)/i.test(sql)) {
          let insertId = null;
          if (/^\s*insert\s+into/i.test(sql) && res.rows && res.rows.length > 0) {
            insertId = res.rows[0].id || res.rows[0].user_id || null;
          }
          return [{ affectedRows: res.rowCount, insertId }, res.fields];
        }
        return [res.rows, res.fields];
      },
      release: () => client.release()
    };
  },
  pool,
  checkConnection
};
