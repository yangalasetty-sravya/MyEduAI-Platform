import React, { useState, useEffect } from 'react';
import Card from '../../components/common/Card';

// ✅ ADDED: Styles for this component, using theme variables
const assessmentsPageStyles = `
  .assessments-container {
    animation: fadeIn 0.5s ease-out;
  }
  .assessments-list {
    list-style: none;
    padding: 0;
    margin: 0;
    /* Uses the theme's border color for the dividers */
    divide-y: 1px solid var(--border-color); 
  }
  .assessment-item {
    padding: 1rem 0.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--border-color);
  }
  .assessment-item:last-child {
    border-bottom: none;
  }
  .item-title {
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--text-primary);
  }
  .item-date {
    font-size: 0.875rem;
    color: var(--text-secondary);
  }
  .item-score {
    font-size: 1.75rem;
    font-weight: 700;
  }
  .item-score-label {
    font-size: 0.75rem;
    color: var(--text-secondary);
    text-align: right;
  }
`;

const Assessments = () => {
  const [assessments, setAssessments] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAssessments = async () => {
      const simulatedData = [
        { id: 1, title: 'Initial Skills Assessment', date: '2023-10-25', score: 85 },
        { id: 2, title: 'React Basics Quiz', date: '2023-11-10', score: 92 },
        { id: 3, title: 'Hooks Challenge', date: '2023-11-20', score: 78 },
      ];
      setAssessments(simulatedData);
      setLoading(false);
    };
    fetchAssessments();
  }, []);

  // ✅ CHANGED: Function now returns hex codes for inline styling
  const getScoreColor = (score) => {
    if (score >= 85) return '#4ade80'; // Green
    if (score >= 70) return '#facc15'; // Yellow
    return '#f87171'; // Red
  };

  if (loading) {
    return <Card>Loading assessment results...</Card>;
  }

  return (
    // ✅ CHANGED: JSX now uses semantic class names instead of Tailwind
    <>
      <style>{assessmentsPageStyles}</style>
      <div className="assessments-container">
        <h2 className="page-header">My Assessments</h2>
        <Card>
          <ul className="assessments-list">
            {assessments.map((assessment) => (
              <li key={assessment.id} className="assessment-item">
                <div>
                  <h3 className="item-title">{assessment.title}</h3>
                  <p className="item-date">Completed on: {assessment.date}</p>
                </div>
                <div className="text-right">
                  <p className="item-score" style={{ color: getScoreColor(assessment.score) }}>
                    {assessment.score}%
                  </p>
                  <p className="item-score-label">Score</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
};

export default Assessments;