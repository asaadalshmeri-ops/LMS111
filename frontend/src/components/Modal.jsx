import React from 'react';

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>{title}</h2>
          <button style={styles.closeBtn} onClick={onClose}>&times;</button>
        </div>
        <div style={styles.body}>
          {children}
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 26, 36, 0.65)',
    display: 'flex',
    align-items: 'center',
    justify-content: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(4px)',
    animation: 'fadeIn 0.2s ease-out'
  },
  modal: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    width: '90%',
    maxWidth: '650px',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    overflow: 'hidden',
    border: '1px solid #e2e8f0',
    animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
  },
  header: {
    padding: '1.25rem 1.5rem',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc'
  },
  title: {
    fontSize: '1.2rem',
    fontWeight: '700',
    color: '#1A2A3A',
    margin: 0
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '1.75rem',
    color: '#6B7B8D',
    cursor: 'pointer',
    lineHeight: '1',
    transition: 'color 0.2s',
    outline: 'none'
  },
  body: {
    padding: '1.5rem',
    overflowY: 'auto',
    flex: 1
  }
};

export default Modal;
