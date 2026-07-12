import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Toast from '../../components/Toast';

const LectureProgram = ({ setCurrentTab }) => {
  const { token, user } = useAuth();
  const [lectures, setLectures] = useState([]);
  const [selectedLecture, setSelectedLecture] = useState(null);

  // Toast
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState('success');
  const [submitting, setSubmitting] = useState(false);

  const showToast = (msg, type = 'success') => {
    setToastMsg(msg);
    setToastType(type);
  };

  const fetchLectures = async () => {
    try {
      const res = await fetch('/api/student/lectures', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setLectures(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchLectures();
  }, [token]);

  const handleMarkAttendance = async (lectureId) => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/student/lectures/${lectureId}/attendance`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Attendance recorded! Unlocking lecture materials.', 'success');
        // Fetch refreshed lecture list
        await fetchLectures();
        // Set active lecture
        const lectureObj = data.lecture || lectures.find(l => l._id === lectureId);
        setSelectedLecture(lectureObj);
      } else {
        showToast(data.message || 'Verification failed', 'error');
      }
    } catch (err) {
      showToast('Error marking attendance', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const isAttendanceMarked = (lecture) => {
    if (!lecture.attendance || !user.studentProfile) return false;
    return lecture.attendance.some(
      record => record.studentId?._id?.toString() === user.studentProfile._id.toString() ||
                record.studentId?.toString() === user.studentProfile._id.toString()
    );
  };

  // Convert YouTube links into embed urls
  const getYoutubeEmbed = (url) => {
    if (!url) return '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : url;
  };

  if (selectedLecture) {
    return (
      <div>
        <Toast message={toastMsg} type={toastType} onClose={() => setToastMsg('')} />
        
        <div style={{ marginBottom: '1rem' }}>
          <button className="btn btn-secondary" onClick={() => setSelectedLecture(null)}>
            ⬅️ Back to Lecture Program
          </button>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <span className="badge badge-success">Lecture #{selectedLecture.lectureNumber}</span>
              <h2 style={{ fontSize: '1.4rem', margin: '0.25rem 0' }}>{selectedLecture.courseName}</h2>
              <p style={{ color: '#6B7B8D', fontSize: '0.85rem' }}>Instructor: <strong>{selectedLecture.instructor}</strong></p>
            </div>
            <div style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem', fontWeight: '700' }}>
              ✓ Attendance Verified
            </div>
          </div>

          {/* YouTube Video Section */}
          {selectedLecture.youtubeLink && (
            <div style={styles.videoWrapper}>
              <iframe
                src={getYoutubeEmbed(selectedLecture.youtubeLink)}
                title="Lecture Video"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={styles.iframe}
              />
            </div>
          )}

          {/* Text/PDF Section */}
          <div style={{ marginTop: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>📘 Lecture Materials & Notes</h3>
            <p style={{ fontSize: '0.9rem', color: '#334155', backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', whiteSpace: 'pre-wrap' }}>
              {selectedLecture.pdfContent || 'No written summaries provided.'}
            </p>
          </div>

          {/* Diagrams Gallery */}
          {selectedLecture.diagrams && selectedLecture.diagrams.length > 0 && (
            <div style={{ marginTop: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>🖼️ Supporting Diagrams</h3>
              <div style={styles.diagramGrid}>
                {selectedLecture.diagrams.map((diag, index) => (
                  <img 
                    key={index} 
                    src={diag} 
                    alt={`Diagram ${index + 1}`} 
                    style={styles.diagramImg} 
                  />
                ))}
              </div>
            </div>
          )}

          {/* Connected Assignment Link */}
          {selectedLecture.assignmentId && (
            <div style={styles.assignmentBanner}>
              <div>
                <h4 style={{ color: '#1e1b4b', margin: 0 }}>✏️ Associated Lecture Assignment Available</h4>
                <p style={{ fontSize: '0.8rem', color: '#4338ca', margin: '0.2rem 0 0 0' }}>Review guidelines and submit PDF responses</p>
              </div>
              <button className="btn btn-primary" onClick={() => setCurrentTab('assignments')}>
                Go to Assignments
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
          <h2>My Lecture Program</h2>
          <p style={{ color: '#6B7B8D', fontSize: '0.85rem' }}>Select course to verify attendance and access learning materials</p>
        </div>
      </div>

      <div className="card-grid">
        {lectures.length === 0 ? (
          <div className="card" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: '#6B7B8D' }}>
            No lectures scheduled for your department stream at this time.
          </div>
        ) : (
          lectures.map(lecture => {
            const marked = isAttendanceMarked(lecture);
            return (
              <div key={lecture._id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={styles.badge}>Lecture #{lecture.lectureNumber}</span>
                  {marked && <span className="badge badge-success">Attended</span>}
                </div>
                <h4 style={{ margin: '0.75rem 0 0.25rem 0', fontSize: '1.15rem' }}>{lecture.courseName}</h4>
                <p style={{ fontSize: '0.8rem', color: '#6B7B8D', marginBottom: '1rem' }}>Instructor: {lecture.instructor}</p>
                
                {marked ? (
                  <button 
                    className="btn btn-secondary" 
                    style={{ width: '100%', justifyContent: 'center' }}
                    onClick={() => setSelectedLecture(lecture)}
                  >
                    📖 View Lecture Materials
                  </button>
                ) : (
                  <button 
                    className="btn btn-primary" 
                    style={{ width: '100%', justifyContent: 'center' }}
                    onClick={() => handleMarkAttendance(lecture._id)}
                    disabled={submitting}
                  >
                    📝 Mark Attendance & Unlock
                  </button>
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
  badge: {
    backgroundColor: '#e0e7ff',
    color: '#6366f1',
    padding: '0.2rem 0.5rem',
    borderRadius: '4px',
    fontSize: '0.75rem',
    fontWeight: '700'
  },
  videoWrapper: {
    width: '100%',
    aspectRatio: '16/9',
    borderRadius: '12px',
    overflow: 'hidden',
    border: '1px solid #cbd5e1',
    backgroundColor: '#000000'
  },
  iframe: {
    width: '100%',
    height: '100%'
  },
  diagramGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '1rem',
    marginTop: '0.5rem'
  },
  diagramImg: {
    width: '100%',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    objectFit: 'cover'
  },
  assignmentBanner: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#e0e7ff',
    padding: '1rem',
    borderRadius: '8px',
    marginTop: '1.5rem',
    border: '1px solid #c7d2fe',
    flexWrap: 'wrap',
    gap: '1rem'
  }
};

export default LectureProgram;
