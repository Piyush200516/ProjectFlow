const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:5000/api';

const results = {
  WORKING: [],
  BROKEN: [],
  MISSING: [],
  FIXED: []
};

function record(apiName, status, errorMsg = null) {
  if (status === 'WORKING') {
    results.WORKING.push(apiName);
  } else if (status === 'BROKEN') {
    results.BROKEN.push(`${apiName} (${errorMsg})`);
  } else if (status === 'MISSING') {
    results.MISSING.push(apiName);
  } else if (status === 'FIXED') {
    results.FIXED.push(apiName);
  }
}

async function runTests() {
  console.log('🧪 Starting complete ProjectFlow Edu API Diagnostics Sweeper...\n');

  // 1. Health Check
  try {
    const res = await axios.get(`${API_URL}/health`);
    if (res.data.status === 'OK' && res.data.database === 'CONNECTED') {
      console.log('✅ GET /api/health: WORKING');
      record('GET /api/health', 'WORKING');
    } else {
      throw new Error(`Invalid payload: ${JSON.stringify(res.data)}`);
    }
  } catch (err) {
    console.error('❌ GET /api/health: BROKEN', err.message);
    record('GET /api/health', 'BROKEN', err.message);
  }

  // Tokens and Temp Identifiers
  let studentToken = '';
  let mentorToken = '';
  let hodToken = '';
  let cdcToken = '';
  let tempProjectId = null;
  let tempTaskId = null;
  let tempDocId = null;

  // 2. Auth: Register
  const uniqueEmail = `stu_${Date.now()}@college.edu`;
  try {
    const res = await axios.post(`${API_URL}/auth/register`, {
      full_name: 'Test Student',
      email: uniqueEmail,
      password: 'password123',
      roll_number: `ROLL_${Date.now()}`
    });
    if (res.data.success && res.data.token) {
      console.log('✅ POST /api/auth/register: WORKING');
      record('POST /api/auth/register', 'WORKING');
    } else {
      throw new Error(`Unexpected payload: ${JSON.stringify(res.data)}`);
    }
  } catch (err) {
    console.error('❌ POST /api/auth/register: BROKEN', err.message);
    record('POST /api/auth/register', 'BROKEN', err.message);
  }

  // 3. Auth: Login (Student)
  try {
    const res = await axios.post(`${API_URL}/auth/login`, {
      email: 'student@college.edu',
      password: 'password123'
    });
    studentToken = res.data.token;
    console.log('✅ POST /api/auth/login: WORKING');
    record('POST /api/auth/login', 'WORKING');
  } catch (err) {
    console.error('❌ POST /api/auth/login: BROKEN', err.message);
    record('POST /api/auth/login', 'BROKEN', err.message);
  }

  // Login other roles for subsequent dashboard testing
  try {
    const mentorLogin = await axios.post(`${API_URL}/auth/login`, { email: 'mentor@college.edu', password: 'password123' });
    mentorToken = mentorLogin.data.token;
    const hodLogin = await axios.post(`${API_URL}/auth/login`, { email: 'hod@college.edu', password: 'password123' });
    hodToken = hodLogin.data.token;
    const cdcLogin = await axios.post(`${API_URL}/auth/login`, { email: 'cdc@college.edu', password: 'password123' });
    cdcToken = cdcLogin.data.token;
  } catch (err) {
    console.error('⚠️ Pre-login setups failed:', err.message);
  }

  // 4. Auth: Get Me (Protected)
  try {
    // Test auth protection failure first
    try {
      await axios.get(`${API_URL}/auth/me`);
      throw new Error('Should have failed with 401');
    } catch (unauthErr) {
      if (unauthErr.response && unauthErr.response.status === 401) {
        // Success check
      } else {
        throw unauthErr;
      }
    }

    // Test auth success
    const res = await axios.get(`${API_URL}/auth/me`, { headers: { Authorization: `Bearer ${studentToken}` } });
    if (res.data.user && res.data.user.email === 'student@college.edu') {
      console.log('✅ GET /api/auth/me: WORKING');
      record('GET /api/auth/me', 'WORKING');
    } else {
      throw new Error('Invalid user details returned');
    }
  } catch (err) {
    console.error('❌ GET /api/auth/me: BROKEN', err.message);
    record('GET /api/auth/me', 'BROKEN', err.message);
  }

  // 5. Projects: GET Projects
  try {
    const res = await axios.get(`${API_URL}/projects`, { headers: { Authorization: `Bearer ${studentToken}` } });
    if (Array.isArray(res.data)) {
      console.log('✅ GET /api/projects: WORKING');
      record('GET /api/projects', 'WORKING');
    } else {
      throw new Error('Not an array');
    }
  } catch (err) {
    console.error('❌ GET /api/projects: BROKEN', err.message);
    record('GET /api/projects', 'BROKEN', err.message);
  }

  // 6. Projects: POST Create Project
  try {
    const res = await axios.post(
      `${API_URL}/projects`,
      { title: 'API Automated Test Project', type: 'Major Project', description: 'Testing POST projects' },
      { headers: { Authorization: `Bearer ${studentToken}` } }
    );
    tempProjectId = res.data.id;
    if (tempProjectId) {
      console.log('✅ POST /api/projects: WORKING');
      record('POST /api/projects', 'WORKING');
    } else {
      throw new Error('No project ID returned');
    }
  } catch (err) {
    console.error('❌ POST /api/projects: BROKEN', err.message);
    record('POST /api/projects', 'BROKEN', err.message);
  }

  // 7. Projects: GET Project By ID
  if (tempProjectId) {
    try {
      const res = await axios.get(`${API_URL}/projects/${tempProjectId}`, { headers: { Authorization: `Bearer ${studentToken}` } });
      if (res.data.id === tempProjectId && Array.isArray(res.data.members)) {
        console.log('✅ GET /api/projects/:id: WORKING');
        record('GET /api/projects/:id', 'WORKING');
      } else {
        throw new Error('Invalid project detail fields');
      }
    } catch (err) {
      console.error('❌ GET /api/projects/:id: BROKEN', err.message);
      record('GET /api/projects/:id', 'BROKEN', err.message);
    }
  } else {
    record('GET /api/projects/:id', 'MISSING', 'Project was not created');
  }

  // 8. Projects: PUT Update Project
  if (tempProjectId) {
    try {
      const res = await axios.put(
        `${API_URL}/projects/${tempProjectId}`,
        { title: 'API Automated Test Project Updated' },
        { headers: { Authorization: `Bearer ${studentToken}` } }
      );
      if (res.data.title === 'API Automated Test Project Updated') {
        console.log('✅ PUT /api/projects/:id: WORKING');
        record('PUT /api/projects/:id', 'WORKING');
      } else {
        throw new Error('Title update did not reflect');
      }
    } catch (err) {
      console.error('❌ PUT /api/projects/:id: BROKEN', err.message);
      record('PUT /api/projects/:id', 'BROKEN', err.message);
    }
  } else {
    record('PUT /api/projects/:id', 'MISSING');
  }

  // 9. Projects: PATCH Update Project
  if (tempProjectId) {
    try {
      const res = await axios.patch(
        `${API_URL}/projects/${tempProjectId}`,
        { status: 'In Progress' },
        { headers: { Authorization: `Bearer ${studentToken}` } }
      );
      if (res.data.status === 'In Progress') {
        console.log('✅ PATCH /api/projects/:id: WORKING');
        record('PATCH /api/projects/:id', 'WORKING');
      } else {
        throw new Error('Status patch did not reflect');
      }
    } catch (err) {
      console.error('❌ PATCH /api/projects/:id: BROKEN', err.message);
      record('PATCH /api/projects/:id', 'BROKEN', err.message);
    }
  } else {
    record('PATCH /api/projects/:id', 'MISSING');
  }

  // 10. Tasks: GET Tasks By Project
  try {
    const res = await axios.get(`${API_URL}/tasks/project/1`, { headers: { Authorization: `Bearer ${studentToken}` } });
    if (Array.isArray(res.data)) {
      console.log('✅ GET /api/tasks/project/:projectId: WORKING');
      record('GET /api/tasks/project/:projectId', 'WORKING');
    } else {
      throw new Error('Not an array');
    }
  } catch (err) {
    console.error('❌ GET /api/tasks/project/:projectId: BROKEN', err.message);
    record('GET /api/tasks/project/:projectId', 'BROKEN', err.message);
  }

  // 11. Tasks: POST Create Task
  try {
    const res = await axios.post(
      `${API_URL}/tasks`,
      { title: 'Create PostgreSQL Schema Task', status: 'Requirements', priority: 'High', projectId: 1, members: ['Piyush Mishra'] },
      { headers: { Authorization: `Bearer ${studentToken}` } }
    );
    tempTaskId = res.data.id;
    if (tempTaskId) {
      console.log('✅ POST /api/tasks: WORKING');
      record('POST /api/tasks', 'WORKING');
    } else {
      throw new Error('No task ID returned');
    }
  } catch (err) {
    console.error('❌ POST /api/tasks: BROKEN', err.message);
    record('POST /api/tasks', 'BROKEN', err.message);
  }

  // 12. Tasks: PUT Update Task
  if (tempTaskId) {
    try {
      const res = await axios.put(
        `${API_URL}/tasks/${tempTaskId}`,
        { status: 'Development', priority: 'Critical' },
        { headers: { Authorization: `Bearer ${studentToken}` } }
      );
      if (res.data.status === 'Development') {
        console.log('✅ PUT /api/tasks/:id: WORKING');
        record('PUT /api/tasks/:id', 'WORKING');
      } else {
        throw new Error('Task status update did not reflect');
      }
    } catch (err) {
      console.error('❌ PUT /api/tasks/:id: BROKEN', err.message);
      record('PUT /api/tasks/:id', 'BROKEN', err.message);
    }
  } else {
    record('PUT /api/tasks/:id', 'MISSING');
  }

  // 13. Tasks: DELETE Task
  if (tempTaskId) {
    try {
      await axios.delete(`${API_URL}/tasks/${tempTaskId}`, { headers: { Authorization: `Bearer ${studentToken}` } });
      console.log('✅ DELETE /api/tasks/:id: WORKING');
      record('DELETE /api/tasks/:id', 'WORKING');
    } catch (err) {
      console.error('❌ DELETE /api/tasks/:id: BROKEN', err.message);
      record('DELETE /api/tasks/:id', 'BROKEN', err.message);
    }
  } else {
    record('DELETE /api/tasks/:id', 'MISSING');
  }

  // 14. Documents: GET Documents By Project
  try {
    const res = await axios.get(`${API_URL}/documents/project/1`, { headers: { Authorization: `Bearer ${studentToken}` } });
    if (Array.isArray(res.data)) {
      console.log('✅ GET /api/documents/project/:projectId: WORKING');
      record('GET /api/documents/project/:projectId', 'WORKING');
    } else {
      throw new Error('Not an array');
    }
  } catch (err) {
    console.error('❌ GET /api/documents/project/:projectId: BROKEN', err.message);
    record('GET /api/documents/project/:projectId', 'BROKEN', err.message);
  }

  // 15. Documents: POST Upload Document
  try {
    const tempFilePath = path.join(__dirname, 'test_mock_document.pdf');
    fs.writeFileSync(tempFilePath, '%PDF-1.4 Mock PDF Content for ProjectFlow Edu API Testing', 'utf8');

    const form = new FormData();
    form.append('projectId', '1');
    
    // Create form boundary manually or use native Blob/File under Node 18+
    const fileBuffer = fs.readFileSync(tempFilePath);
    const blob = new Blob([fileBuffer], { type: 'application/pdf' });
    form.append('file', blob, 'test_mock_document.pdf');

    const res = await axios.post(`${API_URL}/documents/upload`, form, {
      headers: {
        Authorization: `Bearer ${studentToken}`
      }
    });

    tempDocId = res.data.id;
    fs.unlinkSync(tempFilePath); // Cleanup local mock

    if (tempDocId) {
      console.log('✅ POST /api/documents/upload: WORKING');
      record('POST /api/documents/upload', 'WORKING');
    } else {
      throw new Error('No document ID returned');
    }
  } catch (err) {
    console.error('❌ POST /api/documents/upload: BROKEN', err.message);
    record('POST /api/documents/upload', 'BROKEN', err.message);
  }

  // 16. Documents: DELETE Document
  if (tempDocId) {
    try {
      await axios.delete(`${API_URL}/documents/${tempDocId}`, { headers: { Authorization: `Bearer ${studentToken}` } });
      console.log('✅ DELETE /api/documents/:id: WORKING');
      record('DELETE /api/documents/:id', 'WORKING');
    } catch (err) {
      console.error('❌ DELETE /api/documents/:id: BROKEN', err.message);
      record('DELETE /api/documents/:id', 'BROKEN', err.message);
    }
  } else {
    record('DELETE /api/documents/:id', 'MISSING');
  }

  // 17. Projects: DELETE Project (Cleanup)
  if (tempProjectId) {
    try {
      await axios.delete(`${API_URL}/projects/${tempProjectId}`, { headers: { Authorization: `Bearer ${studentToken}` } });
      console.log('✅ DELETE /api/projects/:id: WORKING');
      record('DELETE /api/projects/:id', 'WORKING');
    } catch (err) {
      console.error('❌ DELETE /api/projects/:id: BROKEN', err.message);
      record('DELETE /api/projects/:id', 'BROKEN', err.message);
    }
  } else {
    record('DELETE /api/projects/:id', 'MISSING');
  }

  // 18. Mentor APIs
  try {
    const res = await axios.get(`${API_URL}/mentor/dashboard`, { headers: { Authorization: `Bearer ${mentorToken}` } });
    if (res.data && typeof res.data.assigned === 'number') {
      console.log('✅ GET /api/mentor/dashboard: WORKING');
      record('GET /api/mentor/dashboard', 'WORKING');
    } else {
      throw new Error('Invalid dashboard fields');
    }
  } catch (err) {
    console.error('❌ GET /api/mentor/dashboard: BROKEN', err.message);
    record('GET /api/mentor/dashboard', 'BROKEN', err.message);
  }

  // 19. HOD APIs
  try {
    const res = await axios.get(`${API_URL}/hod/dashboard`, { headers: { Authorization: `Bearer ${hodToken}` } });
    if (res.data && typeof res.data.totalProjects === 'number') {
      console.log('✅ GET /api/hod/dashboard: WORKING');
      record('GET /api/hod/dashboard', 'WORKING');
    } else {
      throw new Error('Invalid dashboard fields');
    }
  } catch (err) {
    console.error('❌ GET /api/hod/dashboard: BROKEN', err.message);
    record('GET /api/hod/dashboard', 'BROKEN', err.message);
  }

  // 20. CDC APIs
  try {
    const res = await axios.get(`${API_URL}/cdc/dashboard`, { headers: { Authorization: `Bearer ${cdcToken}` } });
    if (res.data && typeof res.data.activeStartups === 'number') {
      console.log('✅ GET /api/cdc/dashboard: WORKING');
      record('GET /api/cdc/dashboard', 'WORKING');
    } else {
      throw new Error('Invalid dashboard fields');
    }
  } catch (err) {
    console.error('❌ GET /api/cdc/dashboard: BROKEN', err.message);
    record('GET /api/cdc/dashboard', 'BROKEN', err.message);
  }

  // Render Report
  console.log('\n=======================================');
  console.log('         📊 API DIAGNOSTIC REPORT      ');
  console.log('=======================================');
  
  console.log('\n[WORKING]');
  results.WORKING.forEach(api => console.log(`- ${api}`));
  
  console.log('\n[BROKEN]');
  if (results.BROKEN.length === 0) console.log('- None');
  results.BROKEN.forEach(api => console.log(`- ${api}`));
  
  console.log('\n[MISSING]');
  if (results.MISSING.length === 0) console.log('- None');
  results.MISSING.forEach(api => console.log(`- ${api}`));

  console.log('\n[FIXED]');
  if (results.FIXED.length === 0) console.log('- None');
  results.FIXED.forEach(api => console.log(`- ${api}`));

  console.log('\n=======================================');
  process.exit(results.BROKEN.length > 0 ? 1 : 0);
}

runTests();
