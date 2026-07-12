import React, { useEffect } from 'react';

const Toast = ({ message, type = 'success', onClose, duration = 4000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [onClose, duration]);

  if (!message) return null;

  const getColors = () => {
    switch (type) {
      case 'success':
        return { bg: '#d1fae5', text: '#065f46', border: '#10b981' };
      case 'error':
        return { bg: '#fee2e2', text: '#991b1b', border: '#ef4444' };
      case 'warning':
        return { bg: '#fef3c7', text: '#92400e', border: '#f59e0b' };
      default:
        return { bg: '#e0e7ff', text: '#3730a3', border: '#6366f1' };
    }
  };

  const colors = getColors();

  return (
    <div style={{
      ...styles.toast,
      backgroundColor: colors.bg,
      color: colors.text,
      borderLeft: `5px solid ${colors.border}`
    }}>
      <span>{message}</span>
      <button style={styles.closeBtn} onClick={onClose}>&times;</button>
    </div>
  );
};

const styles = {
  toast: {
    position: 'fixed',
    top: '20px',
    right: '20px',
    padding: '1rem 1.5rem',
    borderRadius: '8px',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
    minWidth: '300px',
    maxWidth: '450px',
    fontSize: '0.9rem',
    fontWeight: '600',
    fontFamily: 'system-ui, sans-serif',
    animation: 'slideIn 0.3s ease-out'
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '1.25rem',
    color: 'inherit',
    cursor: 'pointer',
    opacity: '0.7',
    outline: 'none'
  }
};

export default Toast;
