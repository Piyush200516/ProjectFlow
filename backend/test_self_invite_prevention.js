const axios = require('axios');
const db = require('./src/config/db');

const API_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('🧪 Starting Dedicated Verification for Self-Invite Prevention...\n');

  try {
    // 0. Reset Project 1 member list to Piyush and Anjali to avoid the 5-member cap
    console.log('0. Cleaning up Project 1 members to ensure capacity...');
    await db.execute(
      'DELETE FROM project_members WHERE project_id = 1 AND student_id NOT IN (5, 7)'
    );
    console.log('✅ Team membership capacity restored.');

    // 1. Login as Student A (Piyush)
    console.log('1. Logging in as Student A (Piyush)...');
    const resA = await axios.post(`${API_URL}/auth/login`, {
      email: 'student@college.edu',
      password: 'password123'
    });
    const tokenA = resA.data.token;
    console.log('✅ Student A logged in successfully.');

    // 2. Attempt self-invite
    console.log('2. Attempting self-invite (student@college.edu, CS2026001)...');
    try {
      await axios.post(
        `${API_URL}/team/invite`,
        { email: 'student@college.edu', rollNumber: 'CS2026001' },
        { headers: { Authorization: `Bearer ${tokenA}` } }
      );
      throw new Error('Self-invite was incorrectly ALLOWED!');
    } catch (err) {
      if (err.response && err.response.status === 400) {
        console.log('✅ Blocked correctly with status 400.');
        console.log('✅ Error message received:', err.response.data.message);
        if (err.response.data.message === 'You cannot invite yourself to your own team.') {
          console.log('\n🎉 SUCCESS: Self-invite prevention verified successfully! ✅');
          process.exit(0);
        } else {
          throw new Error(`Unexpected error message: ${err.response.data.message}`);
        }
      } else {
        throw err;
      }
    }
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response && error.response.data) {
      console.error('Error Details:', error.response.data);
    }
    process.exit(1);
  }
}

runTests();
