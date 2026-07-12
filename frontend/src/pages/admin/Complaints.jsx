import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/Modal';
import Toast from '../../components/Toast';

const Complaints = () => {
  const { token } = useAuth();
  const [complaints, setComplaints] = useState([]);
  
  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  
  // Forms
  const [response, setResponse] = useState('');
  const [status, setStatus] = useState('reviewed');

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
      const res = await fetch('/api/admin/complaints', {
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

  const handleOpenResponseModal = (complaint) => {
    setSelectedComplaint(complaint);
    setResponse(complaint.response || '');
    setStatus(complaint.status || 'reviewed');
    setIsModalOpen(true);
  };

  const handleResponseSubmit = async (e) => {
    e.preventDefault();
    if (!response) return showToast('Please enter response text', 'error');

    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/complaints/${selectedComplaint._id}/respond`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ response, status })
      });

      if (res.ok) {
        showToast('Response submitted successfully!', 'success');
        setIsModalOpen(false);
        fetchComplaints();
      } else {
        const data = await res.json();
        showToast(data.message || 'Submission failed', 'error');
      }
    } catch (err) {
      showToast('Error connecting to server', 'error');
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
    <div>
      <Toast message={toastMsg} type={toastType} onClose={() => setToastMsg('')} />
      
      <div className="action-bar">
        <div>
          <h2>Student Complaints & Grievances</h2>
          <p style={{ color: '#6B7B8D', fontSize: '0.85rem' }}>Track student issues and submit official resolutions</p>
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Student ID</th>
              <th>Student Name</th>
              <th>Department</th>
              <th>Subject</th>
              <th>Status</th>
              <th>Filed Date</th>
              <th>Attachments</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {complaints.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '3rem' }}>No student complaints filed.</td>
              </tr>
            ) : (
              complaints.map(comp => (
                <tr key={comp._id}>
                  <td><strong>{comp.studentId?.academicId}</strong></td>
                  <td>{comp.studentId?.fullName}</td>
                  <td>{comp.studentId?.departmentId?.name || 'N/A'}</td>
                  <td>{comp.subject}</td>
                  <td>
                    <span className={`badge badge-${getStatusBadge(comp.status)}`}>
                      {comp.status.toUpperCase()}
                    </span>
                  </td>
                  <td>{new Date(comp.createdAt).toLocaleDateString()}</td>
                  <td>
                    {comp.attachments && comp.attachments.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        {comp.attachments.map((file, idx) => (
                          <a key={idx} href={file} target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', color: '#6366f1', textDecoration: 'none' }}>
                            📎 File #{idx + 1}
                          </a>
                        ))}
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: '#6B7B8D' }}>No files</span>
                    )}
                  </td>
                  <td>
                    <button className="btn btn-secondary" onClick={() => handleOpenResponseModal(comp)} style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
                      💬 Reply / Edit
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL: COMPLAINT REPLY */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Complaint Resolution">
        {selectedComplaint && (
          <form onSubmit={handleResponseSubmit}>
            <div style={{ marginBottom: '1.25rem', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ fontSize: '0.95rem', margin: '0 0 0.5rem 0' }}>Subject: {selectedComplaint.subject}</h4>
              <p style={{ fontSize: '0.85rem', color: '#334155' }}>{selectedComplaint.description}</p>
              <small style={{ color: '#6B7B8D', fontSize: '0.75rem', display: 'block', marginTop: '0.5rem' }}>
                Filed by: {selectedComplaint.studentId?.fullName} ({selectedComplaint.studentId?.academicId})
              </small>
            </div>

            <div className="form-group">
              <label>Resolution Action Status</label>
              <select
                className="form-control"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="pending">Pending</option>
                <option value="reviewed">Under Review</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>

            <div className="form-group">
              <label>Official Administrative Response</label>
              <textarea
                className="form-control"
                rows="5"
                placeholder="Type resolution description or reply to student..."
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.5rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Submitting reply...' : 'Submit Resolution'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default Complaints;
