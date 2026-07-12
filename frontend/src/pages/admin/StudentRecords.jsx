import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/Modal';
import Toast from '../../components/Toast';

const StudentRecords = () => {
  const { token } = useAuth();
  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);

  // Modal control
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Edit fields
  const [editName, setEditName] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editDeptId, setEditDeptId] = useState('');
  const [newPhoto, setNewPhoto] = useState(null);
  const [newDocs, setNewDocs] = useState([]);

  // Toast
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState('success');
  const [loading, setLoading] = useState(false);

  const showToast = (msg, type = 'success') => {
    setToastMsg(msg);
    setToastType(type);
  };

  const fetchStudents = async () => {
    try {
      const queryParams = new URLSearchParams({
        search,
        page,
        limit: 8
      });
      if (deptFilter) queryParams.append('departmentId', deptFilter);

      const response = await fetch(`/api/admin/students?${queryParams.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setStudents(data.students);
        setTotalPages(data.totalPages);
        setTotalStudents(data.totalStudents);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [search, deptFilter, page]);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await fetch('/api/admin/departments', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (response.ok) {
          setDepartments(data);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchDepartments();
  }, [token]);

  const handleOpenDetails = (student) => {
    setSelectedStudent(student);
    setEditName(student.fullName);
    setEditStatus(student.status);
    setEditDeptId(student.departmentId?._id || student.departmentId);
    setNewPhoto(null);
    setNewDocs([]);
    setIsModalOpen(true);
  };

  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    if (!editName || !editDeptId) return showToast('Name and Department are required', 'error');

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('fullName', editName);
      formData.append('status', editStatus);
      formData.append('departmentId', editDeptId);

      if (newPhoto) formData.append('photo', newPhoto);
      if (newDocs.length > 0) {
        newDocs.forEach(doc => formData.append('documents', doc));
      }

      const response = await fetch(`/api/admin/students/${selectedStudent._id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        showToast('Student profile updated successfully', 'success');
        fetchStudents();
        setIsModalOpen(false);
      } else {
        showToast(data.message || 'Update failed', 'error');
      }
    } catch (error) {
      showToast('Error connecting to server', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStudent = async (studentId) => {
    if (!window.confirm('Are you absolutely sure you want to delete this student and their account credentials?')) return;

    try {
      const response = await fetch(`/api/admin/students/${studentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        showToast('Student deleted successfully', 'success');
        fetchStudents();
        setIsModalOpen(false);
      } else {
        const data = await response.json();
        showToast(data.message || 'Delete failed', 'error');
      }
    } catch (err) {
      showToast('Connection error', 'error');
    }
  };

  return (
    <div>
      <Toast message={toastMsg} type={toastType} onClose={() => setToastMsg('')} />
      
      <div className="action-bar">
        <div>
          <h2>Student Records</h2>
          <p style={{ color: '#6B7B8D', fontSize: '0.85rem' }}>Total registered: {totalStudents}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', width: '60%', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <select 
            className="form-control" 
            style={{ maxWidth: '200px' }}
            value={deptFilter}
            onChange={(e) => { setDeptFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Departments</option>
            {departments.map(d => (
              <option key={d._id} value={d._id}>{d.name}</option>
            ))}
          </select>
          <input
            type="text"
            className="form-control"
            placeholder="Search Academic ID or Name..."
            style={{ maxWidth: '260px' }}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Photo</th>
              <th>Academic ID</th>
              <th>Full Name</th>
              <th>Department</th>
              <th>Status</th>
              <th>Registration Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '3rem' }}>No student records found matching the criteria.</td>
              </tr>
            ) : (
              students.map(student => (
                <tr key={student._id}>
                  <td>
                    <img 
                      src={student.photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80'} 
                      alt="Avatar" 
                      style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #cbd5e1' }}
                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80' }}
                    />
                  </td>
                  <td><strong>{student.academicId}</strong></td>
                  <td>{student.fullName}</td>
                  <td>{student.departmentId?.name || 'Unassigned'}</td>
                  <td>
                    <span className={`badge badge-${student.status === 'Active' ? 'success' : 'danger'}`}>
                      {student.status}
                    </span>
                  </td>
                  <td>{new Date(student.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button className="btn btn-secondary" onClick={() => handleOpenDetails(student)} style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
                      👁️ View / Edit
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
          <button className="btn btn-secondary" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</button>
          <span style={{ alignSelf: 'center', padding: '0 1rem', fontSize: '0.9rem' }}>Page {page} of {totalPages}</span>
          <button className="btn btn-secondary" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
        </div>
      )}

      {/* Student Details & Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Student Profile Details">
        {selectedStudent && (
          <form onSubmit={handleUpdateStudent}>
            <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1.5rem' }}>
              <img 
                src={selectedStudent.photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'} 
                alt={selectedStudent.fullName} 
                style={{ width: '90px', height: '90px', borderRadius: '12px', objectFit: 'cover', border: '2px solid #6366f1' }}
                onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80' }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <h3 style={{ fontSize: '1.25rem', margin: 0 }}>{selectedStudent.fullName}</h3>
                <p style={{ color: '#6B7B8D', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                  Academic ID: <strong>{selectedStudent.academicId}</strong><br />
                  Registered Email: {selectedStudent.userId?.email || 'N/A'}
                </p>
              </div>
            </div>

            <div className="form-group">
              <label>Full 4-Part Name</label>
              <input
                type="text"
                className="form-control"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Department Stream</label>
                <select
                  className="form-control"
                  value={editDeptId}
                  onChange={(e) => setEditDeptId(e.target.value)}
                  required
                >
                  {departments.map(d => (
                    <option key={d._id} value={d._id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Enrollment Status</label>
                <select
                  className="form-control"
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                >
                  <option value="Active">Active</option>
                  <option value="Suspended">Suspended</option>
                  <option value="Graduated">Graduated</option>
                </select>
              </div>
            </div>

            {/* Document Array Details */}
            <div style={{ margin: '1.25rem 0' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: '600', display: 'block', marginBottom: '0.5rem' }}>Identity Verification Documents</label>
              {selectedStudent.documents.length === 0 ? (
                <p style={{ fontSize: '0.85rem', color: '#6B7B8D' }}>No document uploads found for this student.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {selectedStudent.documents.map((doc, idx) => (
                    <a 
                      key={idx} 
                      href={doc} 
                      target="_blank" 
                      rel="noreferrer" 
                      style={{ fontSize: '0.85rem', color: '#6366f1', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                    >
                      📄 Document Verification File #{idx + 1} (Click to open)
                    </a>
                  ))}
                </div>
              )}
            </div>

            <div className="form-row" style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1.25rem', marginTop: '1.25rem' }}>
              <div className="form-group">
                <label>Replace Photo (JPG/PNG)</label>
                <input
                  type="file"
                  className="form-control"
                  accept="image/*"
                  onChange={(e) => setNewPhoto(e.target.files[0])}
                />
              </div>

              <div className="form-group">
                <label>Add Documents (PDF/Images)</label>
                <input
                  type="file"
                  className="form-control"
                  multiple
                  accept=".pdf,image/*"
                  onChange={(e) => setNewDocs(Array.from(e.target.files))}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginTop: '1.5rem' }}>
              <button 
                type="button" 
                className="btn btn-danger"
                onClick={() => handleDeleteStudent(selectedStudent._id)}
              >
                🗑️ Delete Record
              </button>
              
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </div>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default StudentRecords;
