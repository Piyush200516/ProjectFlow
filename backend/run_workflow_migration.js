const fs = require('fs');
const path = require('path');
const db = require('./src/config/db');

async function run() {
  try {
    console.log('Starting Workflow Digitization Database Migration...');
    
    const migrationPath = path.join(__dirname, '../database/projectflow_workflow_digitization.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the SQL schema script
    // Note: Since PostgreSQL supports multi-statement queries on client.query/pool.query, we can execute the whole block
    await db.query(sql);
    
    console.log('🎉 Workflow Digitization Database Migration completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
}

run();
