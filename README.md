# Real-Time Learning Management System (LMS) - Antigravity

This is a complete, production-ready Learning Management System (LMS) built on the MERN stack with JWT authentication and WebSockets (Socket.io) for real-time synchronization between Student and Admin dashboards.

## System Features

### Administrative Capabilities
1. **Student Registration**: Register students with 4-part names. Generates a unique Academic ID (format: `YYYYXXXXX`). Handles photo uploads and multiple identity verification documents.
2. **Student Database**: Searchable, filterable, and paginated table showing all students. Admins can view/edit/delete profiles, modify enrollment status, and add new files.
3. **Department Streams**: Create departments (HOD, description). Expand each department to manage:
   * **Students List**: Enrolled student tracking.
   * **Lecture Materials**: Add lectures with numbers, instructor name, YouTube stream link, written summary, and diagram image uploads.
   * **Assignments**: Create assignments linked to lectures, view student PDF uploads, and grade submissions.
   * **Exams & Proctoring**: Create exam papers with MCQ and Essay question structures. Review proctored student submissions showing raw answers, MCQ scores, and **recorded webcam + screen video tracks** alongside essay grading forms.
   * **Attendance Log**: Inspect live timestamps of when students marked attendance.
   * **Department Bulletins**: Broadcast notifications to targeted student streams.
4. **Fee Management**: Track semester-wise tuition records, paid values, outstanding balances, and view student-uploaded bank receipts.
5. **Global Announcements**: Post alerts that show on all student headers via WebSockets.
6. **Complaints Portal**: View student tickets, select reviewed/resolved status, and submit official replies.

### Student Capabilities
1. **Login**: Login using Academic ID. First-time log-in prompts password configuration. Subsequent log-ins use Academic ID + password.
2. **Lecture Program**: View active lecture cards. Clicking "Mark Attendance" logs entry in the database and unlocks YouTube streams, notes, and diagrams.
3. **Assignments**: Track assignment deadlines and upload PDF solutions. Displays graded scores instantly upon review.
4. **Exams Portal**:
   * **Exam Schedule**: Table showing upcoming exam schedules.
   * **Take Exam**: Activates webcam capture and screen sharing proctoring streams concurrently. Renders MCQ radio lists and Essay text boxes. Upon submission, stops streams and uploads video files to backend, instantly displaying auto-graded MCQ scores.
   * **Exam Results**: Renders past exam transcripts and scores.
5. **My Results**: Renders current semester GPA and Cumulative CGPA grade cards.
6. **Fees**: View semester tuition invoices and upload bank transfer receipts.
7. **Bulletins**: View real-time notifications with unread indicators.
8. **Complaints**: File complaints with attachments and track resolution feedback.

---

## File Structure

```
/workspace
├── backend/
│   ├── config/
│   │   └── db.js               # Database connection and admin seeding
│   ├── controllers/
│   │   ├── adminController.js  # Main admin actions logic
│   │   ├── authController.js   # JWT login & setup password
│   │   └── studentController.js# Attendance, submissions, and proctoring
│   ├── middleware/
│   │   ├── authMiddleware.js   # JWT verification & role guards
│   │   └── uploadMiddleware.js # Multer files validator & uploads organizer
│   ├── models/
│   │   ├── Assignment.js
│   │   ├── Complaint.js
│   │   ├── Department.js
│   │   ├── Exam.js
│   │   ├── Fee.js
│   │   ├── Lecture.js
│   │   ├── Notification.js
│   │   ├── Student.js
│   │   └── User.js
│   ├── routes/
│   │   ├── adminRoutes.js
│   │   ├── authRoutes.js
│   │   └── studentRoutes.js
│   ├── uploads/                # Stores profile photos, documents, receipts, videos
│   ├── .env                    # Config parameters
│   ├── package.json
│   └── server.js               # Express & Socket.io entry point
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Header.jsx      # Global toolbar & sync status
    │   │   ├── Modal.jsx       # Generic modals framework
    │   │   ├── Sidebar.jsx     # Navigation tabs Drawer
    │   │   └── Toast.jsx       # Alert notices system
    │   ├── context/
    │   │   ├── AuthContext.jsx # Login states & profiles provider
    │   │   └── SocketContext.jsx# Live socket instance provider
    │   ├── pages/
    │   │   ├── Login.jsx       # Credentials page
    │   │   ├── admin/          # Admin pages
    │   │   └── student/        # Student pages
    │   ├── App.jsx             # Routes and layout coordinator
    │   ├── index.css           # Vanilla CSS theme system
    │   └── main.jsx
    ├── index.html
    ├── package.json
    └── vite.config.js          # Port & API proxy mappings
```

---

## Installation & Running

### Prerequisites
* **Node.js** (v16.0 or higher)
* **MongoDB** (Running locally on `mongodb://127.0.0.1:27017` or cloud URI)

### Setup Configurations

#### 1. Backend Setup
Navigate to the `backend/` directory:
```bash
cd backend
```
Create a `.env` file (already created by Antigravity in root):
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/lms
JWT_SECRET=lms_jwt_secret_token_key_2026
FRONTEND_URL=http://localhost:5173
```
Install dependencies and run:
```bash
npm install
npm start
```

*Note: On Windows systems experiencing script errors, invoke commands with `npm.cmd`.*

#### 2. Frontend Setup
Navigate to the `frontend/` directory:
```bash
cd ../frontend
```
Install dependencies and run:
```bash
npm install
npm run dev
```

The system will start on:
* Frontend: `http://localhost:5173`
* Backend: `http://localhost:5000`

---

## Database Seeding & Credentials

### Default Admin
When the backend application first runs, it checks for an administrative user. If none exists, it automatically seeds the database with the following administrator credentials:
* **Email / ID**: `admin@lms.com`
* **Password**: `adminpassword123`

### Registering and Testing Students
1. Log in to `admin@lms.com`.
2. Go to **Departments** and click **Create Department** (e.g. `Computer Science`).
3. Go to **Register Student**, fill out the 4-part name (e.g. `John Fitzgerald Kennedy Junior`), email (e.g. `john@lms.com`), select the department, and click submit.
4. An **Academic ID** is generated automatically and shown in a toast alert (e.g. `202600001`).
5. Open an incognito browser window and access `http://localhost:5173`.
6. Click **Set up Student Password** (or log in with the Academic ID, which redirects to password setup). Enter the Academic ID and set a new password.
7. Log in with the Academic ID and new password. You are now logged in as the student!
