const { Pool } = require('pg');
require('dotenv').config();

const isLocalDb = process.env.DATABASE_URL && process.env.DATABASE_URL.includes('localhost');
const poolConfig = process.env.DATABASE_URL 
  ? {
      connectionString: process.env.DATABASE_URL,
      ...(isLocalDb ? {} : { ssl: { rejectUnauthorized: false } })
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'root',
      database: process.env.DB_NAME || 'projectflow_edu',
    };

const pool = new Pool(poolConfig);

const run = async () => {
  try {
    console.log('Connecting to PostgreSQL to apply active project/team membership constraints...');

    // 1. Create check_active_project_membership function and trigger
    await pool.query(`
      CREATE OR REPLACE FUNCTION check_active_project_membership()
      RETURNS TRIGGER AS $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM project_members pm
          JOIN projects p ON pm.project_id = p.id
          WHERE pm.student_id = NEW.student_id AND p.status NOT IN ('Completed', 'Rejected')
        ) THEN
          RAISE EXCEPTION 'Student is already working on an active project.';
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    console.log('Created check_active_project_membership function');

    await pool.query(`
      DROP TRIGGER IF EXISTS trg_check_active_project_membership ON project_members;
      CREATE TRIGGER trg_check_active_project_membership
      BEFORE INSERT ON project_members
      FOR EACH ROW
      EXECUTE FUNCTION check_active_project_membership();
    `);
    console.log('Created trg_check_active_project_membership trigger on project_members');

    // 2. Create check_active_team_submission function and trigger
    await pool.query(`
      CREATE OR REPLACE FUNCTION check_active_team_submission()
      RETURNS TRIGGER AS $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM team_members tm
          JOIN project_form_submissions pfs ON tm.submission_id = pfs.id
          WHERE tm.student_id = NEW.student_id AND pfs.status = 'Pending'
        ) THEN
          RAISE EXCEPTION 'Student is already working on an active project.';
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    console.log('Created check_active_team_submission function');

    await pool.query(`
      DROP TRIGGER IF EXISTS trg_check_active_team_submission ON team_members;
      CREATE TRIGGER trg_check_active_team_submission
      BEFORE INSERT ON team_members
      FOR EACH ROW
      EXECUTE FUNCTION check_active_team_submission();
    `);
    console.log('Created trg_check_active_team_submission trigger on team_members');

    console.log('✅ Active project/team membership constraints applied successfully at DB level!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to apply database level triggers:', error);
    process.exit(1);
  }
};

run();
