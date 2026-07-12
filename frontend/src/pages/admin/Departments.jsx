import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/Modal';
import Toast from '../../components/Toast';

const Departments = () => {
  const { token } = useAuth();
  
  // Data lists
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState(null);
  const [activeTab, setActiveTab] = useState('students'); // students, lectures, assignments, exams, attendance, notifications

  // State lists for selected department
  const [deptStudents, setDeptStudents] = useState([]);
  const [deptLectures, setDeptLectures] = useState([]);
  const [deptAssignments, setDeptAssignments] = useState([]);
  const [deptExams, setDeptExams] = useState([]);

  // Toast
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState('success');

  // Modal controls
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [isLectureModalOpen, setIsLectureModalOpen] = useState(false);
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [isGradeAssignmentModalOpen, setIsGradeAssignmentModalOpen] = useState(false);
  const [isGradeExamModalOpen, setIsGradeExamModalOpen] = useState(false);

  // Form States - Department
  const [deptName, setDeptName] = useState('');
  const [deptDesc, setDeptDesc] = useState('');
  const [deptHead, setDeptHead] = useState('');

  // Form States - Lecture
  const [lecCourse, setLecCourse] = useState('');
  const [lecNum, setLecNum] = useState('');
  const [lecInstructor, setLecInstructor] = useState('');
  const [lecYoutube, setLecYoutube] = useState('');
  const [lecPdf, setLecPdf] = useState('');
  const [lecDiagrams, setLecDiagrams] = useState([]);

  // Form States - Assignment
  const [selectedLectureId, setSelectedLectureId] = useState('');
  const [assignTitle, setAssignTitle] = useState('');
  const [assignDesc, setAssignDesc] = useState('');
  const [assignDueDate, setAssignDueDate] = useState('');

  // Form States - Grading Assignment
  const [activeAssignment, setActiveAssignment] = useState(null);
  const [activeSubmission, setActiveSubmission] = useState(null);
  const [assignmentGrade, setAssignmentGrade] = useState('');

  // Form States - Exam Creation
  const [examCourse, setExamCourse] = useState('');
  const [examDate, setExamDate] = useState('');
  const [examTime, setExamTime] = useState('');
  const [examDuration, setExamDuration] = useState('');
  const [examQuestions, setExamQuestions] = useState([]); // Array of question objects

  // Form States - Grading Exam
  const [activeExam, setActiveExam] = useState(null);
  const [activeExamResult, setActiveExamResult] = useState(null);
  const [essayGrade, setEssayGrade] = useState('');
  const [essayFeedback, setEssayFeedback] = useState('');
  const [gradingQuestionIndex, setGradingQuestionIndex] = useState(0);

  // Form States - Department Announcements
  const [annTitle, setAnnTitle] = useState('');
  const [annMessage, setAnnMessage] = useState('');
  
  const showToast = (msg, type = 'success') => {
    setToastMsg(msg);
    setToastType(type);
  };

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

  useEffect(() => {
    fetchDepartments();
  }, [token]);

  const selectDeptHandler = async (dept) => {
    setSelectedDept(dept);
    setActiveTab('students');
    await refreshDeptDetails(dept._id);
  };

  const refreshDeptDetails = async (deptId) => {
    try {
      // Load Students
      const resStudents = await fetch(`/api/admin/students?departmentId=${deptId}&limit=100`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const dStudents = await resStudents.json();
      if (resStudents.ok) setDeptStudents(dStudents.students);

      // Trigger automatic loading of tabs if they are active
      if (activeTab === 'lectures' || activeTab === 'attendance') fetchLectures(deptId);
      if (activeTab === 'assignments') fetchAssignments(deptId);
      if (activeTab === 'exams') fetchExams(deptId);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLectures = async (deptId = selectedDept?._id) => {
    if (!deptId) return;
    try {
      const res = await fetch(`/api/admin/lectures?departmentId=${deptId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setDeptLectures(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAssignments = async (deptId = selectedDept?._id) => {
    if (!deptId) return;
    try {
      const res = await fetch(`/api/admin/assignments?departmentId=${deptId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setDeptAssignments(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchExams = async (deptId = selectedDept?._id) => {
    if (!deptId) return;
    try {
      const res = await fetch(`/api/admin/exams?departmentId=${deptId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setDeptExams(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAttendance = async (deptId = selectedDept?._id) => {
    // Attendance is calculated from Lectures list populated with student details
    await fetchLectures(deptId);
  };

  // --- ACTIONS ---

  const handleCreateDept = async (e) => {
    e.preventDefault();
    if (!deptName) return showToast('Department name is required', 'error');
    try {
      const res = await fetch('/api/admin/departments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: deptName, description: deptDesc, headOfDepartment: deptHead })
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Department stream created successfully!', 'success');
        setDeptName('');
        setDeptDesc('');
        setDeptHead('');
        setIsDeptModalOpen(false);
        fetchDepartments();
      } else {
        showToast(data.message || 'Failed to create department', 'error');
      }
    } catch (err) {
      showToast('Connection error', 'error');
    }
  };

  const handleCreateLecture = async (e) => {
    e.preventDefault();
    if (!lecCourse || !lecNum || !lecInstructor) {
      return showToast('Course name, number, and instructor are required', 'error');
    }

    try {
      const formData = new FormData();
      formData.append('departmentId', selectedDept._id);
      formData.append('courseName', lecCourse);
      formData.append('lectureNumber', lecNum);
      formData.append('instructor', lecInstructor);
      formData.append('youtubeLink', lecYoutube);
      formData.append('pdfContent', lecPdf);
      if (lecDiagrams.length > 0) {
        lecDiagrams.forEach(file => formData.append('diagrams', file));
      }

      const res = await fetch('/api/admin/lectures', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const data = await res.json();
      if (res.ok) {
        showToast('Lecture uploaded successfully!', 'success');
        setLecCourse('');
        setLecNum('');
        setLecInstructor('');
        setLecYoutube('');
        setLecPdf('');
        setLecDiagrams([]);
        setIsLectureModalOpen(false);
        fetchLectures();
      } else {
        showToast(data.message || 'Error saving lecture', 'error');
      }
    } catch (err) {
      showToast('Error uploading files', 'error');
    }
  };

  const handleDeleteLecture = async (lectureId) => {
    if (!window.confirm('Delete this lecture? This action cannot be undone.')) return;
    try {
      const res = await fetch(`/api/admin/lectures/${lectureId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        showToast('Lecture deleted', 'success');
        fetchLectures();
      }
    } catch (err) {
      showToast('Delete failed', 'error');
    }
  };

  const handleCreateAssignmentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedLectureId || !assignTitle || !assignDueDate) {
      return showToast('Lecture link, Title and Due Date are required', 'error');
    }
    try {
      const res = await fetch('/api/admin/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          lectureId: selectedLectureId,
          title: assignTitle,
          description: assignDesc,
          dueDate: assignDueDate
        })
      });
      if (res.ok) {
        showToast('Assignment generated!', 'success');
        setAssignTitle('');
        setAssignDesc('');
        setAssignDueDate('');
        setSelectedLectureId('');
        setIsAssignmentModalOpen(false);
        fetchAssignments();
        fetchLectures(); // Refresh lecture connections
      }
    } catch (err) {
      showToast('Save failed', 'error');
    }
  };

  const handleGradeAssignmentSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/admin/assignments/${activeAssignment._id}/grade/${activeSubmission.studentId._id || activeSubmission.studentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ grade: assignmentGrade })
      });
      if (res.ok) {
        showToast('Assignment score recorded!', 'success');
        setIsGradeAssignmentModalOpen(false);
        fetchAssignments();
      }
    } catch (err) {
      showToast('Failed to record score', 'error');
    }
  };

  const handleSendAnnouncement = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          departmentId: selectedDept._id,
          title: annTitle,
          message: annMessage
        })
      });
      if (res.ok) {
        showToast('Announcement broadcasted via WebSockets!', 'success');
        setAnnTitle('');
        setAnnMessage('');
      }
    } catch (err) {
      showToast('Announce failed', 'error');
    }
  };

  // --- QUESTION BANK BUILDER ---

  const addQuestionBuilder = (type) => {
    setExamQuestions(prev => [
      ...prev,
      {
        type,
        questionText: '',
        options: type === 'mcq' ? ['', '', '', ''] : [],
        correctAnswer: ''
      }
    ]);
  };

  const removeQuestionBuilder = (index) => {
    setExamQuestions(prev => prev.filter((_, idx) => idx !== index));
  };

  const updateQuestionField = (index, field, value) => {
    setExamQuestions(prev => {
      const next = [...prev];
      next[index][field] = value;
      return next;
    });
  };

  const handleCreateExamSubmit = async () => {
    if (!examCourse || !examDate || !examTime || !examDuration || examQuestions.length === 0) {
      return showToast('Course name, date, time, duration, and questions are required', 'error');
    }
    try {
      const res = await fetch('/api/admin/exams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          departmentId: selectedDept._id,
          courseName: examCourse,
          date: examDate,
          time: examTime,
          duration: examDuration,
          questions: examQuestions
        })
      });
      if (res.ok) {
        showToast('Exam schedule and paper published!', 'success');
        setExamCourse('');
        setExamDate('');
        setExamTime('');
        setExamDuration('');
        setExamQuestions([]);
        setIsExamModalOpen(false);
        fetchExams();
      }
    } catch (err) {
      showToast('Save exam paper failed', 'error');
    }
  };

  const handleGradeEssaySubmit = async (questionIdx) => {
    if (!essayGrade) return showToast('Enter grade score', 'error');
    try {
      const res = await fetch(`/api/admin/exams/${activeExam._id}/grade-essay/${activeExamResult.studentId._id || activeExamResult.studentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          questionIndex: questionIdx,
          grade: essayGrade,
          feedback: essayFeedback
        })
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Essay question graded successfully!', 'success');
        
        // Update local modal data
        const updatedResult = data.exam.results.find(
          r => r.studentId.toString() === (activeExamResult.studentId._id || activeExamResult.studentId).toString()
        );
        setActiveExamResult(updatedResult);
        setActiveExam(data.exam);
        
        setEssayGrade('');
        setEssayFeedback('');
        fetchExams();
      }
    } catch (err) {
      showToast('Failed to grade essay', 'error');
    }
  };

  return (
    <div style={styles.container}>
      <Toast message={toastMsg} type={toastType} onClose={() => setToastMsg('')} />
      
      {/* Upper part: Department Selector */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem' }}>Departments</h2>
            <p style={{ color: '#6B7B8D', fontSize: '0.85rem' }}>Select a department stream to manage academic resources</p>
          </div>
          <button className="btn btn-primary" onClick={() => setIsDeptModalOpen(true)}>
            ➕ Create Department
          </button>
        </div>

        <div style={styles.deptGrid}>
          {departments.length === 0 ? (
            <p style={{ gridColumn: '1/-1', color: '#6B7B8D', fontSize: '0.9rem', textAlign: 'center', padding: '1rem' }}>
              No departments configured yet. Click 'Create Department' to add one.
            </p>
          ) : (
            departments.map(dept => (
              <div 
                key={dept._id} 
                style={{
                  ...styles.deptCard,
                  borderColor: selectedDept?._id === dept._id ? '#6366f1' : '#e2e8f0',
                  backgroundColor: selectedDept?._id === dept._id ? '#f5f7ff' : '#ffffff'
                }}
                onClick={() => selectDeptHandler(dept)}
              >
                <div style={styles.deptIcon}>🏢</div>
                <div>
                  <h3 style={{ fontSize: '1rem', margin: 0 }}>{dept.name}</h3>
                  <p style={{ fontSize: '0.75rem', color: '#6B7B8D' }}>HOD: {dept.headOfDepartment || 'N/A'}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Lower part: Active Department Manager Console */}
      {selectedDept ? (
        <div className="card">
          <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.3rem' }}>{selectedDept.name} Console</h2>
            <p style={{ color: '#6B7B8D', fontSize: '0.85rem' }}>{selectedDept.description || 'No description provided.'}</p>
          </div>

          {/* Console Tabs */}
          <div className="tabs-header">
            <button className={`tab-btn ${activeTab === 'students' ? 'active' : ''}`} onClick={() => { setActiveTab('students'); refreshDeptDetails(selectedDept._id); }}>
              👥 Department Students ({deptStudents.length})
            </button>
            <button className={`tab-btn ${activeTab === 'lectures' ? 'active' : ''}`} onClick={() => { setActiveTab('lectures'); fetchLectures(); }}>
              📚 Department Lectures
            </button>
            <button className={`tab-btn ${activeTab === 'assignments' ? 'active' : ''}`} onClick={() => { setActiveTab('assignments'); fetchAssignments(); }}>
              ✏️ Assignments
            </button>
            <button className={`tab-btn ${activeTab === 'exams' ? 'active' : ''}`} onClick={() => { setActiveTab('exams'); fetchExams(); }}>
              ⏱️ Exams & Proctoring
            </button>
            <button className={`tab-btn ${activeTab === 'attendance' ? 'active' : ''}`} onClick={() => { setActiveTab('attendance'); fetchAttendance(); }}>
              📅 Attendance Reports
            </button>
            <button className={`tab-btn ${activeTab === 'notifications' ? 'active' : ''}`} onClick={() => setActiveTab('notifications')}>
              📢 Announcements
            </button>
          </div>

          <div style={styles.tabContent}>
            {/* TAB: STUDENTS */}
            {activeTab === 'students' && (
              <div>
                <h3 style={styles.sectionTitle}>Enrolled Students</h3>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Academic ID</th>
                        <th>Name</th>
                        <th>Status</th>
                        <th>Registration Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deptStudents.length === 0 ? (
                        <tr>
                          <td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>No students enrolled in this department yet.</td>
                        </tr>
                      ) : (
                        deptStudents.map(student => (
                          <tr key={student._id}>
                            <td><strong>{student.academicId}</strong></td>
                            <td>{student.fullName}</td>
                            <td>
                              <span className={`badge badge-${student.status === 'Active' ? 'success' : 'danger'}`}>
                                {student.status}
                              </span>
                            </td>
                            <td>{new Date(student.createdAt).toLocaleDateString()}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB: LECTURES */}
            {activeTab === 'lectures' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={styles.sectionTitle}>Course Lectures</h3>
                  <button className="btn btn-primary" onClick={() => setIsLectureModalOpen(true)}>
                    ➕ Add Lecture
                  </button>
                </div>

                <div className="card-grid">
                  {deptLectures.length === 0 ? (
                    <p style={{ color: '#6B7B8D', fontSize: '0.9rem', padding: '1rem' }}>No lectures added yet for this department.</p>
                  ) : (
                    deptLectures.map(lecture => (
                      <div key={lecture._id} className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <span style={styles.lectureBadge}>Lecture #{lecture.lectureNumber}</span>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                            onClick={() => handleDeleteLecture(lecture._id)}
                          >
                            🗑️ Delete
                          </button>
                        </div>
                        <h4 style={{ margin: '0.5rem 0 0.25rem 0', fontSize: '1.1rem' }}>{lecture.courseName}</h4>
                        <p style={{ fontSize: '0.8rem', color: '#6B7B8D', marginBottom: '0.5rem' }}>Instructor: <strong>{lecture.instructor}</strong></p>
                        <p style={{ fontSize: '0.85rem', color: '#334155', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: '0.75rem' }}>
                          {lecture.pdfContent || 'No PDF content summary.'}
                        </p>
                        {lecture.youtubeLink && (
                          <div style={{ fontSize: '0.75rem', color: '#6366f1', marginBottom: '0.5rem' }}>
                            📺 YouTube Stream: <a href={lecture.youtubeLink} target="_blank" rel="noreferrer" style={{ color: 'inherit' }}>Link</a>
                          </div>
                        )}
                        {lecture.diagrams && lecture.diagrams.length > 0 && (
                          <div style={{ fontSize: '0.75rem', color: '#10b981' }}>
                            🖼️ Diagrams: {lecture.diagrams.length} uploaded
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB: ASSIGNMENTS */}
            {activeTab === 'assignments' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={styles.sectionTitle}>Department Assignments</h3>
                  <button className="btn btn-primary" onClick={() => setIsAssignmentModalOpen(true)} disabled={deptLectures.length === 0}>
                    ➕ Create Assignment
                  </button>
                </div>

                <div style={styles.assignmentsWrapper}>
                  {deptAssignments.length === 0 ? (
                    <p style={{ color: '#6B7B8D', fontSize: '0.9rem', padding: '1rem' }}>No assignments created yet.</p>
                  ) : (
                    deptAssignments.map(assign => (
                      <div key={assign._id} className="card" style={{ marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <h4 style={{ fontSize: '1.1rem', margin: '0 0 0.25rem 0' }}>{assign.title}</h4>
                            <p style={{ fontSize: '0.8rem', color: '#6B7B8D' }}>
                              Course: {assign.lectureId?.courseName} (Lec #{assign.lectureId?.lectureNumber}) | Due: {new Date(assign.dueDate).toLocaleDateString()}
                            </p>
                          </div>
                          <span className="badge badge-info">{assign.submissions?.length || 0} Submissions</span>
                        </div>
                        <p style={{ fontSize: '0.85rem', color: '#334155', margin: '0.75rem 0' }}>{assign.description}</p>
                        
                        {/* Submissions Section */}
                        {assign.submissions && assign.submissions.length > 0 && (
                          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem', marginTop: '0.75rem' }}>
                            <h5 style={{ fontSize: '0.85rem', marginBottom: '0.5rem', color: '#1A2A3A' }}>Submitted Student Files:</h5>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              {assign.submissions.map(sub => (
                                <div key={sub._id || sub.studentId} style={styles.submissionRow}>
                                  <span style={{ fontSize: '0.85rem' }}>
                                    🎓 Student ID: <strong>{sub.studentId?.academicId || 'Loading...'}</strong> 
                                    {sub.grade !== null && <span style={{ color: '#10b981', marginLeft: '0.5rem' }}>Grade: {sub.grade}/100</span>}
                                  </span>
                                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <a href={sub.fileUrl} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}>
                                      📄 View PDF
                                    </a>
                                    <button 
                                      className="btn btn-primary" 
                                      style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                                      onClick={() => {
                                        setActiveAssignment(assign);
                                        setActiveSubmission(sub);
                                        setAssignmentGrade(sub.grade || '');
                                        setIsGradeAssignmentModalOpen(true);
                                      }}
                                    >
                                      📝 Grade
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB: EXAMS */}
            {activeTab === 'exams' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={styles.sectionTitle}>Exam Schedules & Proctoring</h3>
                  <button className="btn btn-primary" onClick={() => { setExamQuestions([]); setIsExamModalOpen(true); }}>
                    ➕ Create Exam
                  </button>
                </div>

                <div style={styles.examsWrapper}>
                  {deptExams.length === 0 ? (
                    <p style={{ color: '#6B7B8D', fontSize: '0.9rem', padding: '1rem' }}>No exams scheduled yet.</p>
                  ) : (
                    deptExams.map(exam => (
                      <div key={exam._id} className="card" style={{ marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <h4 style={{ fontSize: '1.1rem', margin: '0 0 0.25rem 0' }}>{exam.courseName} Exam</h4>
                            <p style={{ fontSize: '0.8rem', color: '#6B7B8D' }}>
                              🗓️ {exam.date} @ {exam.time} | Duration: {exam.duration} mins | Questions: {exam.questions?.length}
                            </p>
                          </div>
                          <span className="badge badge-warning">{exam.results?.length || 0} Submissions</span>
                        </div>

                        {/* Proctoring Submissions */}
                        {exam.results && exam.results.length > 0 && (
                          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem', marginTop: '0.75rem' }}>
                            <h5 style={{ fontSize: '0.85rem', marginBottom: '0.5rem', color: '#1A2A3A' }}>Proctored Submissions:</h5>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              {exam.results.map(res => (
                                <div key={res._id || res.studentId} style={styles.submissionRow}>
                                  <span style={{ fontSize: '0.85rem' }}>
                                    🎓 Student ID: <strong>{res.studentId?.academicId || 'Loading...'}</strong> 
                                    <span style={{ marginLeft: '0.5rem' }} className={`badge badge-${res.status === 'graded' ? 'success' : 'warning'}`}>
                                      Score: {res.score} ({res.status})
                                    </span>
                                  </span>
                                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button 
                                      className="btn btn-secondary" 
                                      style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                                      onClick={() => {
                                        setActiveExam(exam);
                                        setActiveExamResult(res);
                                        setGradingQuestionIndex(0);
                                        setEssayGrade('');
                                        setEssayFeedback('');
                                        setIsGradeExamModalOpen(true);
                                      }}
                                    >
                                      🎥 View Proctor & Grade Essay
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB: ATTENDANCE */}
            {activeTab === 'attendance' && (
              <div>
                <h3 style={styles.sectionTitle}>Attendance Reports</h3>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Course</th>
                        <th>Lecture #</th>
                        <th>Instructor</th>
                        <th>Total Attendance</th>
                        <th>Student Log</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deptLectures.length === 0 ? (
                        <tr>
                          <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>No lectures available to check attendance.</td>
                        </tr>
                      ) : (
                        deptLectures.map(lecture => (
                          <tr key={lecture._id}>
                            <td>{lecture.courseName}</td>
                            <td>Lec #{lecture.lectureNumber}</td>
                            <td>{lecture.instructor}</td>
                            <td>
                              <span className="badge badge-success">
                                {lecture.attendance?.length || 0} marked
                              </span>
                            </td>
                            <td>
                              <div style={{ maxHeight: '80px', overflowY: 'auto', fontSize: '0.75rem' }}>
                                {lecture.attendance && lecture.attendance.length > 0 ? (
                                  lecture.attendance.map((att, idx) => (
                                    <div key={idx}>
                                      • Student ID: <strong>{att.studentId?.academicId || 'Loading...'}</strong> ({new Date(att.timestamp).toLocaleTimeString()})
                                    </div>
                                  ))
                                ) : (
                                  <span style={{ color: '#6B7B8D' }}>No student logs yet.</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB: ANNOUNCEMENTS */}
            {activeTab === 'notifications' && (
              <div style={{ maxWidth: '500px' }}>
                <h3 style={styles.sectionTitle}>Send Department Announcement</h3>
                <form onSubmit={handleSendAnnouncement}>
                  <div className="form-group">
                    <label>Announcement Title</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Midterm Exam Postponed"
                      value={annTitle}
                      onChange={(e) => setAnnTitle(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Announcement Description</label>
                    <textarea
                      className="form-control"
                      rows="4"
                      placeholder="Type details for all students enrolled in this department..."
                      value={annMessage}
                      onChange={(e) => setAnnMessage(e.target.value)}
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                    📢 Send Announcement (Socket.io Broadcast)
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: '#6B7B8D' }}>
          <span style={{ fontSize: '2.5rem' }}>🏢</span>
          <h3 style={{ marginTop: '1rem', color: '#1A2A3A' }}>Select Department Stream</h3>
          <p style={{ fontSize: '0.85rem' }}>Choose an active department above to view student lists, schedules, and proctoring videos.</p>
        </div>
      )}

      {/* MODAL: CREATE DEPARTMENT */}
      <Modal isOpen={isDeptModalOpen} onClose={() => setIsDeptModalOpen(false)} title="Create Department Stream">
        <form onSubmit={handleCreateDept}>
          <div className="form-group">
            <label>Department Name</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Computer Science Engineering"
              value={deptName}
              onChange={(e) => setDeptName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <input
              type="text"
              className="form-control"
              placeholder="Summary of streams"
              value={deptDesc}
              onChange={(e) => setDeptDesc(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Head of Department (HOD)</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Dr. Alan Turing"
              value={deptHead}
              onChange={(e) => setDeptHead(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsDeptModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Create Department</button>
          </div>
        </form>
      </Modal>

      {/* MODAL: ADD LECTURE */}
      <Modal isOpen={isLectureModalOpen} onClose={() => setIsLectureModalOpen(false)} title="Add Lecture">
        <form onSubmit={handleCreateLecture}>
          <div className="form-row">
            <div className="form-group">
              <label>Course Name</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Data Structures"
                value={lecCourse}
                onChange={(e) => setLecCourse(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Lecture Number</label>
              <input
                type="number"
                className="form-control"
                placeholder="e.g. 1"
                value={lecNum}
                onChange={(e) => setLecNum(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label>Instructor Name</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Prof. Donald Knuth"
              value={lecInstructor}
              onChange={(e) => setLecInstructor(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>YouTube Embed Link</label>
            <input
              type="url"
              className="form-control"
              placeholder="e.g. https://www.youtube.com/embed/dQw4w9WgXcQ"
              value={lecYoutube}
              onChange={(e) => setLecYoutube(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Lecture content summary</label>
            <textarea
              className="form-control"
              rows="3"
              placeholder="Short text summary"
              value={lecPdf}
              onChange={(e) => setLecPdf(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Diagrams / Support Images (multiple)</label>
            <input
              type="file"
              className="form-control"
              multiple
              accept="image/*"
              onChange={(e) => setLecDiagrams(Array.from(e.target.files))}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsLectureModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Add Lecture</button>
          </div>
        </form>
      </Modal>

      {/* MODAL: CREATE ASSIGNMENT */}
      <Modal isOpen={isAssignmentModalOpen} onClose={() => setIsAssignmentModalOpen(false)} title="Create Lecture Assignment">
        <form onSubmit={handleCreateAssignmentSubmit}>
          <div className="form-group">
            <label>Link to Lecture</label>
            <select 
              className="form-control"
              value={selectedLectureId}
              onChange={(e) => setSelectedLectureId(e.target.value)}
              required
            >
              <option value="">-- Choose Lecture --</option>
              {deptLectures.map(lec => (
                <option key={lec._id} value={lec._id}>Lec #{lec.lectureNumber} - {lec.courseName}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Assignment Title</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Linked List Implementation"
              value={assignTitle}
              onChange={(e) => setAssignTitle(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Description / Instructions</label>
            <textarea
              className="form-control"
              rows="3"
              placeholder="Provide assignment tasks details..."
              value={assignDesc}
              onChange={(e) => setAssignDesc(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Due Date</label>
            <input
              type="date"
              className="form-control"
              value={assignDueDate}
              onChange={(e) => setAssignDueDate(e.target.value)}
              required
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsAssignmentModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Create Assignment</button>
          </div>
        </form>
      </Modal>

      {/* MODAL: GRADE ASSIGNMENT SUBMISSION */}
      <Modal isOpen={isGradeAssignmentModalOpen} onClose={() => setIsGradeAssignmentModalOpen(false)} title="Grade Assignment Submission">
        {activeSubmission && (
          <form onSubmit={handleGradeAssignmentSubmit}>
            <p style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>
              Grading submission for Student ID: <strong>{activeSubmission.studentId?.academicId || 'Loading...'}</strong>
            </p>
            <div className="form-group">
              <label>Grade Score (0 - 100)</label>
              <input
                type="number"
                min="0"
                max="100"
                className="form-control"
                placeholder="e.g. 85"
                value={assignmentGrade}
                onChange={(e) => setAssignmentGrade(e.target.value)}
                required
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.5rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsGradeAssignmentModalOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Save Grade</button>
            </div>
          </form>
        )}
      </Modal>

      {/* MODAL: CREATE EXAM */}
      <Modal isOpen={isExamModalOpen} onClose={() => setIsExamModalOpen(false)} title="Create Exam Paper">
        <div style={{ maxHeight: '75vh', overflowY: 'auto', paddingRight: '0.5rem' }}>
          <div className="form-group">
            <label>Course Name</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Operating Systems"
              value={examCourse}
              onChange={(e) => setExamCourse(e.target.value)}
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Date (e.g. Day/Date)</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Friday, 2026-07-24"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Time</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. 02:00 PM"
                value={examTime}
                onChange={(e) => setExamTime(e.target.value)}
              />
            </div>
          </div>
          <div className="form-group">
            <label>Duration (Minutes)</label>
            <input
              type="number"
              className="form-control"
              placeholder="e.g. 60"
              value={examDuration}
              onChange={(e) => setExamDuration(e.target.value)}
            />
          </div>

          <div style={{ borderTop: '1px solid #e2e8f0', marginTop: '1rem', paddingTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h4 style={{ fontSize: '0.95rem' }}>Questions ({examQuestions.length})</h4>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }} onClick={() => addQuestionBuilder('mcq')}>
                  ➕ Add MCQ
                </button>
                <button type="button" className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }} onClick={() => addQuestionBuilder('essay')}>
                  ➕ Add Essay
                </button>
              </div>
            </div>

            {examQuestions.map((q, idx) => (
              <div key={idx} style={styles.questionBuilderCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <strong>Q{idx + 1} ({q.type.toUpperCase()})</strong>
                  <button type="button" style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer' }} onClick={() => removeQuestionBuilder(idx)}>Remove</button>
                </div>
                <div className="form-group">
                  <label>Question Text</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Type question here..."
                    value={q.questionText}
                    onChange={(e) => updateQuestionField(idx, 'questionText', e.target.value)}
                  />
                </div>
                {q.type === 'mcq' && (
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Options (4 required)</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', margin: '0.25rem 0' }}>
                      {[0, 1, 2, 3].map(optIdx => (
                        <input
                          key={optIdx}
                          type="text"
                          className="form-control"
                          placeholder={`Option ${optIdx + 1}`}
                          value={q.options[optIdx] || ''}
                          onChange={(e) => {
                            const newOpts = [...q.options];
                            newOpts[optIdx] = e.target.value;
                            updateQuestionField(idx, 'options', newOpts);
                          }}
                        />
                      ))}
                    </div>
                    <div className="form-group" style={{ marginTop: '0.5rem' }}>
                      <label>Correct Option Text (Must match one option exactly)</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Type exact correct option text"
                        value={q.correctAnswer}
                        onChange={(e) => updateQuestionField(idx, 'correctAnswer', e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsExamModalOpen(false)}>Cancel</button>
            <button type="button" className="btn btn-primary" onClick={handleCreateExamSubmit}>Save Exam Schedule</button>
          </div>
        </div>
      </Modal>

      {/* MODAL: VIEW PROCTORING & GRADE ESSAY */}
      <Modal isOpen={isGradeExamModalOpen} onClose={() => setIsGradeExamModalOpen(false)} title="Proctoring Review & Manual Essay Grading">
        {activeExamResult && activeExam && (
          <div style={{ maxHeight: '75vh', overflowY: 'auto' }}>
            <p style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>
              Reviewing Student ID: <strong>{activeExamResult.studentId?.academicId || 'Loading...'}</strong> | Score: <strong>{activeExamResult.score}</strong>
            </p>

            {/* Recorded Proctoring Media Player */}
            <h4 style={{ fontSize: '0.95rem', marginBottom: '0.5rem' }}>🎥 Recorded Proctoring Streams</h4>
            <div className="proctoring-box" style={{ marginBottom: '1.5rem' }}>
              <div className="camera-preview">
                <span className="proctor-badge">🔴 CAM REC</span>
                {activeExamResult.cameraRecording ? (
                  <video src={activeExamResult.cameraRecording} controls style={{ width: '100%', height: '100%' }} />
                ) : (
                  <div style={styles.noMediaText}>No camera proctoring file available.</div>
                )}
              </div>
              
              <div className="screen-preview">
                <span className="proctor-badge">🖥️ SCREEN REC</span>
                {activeExamResult.screenRecording ? (
                  <video src={activeExamResult.screenRecording} controls style={{ width: '100%', height: '100%' }} />
                ) : (
                  <div style={styles.noMediaText}>No screen recording file available.</div>
                )}
              </div>
            </div>

            {/* Questions Grading List */}
            <h4 style={{ fontSize: '0.95rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>✍️ Student Answers & Essay Grading</h4>
            {activeExam.questions.map((q, idx) => (
              <div key={idx} style={{ padding: '0.75rem', borderRadius: '8px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', marginBottom: '1rem' }}>
                <p style={{ fontSize: '0.9rem' }}><strong>Q{idx + 1}: {q.questionText}</strong> <span style={{ fontSize: '0.75rem', color: '#6B7B8D' }}>({q.type.toUpperCase()})</span></p>
                <p style={{ fontSize: '0.85rem', color: '#334155', margin: '0.5rem 0', padding: '0.5rem', backgroundColor: '#ffffff', borderRadius: '4px', borderLeft: '3px solid #6366f1' }}>
                  Student Answer: <strong>{activeExamResult.answers[idx] || '[No Answer Submitted]'}</strong>
                </p>
                {q.type === 'mcq' ? (
                  <p style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 600 }}>
                    Auto-Graded. Correct Answer: {q.correctAnswer}
                  </p>
                ) : (
                  <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px dotted #cbd5e1' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <input 
                        type="number"
                        placeholder="Score (0-10)"
                        className="form-control"
                        style={{ maxWidth: '120px' }}
                        value={gradingQuestionIndex === idx ? essayGrade : (activeExamResult.essayGrades?.find(g => g.questionIndex === idx)?.grade || '')}
                        onChange={(e) => {
                          setGradingQuestionIndex(idx);
                          setEssayGrade(e.target.value);
                        }}
                      />
                      <input 
                        type="text"
                        placeholder="Feedback"
                        className="form-control"
                        value={gradingQuestionIndex === idx ? essayFeedback : (activeExamResult.essayGrades?.find(g => g.questionIndex === idx)?.feedback || '')}
                        onChange={(e) => {
                          setGradingQuestionIndex(idx);
                          setEssayFeedback(e.target.value);
                        }}
                      />
                      <button 
                        type="button" 
                        className="btn btn-primary"
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                        onClick={() => handleGradeEssaySubmit(idx)}
                      >
                        Grade Q{idx + 1}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsGradeExamModalOpen(false)}>Close Reviewer</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  deptGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: '1rem',
    marginTop: '1.25rem'
  },
  deptCard: {
    border: '2px solid #e2e8f0',
    borderRadius: '10px',
    padding: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  deptIcon: {
    fontSize: '1.5rem',
    background: '#e0e7ff',
    width: '42px',
    height: '42px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  tabContent: {
    marginTop: '1rem'
  },
  sectionTitle: {
    fontSize: '1.15rem',
    fontWeight: '700',
    marginBottom: '1rem',
    color: '#1A2A3A'
  },
  lectureBadge: {
    backgroundColor: '#e0e7ff',
    color: '#6366f1',
    padding: '0.2rem 0.5rem',
    borderRadius: '4px',
    fontSize: '0.75rem',
    fontWeight: '700'
  },
  submissionRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: '0.5rem 0.75rem',
    borderRadius: '6px',
    border: '1px solid #e2e8f0'
  },
  questionBuilderCard: {
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    padding: '1rem',
    marginBottom: '1rem',
    backgroundColor: '#f8fafc'
  },
  noMediaText: {
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.8rem',
    color: '#94a3b8',
    textAlign: 'center',
    padding: '1rem'
  }
};

export default Departments;
