import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const StudentDashboard = ({ setCurrentTab }) => {
  const { user, token } = useAuth();
  
  const [academics, setAcademics] = useState({
    gpa: '0.00',
    cgpa: '0.00',
    subjectsCount: 0
  });

  const [fees, setFees] = useState({
    totalDue: 0,
    amountPaid: 0,
    remaining: 0
  });

  const [announcementsCount, setAnnouncementsCount] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch Results
        const resRes = await fetch('/api/student/results', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (resRes.ok) {
          const dRes = await resRes.json();
          setAcademics({
            gpa: dRes.gpa || '0.00',
            cgpa: dRes.cgpa || '0.00',
            subjectsCount: dRes.grades?.length || 0
          });
        }

        // Fetch Fees
        const resFees = await fetch('/api/student/fees', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (resFees.ok) {
          const dFees = await resFees.json();
          let due = 0, paid = 0, remaining = 0;
          if (Array.isArray(dFees)) {
            dFees.forEach(fee => {
              due += fee.totalFees || 0;
              paid += fee.amountPaid || 0;
              remaining += fee.remaining || 0;
            });
          }
          setFees({ totalDue: due, amountPaid: paid, remaining });
        }

        // Fetch announcements count
        const resAnn = await fetch('/api/student/notifications', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (resAnn.ok) {
          const dAnn = await resAnn.json();
          setAnnouncementsCount(dAnn.length);
        }

      } catch (err) {
        console.error(err);
      }
    };
    fetchStats();
  }, [token]);

  return (
    <div>
      <div style={styles.welcomeBanner}>
        <div style={styles.bannerText}>
          <h2>Welcome back, {user.name}!</h2>
          <p>LMS Antigravity provides real-time access to proctored exams, lecture materials, and academic reporting.</p>
        </div>
        <div style={styles.bannerGraphic}>🎓</div>
      </div>

      {/* GPA & Quick Stats cards */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#e0e7ff', color: '#6366f1' }}>🏆</div>
          <div className="stat-info">
            <h3>{academics.gpa}</h3>
            <p>Current Semester GPA</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#d1fae5', color: '#10b981' }}>🏅</div>
          <div className="stat-info">
            <h3>{academics.cgpa}</h3>
            <p>Cumulative CGPA</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#fee2e2', color: '#ef4444' }}>💸</div>
          <div className="stat-info">
            <h3>${fees.remaining}</h3>
            <p>Remaining Fees Due</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#fef3c7', color: '#f59e0b' }}>📢</div>
          <div className="stat-info">
            <h3>{announcementsCount}</h3>
            <p>Active Announcements</p>
          </div>
        </div>
      </div>

      {/* Quick Navigation Panel */}
      <div className="card">
        <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>⚡ Quick Task Launchers</h3>
        <div style={styles.quickGrid}>
          <div style={styles.quickCard} onClick={() => setCurrentTab('lectures')}>
            <span style={{ fontSize: '1.5rem' }}>📚</span>
            <h4>Lecture Program</h4>
            <p>Mark attendance and load course PDFs/videos</p>
          </div>

          <div style={styles.quickCard} onClick={() => setCurrentTab('exams')}>
            <span style={{ fontSize: '1.5rem' }}>⏱️</span>
            <h4>Exams Portal</h4>
            <p>Enter webcam/screen-proctored examination sessions</p>
          </div>

          <div style={styles.quickCard} onClick={() => setCurrentTab('assignments')}>
            <span style={{ fontSize: '1.5rem' }}>✏️</span>
            <h4>Assignments</h4>
            <p>Upload PDF answers and view graded summaries</p>
          </div>

          <div style={styles.quickCard} onClick={() => setCurrentTab('complaints')}>
            <span style={{ fontSize: '1.5rem' }}>📩</span>
            <h4>Complaints Log</h4>
            <p>Submit feedback and check administrative replies</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  welcomeBanner: {
    background: 'linear-gradient(135deg, #1A2A3A 0%, #2c3e50 100%)',
    color: 'white',
    padding: '2rem',
    borderRadius: '16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
  },
  bannerText: {
    maxWidth: '70%'
  },
  bannerGraphic: {
    fontSize: '4rem',
    opacity: 0.8
  },
  quickGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '1rem'
  },
  quickCard: {
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    padding: '1.25rem',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s',
    ':hover': {
      borderColor: '#6366f1',
      transform: 'translateY(-2px)'
    }
  }
};

export default StudentDashboard;
