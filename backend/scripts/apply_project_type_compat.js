const { Client } = require('pg');

const run = async () => {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required');
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  await client.query(`ALTER TABLE project_members ADD COLUMN IF NOT EXISTS registration_id INT`);
  await client.query(`ALTER TABLE project_members ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'Member'`);
  await client.query(`ALTER TABLE project_members ADD COLUMN IF NOT EXISTS is_leader BOOLEAN DEFAULT FALSE`);
  await client.query('ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_type_check');
  await client.query(`
    ALTER TABLE projects
    ADD CONSTRAINT projects_type_check
    CHECK (type IN (
      'Mini Project',
      'Minor Project',
      'Major Project',
      'Hackathon Project',
      'Final Year Project',
      'Research Project'
    ))
  `);
  await client.end();
  console.log('projects_type_check compatibility applied');
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
