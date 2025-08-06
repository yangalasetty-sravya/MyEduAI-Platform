import React, { useState } from 'react';
import { X, ChevronRight, Book, Globe, Clock, ChevronLeft, GraduationCap } from 'lucide-react';

const LearningSetupPopup = ({ isOpen, onClose, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [setupData, setSetupData] = useState({
    educationLevel: '',
    subjects: [],
    timeCommitment: '',
    preferredLanguage: 'English'
  });

  // Subject mapping based on education level
  const subjectsByEducationLevel = {
    '1st-5th': ['Mathematics', 'English', 'Science', 'Social Studies', 'Hindi/Regional Language', 'Art & Craft'],
    '6th-8th': ['Mathematics', 'English', 'Science', 'Social Science', 'Hindi/Regional Language', 'Computer Science', 'Sanskrit'],
    '9th-10th': ['Mathematics', 'English', 'Science (Physics/Chemistry/Biology)', 'Social Science', 'Hindi/Regional Language', 'Computer Applications', 'Sanskrit'],
    'intermediate': ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'English', 'Computer Science', 'Economics', 'Political Science', 'History', 'Geography', 'Psychology', 'Sociology'],
    'undergraduate': ['Engineering', 'Medicine', 'Commerce', 'Arts', 'Science', 'Computer Science', 'Business Administration', 'Economics', 'Psychology', 'Literature', 'Law', 'Architecture'],
    'postgraduate': ['MBA', 'MS/M.Tech', 'MA', 'MSc', 'MCom', 'LLM', 'PhD Preparation', 'Research Methods', 'Specialized Fields']
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete(setupData);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleEducationLevelSelect = (level) => {
    setSetupData(prev => ({
      ...prev,
      educationLevel: level,
      subjects: [] // Reset subjects when education level changes
    }));
  };

  const handleSubjectToggle = (subject) => {
    setSetupData(prev => ({
      ...prev,
      subjects: prev.subjects.includes(subject)
        ? prev.subjects.filter(s => s !== subject)
        : [...prev.subjects, subject]
    }));
  };

  const getAvailableSubjects = () => {
    return subjectsByEducationLevel[setupData.educationLevel] || [];
  };

  const styles = {
    popupOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backdropFilter: 'blur(15px)',
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      animation: 'fadeIn 0.3s ease-in-out',
      padding: '20px',
      boxSizing: 'border-box'
    },
    popupContainer: {
      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.07))',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '24px',
      padding: '32px',
      width: '100%',
      maxWidth: '600px',
      minHeight: '550px',
      maxHeight: '90vh',
      backdropFilter: 'blur(25px)',
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)',
      color: '#fff',
      position: 'relative',
      animation: 'slideUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      display: 'flex',
      flexDirection: 'column'
    },
    closeBtn: {
      position: 'absolute',
      top: '16px',
      right: '20px',
      background: 'none',
      border: 'none',
      fontSize: '28px',
      color: 'rgba(255, 255, 255, 0.8)',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      borderRadius: '50%',
      width: '40px',
      height: '40px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10
    },
    popupHeader: {
      textAlign: 'center',
      marginBottom: '16px',
      padding: '0 20px',
      flexShrink: 0
    },
    popupContent: {
      flex: 1,
      overflowY: 'auto',
      padding: '10px 4px',
    },
    popupFooter: {
      paddingTop: '20px',
      borderTop: '1px solid rgba(255, 255, 255, 0.1)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexShrink: 0
    },
    btn: {
        padding: '12px 24px',
        borderRadius: '12px',
        border: 'none',
        fontSize: '16px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
    }
  };

  if (!isOpen) return null;

  return (
    <div style={styles.popupOverlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={styles.popupContainer}>
        <button style={styles.closeBtn} className="close-btn" onClick={onClose}>
          <X size={24} />
        </button>

        <div style={styles.popupHeader}>
          <h2 style={{margin: '0 0 8px 0', fontSize: '24px', fontWeight: '700'}}>Personalize Your Learning</h2>
          <p style={{margin: 0, color: 'rgba(255, 255, 255, 0.8)', fontSize: '16px'}}>A few quick questions to tailor your experience.</p>
        </div>

        <div className="setup-progress">
            <span className="progress-text">Step {currentStep} of 4</span>
            <div className="progress-bar">
                <div 
                className="progress-fill" 
                style={{ width: `${(currentStep / 4) * 100}%` }}
                ></div>
            </div>
        </div>

        <div style={styles.popupContent}>
          {currentStep === 1 && (
            <div className="setup-step">
              <div className="step-icon"><GraduationCap size={32} /></div>
              <h3>What is your Education Level?</h3>
              <p>Select your current education level.</p>
              <div className="options-list">
                {[
                  { value: '1st-5th', label: '1st to 5th Class (Primary)' },
                  { value: '6th-8th', label: '6th to 8th Class (Middle School)' },
                  { value: '9th-10th', label: '9th to 10th Class (High School)' },
                  { value: 'intermediate', label: '11th-12th/Intermediate (+2)' },
                  { value: 'undergraduate', label: 'Undergraduate (Bachelor\'s Degree)' },
                  { value: 'postgraduate', label: 'Postgraduate (Master\'s/PhD)' }
                ].map(level => (
                  <div 
                    key={level.value} 
                    className={`option-card single ${setupData.educationLevel === level.value ? 'selected' : ''}`} 
                    onClick={() => handleEducationLevelSelect(level.value)}
                  >
                    {level.label}
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="setup-step">
              <div className="step-icon"><Book size={32} /></div>
              <h3>What subjects interest you?</h3>
              <p>Choose subjects relevant to your education level.</p>
              <div className="options-grid">
                {getAvailableSubjects().map(subject => (
                  <div 
                    key={subject} 
                    className={`option-card ${setupData.subjects.includes(subject) ? 'selected' : ''}`} 
                    onClick={() => handleSubjectToggle(subject)}
                  >
                    {subject}
                  </div>
                ))}
              </div>
              {getAvailableSubjects().length === 0 && (
                <p style={{color: 'rgba(255, 255, 255, 0.6)', fontStyle: 'italic'}}>
                  Please select an education level first to see available subjects.
                </p>
              )}
            </div>
          )}

          {currentStep === 3 && (
            <div className="setup-step">
              <div className="step-icon"><Clock size={32} /></div>
              <h3>How much time can you dedicate?</h3>
              <p>This helps us suggest appropriate courses.</p>
              <div className="options-list">
                {[
                  { value: '15min', label: '15 minutes per day' }, 
                  { value: '30min', label: '30 minutes per day' }, 
                  { value: '1hour', label: '1 hour per day' }, 
                  { value: '2hours', label: '2+ hours per day' }, 
                  { value: 'flexible', label: 'Flexible schedule' }
                ].map(option => (
                  <div 
                    key={option.value} 
                    className={`option-card single ${setupData.timeCommitment === option.value ? 'selected' : ''}`} 
                    onClick={() => setSetupData(prev => ({ ...prev, timeCommitment: option.value }))}
                  >
                    {option.label}
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="setup-step">
              <div className="step-icon"><Globe size={32} /></div>
              <h3>Preferred learning language?</h3>
              <p>We'll customize content accordingly.</p>
              <div className="options-list">
                {['English', 'Hindi', 'Tamil', 'Telugu', 'Bengali', 'Marathi', 'Gujarati', 'Kannada', 'Malayalam', 'Punjabi']
                .map(language => (
                  <div 
                    key={language} 
                    className={`option-card single ${setupData.preferredLanguage === language ? 'selected' : ''}`} 
                    onClick={() => setSetupData(prev => ({ ...prev, preferredLanguage: language }))}
                  >
                    {language}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={styles.popupFooter}>
            <button className="btn-setup secondary" onClick={onClose}>Skip Setup</button>
            <div style={{display: 'flex', gap: '12px'}}>
                {currentStep > 1 && (
                    <button className="btn-setup secondary" onClick={handlePrevious}>
                        <ChevronLeft size={20} /> Previous
                    </button>
                )}
                <button 
                    className="btn-setup primary" 
                    onClick={handleNext}
                    disabled={
                        (currentStep === 1 && !setupData.educationLevel) ||
                        (currentStep === 2 && setupData.subjects.length === 0) ||
                        (currentStep === 3 && !setupData.timeCommitment)
                    }
                    >
                    {currentStep === 4 ? 'Complete Setup' : 'Next'}
                    <ChevronRight size={20} />
                </button>
            </div>
        </div>
      </div>
        <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(30px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .close-btn:hover { background: rgba(255, 255, 255, 0.1) !important; color: white !important; transform: rotate(90deg) !important; }
        .setup-progress { margin-bottom: 20px; color: rgba(255, 255, 255, 0.8); }
        .progress-text { font-size: 14px; display: block; text-align: center; margin-bottom: 8px; }
        .progress-bar { width: 100%; height: 6px; background: rgba(255, 255, 255, 0.15); border-radius: 3px; overflow: hidden; }
        .progress-fill { height: 100%; background: linear-gradient(90deg, #667eea, #764ba2); border-radius: 3px; transition: width 0.4s ease; }
        .setup-step { text-align: center; animation: fadeIn 0.5s ease; }
        .setup-step h3 { font-size: 22px; margin: 12px 0 8px; font-weight: 600; }
        .setup-step p { margin: 0 auto 24px; color: rgba(255, 255, 255, 0.7); max-width: 80%; }
        .step-icon { width: 60px; height: 60px; margin: 0 auto; display: flex; align-items: center; justify-content: center; background: rgba(255, 255, 255, 0.1); border-radius: 50%; border: 1px solid rgba(255, 255, 255, 0.2); }
        .options-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; }
        .options-list { display: flex; flex-direction: column; gap: 12px; }
        .option-card { background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 12px; padding: 16px; text-align: center; cursor: pointer; transition: all 0.2s ease; font-weight: 500; }
        .option-card:hover { background: rgba(255, 255, 255, 0.15); border-color: rgba(255, 255, 255, 0.3); transform: translateY(-3px); }
        .option-card.selected { background: rgba(102, 126, 234, 0.3); border-color: #667eea; color: #fff; box-shadow: 0 0 15px rgba(102, 126, 234, 0.3); }
        .btn-setup { padding: 12px 20px; border-radius: 10px; border: none; font-size: 15px; font-weight: 600; cursor: pointer; transition: all 0.3s ease; display: flex; align-items: center; gap: 8px; }
        .btn-setup.primary { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
        .btn-setup.primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 4px 15px rgba(0,0,0,0.2); }
        .btn-setup.secondary { background: rgba(255, 255, 255, 0.15); color: rgba(255, 255, 255, 0.9); }
        .btn-setup.secondary:hover { background: rgba(255, 255, 255, 0.25); }
        .btn-setup:disabled { opacity: 0.5; cursor: not-allowed; }
        `}</style>
    </div>
  );
};

// This line is the fix. We are now exporting the correct component.
export default LearningSetupPopup;