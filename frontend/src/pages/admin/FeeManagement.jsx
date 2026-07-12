import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/Modal';
import Toast from '../../components/Toast';

const FeeManagement = () => {
  const { token } = useAuth();
  const [fees, setFees] = useState([]);
  const [students, setStudents] = useState([]);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  // Forms
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [semester, setSemester] = useState('');
  const [totalFees, setTotalFees] = useState('');
  const [amountPaid, setAmountPaid] = useState('');

  // Update Forms
  const [selectedFee, setSelectedFee] = useState(null);
  const [updatePaidAmount, setUpdatePaidAmount] = useState('');
  const [receiptFile, setReceiptFile] = useState(null);

  // Toast
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState('success');
  const [loading, setLoading] = useState(false);

  const showToast = (msg, type = 'success') => {
    setToastMsg(msg);
    setToastType(type);
  };

  const fetchFees = async () => {
    try {
      const res = await fetch('/api/admin/fees', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setFees(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await fetch('/api/admin/students?limit=1000', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setStudents(data.students);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchFees();
    fetchStudents();
  }, [token]);

  const handleCreateFee = async (e) => {
    e.preventDefault();
    if (!selectedStudentId || !semester || !totalFees) {
      return showToast('Student, semester, and total fee are required', 'error');
    }
    setLoading(true);
    try {
      const res = await fetch('/api/admin/fees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          studentId: selectedStudentId,
          semester,
          totalFees: Number(totalFees),
          amountPaid: Number(amountPaid) || 0
        })
      });
      if (res.ok) {
        showToast('Student billing record created!', 'success');
        setSelectedStudentId('');
        setSemester('');
        setTotalFees('');
        setAmountPaid('');
        setIsCreateModalOpen(false);
        fetchFees();
      } else {
        const data = await res.json();
        showToast(data.message || 'Creation failed', 'error');
      }
    } catch (err) {
      showToast('Error connecting to server', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenUpdate = (fee) => {
    setSelectedFee(fee);
    setUpdatePaidAmount(fee.amountPaid);
    setReceiptFile(null);
    setIsUpdateModalOpen(true);
  };

  const handleUpdateFee = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('amountPaid', updatePaidAmount);
      if (receiptFile) {
        formData.append('receipt', receiptFile);
      }

      const res = await fetch(`/api/admin/fees/${selectedFee._id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (res.ok) {
        showToast('Student payment record adjusted!', 'success');
        setIsUpdateModalOpen(false);
        fetchFees();
      } else {
        const data = await res.json();
        showToast(data.message || 'Update failed', 'error');
      }
    } catch (err) {
      showToast('Server update failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Toast message={toastMsg} type={toastType} onClose={() => setToastMsg('')} />
      
      <div className="action-bar">
        <div>
          <h2>Fee & Finance Management</h2>
          <p style={{ color: '#6B7B8D', fontSize: '0.85rem' }}>View, invoice, and track student semester payments</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsCreateModalOpen(true)}>
          ➕ Invoice Student
        </button>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Academic ID</th>
              <th>Student Name</th>
              <th>Department</th>
              <th>Semester</th>
              <th>Total Due</th>
              <th>Amount Paid</th>
              <th>Remaining Balance</th>
              <th>Receipts</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {fees.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '3rem' }}>No billing profiles registered.</td>
              </tr>
            ) : (
              fees.map(fee => (
                <tr key={fee._id}>
                  <td><strong>{fee.studentId?.academicId}</strong></td>
                  <td>{fee.studentId?.fullName}</td>
                  <td>{fee.studentId?.departmentId?.name || 'N/A'}</td>
                  <td>{fee.semester}</td>
                  <td>${fee.totalFees}</td>
                  <td style={{ color: '#10b981', fontWeight: 600 }}>${fee.amountPaid}</td>
                  <td style={{ color: fee.remaining > 0 ? '#ef4444' : '#10b981', fontWeight: 700 }}>
                    ${fee.remaining}
                  </td>
                  <td>
                    {fee.receipts && fee.receipts.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        {fee.receipts.map((rec, idx) => (
                          <a key={idx} href={rec.fileUrl} target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', color: '#6366f1', textDecoration: 'none' }}>
                            🧾 Receipt #{idx + 1}
                          </a>
                        ))}
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: '#6B7B8D' }}>No uploads</span>
                    )}
                  </td>
                  <td>
                    <button className="btn btn-secondary" onClick={() => handleOpenUpdate(fee)} style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
                      ⚙️ Adjust / Upload
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL: CREATE FEE */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Generate Semester Invoice">
        <form onSubmit={handleCreateFee}>
          <div className="form-group">
            <label>Select Student</label>
            <select 
              className="form-control"
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              required
            >
              <option value="">-- Choose Student --</option>
              {students.map(student => (
                <option key={student._id} value={student._id}>
                  {student.fullName} ({student.academicId})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Semester Term</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Fall 2026"
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Total Semester Fees ($)</label>
              <input
                type="number"
                className="form-control"
                placeholder="e.g. 1500"
                value={totalFees}
                onChange={(e) => setTotalFees(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Initial Amount Paid ($)</label>
              <input
                type="number"
                className="form-control"
                placeholder="e.g. 500"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsCreateModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>Generate Invoice</button>
          </div>
        </form>
      </Modal>

      {/* MODAL: UPDATE FEE */}
      <Modal isOpen={isUpdateModalOpen} onClose={() => setIsUpdateModalOpen(false)} title="Adjust Payment Details">
        {selectedFee && (
          <form onSubmit={handleUpdateFee}>
            <p style={{ marginBottom: '1.25rem', fontSize: '0.9rem' }}>
              Student: <strong>{selectedFee.studentId?.fullName}</strong> ({selectedFee.studentId?.academicId})<br />
              Semester: {selectedFee.semester} | Invoice Total: ${selectedFee.totalFees}
            </p>
            <div className="form-group">
              <label>Cumulative Amount Paid ($)</label>
              <input
                type="number"
                className="form-control"
                value={updatePaidAmount}
                onChange={(e) => setUpdatePaidAmount(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label>Attach Payment Receipt Image/PDF (Optional)</label>
              <input
                type="file"
                className="form-control"
                accept=".pdf,image/*"
                onChange={(e) => setReceiptFile(e.target.files[0])}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.5rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsUpdateModalOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>Adjust Record</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default FeeManagement;
