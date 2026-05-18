const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const schemaPath = path.join(__dirname, '../database/projectflow_automated_saas_schema.sql');
const schemaSql = fs.readFileSync(schemaPath, 'utf8');

async function initializeDb() {
  console.log('Connecting to default postgres database...');
  const adminClient = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'root',
    database: 'postgres'
  });

  try {
    await adminClient.connect();
    
    // Recreate database to ensure clean execution of dropped constraints/tables
    const res = await adminClient.query("SELECT 1 FROM pg_database WHERE datname = 'projectflow_edu'");
    if (res.rowCount > 0) {
      console.log('Dropping existing database for clean setup...');
      // Terminate existing connections first
      await adminClient.query(`
        SELECT pg_terminate_backend(pg_stat_activity.pid)
        FROM pg_stat_activity
        WHERE pg_stat_activity.datname = 'projectflow_edu'
          AND pid <> pg_backend_pid();
      `);
      await adminClient.query('DROP DATABASE projectflow_edu');
    }
    console.log('Creating database projectflow_edu...');
    await adminClient.query('CREATE DATABASE projectflow_edu');
    console.log('Database projectflow_edu created successfully.');
  } catch (error) {
    console.error('Error recreating database:', error);
    process.exit(1);
  } finally {
    await adminClient.end();
  }

  // Connect to projectflow_edu and execute the schema
  console.log('Connecting to projectflow_edu database...');
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'root',
    database: 'projectflow_edu'
  });

  try {
    await client.connect();
    console.log('Executing automated SaaS schema script...');
    await client.query(schemaSql);
    console.log('🎉 PostgreSQL SaaS Database Schema and Seed Data executed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error executing SaaS schema:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

initializeDb();
