import React from 'react';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ currentTab, setCurrentTab }) => {
  const { user, logout } = useAuth();

  if (!user) return null;

  const adminMenu = [
    { id: 'dashboard', name: 'Dashboard', icon: '📊' },
    { id: 'registration', name: 'Register Student', icon: '📝' },
    { id: 'records', name: 'Student Records', icon: '👥' },
    { id: 'departments', name: 'Departments', icon: '🏢' },
    { id: 'fees', name: 'Fee Management', icon: '💰' },
    { id: 'announcements', name: 'Announcements', icon: '📢' },
    { id: 'complaints', name: 'Complaints & Grievances', icon: '📬' },
  ];

  const studentMenu = [
    { id: 'dashboard', name: 'Dashboard', icon: '🎓' },
    { id: 'lectures', name: 'Lecture Program', icon: '📚' },
    { id: 'assignments', name: 'Assignments', icon: '✏️' },
    { id: 'exams', name: 'Exams Portal', icon: '⏱️' },
    { id: 'results', name: 'My Results', icon: '🏅' },
    { id: 'fees', name: 'Fees & Receipts', icon: '💳' },
    { id: 'notifications', name: 'Announcements', icon: '🔔' },
    { id: 'complaints', name: 'Complaints Log', icon: '📩' },
  ];

  const menuItems = user.role === 'admin' ? adminMenu : studentMenu;

  return (
    <div style={styles.sidebar}>
      <div style={styles.brand}>
        <div style={styles.logoIcon}>LMS</div>
        <div>
          <h2 style={styles.logoText}>Antigravity</h2>
          <span style={styles.logoSubtext}>{user.role === 'admin' ? 'Admin Portal' : 'Student Hub'}</span>
        </div>
      </div>

      <div style={styles.profileSection}>
        <img 
          src={user.studentProfile?.photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'} 
          alt="Avatar" 
          style={styles.avatar} 
          onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80' }}
        />
        <div style={styles.profileMeta}>
          <h4 style={styles.profileName} title={user.name}>{user.name}</h4>
          {user.role === 'student' && (
            <span style={styles.profileId}>{user.studentProfile?.academicId}</span>
          )}
        </div>
      </div>

      <nav style={styles.nav}>
        {menuItems.map((item) => (
          <button
            key={item.id}
            style={{
              ...styles.navLink,
              ...(currentTab === item.id ? styles.activeNavLink : {})
            }}
            onClick={() => setCurrentTab(item.id)}
          >
            <span style={styles.navIcon}>{item.icon}</span>
            <span>{item.name}</span>
            {currentTab === item.id && <div style={styles.activeIndicator} />}
          </button>
        ))}
      </nav>

      <div style={styles.footer}>
        <button style={styles.logoutBtn} onClick={logout}>
          <span style={styles.navIcon}>🚪</span>
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};

const styles = {
  sidebar: {
    width: '260px',
    backgroundColor: '#1A2A3A',
    color: '#ffffff',
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    position: 'sticky',
    top: 0,
    boxShadow: '4px 0 10px rgba(0, 0, 0, 0.1)',
    zIndex: 100
  },
  brand: {
    padding: '1.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
  },
  logoIcon: {
    backgroundColor: '#6366f1',
    color: '#ffffff',
    width: '40px',
    height: '40px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '800',
    fontSize: '1.1rem'
  },
  logoText: {
    fontSize: '1.15rem',
    fontWeight: '700',
    color: '#ffffff',
    margin: 0
  },
  logoSubtext: {
    fontSize: '0.75rem',
    color: '#6B7B8D',
    display: 'block'
  },
  profileSection: {
    padding: '1.25rem 1.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    backgroundColor: 'rgba(0, 0, 0, 0.1)'
  },
  avatar: {
    width: '42px',
    height: '42px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2px solid #6366f1'
  },
  profileMeta: {
    overflow: 'hidden',
    flex: 1
  },
  profileName: {
    fontSize: '0.9rem',
    fontWeight: '600',
    color: '#ffffff',
    margin: 0,
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    whiteSpace: 'nowrap'
  },
  profileId: {
    fontSize: '0.75rem',
    color: '#6B7B8D',
    display: 'block'
  },
  nav: {
    padding: '1.25rem 0.75rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
    flex: 1,
    overflowY: 'auto'
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.85rem',
    padding: '0.75rem 1rem',
    background: 'none',
    border: 'none',
    color: '#cbd5e1',
    fontFamily: 'inherit',
    fontSize: '0.9rem',
    fontWeight: '500',
    textAlign: 'left',
    cursor: 'pointer',
    borderRadius: '8px',
    transition: 'all 0.2s',
    position: 'relative',
    outline: 'none'
  },
  activeNavLink: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    color: '#6366f1',
    fontWeight: '600'
  },
  navIcon: {
    fontSize: '1.1rem',
    display: 'inline-flex'
  },
  activeIndicator: {
    position: 'absolute',
    left: 0,
    top: '20%',
    height: '60%',
    width: '4px',
    backgroundColor: '#6366f1',
    borderRadius: '0 4px 4px 0'
  },
  footer: {
    padding: '1rem',
    borderTop: '1px solid rgba(255, 255, 255, 0.05)'
  },
  logoutBtn: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '0.85rem',
    padding: '0.75rem 1rem',
    background: 'none',
    border: 'none',
    color: '#f87171',
    fontFamily: 'inherit',
    fontSize: '0.9rem',
    fontWeight: '500',
    textAlign: 'left',
    cursor: 'pointer',
    borderRadius: '8px',
    transition: 'background-color 0.2s',
    outline: 'none'
  }
};

export default Sidebar;
