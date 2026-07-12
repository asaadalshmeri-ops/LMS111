import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Toast from '../../components/Toast';

const Complaints = () => {
  const { token } = useAuth();
  const [complaints, setComplaints] = useState([]);
  
  // Forms
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState([]);

  // Toast
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState('success');
  const [submitting, setSubmitting] = useState(false);

  const showToast = (msg, type = 'success') => {
    setToastMsg(msg);
    setToastType(type);
  };

  const fetchComplaints = async () => {
    try {
      const res = await fetch('/api/student/complaints', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setComplaints(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [token]);

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject || !description) {
      return showToast('Subject and description are required', 'error');
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('subject', subject);
      formData.append('description', description);
      if (files.length > 0) {
        files.forEach(f => formData.append('attachments', f));
      }

      const res = await fetch('/api/student/complaints', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (res.ok) {
        showToast('Complaint ticket filed successfully!', 'success');
        setSubject('');
        setDescription('');
        setFiles([]);
        document.getElementById('complaint-files').value = '';
        fetchComplaints();
      } else {
        const data = await res.json();
        showToast(data.message || 'Submission failed', 'error');
      }
    } catch (err) {
      showToast('Error connecting to complaints database', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (s) => {
    switch (s) {
      case 'resolved': return 'success';
      case 'reviewed': return 'warning';
      default: return 'danger';
    }
  };

  return (
    <div style={styles.container}>
      <Toast message={toastMsg} type={toastType} onClose={() => setToastMsg('')} />

      <div className="action-bar">
        <div>
          <h2>Complaints Log & Grievances</h2>
          <p style={{ color: '#6B7B8D', fontSize: '0.85rem' }}>Submit feedback or resolve academic grading disputes</p>
        </div>
      </div>

      <div style={styles.grid}>
        {/* Ticket Creator */}
        <div className="card" style={{ flex: 1, minWidth: '300px' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>📩 File a New Complaint Ticket</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Topic / Subject</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Exam grading discrepancy"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Detailed Explanation</label>
              <textarea
                className="form-control"
                rows="5"
                placeholder="Describe your issue in full details..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Attachments (multiple PDF/Images)</label>
              <input
                id="complaint-files"
                type="file"
                className="form-control"
                multiple
                accept=".pdf,image/*"
                onChange={handleFileChange}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={submitting}>
              {submitting ? 'Filing Ticket...' : 'File Ticket'}
            </button>
          </form>
        </div>

        {/* Ticket Log */}
        <div style={{ flex: 2, minWidth: '350px' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>📋 Filed Complaints List</h3>
          
          <div style={styles.ticketsList}>
            {complaints.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '3rem', color: '#6B7B8D' }}>
                No complaints submitted.
              </div>
            ) : (
              complaints.map(comp => (
                <div key={comp._id} className="card" style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h4 style={{ fontSize: '1rem', margin: 0 }}>{comp.subject}</h4>
                    <span className={`badge badge-${getStatusBadge(comp.status)}`}>
                      {comp.status.toUpperCase()}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#6B7B8D', marginTop: '0.1rem' }}>
                    Filed on: {new Date(comp.createdAt).toLocaleDateString()}
                  </p>
                  <p style={{ fontSize: '0.85rem', color: '#334155', margin: '0.5rem 0' }}>{comp.description}</p>
                  
                  {/* Attachments preview */}
                  {comp.attachments && comp.attachments.length > 0 && (
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', margin: '0.5rem 0' }}>
                      {comp.attachments.map((file, idx) => (
                        <a key={idx} href={file} target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', color: '#6366f1', textDecoration: 'none' }}>
                          📎 Attachment #{idx + 1}
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Official Response */}
                  {comp.response ? (
                    <div style={styles.responseBox}>
                      <strong>🎓 University Response:</strong>
                      <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem' }}>{comp.response}</p>
                    </div>
                  ) : (
                    <div style={{ ...styles.responseBox, borderLeftColor: '#f59e0b', backgroundColor: '#fef3c7' }}>
                      <span style={{ fontSize: '0.8rem', color: '#92400e', fontWeight: 600 }}>Awaiting administrative review.</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  grid: {
    display: 'flex',
    gap: '1.5rem',
    flexWrap: 'wrap'
  },
  ticketsList: {
    display: 'flex',
    flexDirection: 'column'
  },
  responseBox: {
    marginTop: '0.75rem',
    padding: '0.75rem',
    borderRadius: '6px',
    backgroundColor: '#ecfeff',
    borderLeft: '4px solid #06b6d4'
  }
};

export default Complaints;
