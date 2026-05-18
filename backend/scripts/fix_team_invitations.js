const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function fixTeamInvitations() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'root',
    database: 'projectflow_edu'
  });

  await client.connect();
  console.log('Connected to DB');

  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS team_invitations (
      invite_id SERIAL PRIMARY KEY,
      project_id INT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      inviter_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      invited_student_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Accepted', 'Rejected')),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT unique_invitation UNIQUE (project_id, invited_student_id)
    );
  `;

  await client.query(createTableQuery);
  console.log('team_invitations table created in DB.');
  await client.end();

  // Also append to the schema file for future
  const schemaPath = path.join(__dirname, '../database/projectflow_edu_postgres_schema.sql');
  let schema = fs.readFileSync(schemaPath, 'utf8');
  if (!schema.includes('CREATE TABLE team_invitations')) {
    schema += '\n' + createTableQuery;
    fs.writeFileSync(schemaPath, schema);
    console.log('Appended to schema file.');
  }
}

fixTeamInvitations().catch(console.error);
