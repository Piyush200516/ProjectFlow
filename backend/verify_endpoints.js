const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function testPortals() {
  console.log('🏁 Starting programmatic integration and verification testing...\n');

  try {
    // 1. Verify Student Portal
    console.log('--- 👤 1. Testing Student Portal ---');
    const studentLogin = await axios.post(`${API_URL}/auth/login`, {
      email: 'student@college.edu',
      password: 'password123'
    });
    console.log('✅ Student Login: Success!');
    const studentToken = studentLogin.data.token;
    console.log(`   User Info: ${JSON.stringify(studentLogin.data.user)}`);

    const studentHeaders = { headers: { Authorization: `Bearer ${studentToken}` } };
    
    const studentMe = await axios.get(`${API_URL}/auth/me`, studentHeaders);
    console.log(`✅ Get Student Profile /me: Success! Full Name: ${studentMe.data.user.full_name}`);

    const studentProjects = await axios.get(`${API_URL}/projects`, studentHeaders);
    console.log(`✅ Get Student Projects: Success! Found ${studentProjects.data.length} projects.`);
    studentProjects.data.forEach(p => {
      console.log(`   - Project ID: ${p.id}, Title: "${p.title}", Team: "${p.team_name}", Progress: ${p.progress_percent}%`);
    });

    if (studentProjects.data.length > 0) {
      const projectId = studentProjects.data[0].id;
      const projectTasks = await axios.get(`${API_URL}/tasks/project/${projectId}`, studentHeaders);
      console.log(`✅ Get Project Tasks: Success! Found ${projectTasks.data.length} tasks.`);
      projectTasks.data.forEach(t => {
        console.log(`     Task: "${t.title}", Status: "${t.status}", Priority: "${t.priority}", Assignees: ${JSON.stringify(t.members)}`);
      });
    }

    // 2. Verify Mentor Portal
    console.log('\n--- 🏫 2. Testing Mentor Portal ---');
    const mentorLogin = await axios.post(`${API_URL}/auth/login`, {
      email: 'mentor@college.edu',
      password: 'password123'
    });
    console.log('✅ Mentor Login: Success!');
    const mentorToken = mentorLogin.data.token;
    const mentorHeaders = { headers: { Authorization: `Bearer ${mentorToken}` } };

    const mentorStats = await axios.get(`${API_URL}/mentor/dashboard`, mentorHeaders);
    console.log(`✅ Get Mentor Stats: Success! Statistics: ${JSON.stringify(mentorStats.data)}`);

    const mentorReviews = await axios.get(`${API_URL}/mentor/reviews`, mentorHeaders);
    console.log(`✅ Get Mentor Reviews Queue: Success! Found ${mentorReviews.data.length} items in queue.`);

    // 3. Verify HOD Portal
    console.log('\n--- 🏛️ 3. Testing HOD Portal ---');
    const hodLogin = await axios.post(`${API_URL}/auth/login`, {
      email: 'hod@college.edu',
      password: 'password123'
    });
    console.log('✅ HOD Login: Success!');
    const hodToken = hodLogin.data.token;
    const hodHeaders = { headers: { Authorization: `Bearer ${hodToken}` } };

    const hodStats = await axios.get(`${API_URL}/hod/dashboard`, hodHeaders);
    console.log(`✅ Get HOD Stats: Success! Statistics: ${JSON.stringify(hodStats.data)}`);

    const hodProjects = await axios.get(`${API_URL}/hod/projects`, hodHeaders);
    console.log(`✅ Get HOD Oversight Projects: Success! Found ${hodProjects.data.length} projects.`);

    // 4. Verify CDC Portal
    console.log('\n--- 💼 4. Testing CDC Portal ---');
    const cdcLogin = await axios.post(`${API_URL}/auth/login`, {
      email: 'cdc@college.edu',
      password: 'password123'
    });
    console.log('✅ CDC Login: Success!');
    const cdcToken = cdcLogin.data.token;
    const cdcHeaders = { headers: { Authorization: `Bearer ${cdcToken}` } };

    const cdcStats = await axios.get(`${API_URL}/cdc/dashboard`, cdcHeaders);
    console.log(`✅ Get CDC Stats: Success! Statistics: ${JSON.stringify(cdcStats.data)}`);

    const cdcStartups = await axios.get(`${API_URL}/cdc/startups`, cdcHeaders);
    console.log(`✅ Get CDC Startups: Success! Found ${cdcStartups.data.length} incubated startups.`);
    cdcStartups.data.forEach(s => {
      console.log(`   - Startup: "${s.name}", Founder: "${s.founder_name}", Stage: "${s.incubation_stage}", Funding: "${s.funding_status}"`);
    });

    console.log('\n🎉 ALL PORTALS AND ENDPOINTS TESTED SUCCESSFULLY! INTEGRATION VERIFIED 100%!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ INTEGRATION TEST FAILED:', error.message);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data: ${JSON.stringify(error.response.data)}`);
    }
    process.exit(1);
  }
}

testPortals();
