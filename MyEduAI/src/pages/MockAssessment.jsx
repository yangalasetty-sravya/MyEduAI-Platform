// MockAssessment.js

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveAssessmentResults } from "../services/firestoreService";
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
 // Import doc and getDoc
import { db } from '../firebase'; // Import db
import { Clock, Brain, AlertCircle, Award } from 'lucide-react';
import axios from "axios";

// --- START: CSS-in-JS (No changes here, it's perfect) ---
const styles = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }
  @keyframes slideIn {
    from { transform: translateX(50px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  .assessment-container { background-color: #111827; min-height: 100vh; color: white; padding: 2rem; display: flex; flex-direction: column; align-items: center; font-family: sans-serif; }
  .assessment-header, .assessment-main, .assessment-footer { width: 100%; max-width: 800px; animation: fadeIn 0.5s ease-out; }
  .assessment-main { flex-grow: 1; display: flex; align-items: center; justify-content: center; }
  .question-card { background-color: rgba(31, 41, 55, 0.5); backdrop-filter: blur(10px); border: 1px solid rgba(55, 65, 81, 0.5); border-radius: 24px; padding: 2rem; width: 100%; animation: slideIn 0.4s ease-out; }
  .option-button { width: 100%; padding: 1rem; text-align: left; border-radius: 12px; border: 2px solid #374151; background-color: transparent; color: white; font-size: 1.125rem; cursor: pointer; transition: all 0.2s ease; display: flex; align-items: center; gap: 1rem; }
  .option-button:hover { border-color: #8B5CF6; background-color: rgba(139, 92, 246, 0.1); }
  .progress-bar-container { width: 100%; background-color: #374151; border-radius: 9999px; height: 10px; margin-top: 1rem; }
  .progress-bar-fill { height: 100%; border-radius: 9999px; background-image: linear-gradient(to right, #8B5CF6, #2DD4BF); transition: width 0.5s ease-in-out; }
  .centered-content { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; flex-grow: 1; }
  .loading-icon { animation: pulse 1.5s infinite ease-in-out; }
`;
// --- END: CSS-in-JS ---

const MockAssessment = () => {
  // We only need the user object here to get the UID for saving results.
  // The 'loading' state is handled by the PrivateRoute in App.js.
  const [user] = useAuthState(auth);
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(900); // 15 minutes
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true); // Renamed for clarity
  const [error, setError] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);

  const [userSetupData, setUserSetupData] = useState(null);

// Fetch user setup data from Firestore after mount
useEffect(() => {
  const fetchUserData = async () => {
    if (!user) return;
    try {
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.educationLevel && data.subjects) {
          setUserSetupData({
            educationLevel: data.educationLevel,
            subjects: data.subjects,
            preferredLanguage: data.preferredLanguage || 'English'
          });
        } else {
          throw new Error("User setup data is incomplete.");
        }
      } else {
        throw new Error("No user document found.");
      }
    } catch (err) {
      console.error("Failed to fetch user setup data:", err.message);
      setError("Could not load your learning setup. Please try again.");
    }
  };

  fetchUserData();
}, [user]);

  const fallbackQuestions = [
    { question: "What is the capital of India?", options: ["Mumbai", "Delhi", "Kolkata", "Chennai"], correct: 1 },
    { question: "What is 2 + 2?", options: ["3", "4", "5", "6"], correct: 1 },
  ];
  
  // This useCallback prevents the function from being recreated on every render
  const generateAssessment = useCallback(async () => {
    // Only fetch if a user exists. The PrivateRoute ensures this component
    // won't even render without a user.
    if (!user) return; 

    setIsLoadingQuestions(true);
    setError(null);
    try {
      if (userSetupData?.subjects?.length) {
        const response = await axios.post("http://localhost:5000/api/quiz/generate-quiz", {
          educationLevel: userSetupData.educationLevel,
          subjects: userSetupData.subjects,
          language: userSetupData.preferredLanguage || 'English',
        }, { timeout: 20000 });
        if (response.data?.questions?.length) {
          setQuestions(response.data.questions.slice(0, 10));
        } else {
          throw new Error('No valid questions received from AI');
        }
      } else {
        throw new Error('User setup data is missing. This can happen on page refresh.');
      }
    } catch (err) {
      console.error("Quiz generation failed:", err);
      setError('Failed to generate personalized questions. Using a default assessment.');
      setQuestions(fallbackQuestions);
    } finally {
      setIsLoadingQuestions(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, userSetupData]); // Dependencies for useCallback

  // Effect to fetch questions once the component mounts
  useEffect(() => {
  if (userSetupData) {
    generateAssessment();
  }
}, [userSetupData, generateAssessment]);



  // Effect for the timer (no changes needed)
  useEffect(() => {
    if (isLoadingQuestions || isCompleted || timeLeft <= 0) return;
    const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, isLoadingQuestions, isCompleted]);

  
  // Using useCallback for performance and to prevent re-creation
  const handleSubmit = useCallback(async () => {
    if (isSubmitting || !user) return;
    setIsSubmitting(true);
    
    const correctCount = questions.reduce((acc, q, i) => (answers[i] === q.correct ? acc + 1 : acc), 0);
    const score = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;

    const results = {
      score,
      totalQuestions: questions.length,
      correctAnswers: correctCount,
      answers,
      subjects: userSetupData?.subjects || ['General'],
      educationLevel: userSetupData?.educationLevel || 'General',
    };
    
    // 1. Show the completion screen immediately.
    setIsCompleted(true);

    try {
      // 2. Save results in the background. The user sees their score while this happens.
      await saveAssessmentResults(user.uid, results);
      await updateDoc(doc(db, 'users', user.uid), {
  assessmentPending: false,
});

    } catch (error) {
      console.error("❌ Failed to save results:", error.message);
      setError("We couldn't save your results, but your progress is noted.");
    }
    
    // 3. Navigate after a delay. This is now SAFE because the global PrivateRoute is handling auth.
    // The delay is purely for the user to see their score.
    setTimeout(() => {
      navigate('/learner-dashboard', { 
        replace: true, // Recommended to prevent going back to the results screen
        state: { 
          fromAssessment: true,
          score: score 
        } 
      });
    }, 4000); // 4 seconds to view score

  }, [isSubmitting, user, answers, questions, userSetupData, navigate]);


  // Effect to auto-submit when time runs out
  useEffect(() => {
    if (timeLeft === 0 && !isSubmitting && !isCompleted) {
      handleSubmit();
    }
  }, [timeLeft, isSubmitting, isCompleted, handleSubmit]);


  const handleAnswerSelect = (optionIndex) => {
    setAnswers(prev => ({ ...prev, [currentQuestion]: optionIndex }));
    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
      } else {
        handleSubmit();
      }
    }, 300);
  };

  const calculateScore = () => {
    if (questions.length === 0) return 0;
    const correctCount = questions.reduce((acc, q, i) => (answers[i] === q.correct ? acc + 1 : acc), 0);
    return Math.round((correctCount / questions.length) * 100);
  };

  // --- Render Logic ---

  if (isLoadingQuestions) {
    return (
      <>
        <style>{styles}</style>
        <div className="assessment-container">
          <div className="centered-content">
            <Brain className="loading-icon" size={64} />
            <h2 className="text-2xl font-bold mt-4">Crafting Your Challenge...</h2>
            <p className="text-purple-300">Personalizing questions just for you.</p>
          </div>
        </div>
      </>
    );
  }
  
  // This screen is now safe to use.
  if (isCompleted) {
    const score = calculateScore();
    return (
      <>
        <style>{styles}</style>
        <div className="assessment-container">
          <div className="centered-content">
            <Award className="w-20 h-20 text-yellow-400" size={80}/>
            <h2 className="text-3xl font-bold mt-4">Assessment Complete!</h2>
            <h1 className="text-6xl font-bold my-4 text-teal-400">{score}%</h1>
            <p className="text-lg text-gray-300">We're now tailoring your learning path.</p>
            <p className="text-sm text-gray-400 mt-2">Redirecting to your dashboard...</p>
          </div>
        </div>
      </>
    );
  }
  
  if (!questions || questions.length === 0) {
     return (
        <>
            <style>{styles}</style>
            <div className="assessment-container">
                <div className="centered-content">
                    <AlertCircle className="w-16 h-16 text-red-500" />
                    <h2 className="text-2xl font-bold mt-4">Error Loading Assessment</h2>
                    <p className="text-gray-400 max-w-md">{error || "Could not load questions. Please go back and try again."}</p>
                </div>
            </div>
        </>
     )
  }

  const currentQData = questions[currentQuestion];
  const progressPercentage = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <>
      <style>{styles}</style>
      <div className="assessment-container">
        {/* The rest of the JSX is unchanged and correct */}
        <header className="assessment-header mb-8">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center border border-purple-500/30">
                        <Brain className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold">Initial Assessment</h1>
                        <p className="text-sm text-gray-400">Discover your starting point</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 bg-gray-800/50 px-4 py-2 rounded-xl border border-gray-700">
                    <Clock className={`w-5 h-5 ${timeLeft < 60 ? 'text-red-400' : 'text-gray-400'}`} />
                    <span className={`font-mono font-semibold ${timeLeft < 60 ? 'text-red-400' : ''}`}>
                        {`${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')}`}
                    </span>
                </div>
            </div>
            <div className="progress-bar-container">
                <div className="progress-bar-fill" style={{ width: `${progressPercentage}%` }}></div>
            </div>
        </header>

        <main className="assessment-main">
          {currentQData && (
            <div className="question-card">
                <h2 className="text-2xl font-semibold mb-6">
                    <span className="text-gray-500 mr-2">Q{currentQuestion + 1}.</span>
                    {currentQData.question}
                </h2>
                <div className="space-y-4">
                    {currentQData.options.map((option, index) => (
                    <button
                        key={index}
                        onClick={() => handleAnswerSelect(index)}
                        className="option-button"
                    >
                        <div className="w-7 h-7 rounded-lg bg-gray-700 flex-shrink-0 flex items-center justify-center font-bold text-purple-300">
                        {String.fromCharCode(65 + index)}
                        </div>
                        <span>{option}</span>
                    </button>
                    ))}
                </div>
            </div>
          )}
        </main>

        <footer className="assessment-footer mt-6">
          {error && (
            <div className="flex items-center gap-2 bg-yellow-500/10 p-3 rounded-xl border border-yellow-400/30">
              <AlertCircle className="w-5 h-5 text-yellow-400" />
              <span className="text-yellow-200 text-sm">{error}</span>
            </div>
          )}
        </footer>
      </div>
    </>
  );
};

export default MockAssessment;  