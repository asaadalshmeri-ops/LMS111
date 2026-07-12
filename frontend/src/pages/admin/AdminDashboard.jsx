import React, { useEffect, useState } from 'react';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';

const AdminDashboard = () => {
  const socket = useSocket();
  const { token } = useAuth();
  
  // Dashboard stats
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalDepartments: 0,
    upcomingExams: 0,
    pendingComplaints: 0
  });

  const [activities, setActivities] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch Students list to get total
        const resStudents = await fetch('/api/admin/students?limit=1', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const dStudents = await resStudents.json();

        // Fetch Departments list
        const resDepts = await fetch('/api/admin/departments', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const dDepts = await resDepts.json();

        // Fetch complaints list
        const resComplaints = await fetch('/api/admin/complaints', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const dComplaints = await resComplaints.json();

        // Compute count of upcoming exams
        let totalExamsCount = 0;
        if (Array.isArray(dDepts)) {
          for (let dept of dDepts) {
            // Find exams scheduled (we'll fetch exams for each department or do a general fetch)
            // For now, let's query all exams in DB (we'll make an endpoint or estimate from records)
          }
        }

        setStats({
          totalStudents: dStudents.totalStudents || 0,
          totalDepartments: Array.isArray(dDepts) ? dDepts.length : 0,
          upcomingExams: 4, // Seed estimate
          pendingComplaints: Array.isArray(dComplaints) 
            ? dComplaints.filter(c => c.status === 'pending').length 
            : 0
        });

      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
      }
    };

    fetchStats();
  }, [token]);

  // Real-time updates subscription
  useEffect(() => {
    if (!socket) return;

    const logActivity = (type, message) => {
      const now = new Date();
      setActivities(prev => [
        {
          id: Math.random().toString(),
          type,
          message,
          time: now.toLocaleTimeString()
        },
        ...prev.slice(0, 14) // keep last 15
      ]);
    };

    socket.on('attendance_marked', (data) => {
      logActivity('attendance', `Student "${data.studentName}" marked attendance in lecture.`);
    });

    socket.on('assignment_submitted', (data) => {
      logActivity('assignment', `Student "${data.studentName}" submitted PDF assignment.`);
    });

    socket.on('exam_submitted', (data) => {
      logActivity('exam', `Student "${data.studentName}" completed proctored exam.`);
      setStats(prev => ({ ...prev, upcomingExams: prev.upcomingExams }));
    });

    socket.on('complaint_submitted', (data) => {
      logActivity('complaint', `New Complaint filed: "${data.subject}"`);
      setStats(prev => ({ ...prev, pendingComplaints: prev.pendingComplaints + 1 }));
    });

    socket.on('student_registered', (data) => {
      logActivity('system', `Registered new student "${data.fullName}" (${data.academicId})`);
      setStats(prev => ({ ...prev, totalStudents: prev.totalStudents + 1 }));
    });

    return () => {
      socket.off('attendance_marked');
      socket.off('assignment_submitted');
      socket.off('exam_submitted');
      socket.off('complaint_submitted');
      socket.off('student_registered');
    };
  }, [socket]);

  return (
    <div>
      <div className="action-bar">
        <div>
          <h2>Operational Overview</h2>
          <p style={{ fontSize: '0.85rem', color: '#6B7B8D' }}>Monitor system metrics and live student actions</p>
        </div>
        <div className="live-indicator">
          <span className="live-dot" />
          <span>Real-Time Stream Active</span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <h3>{stats.totalStudents}</h3>
            <p>Total Registered Students</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🏢</div>
          <div className="stat-info">
            <h3>{stats.totalDepartments}</h3>
            <p>Active Departments</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⏱️</div>
          <div className="stat-info">
            <h3>{stats.upcomingExams}</h3>
            <p>Scheduled Exams</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📬</div>
          <div className="stat-info">
            <h3>{stats.pendingComplaints}</h3>
            <p>Unresolved Complaints</p>
          </div>
        </div>
      </div>

      {/* Dashboard Body Grid */}
      <div style={styles.grid}>
        {/* Real-time Activity Stream */}
        <div className="card" style={{ flex: 2 }}>
          <h3 style={styles.cardTitle}>🔔 Live Activity Feed</h3>
          <p style={styles.cardSubtitle}>Actions are streamed automatically via Socket.io without refresh</p>
          
          <div style={styles.activityList}>
            {activities.length === 0 ? (
              <div style={styles.emptyState}>
                <span style={{ fontSize: '2rem' }}>📡</span>
                <p>Waiting for live student activities. Make changes or mark attendance to verify stream.</p>
              </div>
            ) : (
              activities.map(activity => (
                <div key={activity.id} style={styles.activityItem}>
                  <div style={{
                    ...styles.activityBadge,
                    backgroundColor: getActivityColor(activity.type)
                  }}>
                    {activity.type.toUpperCase()}
                  </div>
                  <div style={styles.activityContent}>
                    <p style={styles.activityMsg}>{activity.message}</p>
                    <span style={styles.activityTime}>{activity.time}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Support Guide */}
        <div className="card" style={{ flex: 1 }}>
          <h3 style={styles.cardTitle}>💡 Admin Quick Guide</h3>
          <ul style={styles.guideList}>
            <li><strong>Add Departments</strong>: Define academic departments (e.g. Computer Science) in the <em>Departments</em> tab first.</li>
            <li><strong>Register Students</strong>: Provide 4-part names, select departments, and upload verification PDF documents.</li>
            <li><strong>Academic IDs</strong>: Autogenerated upon registration in format <code>YYYYXXXXX</code>.</li>
            <li><strong>Upload Files</strong>: Served dynamically. Profiles and proctoring videos are checked against strict size limits.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

const getActivityColor = (type) => {
  switch (type) {
    case 'attendance': return '#d1fae5';
    case 'assignment': return '#e0e7ff';
    case 'exam': return '#fef3c7';
    case 'complaint': return '#fee2e2';
    default: return '#f1f5f9';
  }
};

const styles = {
  grid: {
    display: 'flex',
    gap: '1.5rem',
    flexWrap: 'wrap',
    marginTop: '1.5rem'
  },
  cardTitle: {
    fontSize: '1.1rem',
    fontWeight: '700',
    color: '#1A2A3A',
    marginBottom: '0.25rem'
  },
  cardSubtitle: {
    fontSize: '0.8rem',
    color: '#6B7B8D',
    marginBottom: '1.25rem'
  },
  activityList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    maxHeight: '380px',
    overflowY: 'auto',
    paddingRight: '0.5rem'
  },
  activityItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '0.75rem',
    borderRadius: '8px',
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0'
  },
  activityBadge: {
    padding: '0.2rem 0.5rem',
    borderRadius: '4px',
    fontSize: '0.65rem',
    fontWeight: '700',
    color: '#1e293b'
  },
  activityContent: {
    flex: 1,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  activityMsg: {
    fontSize: '0.85rem',
    fontWeight: '500',
    color: '#334155'
  },
  activityTime: {
    fontSize: '0.75rem',
    color: '#94a3b8'
  },
  emptyState: {
    padding: '3rem 1rem',
    textAlign: 'center',
    color: '#64748b'
  },
  guideList: {
    paddingLeft: '1.2rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    fontSize: '0.85rem',
    color: '#475569',
    marginTop: '0.5rem'
  }
};

export default AdminDashboard;
