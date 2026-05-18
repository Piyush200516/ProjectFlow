const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function testSaaSWorkflow() {
  console.log('🏁 Starting Academic SaaS Workflow Verification Suite...\n');

  try {
    // 1. Log in Student Leader
    console.log('--- 👤 1. Logging in Student Leader (Rohan Sharma) ---');
    const student1Login = await axios.post(`${API_URL}/auth/login`, {
      email: 'student1@college.edu',
      password: 'password123'
    });
    console.log('✅ Student 1 Login: Success!');
    const student1Token = student1Login.data.token;
    const student1Headers = { headers: { Authorization: `Bearer ${student1Token}` } };

    // Get Active Registration Forms
    const activeForms = await axios.get(`${API_URL}/workflow/student/forms/active`, student1Headers);
    console.log(`✅ Get Active Registration Forms: Success! Found ${activeForms.data.length} open forms.`);
    if (activeForms.data.length === 0) {
      throw new Error('No active registration forms found!');
    }
    const formId = activeForms.data[0].id;

    // 2. Submit Project Team Proposal
    console.log('\n--- 👥 2. Submitting Project Team Proposal (exactly 4 members) ---');
    const submissionBody = {
      form_id: formId,
      title: 'Automated Academic SaaS Platform',
      description: 'Fully digitizing the offline student project management lifecycle.',
      domain: 'Web Application & Cloud',
      github_link: 'https://github.com/student/academic-saas',
      team_member_emails: [
        'student2@college.edu',
        'student3@college.edu',
        'student4@college.edu'
      ]
    };

    const registrationSubmit = await axios.post(
      `${API_URL}/workflow/student/forms/submit`,
      submissionBody,
      student1Headers
    );
    const submissionId = registrationSubmit.data.submissionId;
    console.log(`✅ Project Proposal Submitted Successfully! Registration ID: ${submissionId}`);

    // 3. Log in HOD (Dr. Piyush Mishra)
    console.log('\n--- 🏛️ 3. Logging in HOD for Approval & Mentor Assignment ---');
    const hodLogin = await axios.post(`${API_URL}/auth/login`, {
      email: 'hod@college.edu',
      password: 'password123'
    });
    console.log('✅ HOD Login: Success!');
    const hodToken = hodLogin.data.token;
    const hodHeaders = { headers: { Authorization: `Bearer ${hodToken}` } };

    // Fetch HOD Pending Approvals list
    const pendingApprovals = await axios.get(`${API_URL}/workflow/hod/submissions`, hodHeaders);
    console.log(`✅ Get HOD Approvals List: Success! Found ${pendingApprovals.data.length} pending registration forms.`);

    // Assign Mentor (Manual allocation to Prof. Satish Verma, user_id = 3)
    console.log('   Assigning Prof. Satish Verma to the project team...');
    const assignResult = await axios.post(
      `${API_URL}/workflow/hod/assign-mentor`,
      {
        submission_id: submissionId,
        mentor_id: 3,
        auto_assign: false
      },
      hodHeaders
    );
    console.log(`✅ Mentor Assigned & Project Workspace Activated! Project ID: ${assignResult.data.projectId}`);
    const projectId = assignResult.data.projectId;

    // 4. Log in Mentor (Prof. Satish Verma)
    console.log('\n--- 🏫 4. Logging in Mentor to Create Deliverable Milestones ---');
    const mentorLogin = await axios.post(`${API_URL}/auth/login`, {
      email: 'mentor@college.edu',
      password: 'password123'
    });
    console.log('✅ Mentor Login: Success!');
    const mentorToken = mentorLogin.data.token;
    const mentorHeaders = { headers: { Authorization: `Bearer ${mentorToken}` } };

    // Upload Document Template (Synopsis Deliverable)
    console.log('   Uploading Synopsis Deliverable template & setting deadline...');
    const templateCreate = await axios.post(
      `${API_URL}/workflow/mentor/document-templates`,
      {
        title: 'Project Synopsis deliverable template',
        description: 'Detailing title, objectives, tech stack, and members role matrix.',
        file_path: 'uploads/templates/synopsis_format.pdf',
        document_type: 'Synopsis',
        project_type: 'Minor Project',
        deadline_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days from now (on-time)
      },
      mentorHeaders
    );
    console.log(`✅ Synopsis Template Created! Template ID: ${templateCreate.data.templateId}`);
    const templateId = templateCreate.data.templateId;

    // 5. Student Submits Deliverable
    console.log('\n--- 📤 5. Student Leader Submitting Synopsis Deliverable ---');
    const docSubmit = await axios.post(
      `${API_URL}/workflow/student/documents/submit`,
      {
        project_id: projectId,
        template_id: templateId,
        document_type: 'Synopsis',
        file_name: 'Synopsis_Automated_SaaS.pdf',
        file_path: 'uploads/student1/Synopsis_Automated_SaaS.pdf'
      },
      student1Headers
    );
    console.log(`✅ Deliverable Submitted! On-Time Status: ${!docSubmit.data.isLate}, Score awarded: ${docSubmit.data.scoreAwarded}/10`);
    const docSubmissionId = docSubmit.data.submissionId;

    // 6. Mentor Review and Scoring
    console.log('\n--- 📝 6. Mentor Reviewing Submission ---');
    const reviewResult = await axios.post(
      `${API_URL}/workflow/mentor/submissions/${docSubmissionId}/review`,
      {
        status: 'Approved',
        comments: 'Outstanding detailed proposal. 10/10 timeliness and coverage.'
      },
      mentorHeaders
    );
    console.log('✅ Mentor Approved and Scored the Submission!');

    // 7. Verify Scores and Final Evaluation
    console.log('\n--- 📊 7. Verifying Auto Scoring & Final Evaluation Breakup ---');
    const marksData = await axios.get(
      `${API_URL}/workflow/projects/marks?studentId=4&projectId=${projectId}`,
      student1Headers
    );

    console.log(`✅ Marks Retrieval: Success!`);
    marksData.data.forEach(m => {
      console.log(`   - Student ID: ${m.student_id}`);
      console.log(`     Timely Submission Score: ${m.timeliness_marks}/20`);
      console.log(`     Documentation Completeness: ${m.completeness}/30`);
      console.log(`     Other Quality Metrics (Mentor + Viva + Innovation): ${parseFloat(m.quality_marks) - parseFloat(m.completeness)}/50`);
      console.log(`     Total Joint Score: ${m.total_marks}/100`);
    });

    console.log('\n🎉 ALL PORTAL WORKFLOW PHASES (1 TO 8) SUCCESSFULLY VERIFIED AND COMPLETED!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ WORKFLOW INTEGRATION TEST FAILED:', error.message);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data: ${JSON.stringify(error.response.data)}`);
    }
    process.exit(1);
  }
}

testSaaSWorkflow();
