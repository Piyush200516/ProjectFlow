# Migrate ProjectFlow Edu Frontend to Firebase

The goal is to replace the current dummy data and mock authentication with real Firebase services (Authentication, Firestore, and Storage). This will act as the backend for the application for now, ensuring a functional data layer without needing the Node.js backend.

## User Review Required

> [!IMPORTANT]
> The plan involves modifying several files. The mock data will be completely removed in favor of real-time Firebase listeners or fetches. Please review the planned file changes to ensure they align with your expectations.
> 
> Also, since we are moving away from mock data, you will need to create some users via signup or populate Firestore with Mentor/HOD/CDC users manually, as these roles cannot register from the frontend.
>
> Firebase environment variables must be populated in the `.env` file after creation.

## Open Questions

> [!WARNING]
> How should project progress calculation happen for now? Should it be manually updatable or calculated based on Kanban tasks? For now, I'll allow manual update or leave it static.
> For the mentor/HOD/CDC users, since they can't sign up, you'll need to create their accounts in Firebase Auth and add their roles to the `users` collection in Firestore. Does this sound correct?

## Proposed Changes

### Configuration
#### [NEW] [firebase.js](file:///e:/ProjectFlow/frontend/src/lib/firebase.js)
- Initialize Firebase App.
- Export `auth`, `db` (Firestore), and `storage`.
#### [NEW] [.env.example](file:///e:/ProjectFlow/frontend/.env.example)
- Add placeholders for VITE_FIREBASE_* variables.

### Authentication Layer
#### [MODIFY] [AuthContext.jsx](file:///e:/ProjectFlow/frontend/src/context/AuthContext.jsx)
- Integrate `onAuthStateChanged` to manage user state.
- Implement `login` using `signInWithEmailAndPassword`. Fetch user role from Firestore (`users` collection) to verify and store role in context. Redirect based on role.
- Implement `signup` using `createUserWithEmailAndPassword` for students. Create a corresponding document in the `users` collection.
#### [MODIFY] [Login.jsx](file:///e:/ProjectFlow/frontend/src/pages/auth/Login.jsx)
- Update error handling to show Firebase errors.
- Hook into the updated AuthContext.
#### [MODIFY] [Signup.jsx](file:///e:/ProjectFlow/frontend/src/pages/auth/Signup.jsx)
- Connect to AuthContext's signup method to create the user in Firebase Auth and Firestore.

### Student Portal - Projects
#### [MODIFY] [StudentProjects.jsx](file:///e:/ProjectFlow/frontend/src/pages/student/StudentProjects.jsx)
- Fetch projects from Firestore `projects` collection where `createdBy` == current user UID.
- Modify the "New Project" modal to save the project details directly into the `projects` collection.
#### [NEW] [ProjectDetails.jsx](file:///e:/ProjectFlow/frontend/src/pages/student/ProjectDetails.jsx)
- Create a dedicated page to fetch and display a specific project using its `id`.
- Update `App.jsx` to include the route `/student/projects/:id`.

### Storage & Documentation
#### [MODIFY] [StudentDocumentation.jsx](file:///e:/ProjectFlow/frontend/src/pages/student/StudentDocumentation.jsx)
- Implement file upload to Firebase Storage.
- Save document metadata (URL, name, size, upload date) to the `documents` collection in Firestore.
- Fetch documents from Firestore instead of mock data.

## Verification Plan

### Automated Tests
- Run `npm run dev` to verify the build processes without runtime errors.

### Manual Verification
1. Sign up as a new student and verify creation in Firebase Authentication and Firestore `users` collection.
2. Sign in as the student and verify redirection to `/student/dashboard`.
3. Create a new project in the Student portal and check if it appears in the list and in Firestore.
4. Click on the project to navigate to Project Details and verify the data fetch.
5. Upload a document in Student Documentation and verify it uploads to Firebase Storage and saves metadata to Firestore.
