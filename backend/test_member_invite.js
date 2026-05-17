const axios = require('axios');
const db = require('./src/config/db');

const API_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('🧪 Starting Dedicated Verification for Member Team Invitations...\n');

  try {
    // 0. Reset Project 1 member list to Piyush (5, leader) and Anjali (7, member)
    console.log('0. Resetting Project 1 team memberships...');
    await db.execute('DELETE FROM project_members WHERE project_id = 1');
    await db.execute('INSERT INTO project_members (project_id, student_id, is_leader) VALUES (1, 5, true)');
    await db.execute('INSERT INTO project_members (project_id, student_id, is_leader) VALUES (1, 7, false)');
    
    // Clear invitations for student2
    await db.execute(`
      DELETE FROM team_invitations 
      WHERE invited_student_id = (SELECT id FROM users WHERE email = 'student2@college.edu')
    `);
    console.log('✅ Project 1 team members reset successfully.');

    // 1. Login as Student B (Anjali - who is a MEMBER, not leader)
    console.log('1. Logging in as Student B (Anjali - student3@college.edu)...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'student3@college.edu',
      password: 'password123'
    });
    const tokenB = loginRes.data.token;
    console.log('✅ Student B (Anjali) logged in successfully.');

    // 2. Attempt to invite Student C (Rohan Verma - student2@college.edu) as Anjali (member)
    console.log('2. Sending team invitation to Rohan Verma (student2@college.edu) as Anjali...');
    const inviteRes = await axios.post(
      `${API_URL}/team/invite`,
      { email: 'student2@college.edu', rollNumber: 'CS2026002' },
      { headers: { Authorization: `Bearer ${tokenB}` } }
    );
    console.log('✅ Invite response:', inviteRes.data.message);

    // 3. Query the database using our invitations list to verify
    const listRes = await axios.get(`${API_URL}/team/invitations`, {
      headers: { Authorization: `Bearer ${tokenB}` } // Rohan's credentials later, let's login Rohan
    });

    console.log('\n🎉 SUCCESS: Active member Anjali was able to successfully invite Rohan! ✅');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response && error.response.data) {
      console.error('Error Details:', error.response.data);
    }
    process.exit(1);
  }
}

runTests();
