import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Toast from '../components/Toast';

const Login = () => {
  const { login, setupPassword } = useAuth();
  const [isSetupMode, setIsSetupMode] = useState(false);
  
  // Login fields
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  // Setup fields
  const [setupAcademicId, setSetupAcademicId] = useState('');
  const [setupPasswordVal, setSetupPasswordVal] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Toast notifications
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState('success');
  const [loading, setLoading] = useState(false);

  const showToast = (msg, type = 'success') => {
    setToastMsg(msg);
    setToastType(type);
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!identifier || !password) {
      return showToast('Please enter all login credentials', 'error');
    }

    setLoading(true);
    try {
      await login(identifier, password);
      showToast('Login successful!', 'success');
    } catch (err) {
      if (err.message.includes('First time logging in')) {
        showToast(err.message, 'warning');
        setIsSetupMode(true);
        if (identifier.match(/^\d+$/)) {
          setSetupAcademicId(identifier);
        }
      } else {
        showToast(err.message || 'Login failed. Please verify credentials.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSetupSubmit = async (e) => {
    e.preventDefault();
    if (!setupAcademicId || !setupPasswordVal || !confirmPassword) {
      return showToast('Please fill out all setup fields', 'error');
    }

    if (setupPasswordVal !== confirmPassword) {
      return showToast('Passwords do not match', 'error');
    }

    if (setupPasswordVal.length < 6) {
      return showToast('Password must be at least 6 characters long', 'error');
    }

    setLoading(true);
    try {
      await setupPassword(setupAcademicId, setupPasswordVal);
      showToast('Credentials configured successfully! You can now log in.', 'success');
      // Reset forms and toggle back
      setIdentifier(setupAcademicId);
      setIsSetupMode(false);
      setPassword('');
      setSetupPasswordVal('');
      setConfirmPassword('');
    } catch (err) {
      showToast(err.message || 'Verification failed. Contact administrator.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <Toast message={toastMsg} type={toastType} onClose={() => setToastMsg('')} />
      
      <div style={styles.card}>
        <div style={styles.branding}>
          <div style={styles.logo}>LMS</div>
          <h1 style={styles.title}>LMS Antigravity</h1>
          <p style={styles.subtitle}>
            {isSetupMode 
              ? 'Configure your student account password' 
              : 'Sign in to access your customized academic dashboard'
            }
          </p>
        </div>

        {!isSetupMode ? (
          <form onSubmit={handleLoginSubmit} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Academic ID / Email Address</label>
              <input
                type="text"
                placeholder="202600001 or admin@lms.com"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                style={styles.input}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Account Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.input}
              />
            </div>

            <button type="submit" disabled={loading} style={styles.submitBtn}>
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>

            <div style={styles.toggleFooter}>
              First time logging in?{' '}
              <button 
                type="button" 
                onClick={() => setIsSetupMode(true)} 
                style={styles.toggleBtn}
              >
                Set up Student Password
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSetupSubmit} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Academic ID (9-Digit)</label>
              <input
                type="text"
                placeholder="YYYYXXXXX (e.g. 202600001)"
                value={setupAcademicId}
                onChange={(e) => setSetupAcademicId(e.target.value)}
                style={styles.input}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>New Password</label>
              <input
                type="password"
                placeholder="At least 6 characters"
                value={setupPasswordVal}
                onChange={(e) => setSetupPasswordVal(e.target.value)}
                style={styles.input}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Confirm Password</label>
              <input
                type="password"
                placeholder="Repeat password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={styles.input}
              />
            </div>

            <button type="submit" disabled={loading} style={styles.submitBtn}>
              {loading ? 'Configuring Account...' : 'Set Password & Register'}
            </button>

            <div style={styles.toggleFooter}>
              Already set your password?{' '}
              <button 
                type="button" 
                onClick={() => setIsSetupMode(false)} 
                style={styles.toggleBtn}
              >
                Return to Login
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #1A2A3A 0%, #0f1a24 100%)',
    padding: '1rem'
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '2.5rem',
    width: '100%',
    maxWidth: '450px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    border: '1px solid rgba(255, 255, 255, 0.1)'
  },
  branding: {
    textAlign: 'center',
    marginBottom: '2rem'
  },
  logo: {
    display: 'inline-block',
    backgroundColor: '#6366f1',
    color: '#ffffff',
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    fontWeight: '800',
    fontSize: '1.25rem',
    marginBottom: '1rem'
  },
  title: {
    fontSize: '1.6rem',
    fontWeight: '800',
    color: '#1A2A3A',
    marginBottom: '0.5rem'
  },
  subtitle: {
    fontSize: '0.85rem',
    color: '#6B7B8D'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem'
  },
  label: {
    fontSize: '0.8rem',
    fontWeight: '600',
    color: '#334155'
  },
  input: {
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    outline: 'none',
    fontSize: '0.9rem',
    transition: 'border-color 0.2s',
    fontFamily: 'inherit'
  },
  submitBtn: {
    backgroundColor: '#6366f1',
    color: '#ffffff',
    border: 'none',
    padding: '0.8rem',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '0.95rem',
    cursor: 'pointer',
    transition: 'all 0.2s',
    marginTop: '0.5rem'
  },
  toggleFooter: {
    fontSize: '0.8rem',
    color: '#6B7B8D',
    textAlign: 'center',
    marginTop: '0.5rem'
  },
  toggleBtn: {
    background: 'none',
    border: 'none',
    color: '#6366f1',
    fontWeight: '700',
    cursor: 'pointer',
    padding: '0',
    fontFamily: 'inherit'
  }
};

export default Login;
