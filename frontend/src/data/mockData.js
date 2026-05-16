export const mockProjects = [
  {
    id: '1',
    title: 'AI-Powered Resume Parser',
    type: 'Major Project',
    teamName: 'Neural Ninjas',
    members: [
      { name: 'Piyush Mishra', roll: 'CS01' },
      { name: 'Rahul Sharma', roll: 'CS02' }
    ],
    mentor: 'Dr. Smith',
    description: 'An advanced resume parser using NLP to extract skills and experience.',
    status: 'In Development',
    progress: 65,
    startDate: '2026-01-15',
    kanban: [
      { id: 't1', title: 'Setup Backend API', stage: 'Development', priority: 'High' },
      { id: 't2', title: 'Design UI Layout', stage: 'UI/UX Design', priority: 'Medium' },
    ]
  },
  {
    id: '2',
    title: 'Blockchain Voting System',
    type: 'Mini Project',
    teamName: 'CryptoVoters',
    members: [
      { name: 'Amit Singh', roll: 'CS05' }
    ],
    mentor: 'Prof. J. Doe',
    description: 'Secure and transparent voting system using Ethereum.',
    status: 'Planning',
    progress: 20,
    startDate: '2026-03-01',
    kanban: [
      { id: 't3', title: 'Define Smart Contract', stage: 'Planning', priority: 'High' },
    ]
  }
];

export const mockFeedback = [
  { id: 'f1', projectId: '1', mentor: 'Dr. Smith', date: '2026-02-10', message: 'Good progress on the NLP module. Focus on accuracy now.' },
];
