import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Toast from '../../components/Toast';

const Announcements = () => {
  const { token } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [targetDeptId, setTargetDeptId] = useState(''); // Empty string representing Global
  
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');

  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState('success');
  const [submitting, setSubmitting] = useState(false);

  const showToast = (msg, type = 'success') => {
    setToastMsg(msg);
    setToastType(type);
  };

  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const res = await fetch('/api/admin/departments', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) setDepartments(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchDepts();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !message) {
      return showToast('Title and message are required', 'error');
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          departmentId: targetDeptId || null, // null represents global
          title,
          message
        })
      });

      if (res.ok) {
        showToast('Announcement posted & broadcasted via WebSockets!', 'success');
        setTitle('');
        setMessage('');
      } else {
        const data = await res.json();
        showToast(data.message || 'Broadcast failed', 'error');
      }
    } catch (err) {
      showToast('Error connecting to socket endpoint', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <Toast message={toastMsg} type={toastType} onClose={() => setToastMsg('')} />
      
      <div className="card">
        <h2>📢 Announcements Center</h2>
        <p style={{ color: '#6B7B8D', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
          Publish alerts. Global alerts sync to all student headers, while Department alerts target selected streams.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Recipient Target</label>
            <select
              className="form-control"
              value={targetDeptId}
              onChange={(e) => setTargetDeptId(e.target.value)}
            >
              <option value="">🌎 Global Broadcast (All Enrolled Students)</option>
              {departments.map(d => (
                <option key={d._id} value={d._id}>🏢 Department: {d.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Announcement Title</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Campus Closure due to weather conditions"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Alert Description / Detailed Message</label>
            <textarea
              className="form-control"
              rows="6"
              placeholder="Write detailed announcements description here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: '0.5rem', justifyContent: 'center' }}
            disabled={submitting}
          >
            {submitting ? 'Streaming Alert...' : 'Publish Announcement'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Announcements;
