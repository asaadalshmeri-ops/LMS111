import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';

const Notifications = () => {
  const { token, user } = useAuth();
  const socket = useSocket();
  const [notifications, setNotifications] = useState([]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/student/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setNotifications(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [token]);

  // Real-time synchronization
  useEffect(() => {
    if (!socket) return;

    socket.on('announcement_created', (announcement) => {
      // Check if global OR targeted to student's department
      const deptId = user.studentProfile?.departmentId?._id || user.studentProfile?.departmentId;
      if (!announcement.departmentId || (deptId && announcement.departmentId.toString() === deptId.toString())) {
        setNotifications(prev => [announcement, ...prev]);
      }
    });

    return () => {
      socket.off('announcement_created');
    };
  }, [socket, user]);

  const handleMarkAsRead = async (annId) => {
    try {
      const res = await fetch(`/api/student/notifications/${annId}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setNotifications(prev => prev.map(ann => {
          if (ann._id === annId) {
            // Ensure readBy includes student's profile id
            const studentId = user.studentProfile?._id;
            if (studentId && !ann.readBy.includes(studentId)) {
              return { ...ann, readBy: [...ann.readBy, studentId] };
            }
          }
          return ann;
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const isRead = (ann) => {
    if (!user.studentProfile) return false;
    return ann.readBy?.includes(user.studentProfile._id);
  };

  return (
    <div>
      <div className="action-bar">
        <div>
          <h2>Announcements Hub</h2>
          <p style={{ color: '#6B7B8D', fontSize: '0.85rem' }}>View global university updates and specific department alerts</p>
        </div>
      </div>

      <div style={styles.list}>
        {notifications.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem', color: '#6B7B8D' }}>
            No announcements posted. You are all caught up!
          </div>
        ) : (
          notifications.map(ann => {
            const read = isRead(ann);
            return (
              <div 
                key={ann._id} 
                className="card" 
                style={{ 
                  ...styles.card,
                  borderColor: read ? '#e2e8f0' : '#6366f1',
                  backgroundColor: read ? '#ffffff' : '#f5f7ff' 
                }}
                onClick={() => !read && handleMarkAsRead(ann._id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', margin: 0 }}>
                      {!read && <span style={styles.unreadDot} />}
                      {ann.title}
                    </h3>
                    <span style={{ fontSize: '0.75rem', color: '#6B7B8D' }}>
                      Posted: {new Date(ann.createdAt).toLocaleString()} | Scope: {ann.departmentId ? 'Departmental' : 'Global University'}
                    </span>
                  </div>
                  {!read && <span className="badge badge-warning">NEW</span>}
                </div>
                <p style={{ fontSize: '0.85rem', color: '#334155', marginTop: '0.75rem', whiteSpace: 'pre-wrap' }}>{ann.message}</p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

const styles = {
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  card: {
    cursor: 'pointer',
    transition: 'all 0.2s',
    borderWidth: '1.5px'
  },
  unreadDot: {
    display: 'inline-block',
    width: '8px',
    height: '8px',
    backgroundColor: '#6366f1',
    borderRadius: '50%',
    marginRight: '0.5rem',
    transform: 'translateY(-2px)'
  }
};

export default Notifications;
