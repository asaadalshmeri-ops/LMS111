import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Login from './pages/Login';

// Admin page imports
import AdminDashboard from './pages/admin/AdminDashboard';
import StudentRegistration from './pages/admin/StudentRegistration';
import StudentRecords from './pages/admin/StudentRecords';
import Departments from './pages/admin/Departments';
import FeeManagement from './pages/admin/FeeManagement';
import Announcements from './pages/admin/Announcements';
import ComplaintsAdmin from './pages/admin/Complaints';

// Student page imports
import StudentDashboard from './pages/student/StudentDashboard';
import LectureProgram from './pages/student/LectureProgram';
import Assignments from './pages/student/Assignments';
import Exams from './pages/student/Exams';
import MyResults from './pages/student/MyResults';
import Fees from './pages/student/Fees';
import Notifications from './pages/student/Notifications';
import ComplaintsStudent from './pages/student/Complaints';

const AppContent = () => {
  const { user, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState('dashboard');

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <span style={{ marginTop: '1rem', color: '#1A2A3A', fontWeight: '600' }}>Loading LMS secure interface...</span>
      </div>
    );
  }

  // Render Auth page if user not logged in
  if (!user) {
    return <Login />;
  }

  // Admin routing mapping
  const renderAdminTab = () => {
    switch (currentTab) {
      case 'dashboard':
        return <AdminDashboard />;
      case 'registration':
        return <StudentRegistration />;
      case 'records':
        return <StudentRecords />;
      case 'departments':
        return <Departments />;
      case 'fees':
        return <FeeManagement />;
      case 'announcements':
        return <Announcements />;
      case 'complaints':
        return <ComplaintsAdmin />;
      default:
        return <AdminDashboard />;
    }
  };

  // Student routing mapping
  const renderStudentTab = () => {
    switch (currentTab) {
      case 'dashboard':
        return <StudentDashboard setCurrentTab={setCurrentTab} />;
      case 'lectures':
        return <LectureProgram setCurrentTab={setCurrentTab} />;
      case 'assignments':
        return <Assignments />;
      case 'exams':
        return <Exams />;
      case 'results':
        return <MyResults />;
      case 'fees':
        return <Fees />;
      case 'notifications':
        return <Notifications />;
      case 'complaints':
        return <ComplaintsStudent />;
      default:
        return <StudentDashboard setCurrentTab={setCurrentTab} />;
    }
  };

  const getPageHeaderTitle = () => {
    const titleMap = {
      dashboard: 'Dashboard Overview',
      registration: 'Register Student Credentials',
      records: 'Registered Students Database',
      departments: 'Departments Control Board',
      fees: 'Fee Records & Invoices',
      announcements: 'University Bulletins',
      complaints: 'Grievance & Tickets Console',
      lectures: 'Lecture materials & Attendance',
      assignments: 'Homework Assignments portal',
      exams: 'Examination & Proctoring Center',
      results: 'Term GPA & Scorecards',
    };
    return titleMap[currentTab] || 'LMS Portal';
  };

  return (
    <div className="app-container">
      <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />
      
      <div className="main-content">
        <Header title={getPageHeaderTitle()} />
        <main className="content-body">
          {user.role === 'admin' ? renderAdminTab() : renderStudentTab()}
        </main>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <SocketProvider>
        <AppContent />
      </SocketProvider>
    </AuthProvider>
  );
};

const styles = {
  loadingContainer: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc'
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #cbd5e1',
    borderTopColor: '#6366f1',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  }
};

// Add standard keyframe rule inside stylesheet
const styleTag = document.createElement('style');
styleTag.innerHTML = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes slideUp {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
`;
document.head.appendChild(styleTag);

export default App;
