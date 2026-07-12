import React from 'react';
import { useAuth } from '../context/AuthContext';

const Header = ({ title }) => {
  const { user } = useAuth();

  if (!user) return null;

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Active':
        return { backgroundColor: '#d1fae5', color: '#065f46' };
      case 'Suspended':
        return { backgroundColor: '#fee2e2', color: '#991b1b' };
      default:
        return { backgroundColor: '#f1f5f9', color: '#475569' };
    }
  };

  return (
    <header style={styles.header}>
      <div>
        <h1 style={styles.title}>{title}</h1>
        <div style={styles.liveWrapper}>
          <span style={styles.liveDot} />
          <span style={styles.liveText}>Live Sync Connected</span>
        </div>
      </div>

      <div style={styles.userSection}>
        {user.role === 'student' && user.studentProfile && (
          <div style={styles.studentMeta}>
            <span style={styles.deptBadge}>
              🏢 {user.studentProfile.departmentId?.name || 'Loading Dept...'}
            </span>
            <span style={{
              ...styles.statusBadge,
              ...getStatusStyle(user.studentProfile.status)
            }}>
              {user.studentProfile.status}
            </span>
          </div>
        )}
        
        <div style={styles.divider} />
        
        <div style={styles.profileBox}>
          <img 
            src={user.studentProfile?.photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'} 
            alt="Avatar" 
            style={styles.avatar} 
            onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80' }}
          />
          <div>
            <h4 style={styles.userName}>{user.name}</h4>
            <span style={styles.userRole}>{user.role.toUpperCase()}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

const styles = {
  header: {
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e2e8f0',
    padding: '1.25rem 2rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
    zIndex: 90
  },
  title: {
    fontSize: '1.4rem',
    fontWeight: '700',
    color: '#1A2A3A',
    lineHeight: '1.2'
  },
  liveWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    marginTop: '0.2rem'
  },
  liveDot: {
    width: '6px',
    height: '6px',
    backgroundColor: '#10b981',
    borderRadius: '50%',
    boxShadow: '0 0 8px #10b981',
    animation: 'pulse 1.5s infinite'
  },
  liveText: {
    fontSize: '0.75rem',
    color: '#6B7B8D',
    fontWeight: '600'
  },
  userSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.25rem'
  },
  studentMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem'
  },
  deptBadge: {
    backgroundColor: '#f1f5f9',
    color: '#334155',
    padding: '0.35rem 0.75rem',
    borderRadius: '6px',
    fontSize: '0.8rem',
    fontWeight: '600',
    border: '1px solid #e2e8f0'
  },
  statusBadge: {
    padding: '0.35rem 0.75rem',
    borderRadius: '6px',
    fontSize: '0.8rem',
    fontWeight: '700'
  },
  divider: {
    width: '1px',
    height: '30px',
    backgroundColor: '#cbd5e1'
  },
  profileBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem'
  },
  avatar: {
    width: '38px',
    height: '38px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '1.5px solid #6366f1'
  },
  userName: {
    fontSize: '0.85rem',
    fontWeight: '700',
    color: '#1A2A3A',
    margin: 0
  },
  userRole: {
    fontSize: '0.7rem',
    color: '#6B7B8D',
    fontWeight: '800',
    display: 'block'
  }
};

export default Header;
