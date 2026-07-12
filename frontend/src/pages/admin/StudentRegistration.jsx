import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Toast from '../../components/Toast';

const StudentRegistration = () => {
  const { token } = useAuth();
  
  // Form fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [photo, setPhoto] = useState(null);
  const [documents, setDocuments] = useState([]);
  
  // Selection datasets
  const [departments, setDepartments] = useState([]);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState('success');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await fetch('/api/admin/departments', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (response.ok) {
          setDepartments(data);
          if (data.length > 0) setDepartmentId(data[0]._id);
        }
      } catch (err) {
        console.error('Error fetching departments list:', err);
      }
    };
    fetchDepartments();
  }, [token]);

  const showToast = (msg, type = 'success') => {
    setToastMsg(msg);
    setToastType(type);
  };

  const handlePhotoChange = (e) => {
    setPhoto(e.target.files[0]);
  };

  const handleDocsChange = (e) => {
    setDocuments(Array.from(e.target.files));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    if (!fullName || !email || !departmentId) {
      return showToast('Full name, email, and department selection are required', 'error');
    }

    // Verify 4-part name
    const parts = fullName.trim().split(/\s+/);
    if (parts.length < 4) {
      return showToast('Please enter your full 4-part name (First, Middle, Third, and Last Name)', 'error');
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('fullName', fullName.trim());
      formData.append('email', email.toLowerCase().trim());
      formData.append('departmentId', departmentId);

      if (photo) {
        formData.append('photo', photo);
      }

      if (documents.length > 0) {
        documents.forEach(doc => {
          formData.append('documents', doc);
        });
      }

      const response = await fetch('/api/admin/students', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
          // Note: Content-Type is auto-configured by browser when using FormData
        },
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        showToast(`Registration Successful! Academic ID: ${data.student.academicId}`, 'success');
        // Reset form fields
        setFullName('');
        setEmail('');
        setPhoto(null);
        setDocuments([]);
        // Clear files input
        document.getElementById('photo-input').value = '';
        document.getElementById('docs-input').value = '';
      } else {
        showToast(data.message || 'Registration failed', 'error');
      }

    } catch (error) {
      showToast('Server connection error. Failed to submit registration form.', 'error');
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '650px', margin: '0 auto' }}>
      <Toast message={toastMsg} type={toastType} onClose={() => setToastMsg('')} />
      
      <div className="card">
        <h2 style={{ marginBottom: '0.25rem' }}>Student Registration</h2>
        <p style={{ color: '#6B7B8D', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
          Create a new student credential record. Academic IDs (YYYYXXXXX) are generated automatically.
        </p>

        <form onSubmit={handleFormSubmit}>
          <div className="form-group">
            <label>Full Name (Must contain 4 parts)</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. John Fitzgerald Kennedy Junior"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
            <small style={{ color: '#6B7B8D', fontSize: '0.75rem' }}>Name format: First Name + Father's Name + Grandfather's Name + Family Name</small>
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              className="form-control"
              placeholder="e.g. student@lms.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Department Stream</label>
            <select
              className="form-control"
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              required
            >
              {departments.length === 0 ? (
                <option value="">No departments available. Create one first!</option>
              ) : (
                departments.map(dept => (
                  <option key={dept._id} value={dept._id}>{dept.name}</option>
                ))
              )}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Profile Picture (JPG/PNG)</label>
              <input
                id="photo-input"
                type="file"
                className="form-control"
                accept="image/*"
                onChange={handlePhotoChange}
              />
            </div>

            <div className="form-group">
              <label>Identity Documents (PDF/Images)</label>
              <input
                id="docs-input"
                type="file"
                className="form-control"
                multiple
                accept=".pdf,image/*"
                onChange={handleDocsChange}
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: '1rem', justifyContent: 'center' }}
            disabled={submitting || departments.length === 0}
          >
            {submitting ? 'Creating Academic Records...' : 'Register Student Credentials'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default StudentRegistration;
