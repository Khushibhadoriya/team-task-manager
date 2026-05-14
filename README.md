TaskFlow — Team Task Manager
A full-stack web application for managing team projects and tasks with role-based access control.
🔗 Live Demo: team-task-manager-production-2321.up.railway.app

Features

Authentication — Secure signup/login with JWT stored in HTTP-only cookies
Project Management — Create projects, manage team members, track progress
Task Management — Create, assign, and update tasks with priorities and due dates
Role-Based Access Control — Project owners, admins, and members have different permissions
Dashboard — Personal overview of assigned tasks, overdue items, and project summaries
Team Management — Invite members by email, assign roles, remove members
Overdue Tracking — Automatically flags tasks past their due date


Tech Stack
Framework: Next.js 16 (App Router) 
Styling: Tailwind CSS v4
Database: MongoDB Atlas + Mongoose
Authentication: JWT + bcrypts
Deployment: Railway

Project Structure
team-task-manager/
├── app/
│   ├── (auth)/
│   │   ├── login/page.jsx          # Login page
│   │   └── signup/page.jsx         # Signup page
│   ├── api/
│   │   ├── auth/
│   │   │   ├── signup/route.js     # POST /api/auth/signup
│   │   │   ├── login/route.js      # POST /api/auth/login
│   │   │   ├── me/route.js         # GET  /api/auth/me
│   │   │   └── logout/route.js     # POST /api/auth/logout
│   │   ├── projects/
│   │   │   ├── route.js            # GET, POST /api/projects
│   │   │   └── [id]/
│   │   │       ├── route.js        # GET, PUT, DELETE /api/projects/:id
│   │   │       └── members/
│   │   │           ├── route.js    # POST /api/projects/:id/members
│   │   │           └── [userId]/
│   │   │               └── route.js # DELETE /api/projects/:id/members/:userId
│   │   ├── tasks/
│   │   │   ├── route.js            # GET, POST /api/tasks
│   │   │   └── [id]/route.js       # GET, PUT, DELETE /api/tasks/:id
│   │   └── dashboard/route.js      # GET /api/dashboard
│   ├── dashboard/
│   │   ├── layout.jsx              # Auth guard + Navbar
│   │   └── page.jsx                # Dashboard UI
│   ├── projects/
│   │   ├── layout.jsx              # Auth guard + Navbar
│   │   ├── page.jsx                # Projects list
│   │   └── [id]/
│   │       ├── layout.jsx          # Auth guard + Navbar
│   │       └── page.jsx            # Project detail + tasks
│   ├── globals.css
│   └── layout.js
├── components/
│   ├── Navbar.jsx
│   └── ui/
│       ├── Modal.jsx
│       ├── Spinner.jsx
│       └── Alert.jsx
├── context/
│   └── AuthContext.jsx             # Global auth state
├── lib/
│   ├── db.js                       # MongoDB connection
│   ├── auth.js                     # JWT helpers
│   └── middleware.js               # Auth + RBAC middleware
└── models/
    ├── User.js
    ├── Project.js
    └── Task.js



Role-Based Access Control
Admin  →  Edit project, manage members, create/delete/edit tasks
Member →  View project and tasks, update task status only

 

Local Development Setup
Prerequisites

Node.js v18+
MongoDB Atlas account (free tier)

Steps
1. Clone the repository
bashgit clone https://github.com/Khushibhadoriya/team-task-manager
cd team-task-manager
2. Install dependencies
bashnpm install
3. Create .env.local file in the root
env: MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_secret_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
4. Run the development server
bash: npm run dev
5. Open your browser
http://localhost:3000


Author
Khushi Bhadoriya


