import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

// Enhanced animation styles, now including a placeholder style
const AnimationStyles = () => (
  <style>
    {`
      @keyframes fadeIn {
        from { opacity: 0; transform: scale(0.98); }
        to { opacity: 1; transform: scale(1); }
      }
      @keyframes slideInUp {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      /* --- INTERACTIVE STYLES --- */
      .action-button:hover:not(:disabled) {
        transform: translateY(-3px);
        box-shadow: 0 10px 20px rgba(0, 0, 0, 0.25);
      }
      .secondary-button:hover:not(:disabled) {
        background-color: rgba(255, 255, 255, 0.08);
      }
      .form-textarea:focus {
        border-color: #667eea;
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.3);
        outline: none;
      }
      /* New style for placeholder text */
      .form-textarea::placeholder {
        color: #A0AEC0;
        opacity: 1; /* Override browser defaults */
      }
    `}
  </style>
);

// A reusable loading spinner component
const LoadingSpinner = ({ size = '24px', color = '#ffffff' }) => (
  <div style={{ ...styles.spinner, width: size, height: size, borderTopColor: color }}></div>
);

const AvailabilityFormPage = ({ user, onSetupComplete }) => {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  // State to track the current question
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/volunteers/generate-availability-form', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uid: user?.uid, email: user?.email, name: user?.name || '',
          }),
        });
        const data = await res.json();
        if (data.questions && Array.isArray(data.questions)) {
          setQuestions(data.questions);
        } else {
          setMessage('No availability questions received from the server.');
        }
      } catch (err) {
        console.error('Error fetching availability form:', err);
        setMessage('Failed to load the availability form. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    if (user?.role === 'volunteer') fetchQuestions();
    else {
      setIsLoading(false);
      setMessage("This form is for volunteers only.");
    }
  }, [user]);

  // --- Handlers ---
  const handleChange = (index, value) => {
    setAnswers((prev) => ({ ...prev, [index]: value }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        availabilityForm: answers, setupComplete: true,
        volunteerAssessmentComplete: true
      });
      if (onSetupComplete) {
        onSetupComplete({ ...user, setupComplete: true });
      }
      navigate('/volunteer-dashboard');
    } catch (err) {
      console.error('Submission failed:', err);
      setMessage('Submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // --- Render Logic ---
  if (!user) {
    return (
        <div style={styles.container}>
            <div style={styles.formContainer}><LoadingSpinner size="40px" /></div>
        </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <>
      <AnimationStyles />
      <div style={styles.container}>
        <form onSubmit={handleSubmit} style={styles.formContainer}>
          <h2 style={styles.header}>Complete Your Profile</h2>
          <p style={styles.subHeader}>Just a few final questions to get you set up.</p>

          {isLoading ? (
            <div style={{ padding: '50px 0', textAlign: 'center' }}>
              <LoadingSpinner size="40px" />
              <p style={{ marginTop: '15px', color: '#A0AEC0' }}>Generating Your Form...</p>
            </div>
          ) : currentQuestion ? (
            <>
              {/* Add key to re-trigger animation on question change */}
              <div key={currentQuestionIndex} style={{ animation: `slideInUp 0.5s ease-out` }}>
                  <div style={styles.questionCard}>
                    <label htmlFor={`q-${currentQuestionIndex}`} style={styles.questionText}>
                      {currentQuestionIndex + 1}. {currentQuestion.question}
                    </label>
                    <textarea
                      id={`q-${currentQuestionIndex}`}
                      className="form-textarea"
                      style={styles.textarea}
                      rows="4"
                      value={answers[currentQuestionIndex] || ''}
                      onChange={(e) => handleChange(currentQuestionIndex, e.target.value)}
                      placeholder="Your answer here..."
                      required
                    />
                  </div>
              </div>

              {/* Navigation Controls */}
              <div style={styles.navigationContainer}>
                <button
                  type="button"
                  onClick={handlePrevious}
                  className="secondary-button"
                  style={currentQuestionIndex === 0 ? {...styles.secondaryButton, ...styles.buttonDisabled} : styles.secondaryButton}
                  disabled={currentQuestionIndex === 0}
                >
                  Previous
                </button>

                {currentQuestionIndex < questions.length - 1 ? (
                  <button type="button" onClick={handleNext} className="action-button" style={styles.button}>
                    Next
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="action-button"
                    style={isSubmitting ? {...styles.button, ...styles.buttonDisabled} : styles.button}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? <LoadingSpinner size="24px" /> : 'Submit'}
                  </button>
                )}
              </div>
            </>
          ) : (
            <p style={styles.errorMessage}>{message || 'No questions available.'}</p>
          )}
          {message && !isSubmitting && <p style={styles.errorMessage}>{message}</p>}
        </form>
      </div>
    </>
  );
};

const styles = {
  // --- LAYOUT & STRUCTURE ---
  container: {
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    minHeight: '100vh', padding: '40px 20px',
    background: 'linear-gradient(135deg, #16222A 0%, #3A6073 100%)',
    color: '#e0e0e0', fontFamily: "'Segoe UI', 'Roboto', 'Helvetica Neue', sans-serif",
  },
  formContainer: {
    padding: '40px', background: 'rgba(30, 41, 59, 0.6)', borderRadius: '20px',
    border: '1px solid rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(15px)',
    width: '100%', maxWidth: '750px', textAlign: 'center',
    animation: 'fadeIn 0.6s ease-out forwards', boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
  },

  // --- TYPOGRAPHY & HEADERS ---
  header: {
    fontSize: '2rem', fontWeight: '700', marginBottom: '8px', color: '#ffffff', letterSpacing: '-0.5px',
  },
  subHeader: {
    marginBottom: '40px', fontSize: '1rem', color: '#A0AEC0',
    maxWidth: '90%', margin: '0 auto 40px auto', lineHeight: '1.6',
  },
  
  // --- FORM ELEMENTS ---
  questionCard: {
    background: 'rgba(0, 0, 0, 0.2)', borderRadius: '12px', padding: '25px',
    marginBottom: '25px', textAlign: 'left',
  },
  questionText: {
    display: 'block', fontWeight: '600', fontSize: '1.1rem',
    marginBottom: '15px', lineHeight: '1.5', color: '#ffffff',
  },
  textarea: {
    width: '100%', padding: '15px', borderRadius: '8px',
    border: '1px solid rgba(255, 255, 255, 0.2)', boxSizing: 'border-box',
    background: 'rgba(0, 0, 0, 0.3)',
    color: '#ffffff', // Bright color for the user's answer
    fontSize: '1rem', resize: 'vertical',
    transition: 'border-color 0.3s, box-shadow 0.3s', minHeight: '100px',
  },

  // --- ACTION BUTTONS & NAVIGATION ---
  navigationContainer: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px',
  },
  button: {
    width: 'auto', flexGrow: 1, marginLeft: '10px', padding: '15px',
    background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
    color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer',
    fontSize: '1.1rem', fontWeight: 'bold',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    minHeight: '58px', boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
  },
  secondaryButton: {
    width: 'auto', flexGrow: 1, marginRight: '10px', padding: '15px',
    background: 'transparent', color: '#e0e0e0',
    border: '1px solid rgba(255, 255, 255, 0.3)', borderRadius: '8px',
    cursor: 'pointer', fontSize: '1.1rem', fontWeight: 'bold',
    transition: 'background-color 0.2s ease', display: 'flex',
    justifyContent: 'center', alignItems: 'center', minHeight: '58px',
  },
  buttonDisabled: {
    opacity: 0.6, cursor: 'not-allowed', transform: 'none', boxShadow: 'none',
  },

  // --- UTILITIES & FEEDBACK ---
  errorMessage: {
    marginTop: '20px', color: '#f87171', fontSize: '1rem', fontWeight: '500',
    background: 'rgba(248, 113, 113, 0.1)', border: '1px solid rgba(248, 113, 113, 0.3)',
    borderRadius: '8px', padding: '12px',
  },
  spinner: {
    border: '4px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '50%', animation: 'spin 1s linear infinite',
  },
};

export default AvailabilityFormPage;