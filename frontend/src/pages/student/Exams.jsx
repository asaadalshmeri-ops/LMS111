import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import Toast from '../../components/Toast';

const Exams = () => {
  const { token, user } = useAuth();
  const [exams, setExams] = useState([]);
  const [activeExam, setActiveExam] = useState(null);
  
  // Navigation tabs inside portal
  const [examTab, setExamTab] = useState('schedule'); // schedule, results
  
  // Exam taking state
  const [answers, setAnswers] = useState([]);
  const [examSubmitted, setExamSubmitted] = useState(false);
  const [autoGradeResult, setAutoGradeResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Proctoring streams refs
  const videoRef = useRef(null);
  const [mediaAccess, setMediaAccess] = useState(false);
  const [streamError, setStreamError] = useState('');
  
  // MediaRecorder state
  const camStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const camRecorderRef = useRef(null);
  const screenRecorderRef = useRef(null);
  const camChunks = useRef([]);
  const screenChunks = useRef([]);

  // Toast
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState('success');

  const showToast = (msg, type = 'success') => {
    setToastMsg(msg);
    setToastType(type);
  };

  const fetchExams = async () => {
    try {
      const res = await fetch('/api/student/exams', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setExams(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchExams();
  }, [token]);

  const hasTakenExam = (exam) => {
    if (!user.studentProfile) return false;
    return exam.results?.some(
      res => res.studentId?._id?.toString() === user.studentProfile._id.toString() ||
             res.studentId?.toString() === user.studentProfile._id.toString()
    );
  };

  const getExamResult = (exam) => {
    if (!user.studentProfile) return null;
    return exam.results?.find(
      res => res.studentId?._id?.toString() === user.studentProfile._id.toString() ||
             res.studentId?.toString() === user.studentProfile._id.toString()
    );
  };

  // --- PROCTORING MEDIA STREAM STARTER ---
  const startProctoringStreams = async () => {
    setStreamError('');
    camChunks.current = [];
    screenChunks.current = [];

    try {
      // 1. Request Webcam access
      const camStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: true
      });
      camStreamRef.current = camStream;
      
      // Feed camera stream to preview box
      if (videoRef.current) {
        videoRef.current.srcObject = camStream;
      }

      // 2. Request Screen capture access
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true
      });
      screenStreamRef.current = screenStream;

      // 3. Initialize recorders
      const camRecorder = new MediaRecorder(camStream, { mimeType: 'video/webm' });
      camRecorderRef.current = camRecorder;
      camRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) camChunks.current.push(e.data);
      };
      camRecorder.start();

      const screenRecorder = new MediaRecorder(screenStream, { mimeType: 'video/webm' });
      screenRecorderRef.current = screenRecorder;
      screenRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) screenChunks.current.push(e.data);
      };
      screenRecorder.start();

      // Set proctoring triggers
      setMediaAccess(true);
      showToast('Camera and Screen sharing active. Proctoring live stream engaged.', 'success');

      // Listen for screen sharing cancellation by student
      screenStream.getVideoTracks()[0].onended = () => {
        showToast('WARNING: Screen sharing was cancelled. You must share screen to take the exam.', 'error');
        stopAllProctoringStreams();
        setMediaAccess(false);
      };

    } catch (err) {
      console.error('Proctoring access error:', err);
      setStreamError('Permission to webcam and screen recording is strictly required to enter this exam.');
      showToast('Webcam/Screen capture permissions denied.', 'error');
      stopAllProctoringStreams();
    }
  };

  const stopAllProctoringStreams = () => {
    if (camStreamRef.current) {
      camStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
    }
    camStreamRef.current = null;
    screenStreamRef.current = null;
  };

  // --- ACTIONS ---

  const handleEnterExam = async (exam) => {
    setActiveExam(exam);
    setAnswers(new Array(exam.questions.length).fill(''));
    setExamSubmitted(false);
    setAutoGradeResult(null);
    
    // Start webcam proctoring
    setTimeout(() => {
      startProctoringStreams();
    }, 100);
  };

  const handleAnswerChange = (questionIdx, val) => {
    setAnswers(prev => {
      const next = [...prev];
      next[questionIdx] = val;
      return next;
    });
  };

  const handleExamSubmit = async (e) => {
    e.preventDefault();
    if (!mediaAccess) {
      return showToast('Proctoring streams are inactive. Re-grant camera/screen permissions.', 'error');
    }

    if (!window.confirm('Are you ready to submit your exam? Proctoring files will upload automatically.')) return;

    setSubmitting(true);
    showToast('Stopping streams and compiling proctoring files. Please wait...', 'info');

    try {
      // 1. Stop recorders to finalize blobs
      if (camRecorderRef.current && camRecorderRef.current.state !== 'inactive') {
        camRecorderRef.current.stop();
      }
      if (screenRecorderRef.current && screenRecorderRef.current.state !== 'inactive') {
        screenRecorderRef.current.stop();
      }

      // Wait a moment for recording to finalize chunks
      await new Promise(resolve => setTimeout(resolve, 800));

      stopAllProctoringStreams();

      // 2. Build recording blobs
      const camBlob = new Blob(camChunks.current, { type: 'video/webm' });
      const screenBlob = new Blob(screenChunks.current, { type: 'video/webm' });

      // 3. Construct FormData upload
      const formData = new FormData();
      formData.append('answers', JSON.stringify(answers));
      formData.append('cameraRecording', camBlob, 'webcam-proctor.webm');
      formData.append('screenRecording', screenBlob, 'screen-proctor.webm');

      // 4. Send API POST request
      const res = await fetch(`/api/student/exams/${activeExam._id}/submit`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const data = await res.json();

      if (res.ok) {
        showToast('Exam submitted successfully!', 'success');
        setExamSubmitted(true);
        setAutoGradeResult(data.score); // Displays MCQ auto-grade score instantly
        fetchExams();
      } else {
        showToast(data.message || 'Submission failed', 'error');
      }

    } catch (err) {
      console.error(err);
      showToast('Error uploading exam recordings', 'error');
    } finally {
      setSubmitting(false);
      setMediaAccess(false);
    }
  };

  const exitExamWindow = () => {
    stopAllProctoringStreams();
    setActiveExam(null);
    setMediaAccess(false);
    setStreamError('');
  };

  // --- RENDERS ---

  if (activeExam) {
    return (
      <div>
        <Toast message={toastMsg} type={toastType} onClose={() => setToastMsg('')} />
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
          <button className="btn btn-secondary" onClick={exitExamWindow} disabled={submitting}>
            🚪 Exit Exam (No Save)
          </button>
          <div className="live-indicator">
            <span className="live-dot" />
            <span style={{ color: '#ef4444' }}>PROCTORING SESSION ACTIVE</span>
          </div>
        </div>

        {/* Proctoring camera view box */}
        {!examSubmitted && (
          <div className="proctoring-box">
            <div className="camera-preview" style={{ maxWidth: '240px' }}>
              <span className="proctor-badge">🔴 PROCTOR CAMERA</span>
              <video ref={videoRef} autoPlay playsInline muted />
              {!mediaAccess && (
                <div style={styles.proctorPlaceholder}>
                  {streamError ? (
                    <span style={{ color: 'red', fontSize: '0.75rem', padding: '0.5rem' }}>{streamError}</span>
                  ) : (
                    <span>Initializing camera...</span>
                  )}
                </div>
              )}
            </div>
            <div style={{ flex: 1, color: '#94a3b8', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <h4 style={{ color: 'white', margin: 0 }}>Active Session: {activeExam.courseName} Examination</h4>
              <p style={{ fontSize: '0.8rem', marginTop: '0.2rem' }}>
                Screen activity and webcam feeds are recorded concurrently. Do not navigate away from the page or close screen sharing, otherwise your session will be suspended.
              </p>
            </div>
          </div>
        )}

        <div className="card">
          {!examSubmitted ? (
            <form onSubmit={handleExamSubmit}>
              <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
                <h2 style={{ fontSize: '1.25rem' }}>{activeExam.courseName} Exam Sheet</h2>
                <p style={{ color: '#6B7B8D', fontSize: '0.8rem' }}>Duration: {activeExam.duration} Minutes | Instructions: Read all questions carefully.</p>
              </div>

              {activeExam.questions.map((q, idx) => (
                <div key={idx} style={styles.questionCard}>
                  <p style={{ fontWeight: 600 }}>Question {idx + 1}: {q.questionText}</p>
                  
                  {q.type === 'mcq' ? (
                    <div style={styles.optionsList}>
                      {q.options.map((option, optIdx) => (
                        <label key={optIdx} style={styles.optionLabel}>
                          <input
                            type="radio"
                            name={`q-${idx}`}
                            value={option}
                            checked={answers[idx] === option}
                            onChange={() => handleAnswerChange(idx, option)}
                            required
                          />
                          <span>{option}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <textarea
                      className="form-control"
                      rows="5"
                      placeholder="Type your essay response here..."
                      value={answers[idx] || ''}
                      onChange={(e) => handleAnswerChange(idx, e.target.value)}
                      required
                      style={{ marginTop: '0.5rem' }}
                    />
                  )}
                </div>
              ))}

              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: '100%', padding: '0.8rem', justifyContent: 'center', marginTop: '1.5rem' }}
                disabled={submitting || !mediaAccess}
              >
                {submitting ? 'Compiling Video Streams & Uploading...' : 'Submit Answers'}
              </button>
            </form>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
              <span style={{ fontSize: '3rem' }}>🎉</span>
              <h2 style={{ marginTop: '1rem', color: '#1A2A3A' }}>Exam Paper Submitted!</h2>
              <p style={{ color: '#6B7B8D', fontSize: '0.85rem', maxWidth: '500px', margin: '0.5rem auto 1.5rem auto' }}>
                Your exam answers and proctoring videos have been successfully saved to the university database.
              </p>

              <div style={styles.scoreContainer}>
                <p style={{ fontSize: '0.9rem', color: '#475569', margin: 0 }}>MCQ Questions Auto-Graded Score:</p>
                <h3 style={{ fontSize: '2.5rem', color: '#6366f1', marginTop: '0.2rem' }}>{autoGradeResult} Points</h3>
                <small style={{ color: '#6B7B8D' }}>Essay questions are pending manual review by the department professor.</small>
              </div>

              <button className="btn btn-secondary" onClick={() => setActiveExam(null)} style={{ marginTop: '1.5rem' }}>
                Go back to Exam Portal
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <Toast message={toastMsg} type={toastType} onClose={() => setToastMsg('')} />

      <div className="action-bar">
        <div>
          <h2>Exams & Proctoring Portal</h2>
          <p style={{ color: '#6B7B8D', fontSize: '0.85rem' }}>View upcoming exams and start examination sessions</p>
        </div>
        <div className="tabs-header" style={{ marginBottom: 0 }}>
          <button className={`tab-btn ${examTab === 'schedule' ? 'active' : ''}`} onClick={() => setExamTab('schedule')}>
            🗓️ Exam Schedule ({exams.filter(e => !hasTakenExam(e)).length})
          </button>
          <button className={`tab-btn ${examTab === 'results' ? 'active' : ''}`} onClick={() => setExamTab('results')}>
            🏅 Past Exam Results
          </button>
        </div>
      </div>

      {examTab === 'schedule' ? (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Course Name</th>
                <th>Exam Date</th>
                <th>Time</th>
                <th>Duration</th>
                <th>Questions</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {exams.filter(e => !hasTakenExam(e)).length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '3rem' }}>No upcoming exams scheduled. Good job!</td>
                </tr>
              ) : (
                exams.filter(e => !hasTakenExam(e)).map(exam => (
                  <tr key={exam._id}>
                    <td><strong>{exam.courseName}</strong></td>
                    <td>{exam.date}</td>
                    <td>{exam.time}</td>
                    <td>{exam.duration} Minutes</td>
                    <td>{exam.questions?.length} Questions</td>
                    <td>
                      <button className="btn btn-primary" onClick={() => handleEnterExam(exam)}>
                        ✍️ Enter Exam
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Course Name</th>
                <th>Date Taken</th>
                <th>Status</th>
                <th>Auto-Graded MCQ / Essay Score</th>
              </tr>
            </thead>
            <tbody>
              {exams.filter(e => hasTakenExam(e)).length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '3rem' }}>No exam results logged yet.</td>
                </tr>
              ) : (
                exams.filter(e => hasTakenExam(e)).map(exam => {
                  const result = getExamResult(exam);
                  return (
                    <tr key={exam._id}>
                      <td><strong>{exam.courseName}</strong></td>
                      <td>{new Date(result.submittedAt).toLocaleDateString()}</td>
                      <td>
                        <span className={`badge badge-${result.status === 'graded' ? 'success' : 'warning'}`}>
                          {result.status.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <strong>{result.score} Points</strong>
                        <div style={{ fontSize: '0.75rem', color: '#6B7B8D' }}>
                          {result.status === 'pending_review' ? 'Waiting on professor to grade essay portion.' : 'Final scorecard published.'}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const styles = {
  proctorPlaceholder: {
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#94a3b8',
    fontSize: '0.8rem',
    textAlign: 'center',
    backgroundColor: '#1f2937'
  },
  questionCard: {
    padding: '1.25rem',
    borderRadius: '8px',
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    marginBottom: '1.25rem'
  },
  optionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    marginTop: '0.75rem'
  },
  optionLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.9rem',
    cursor: 'pointer',
    padding: '0.5rem',
    borderRadius: '4px',
    border: '1px solid #cbd5e1',
    backgroundColor: '#ffffff'
  },
  scoreContainer: {
    padding: '1.5rem',
    borderRadius: '12px',
    backgroundColor: '#f5f7ff',
    border: '1px solid #c7d2fe',
    display: 'inline-block',
    margin: '1rem 0'
  }
};

export default Exams;
