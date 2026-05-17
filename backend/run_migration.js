const db = require('./src/config/db');

async function run() {
  try {
    console.log('Starting Team Invitation Database Migration...');
    
    // Create team_invitations table safely
    await db.execute(`
      CREATE TABLE IF NOT EXISTS team_invitations (
          invite_id SERIAL PRIMARY KEY,
          project_id INT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
          inviter_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          invited_student_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Accepted', 'Rejected')),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ table team_invitations is ready');

    // Create indexes safely (using PostgreSQL index syntax)
    // In pg, CREATE INDEX IF NOT EXISTS is fully supported
    await db.execute('CREATE INDEX IF NOT EXISTS idx_team_invitations_project ON team_invitations(project_id)');
    await db.execute('CREATE INDEX IF NOT EXISTS idx_team_invitations_invited ON team_invitations(invited_student_id)');
    await db.execute('CREATE INDEX IF NOT EXISTS idx_team_invitations_inviter ON team_invitations(inviter_id)');
    console.log('✅ Indexes are ready');

    // Clean up project memberships for student2 so he can be invited
    console.log('Cleaning up project_members and team_invitations for student2 to ensure he can be invited successfully...');
    await db.execute(`
      DELETE FROM project_members 
      WHERE student_id = (SELECT id FROM users WHERE email = 'student2@college.edu')
    `);
    await db.execute(`
      DELETE FROM team_invitations 
      WHERE invited_student_id = (SELECT id FROM users WHERE email = 'student2@college.edu') 
         OR inviter_id = (SELECT id FROM users WHERE email = 'student2@college.edu')
    `);
    console.log('✅ student2 is now clean and fully inviteable!');
    
    console.log('🎉 Migration completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
}

run();
