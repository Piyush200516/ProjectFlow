const db = require('./src/config/db');

async function migrate() {
    try {
        console.log('Starting migration...');
        
        const createRegistrationFormsTable = `
            CREATE TABLE IF NOT EXISTS registration_forms (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                instructions TEXT,
                branch VARCHAR(100) NOT NULL,
                branch_id INT,
                academic_year VARCHAR(20),
                semester INT NOT NULL,
                section VARCHAR(10) NOT NULL,
                team_size_min INT DEFAULT 2,
                team_size_max INT DEFAULT 4,
                project_type VARCHAR(50) NOT NULL CHECK (project_type IN ('Minor Project', 'Major Project', 'Research Project', 'Hackathon Project')),
                start_date TIMESTAMP NOT NULL,
                deadline TIMESTAMP NOT NULL,
                status VARCHAR(20) DEFAULT 'Draft' CHECK (status IN ('Draft', 'Published', 'Closed')),
                is_published BOOLEAN DEFAULT FALSE,
                created_by INT REFERENCES users(id) ON DELETE SET NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;
        await db.execute(createRegistrationFormsTable);
        await db.execute(`ALTER TABLE registration_forms ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT FALSE;`);
        await db.execute(`UPDATE registration_forms SET is_published = TRUE WHERE LOWER(COALESCE(status, '')) = 'published';`);
        console.log('Created registration_forms table');

        const createFormSubmissionsTable = `
            CREATE TABLE IF NOT EXISTS registration_form_submissions (
                id SERIAL PRIMARY KEY,
                form_id INT NOT NULL REFERENCES registration_forms(id) ON DELETE CASCADE,
                project_title VARCHAR(255) NOT NULL,
                project_domain VARCHAR(100) NOT NULL,
                problem_statement TEXT,
                abstract TEXT,
                tech_stack TEXT,
                leader_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                team_members JSONB, 
                status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
                remarks TEXT,
                submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;
        await db.execute(createFormSubmissionsTable);
        console.log('Created registration_form_submissions table');

        console.log('Migration successful.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
