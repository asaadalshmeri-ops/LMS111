import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Toast from '../../components/Toast';

const Fees = () => {
  const { token } = useAuth();
  const [feeRecords, setFeeRecords] = useState([]);
  
  // Forms
  const [activeRecordId, setActiveRecordId] = useState(null);
  const [receiptFile, setReceiptFile] = useState(null);

  // Toast
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState('success');
  const [submitting, setSubmitting] = useState(false);

  const showToast = (msg, type = 'success') => {
    setToastMsg(msg);
    setToastType(type);
  };

  const fetchFees = async () => {
    try {
      const res = await fetch('/api/student/fees', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setFeeRecords(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchFees();
  }, [token]);

  const handleFileChange = (e) => {
    setReceiptFile(e.target.files[0]);
  };

  const handleReceiptUpload = async (e, recordId) => {
    e.preventDefault();
    if (!receiptFile) return showToast('Please select a receipt document first', 'error');

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('receipt', receiptFile);

      const res = await fetch(`/api/student/fees/${recordId}/receipt`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (res.ok) {
        showToast('Payment receipt uploaded successfully. Awaiting administrative review.', 'success');
        setReceiptFile(null);
        setActiveRecordId(null);
        fetchFees();
      } else {
        const data = await res.json();
        showToast(data.message || 'Upload failed', 'error');
      }
    } catch (err) {
      showToast('Error uploading payment receipt', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <Toast message={toastMsg} type={toastType} onClose={() => setToastMsg('')} />
      
      <div className="action-bar">
        <div>
          <h2>Fees & Receipts</h2>
          <p style={{ color: '#6B7B8D', fontSize: '0.85rem' }}>Track semester balances and submit bank transfer receipts</p>
        </div>
      </div>

      <div style={styles.grid}>
        {feeRecords.length === 0 ? (
          <div className="card" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: '#6B7B8D' }}>
            No fee invoices registered for your student profile.
          </div>
        ) : (
          feeRecords.map(record => (
            <div key={record._id} className="card" style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', margin: 0 }}>Semester: {record.semester}</h3>
                  <span style={{ fontSize: '0.8rem', color: '#6B7B8D' }}>Invoice ID: {record._id}</span>
                </div>
                <span className={`badge badge-${record.remaining > 0 ? 'warning' : 'success'}`} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                  {record.remaining > 0 ? `Balance Due: $${record.remaining}` : 'Fully Settled'}
                </span>
              </div>

              <div style={styles.detailsRow}>
                <div style={styles.detailBox}>
                  <span>Total Invoiced</span>
                  <strong>${record.totalFees}</strong>
                </div>
                <div style={styles.detailBox}>
                  <span>Total Paid</span>
                  <strong style={{ color: '#10b981' }}>${record.amountPaid}</strong>
                </div>
                <div style={styles.detailBox}>
                  <span>Unpaid Balance</span>
                  <strong style={{ color: record.remaining > 0 ? '#ef4444' : '#10b981' }}>${record.remaining}</strong>
                </div>
              </div>

              {/* Upload receipt section */}
              {record.remaining > 0 && (
                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem', marginTop: '0.75rem' }}>
                  {activeRecordId === record._id ? (
                    <form onSubmit={(e) => handleReceiptUpload(e, record._id)} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: '200px' }}>
                        <input 
                          type="file" 
                          className="form-control" 
                          accept=".pdf,image/*" 
                          onChange={handleFileChange}
                          required
                        />
                        <small style={{ color: '#6B7B8D', fontSize: '0.7rem' }}>Only image or PDF format accepted</small>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button type="submit" className="btn btn-primary" disabled={submitting}>
                          {submitting ? 'Uploading...' : 'Confirm Upload'}
                        </button>
                        <button type="button" className="btn btn-secondary" onClick={() => { setActiveRecordId(null); setReceiptFile(null); }}>
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.8rem', color: '#6B7B8D' }}>Have you completed a bank transfer? Submit receipt.</span>
                      <button className="btn btn-primary" onClick={() => setActiveRecordId(record._id)}>
                        📤 Upload Payment Receipt
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Receipts List */}
              {record.receipts && record.receipts.length > 0 && (
                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem', marginTop: '0.75rem' }}>
                  <h4 style={{ fontSize: '0.85rem', marginBottom: '0.4rem' }}>Submitted Receipts Logs:</h4>
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    {record.receipts.map((rec, idx) => (
                      <a 
                        key={idx} 
                        href={rec.fileUrl} 
                        target="_blank" 
                        rel="noreferrer" 
                        style={styles.receiptTag}
                      >
                        🧾 Receipt #{idx + 1} ({new Date(rec.uploadedAt).toLocaleDateString()})
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const styles = {
  grid: {
    display: 'flex',
    flexDirection: 'column'
  },
  detailsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '1rem',
    margin: '1.25rem 0',
    backgroundColor: '#f8fafc',
    padding: '1rem',
    borderRadius: '8px',
    border: '1px solid #e2e8f0'
  },
  detailBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.2rem'
  },
  receiptTag: {
    fontSize: '0.8rem',
    color: '#6366f1',
    textDecoration: 'none',
    backgroundColor: '#e0e7ff',
    padding: '0.3rem 0.6rem',
    borderRadius: '4px',
    border: '1px solid #cbd5e1'
  }
};

export default Fees;
