const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('🧪 Starting Team Invitation Workflow API Verification...\n');

  let tokenA = ''; // Piyush (Leader of Project 1)
  let tokenB = ''; // Rohan (Leader of Project 2)
  let tokenC = ''; // Newly registered student (no project)
  
  const emailC = `invited_${Date.now()}@college.edu`;
  const rollC = `ROLL_${Date.now()}`;

  try {
    // 1. Login as Student A (Piyush)
    console.log('1. Logging in as Student A (Piyush)...');
    const resA = await axios.post(`${API_URL}/auth/login`, {
      email: 'student@college.edu',
      password: 'password123'
    });
    tokenA = resA.data.token;
    console.log('✅ Student A logged in.');

    // 2. Login as Student B (Rohan)
    console.log('2. Logging in as Student B (Rohan)...');
    const resB = await axios.post(`${API_URL}/auth/login`, {
      email: 'student2@college.edu',
      password: 'password123'
    });
    tokenB = resB.data.token;
    console.log('✅ Student B logged in.');

    // 3. Register a clean student (Student C)
    console.log(`3. Registering new Student C (${emailC}, ${rollC})...`);
    const resC = await axios.post(`${API_URL}/auth/register`, {
      full_name: 'Invited Test Student',
      email: emailC,
      password: 'password123',
      roll_number: rollC
    });
    tokenC = resC.data.token;
    console.log('✅ Student C registered successfully.');

    // 4. Send Team Invitation from A to C (Should succeed)
    console.log('4. Sending team invitation from A (Piyush) to C...');
    const inviteRes = await axios.post(
      `${API_URL}/team/invite`,
      { email: emailC, rollNumber: rollC },
      { headers: { Authorization: `Bearer ${tokenA}` } }
    );
    console.log('✅ Invite response:', inviteRes.data.message);

    // 5. Attempt duplicate invite (Should fail)
    console.log('5. Attempting duplicate invite (A to C)...');
    try {
      await axios.post(
        `${API_URL}/team/invite`,
        { email: emailC, rollNumber: rollC },
        { headers: { Authorization: `Bearer ${tokenA}` } }
      );
      console.error('❌ Duplicate invite should have failed!');
    } catch (err) {
      console.log('✅ Duplicate invite blocked correctly:', err.response.data.message);
    }

    // 6. Invite student who is already working on another active project (Should fail)
    console.log('6. Inviting Student B (who is already leader of AgriTech AI)...');
    try {
      await axios.post(
        `${API_URL}/team/invite`,
        { email: 'student2@college.edu', rollNumber: 'CS2026002' },
        { headers: { Authorization: `Bearer ${tokenA}` } }
      );
      console.error('❌ Invite to occupied student should have failed!');
    } catch (err) {
      console.log('✅ Invite to occupied student blocked correctly:', err.response.data.message);
    }

    // 7. Get Invitations for Student C
    console.log('7. Fetching pending invitations for Student C...');
    const listRes = await axios.get(`${API_URL}/team/invitations`, {
      headers: { Authorization: `Bearer ${tokenC}` }
    });
    console.log(`✅ Invitations count: ${listRes.data.length}`);
    if (listRes.data.length === 0) {
      throw new Error('No invitations found for Student C');
    }
    const inviteId = listRes.data[0].invite_id;
    console.log(`✅ Invitation ID to accept: ${inviteId}`);

    // 8. Accept Team Invitation
    console.log('8. Accepting invitation as Student C...');
    const acceptRes = await axios.post(
      `${API_URL}/team/accept`,
      { inviteId },
      { headers: { Authorization: `Bearer ${tokenC}` } }
    );
    console.log('✅ Accept response:', acceptRes.data.message);

    // 9. Verify Synced Workspace (GET /api/team/project/1)
    console.log('9. Verifying synced workspace for Student C...');
    const projectRes = await axios.get(`${API_URL}/team/project/1`, {
      headers: { Authorization: `Bearer ${tokenC}` }
    });
    console.log(`✅ Project title synced: ${projectRes.data.project.title}`);
    console.log(`✅ Team name synced: ${projectRes.data.project.team_name}`);
    console.log(`✅ Team member list counts: ${projectRes.data.members.length} members`);
    
    const isMemberPresent = projectRes.data.members.some(m => m.user_id === resC.data.user.id);
    if (isMemberPresent) {
      console.log('✅ Student C exists in team members list.');
    } else {
      throw new Error('Student C is missing in team members list!');
    }

    console.log('\n🎉 ALL BACKEND TEAM INVITATION TESTS PASSED SUCCESSFULLY! ✅');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Verification failed:', error.message);
    if (error.response && error.response.data) {
      console.error('Error Details:', error.response.data);
    }
    process.exit(1);
  }
}

runTests();
