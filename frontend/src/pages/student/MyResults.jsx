import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const MyResults = () => {
  const { token } = useAuth();
  const [results, setResults] = useState(null);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const res = await fetch('/api/student/results', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) setResults(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchResults();
  }, [token]);

  return (
    <div>
      <div className="action-bar">
        <div>
          <h2>My Results Profile</h2>
          <p style={{ color: '#6B7B8D', fontSize: '0.85rem' }}>View GPA summaries and subject letter grades</p>
        </div>
      </div>

      {results ? (
        <div>
          <div style={styles.statsRow}>
            <div className="card" style={styles.statCard}>
              <span style={{ fontSize: '0.8rem', color: '#6B7B8D' }}>Semester GPA</span>
              <h3 style={{ fontSize: '2.5rem', color: '#6366f1', margin: '0.2rem 0' }}>{results.gpa}</h3>
              <p style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>Grade Status: Satisfactory</p>
            </div>
            
            <div className="card" style={styles.statCard}>
              <span style={{ fontSize: '0.8rem', color: '#6B7B8D' }}>Cumulative CGPA</span>
              <h3 style={{ fontSize: '2.5rem', color: '#6366f1', margin: '0.2rem 0' }}>{results.cgpa}</h3>
              <p style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>Enrollment Status: Active</p>
            </div>
          </div>

          <h3 style={{ margin: '1.5rem 0 0.5rem 0', fontSize: '1.1rem' }}>Subject Grades Summary</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Course Title</th>
                  <th>Raw Score</th>
                  <th>Percentage</th>
                  <th>Letter Grade</th>
                  <th>Grade Points (GP)</th>
                </tr>
              </thead>
              <tbody>
                {results.grades?.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>No exam scorecards recorded for this semester yet.</td>
                  </tr>
                ) : (
                  results.grades?.map((record, index) => (
                    <tr key={index}>
                      <td><strong>{record.subject}</strong></td>
                      <td>{record.score} Points</td>
                      <td>{record.percentage}%</td>
                      <td>
                        <span className={`badge badge-${record.grade === 'F' ? 'danger' : 'success'}`} style={{ fontSize: '0.8rem' }}>
                          {record.grade}
                        </span>
                      </td>
                      <td><strong>{record.gp.toFixed(1)}</strong></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: '#6B7B8D' }}>
          Loading results card...
        </div>
      )}
    </div>
  );
};

const styles = {
  statsRow: {
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap'
  },
  statCard: {
    flex: 1,
    minWidth: '220px',
    textAlign: 'center'
  }
};

export default MyResults;
