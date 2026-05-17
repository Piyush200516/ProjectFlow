const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const schemaPath = path.join(__dirname, '../database/projectflow_edu_postgres_schema.sql');
let schemaSql = fs.readFileSync(schemaPath, 'utf8');

// 1. Inject password hash
const bcryptHash = '$2b$10$r/19AAW90ZkALfccvTktm.hRcoOOzDbYADAngvwyyrnsOo4SYaxu6';
schemaSql = schemaSql.replace(/'password123_hash_here'/g, `'${bcryptHash}'`);

// 2. Add DROP TABLE IF EXISTS documents CASCADE;
if (!schemaSql.includes('DROP TABLE IF EXISTS documents CASCADE;')) {
  schemaSql = schemaSql.replace(
    'DROP TABLE IF EXISTS industry_collaborations CASCADE;',
    'DROP TABLE IF EXISTS documents CASCADE;\nDROP TABLE IF EXISTS industry_collaborations CASCADE;'
  );
}

// 3. Add CREATE TABLE documents definition
const documentsTableSql = `
-- =========================================================================
-- TABLE: documents
-- Purpose: Holds project deliverables and file uploads for API integration.
-- =========================================================================
CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    project_id INT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    uploaded_by INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    original_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(50),
    file_size VARCHAR(30),
    url VARCHAR(1000),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_documents_project ON documents(project_id);
`;

if (!schemaSql.includes('CREATE TABLE documents')) {
  schemaSql = schemaSql.replace(
    'CREATE TABLE mentor_feedback',
    documentsTableSql + '\nCREATE TABLE mentor_feedback'
  );
}

// 4. Transform tasks table to be API-compatible
const strictTasksTablePattern = /CREATE TABLE tasks \([\s\S]*?\);/g;
const apiCompatibleTasksTableSql = `CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    project_id INT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(100) DEFAULT 'Requirements',
    priority VARCHAR(20) DEFAULT 'Medium',
    members JSONB DEFAULT '[]'::jsonb,
    comments INT DEFAULT 0,
    attachments INT DEFAULT 0,
    created_by INT REFERENCES users(id) ON DELETE SET NULL,
    due_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`;

schemaSql = schemaSql.replace(strictTasksTablePattern, apiCompatibleTasksTableSql);

// Remove strict task indexes
schemaSql = schemaSql.replace('CREATE INDEX idx_tasks_assignee ON tasks(assignee_id);', '');
schemaSql = schemaSql.replace('CREATE INDEX idx_tasks_stage ON tasks(stage_id);', 'CREATE INDEX idx_tasks_created_by ON tasks(created_by);');

// Transform projects table to be API-compatible with default values
const strictProjectsTablePattern = /CREATE TABLE projects \([\s\S]*?\);/g;
const apiCompatibleProjectsTableSql = `CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    type VARCHAR(50) DEFAULT 'Mini Project' CHECK (type IN ('Mini Project', 'Major Project', 'Hackathon Project', 'Final Year Project', 'Research Project')),
    team_name VARCHAR(100) DEFAULT 'Team Alpha',
    description TEXT,
    start_date DATE DEFAULT CURRENT_DATE,
    end_date DATE,
    status VARCHAR(20) DEFAULT 'Proposal' CHECK (status IN ('Proposal', 'In Progress', 'Review', 'Completed', 'On Hold', 'Rejected')),
    progress_percent INT DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100),
    branch_id INT DEFAULT 1 REFERENCES branches(id) ON DELETE RESTRICT,
    created_by INT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    mentor_id INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`;

schemaSql = schemaSql.replace(strictProjectsTablePattern, apiCompatibleProjectsTableSql);
schemaSql = schemaSql.replace(/project_type/g, 'type');

// 5. Transform task seed data to map to actual Kanban stages and use the correct columns
const strictTaskSeedPattern = /-- I\. Seed Tasks[\s\S]*?-- J\./;
const apiCompatibleTaskSeedSql = `-- I. Seed Tasks (SDLC Kanban Board Columns mapping)
INSERT INTO tasks (project_id, title, description, status, priority, members, comments, attachments, created_by, due_date) VALUES
(1, 'Create PostgreSQL Schema', 'Design 25 relational tables and triggers for academic data, templates, and evaluations.', 'Architecture', 'High', '["Piyush Mishra"]'::json, 0, 0, 5, '2026-05-20'),
(1, 'Setup JWT Auth & API Gateway', 'Isolate routes by portal roles (student, mentor, hod, cdc) and verify cookies.', 'Development', 'High', '["Rohan Verma"]'::json, 2, 1, 5, '2026-04-15'),
(1, 'Compile Final Thesis Report', 'Write detailed evaluation methodology, contribution score metrics, and user guides.', 'Requirements', 'Medium', '["Anjali Gupta"]'::json, 0, 0, 5, '2026-05-25');

-- J.`;

schemaSql = schemaSql.replace(strictTaskSeedPattern, apiCompatibleTaskSeedSql);

// Write the modified schema back to database/projectflow_edu_postgres_schema.sql
fs.writeFileSync(schemaPath, schemaSql, 'utf8');
console.log('✅ Updated database/projectflow_edu_postgres_schema.sql with valid password hashes, documents table, and API-compatible tasks definition.');

async function initializeDb() {
  console.log('Connecting to default postgres database...');
  const adminClient = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'root',
    database: 'postgres'
  });

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
  await adminClient.end();

  // Connect to projectflow_edu and execute the schema
  console.log('Connecting to projectflow_edu database...');
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'root',
    database: 'projectflow_edu'
  });

  await client.connect();
  console.log('Executing schema script...');
  
  try {
    await client.query(schemaSql);
    console.log('🎉 PostgreSQL Database Schema and Seed Data executed successfully!');
  } catch (error) {
    console.error('Error executing schema:', error);
  } finally {
    await client.end();
  }
}

initializeDb();
