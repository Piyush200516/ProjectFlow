const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('🧪 Starting Dedicated Verification for Student 2 (Rohan Verma) Invite...\n');

  let tokenA = ''; // Piyush (Leader of Project 1)
  let tokenB = ''; // Rohan (student2@college.edu)

  try {
    // 1. Login as Student A (Piyush)
    console.log('1. Logging in as Student A (Piyush)...');
    const resA = await axios.post(`${API_URL}/auth/login`, {
      email: 'student@college.edu',
      password: 'password123'
    });
    tokenA = resA.data.token;
    console.log('✅ Student A logged in successfully.');

    // 2. Login as Student B (Rohan / student2)
    console.log('2. Logging in as Student B (Rohan / student2)...');
    const resB = await axios.post(`${API_URL}/auth/login`, {
      email: 'student2@college.edu',
      password: 'password123'
    });
    tokenB = resB.data.token;
    console.log('✅ Student B logged in successfully.');

    // 3. Send Team Invitation to Student B
    console.log('3. Sending team invitation to Student B (student2@college.edu, CS2026002)...');
    const inviteRes = await axios.post(
      `${API_URL}/team/invite`,
      { email: 'student2@college.edu', rollNumber: 'CS2026002' },
      { headers: { Authorization: `Bearer ${tokenA}` } }
    );
    console.log('✅ Invite response:', inviteRes.data.message);

    // 4. Fetch pending invitations as Student B
    console.log('4. Fetching pending invitations for Student B...');
    const listRes = await axios.get(`${API_URL}/team/invitations`, {
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    console.log(`✅ Invitations found for Student B: ${listRes.data.length}`);
    if (listRes.data.length === 0) {
      throw new Error('No pending invitations found for Student B!');
    }
    const inviteId = listRes.data[0].invite_id;

    // 5. Accept the invitation as Student B
    console.log(`5. Accepting invitation ID ${inviteId} as Student B...`);
    const acceptRes = await axios.post(
      `${API_URL}/team/accept`,
      { inviteId },
      { headers: { Authorization: `Bearer ${tokenB}` } }
    );
    console.log('✅ Accept response:', acceptRes.data.message);

    // 6. Verify they belong to the same project now (GET /api/team/project/1)
    console.log('6. Verifying synchronized team workspace...');
    const projectRes = await axios.get(`${API_URL}/team/project/1`, {
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    console.log(`✅ Sync verify - Project title: "${projectRes.data.project.title}"`);
    console.log(`✅ Sync verify - Team members: ${projectRes.data.members.map(m => m.full_name).join(', ')}`);

    const isMember = projectRes.data.members.some(m => m.email === 'student2@college.edu');
    if (isMember) {
      console.log('🎉 SUCCESS: Student 2 (Rohan Verma) has successfully joined Piyush\'s project team! ✅');
    } else {
      throw new Error('Student 2 is still not showing in Piyush\'s project members list.');
    }

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
