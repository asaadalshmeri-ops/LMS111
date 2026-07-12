import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Toast from '../../components/Toast';

const Assignments = () => {
  const { token, user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  
  // Forms
  const [uploadingId, setUploadingId] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);

  // Toast
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState('success');
  const [loading, setLoading] = useState(false);

  const showToast = (msg, type = 'success') => {
    setToastMsg(msg);
    setToastType(type);
  };

  const fetchAssignments = async () => {
    try {
      const res = await fetch('/api/student/assignments', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setAssignments(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [token]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type !== 'application/pdf') {
      showToast('Only PDF documents are allowed for assignment submissions', 'error');
      e.target.value = '';
      setPdfFile(null);
      return;
    }
    setPdfFile(file);
  };

  const handleUploadSubmit = async (e, assignId) => {
    e.preventDefault();
    if (!pdfFile) return showToast('Please select a PDF file first', 'error');

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('assignmentFile', pdfFile);

      const res = await fetch(`/api/student/assignments/${assignId}/submit`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const data = await res.json();
      if (res.ok) {
        showToast('Assignment submitted successfully!', 'success');
        setPdfFile(null);
        setUploadingId(null);
        fetchAssignments();
      } else {
        showToast(data.message || 'Submission failed', 'error');
      }
    } catch (err) {
      showToast('Error uploading assignment file', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getSubmissionStatus = (assign) => {
    if (!user.studentProfile) return 'pending';
    const sub = assign.submissions?.find(
      s => s.studentId?._id?.toString() === user.studentProfile._id.toString() ||
           s.studentId?.toString() === user.studentProfile._id.toString()
    );
    if (!sub) return 'pending';
    return sub.grade !== null ? 'graded' : 'submitted';
  };

  const getStudentSubmission = (assign) => {
    if (!user.studentProfile) return null;
    return assign.submissions?.find(
      s => s.studentId?._id?.toString() === user.studentProfile._id.toString() ||
           s.studentId?.toString() === user.studentProfile._id.toString()
    );
  };

  return (
    <div>
      <Toast message={toastMsg} type={toastType} onClose={() => setToastMsg('')} />
      
      <div className="action-bar">
        <div>
          <h2>Assignments Portal</h2>
          <p style={{ color: '#6B7B8D', fontSize: '0.85rem' }}>Upload academic responses and inspect score sheets</p>
        </div>
      </div>

      <div style={styles.list}>
        {assignments.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem', color: '#6B7B8D' }}>
            No assignments assigned yet. Make sure to attend your lectures!
          </div>
        ) : (
          assignments.map(assign => {
            const status = getSubmissionStatus(assign);
            const sub = getStudentSubmission(assign);
            
            return (
              <div key={assign._id} className="card" style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.15rem', margin: 0 }}>{assign.title}</h3>
                    <p style={{ fontSize: '0.8rem', color: '#6B7B8D', marginTop: '0.1rem' }}>
                      Course: <strong>{assign.lectureId?.courseName}</strong> | Due: {new Date(assign.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div>
                    {status === 'graded' && (
                      <span className="badge badge-success" style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}>
                        Graded Score: {sub.grade}/100
                      </span>
                    )}
                    {status === 'submitted' && (
                      <span className="badge badge-info">Submitted (Pending Review)</span>
                    )}
                    {status === 'pending' && (
                      <span className="badge badge-danger">Pending Submission</span>
                    )}
                  </div>
                </div>

                <p style={{ fontSize: '0.85rem', color: '#334155', margin: '0.75rem 0' }}>{assign.description}</p>

                {/* Submitting / Upload section */}
                {status !== 'graded' && (
                  <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem', marginTop: '0.75rem' }}>
                    {uploadingId === assign._id ? (
                      <form onSubmit={(e) => handleUploadSubmit(e, assign._id)} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: '200px' }}>
                          <input 
                            type="file" 
                            className="form-control" 
                            accept=".pdf" 
                            onChange={handleFileChange}
                            required
                          />
                          <small style={{ color: '#6B7B8D', fontSize: '0.7rem' }}>Only PDF format is accepted</small>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Uploading...' : 'Confirm Upload'}
                          </button>
                          <button type="button" className="btn btn-secondary" onClick={() => { setUploadingId(null); setPdfFile(null); }}>
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {status === 'submitted' ? (
                          <span style={{ fontSize: '0.8rem', color: '#6B7B8D' }}>
                            File uploaded: <a href={sub.fileUrl} target="_blank" rel="noreferrer" style={{ color: '#6366f1' }}>open submission pdf</a>
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: '#ef4444' }}>Please submit your answer before the deadline.</span>
                        )}
                        <button className="btn btn-primary" onClick={() => setUploadingId(assign._id)}>
                          {status === 'submitted' ? '🔄 Resubmit Answer' : '📤 Upload PDF Answer'}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {status === 'graded' && (
                  <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem', marginTop: '0.75rem', fontSize: '0.8rem', color: '#6B7B8D' }}>
                    File submitted: <a href={sub.fileUrl} target="_blank" rel="noreferrer" style={{ color: '#6366f1' }}>open graded pdf</a>
                  </div>
                )}
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
    flexDirection: 'column'
  }
};

export default Assignments;
