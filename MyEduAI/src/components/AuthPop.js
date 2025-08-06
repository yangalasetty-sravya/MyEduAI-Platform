import React, { useState } from 'react';
import { auth, db, googleProvider } from '../firebase';
import { signInWithPopup } from "firebase/auth";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
//import LearningSetupPopup from '../pages/LearningSetupPopup';

// Add this state variable with your other useState declarations


// I have renamed the component from 'AuthPopup' to 'AuthPop' to match the filename.
const AuthPop = ({ onClose, onAuthSuccess }) => {
  const [mode, setMode] = useState('choose');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [expertise, setExpertise] = useState('');
  const [experience, setExperience] = useState('');
  const [bio, setBio] = useState('');
  const [qualifications, setQualifications] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState({});
  // Add to your state definitions
const [education, setEducation] = useState('');
const [otherEducation, setOtherEducation] = useState('');

// Your errors state should be able to hold keys for the new fields:
// const [errors, setErrors] = useState({});
// Example: errors might look like { fullName: '', email: '', education: '', otherEducation: '' ... }
 

  // Mock database of registered users
  const registeredUsers = ['john@example.com', 'jane@example.com', 'test@example.com'];

  const validateForm = () => {
    const newErrors = {};

    if (mode !== 'choose') {
      if (!email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(email)) {
        newErrors.email = 'Please enter a valid email';
      }

      if (mode !== 'forgot') {
        if (!password.trim()) {
          newErrors.password = 'Password is required';
        } else if (password.length < 6) {
          newErrors.password = 'Password must be at least 6 characters';
        }
      }

      if ((mode === 'learner' || mode === 'volunteer') && !fullName.trim()) {
        newErrors.fullName = 'Full name is required';
      }

      if (mode === 'volunteer') {
        if (!expertise.trim()) {
          newErrors.expertise = 'Expertise is required';
        }
        if (!experience.trim()) {
          newErrors.experience = 'Experience is required';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setFullName('');
    setExpertise('');
    setExperience('');
    setBio('');
    setQualifications('');
    setErrors({});
    setMessage('');
  };

   const handleGoogleAuth = async () => {
    // Check if user has selected a role first
    if (mode === 'choose') {
      setMessage('Please select your role first (Learner or Volunteer)');
      return;
    }

    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Check if user already exists
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        // Existing user - sign them in
        const userData = userDoc.data();
        setMessage(`Welcome back, ${userData.name}!`);
        
        // Call success callback with user data and role
        if (onAuthSuccess) {
          onAuthSuccess(userData, 'login');
        }
        
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        // New user - save with the selected role
        const userData = {
          uid: user.uid,
          name: user.displayName || fullName || 'User',
          email: user.email,
          role: mode, // This will be 'learner' or 'volunteer' based on selection
          expertise: mode === 'volunteer' ? expertise : '',
          experience: mode === 'volunteer' ? experience : '',
          bio: mode === 'volunteer' ? bio : '',
          qualifications: mode === 'volunteer' ? qualifications : '',
          createdAt: new Date(),
          setupComplete: false // For triggering appropriate setup flow
        };

        // Save to Firestore
        await setDoc(userDocRef, userData);

        setMessage(`Account created successfully! Welcome, ${user.displayName}!`);
        
        // Call success callback with the correct role
        if (onAuthSuccess) {
          onAuthSuccess(userData, 'signup');
        }

        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (error) {
      console.error('Google auth error:', error);
    
    let errorMessage = 'Google login failed. Please try again.';
    
    if (error.message.includes('Firebase not properly initialized')) {
      errorMessage = 'Authentication service unavailable. Please refresh the page.';
    } else if (error.code === 'auth/popup-blocked') {
      errorMessage = 'Popup blocked. Please allow popups and try again.';
    } else if (error.code === 'auth/popup-closed-by-user') {
      errorMessage = 'Sign-in cancelled. Please try again.';
    } else if (error.code === 'auth/network-request-failed') {
      errorMessage = 'Network error. Please check your connection.';
    }
    
    setMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setMessage('');
    
    setTimeout(() => {
      setIsLoading(false);
      // Check if user exists in mock database
      if (registeredUsers.includes(email.toLowerCase())) {
        setMessage('Password reset email sent! Check your inbox.');
      } else {
        setMessage('No account found with this email address.');
      }
    }, 1500);
  };

 const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return; // Assumes validateForm now checks education fields for volunteers

    setIsLoading(true);
    setMessage('');

    try {
        if (mode === 'learner' || mode === 'volunteer') {
            // --- NEW SIGN UP LOGIC ---
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            const userData = {
                uid: user.uid,
                name: fullName,
                email,
                role: mode,
                // Volunteer-specific fields that were already there
                expertise: mode === 'volunteer' ? expertise : '',
                experience: mode === 'volunteer' ? experience : '',
                bio: mode === 'volunteer' ? bio : '',
                qualifications: mode === 'volunteer' ? qualifications : '',
                
                // --- NEWLY ADDED EDUCATION FIELDS FOR VOLUNTEERS ---
                education: mode === 'volunteer' ? education : '', // Store the selected education level (e.g., 'Intermediate', 'Graduation', 'Other')
                // Conditionally add 'specifiedEducation' only if mode is 'volunteer' AND education is 'Other'
                ...(mode === 'volunteer' && education === 'Other' && { specifiedEducation: otherEducation.trim() }),
                
                createdAt: new Date(),
                // VITAL: Explicitly set setupComplete to false for all new users
                setupComplete: false 
            };

            // Save the new user's data to Firestore
            await setDoc(doc(db, 'users', user.uid), userData);

            setMessage('Account created! Opening setup...');
            
            // This now calls onAuthSuccess directly instead of forcing a re-login.
            if (onAuthSuccess) {
                // Pass the complete userData object, now including education details for volunteers
                onAuthSuccess(userData); 
            }

        } else if (mode === 'login') {
            // --- LOGIN LOGIC ---
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            const userDoc = await getDoc(doc(db, 'users', user.uid));

            if (userDoc.exists()) {
                const userDataFromDb = userDoc.data(); // Renamed to avoid confusion with the signup userData
                setMessage(`Welcome back, ${userDataFromDb.name}!`);
                if (onAuthSuccess) {
                    onAuthSuccess(userDataFromDb);
                }
            } else {
                throw new Error("User profile not found. Please contact support.");
            }
        }
    } catch (error) {
        console.error('Auth error:', error);
        let errorMessage = 'An error occurred. Please try again.';
        if (error.code === 'auth/email-already-in-use') {
          errorMessage = 'An account with this email already exists.';
        } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
          errorMessage = 'Incorrect email or password.';
        }
        setMessage(errorMessage);
    } finally {
        // This ensures the loading spinner ALWAYS stops after the operation.
        setIsLoading(false);
    }
  };
  const handleModeChange = (newMode) => {
    resetForm();
    setMode(newMode);
  };

  const styles = {
    authOverlay: {
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
    authContainer: {
      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.07))',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '24px',
      padding: '32px',
      width: '100%',
      maxWidth: '450px',
      maxHeight: '90vh',
      backdropFilter: 'blur(25px)',
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)',
      color: '#fff',
      position: 'relative',
      animation: 'slideUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    },
    authHeader: {
      textAlign: 'center',
      marginBottom: '24px',
      flexShrink: 0
    },
    authContent: {
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      flex: 1,
      overflow: 'auto',
      paddingRight: '8px',
      marginRight: '-8px'
    },
    roleSelection: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '16px',
      marginBottom: '20px'
    },
    roleCard: {
      background: 'rgba(255, 255, 255, 0.08)',
      border: '1px solid rgba(255, 255, 255, 0.15)',
      borderRadius: '16px',
      padding: '20px 12px',
      textAlign: 'center',
      cursor: 'pointer',
      transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      transform: 'translateY(0)'
    },
    roleIcon: {
      fontSize: '28px',
      marginBottom: '8px'
    },
    authForm: {
      display: 'flex',
      flexDirection: 'column',
      gap: '16px'
    },
    inputGroup: {
      position: 'relative',
      display: 'flex',
      flexDirection: 'column'
    },
    input: {
      width: '100%',
      padding: '16px 50px 16px 16px',
      borderRadius: '12px',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      background: 'rgba(255, 255, 255, 0.1)',
      color: '#fff',
      fontSize: '16px',
      transition: 'all 0.3s ease',
      outline: 'none',
      boxSizing: 'border-box'
    },
    textarea: {
      width: '100%',
      padding: '16px',
      borderRadius: '12px',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      background: 'rgba(255, 255, 255, 0.1)',
      color: '#fff',
      fontSize: '16px',
      transition: 'all 0.3s ease',
      outline: 'none',
      boxSizing: 'border-box',
      resize: 'vertical',
      minHeight: '80px',
      fontFamily: 'inherit'
    },
    inputIcon: {
      position: 'absolute',
      right: '16px',
      top: '16px',
      fontSize: '18px',
      opacity: 0.7
    },
    errorText: {
      color: '#ff6b6b',
      fontSize: '14px',
      marginTop: '4px'
    },
    submitBtn: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      border: 'none',
      padding: '16px',
      color: 'white',
      borderRadius: '12px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      marginTop: '8px'
    },
    googleBtn: {
      background: 'rgba(255, 255, 255, 0.95)',
      color: '#333',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      padding: '14px 20px',
      borderRadius: '12px',
      fontSize: '16px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '12px'
    },
    googleIcon: {
      width: '20px',
      height: '20px'
    },
    divider: {
      display: 'flex',
      alignItems: 'center',
      margin: '20px 0',
      color: 'rgba(255, 255, 255, 0.6)',
      fontSize: '14px'
    },
    authLink: {
      textAlign: 'center',
      fontSize: '14px',
      color: 'rgba(255, 255, 255, 0.8)'
    },
    forgotLink: {
      textAlign: 'center',
      fontSize: '14px',
      color: 'rgba(255, 255, 255, 0.8)',
      marginTop: '12px'
    },
    successMessage: {
      background: 'rgba(34, 197, 94, 0.2)',
      border: '1px solid rgba(34, 197, 94, 0.3)',
      borderRadius: '8px',
      padding: '12px',
      color: '#4ade80',
      fontSize: '14px',
      textAlign: 'center'
    },
    errorMessage: {
      background: 'rgba(239, 68, 68, 0.2)',
      border: '1px solid rgba(239, 68, 68, 0.3)',
      borderRadius: '8px',
      padding: '12px',
      color: '#f87171',
      fontSize: '14px',
      textAlign: 'center'
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
    spinner: {
      width: '20px',
      height: '20px',
      border: '2px solid rgba(255, 255, 255, 0.3)',
      borderTop: '2px solid white',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }
  };

  const renderContent = () => {
    switch (mode) {
      case 'choose':
        return (
          <>
            <div style={styles.authHeader}>
              <h2 style={{margin: '0 0 8px 0', fontSize: '28px', fontWeight: '700'}}>Welcome!</h2>
              <p style={{margin: 0, color: 'rgba(255, 255, 255, 0.8)', fontSize: '16px'}}>Choose how you'd like to join our community</p>
            </div>
            
            {message && (
              <div style={message.includes('failed') || message.includes('error') ? styles.errorMessage : styles.successMessage}>
                {message}
              </div>
            )}
            
            <div style={styles.roleSelection}>
              <div style={styles.roleCard} className="role-card" onClick={() => handleModeChange('learner')}>
                <div style={styles.roleIcon}>📚</div>
                <h3 style={{margin: '0 0 8px 0', fontSize: '18px'}}>Learner</h3>
                <p style={{margin: 0, fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)'}}>Start your learning journey</p>
              </div>
              <div style={styles.roleCard} className="role-card" onClick={() => handleModeChange('volunteer')}>
                <div style={styles.roleIcon}>🎓</div>
                <h3 style={{margin: '0 0 8px 0', fontSize: '18px'}}>Volunteer</h3>
                <p style={{margin: 0, fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)'}}>Share your expertise</p>
              </div>
            </div>

            <div style={styles.divider} className="divider">
              <span>or</span>
            </div>

            <button style={styles.googleBtn} className="google-btn" onClick={handleGoogleAuth} disabled={isLoading}>
              <svg style={styles.googleIcon} viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {isLoading ? 'Connecting...' : 'Continue with Google'}
            </button>

            <p style={styles.authLink} className="auth-link">
              Already have an account? 
              <span onClick={() => handleModeChange('login')} style={{cursor: 'pointer', textDecoration: 'underline'}}> Sign in here</span>
            </p>
          </>
        );

      case 'learner':
        return (
          <>
            <div style={styles.authHeader}>
              <h2 style={{margin: '0 0 8px 0', fontSize: '28px', fontWeight: '700'}}>Join as Learner 📚</h2>
              <p style={{margin: 0, color: 'rgba(255, 255, 255, 0.8)', fontSize: '16px'}}>Start your learning adventure today</p>
            </div>
            
            {message && (
              <div style={message.includes('failed') || message.includes('error') ? styles.errorMessage : styles.successMessage}>
                {message}
              </div>
            )}
            
            <form style={styles.authForm} onSubmit={handleSubmit}>
              <div style={styles.inputGroup} className="input-group">
                <input 
                  style={{...styles.input, borderColor: errors.fullName ? '#ff6b6b' : 'rgba(255, 255, 255, 0.2)'}}
                  type="text" 
                  placeholder="Full Name" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required 
                />
                <span style={styles.inputIcon}>👤</span>
                {errors.fullName && <span style={styles.errorText}>{errors.fullName}</span>}
              </div>
              <div style={styles.inputGroup} className="input-group">
                <input 
                  style={{...styles.input, borderColor: errors.email ? '#ff6b6b' : 'rgba(255, 255, 255, 0.2)'}}
                  type="email" 
                  placeholder="Email Address" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
                <span style={styles.inputIcon}>✉️</span>
                {errors.email && <span style={styles.errorText}>{errors.email}</span>}
              </div>
              <div style={styles.inputGroup} className="input-group">
                <input 
                  style={{...styles.input, borderColor: errors.password ? '#ff6b6b' : 'rgba(255, 255, 255, 0.2)'}}
                  type="password" 
                  placeholder="Create Password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
                <span style={styles.inputIcon}>🔒</span>
                {errors.password && <span style={styles.errorText}>{errors.password}</span>}
              </div>
              
              <button type="submit" style={styles.submitBtn} className="submit-btn" disabled={isLoading}>
                {isLoading ? <div style={styles.spinner}></div> : 'Create Account'}
              </button>
            </form>

            <div style={styles.divider} className="divider">
              <span>or</span>
            </div>

            <button style={styles.googleBtn} className="google-btn" onClick={handleGoogleAuth} disabled={isLoading}>
              <svg style={styles.googleIcon} viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign up with Google
            </button>

            <p style={styles.authLink} className="auth-link">
              Already have an account? 
              <span onClick={() => handleModeChange('login')} style={{cursor: 'pointer', textDecoration: 'underline'}}> Sign in</span>
            </p>
            <p style={styles.authLink} className="auth-link">
              <span onClick={() => handleModeChange('choose')} style={{cursor: 'pointer', textDecoration: 'underline'}}>← Back to role selection</span>
            </p>
          </>
        );

      case 'volunteer':
  return (
    <>
      <div style={styles.authHeader}>
        <h2 style={{margin: '0 0 8px 0', fontSize: '24px', fontWeight: '700'}}>Join as Volunteer 🎓</h2>
        <p style={{margin: 0, color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px'}}>Share your knowledge with others</p>
      </div>
      
      {message && (
        <div style={message.includes('failed') || message.includes('error') ? styles.errorMessage : styles.successMessage}>
          {message}
        </div>
      )}
      
      <form style={styles.authForm} onSubmit={handleSubmit}>
        <div style={styles.inputGroup} className="input-group">
          <input 
            style={{...styles.input, borderColor: errors.fullName ? '#ff6b6b' : 'rgba(255, 255, 255, 0.2)'}}
            type="text" 
            placeholder="Full Name" 
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required 
          />
          <span style={styles.inputIcon}>👤</span>
          {errors.fullName && <span style={styles.errorText}>{errors.fullName}</span>}
        </div>
        <div style={styles.inputGroup} className="input-group">
          <input 
            style={{...styles.input, borderColor: errors.email ? '#ff6b6b' : 'rgba(255, 255, 255, 0.2)'}}
            type="email" 
            placeholder="Email Address" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required 
          />
          <span style={styles.inputIcon}>✉️</span>
          {errors.email && <span style={styles.errorText}>{errors.email}</span>}
        </div>
        <div style={styles.inputGroup} className="input-group">
          <input 
            style={{...styles.input, borderColor: errors.expertise ? '#ff6b6b' : 'rgba(255, 255, 255, 0.2)'}}
            type="text" 
            placeholder="Your Expertise (e.g., Math, Science)" 
            value={expertise}
            onChange={(e) => setExpertise(e.target.value)}
            required 
          />
          <span style={styles.inputIcon}>🏆</span>
          {errors.expertise && <span style={styles.errorText}>{errors.expertise}</span>}
        </div>
        <div style={styles.inputGroup} className="input-group">
          <input 
            style={{...styles.input, borderColor: errors.experience ? '#ff6b6b' : 'rgba(255, 255, 255, 0.2)'}}
            type="text" 
            placeholder="Years of Experience" 
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
            required 
          />
          <span style={styles.inputIcon}>📅</span>
          {errors.experience && <span style={styles.errorText}>{errors.experience}</span>}
        </div>
        <div style={styles.inputGroup} className="input-group">
          <input 
            style={styles.input} // Assuming no specific error border for optional field unless it has validation
            type="text" 
            placeholder="Qualifications (Optional)" 
            value={qualifications}
            onChange={(e) => setQualifications(e.target.value)}
          />
          <span style={styles.inputIcon}>🎓</span>
        </div>

        {/* --- NEW EDUCATION FIELD START --- */}
        <div style={styles.inputGroup} className="input-group">
          <select
            style={{...styles.input, borderColor: errors.education ? '#ff6b6b' : 'rgba(255, 255, 255, 0.2)'}}
            value={education}
            onChange={(e) => {
              setEducation(e.target.value);
              if (e.target.value !== 'Other') {
                setOtherEducation(''); // Clear 'other' field if not selected
              }
              // Optionally clear error when changing:
              // if (errors.education) setErrors(prev => ({...prev, education: ''}));
            }}
            required // HTML5 validation, supplement with JS validation
          >
            <option value="">Select Education Level *</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Graduation">Graduation</option>
            <option value="Post Graduation">Post Graduation</option>
            <option value="Other">Other</option>
          </select>
          <span style={styles.inputIcon}>📚</span> {/* Education Icon */}
          {errors.education && <span style={styles.errorText}>{errors.education}</span>}
        </div>

        {education === 'Other' && (
          <div style={styles.inputGroup} className="input-group">
            <input
              style={{...styles.input, borderColor: errors.otherEducation ? '#ff6b6b' : 'rgba(255, 255, 255, 0.2)'}}
              type="text"
              placeholder="Please specify your education *"
              value={otherEducation}
              onChange={(e) => {
                setOtherEducation(e.target.value);
                // Optionally clear error:
                // if (errors.otherEducation) setErrors(prev => ({...prev, otherEducation: ''}));
              }}
              required // HTML5 validation, supplement with JS validation
            />
            <span style={styles.inputIcon}>✍️</span> {/* Specify/Edit Icon */}
            {errors.otherEducation && <span style={styles.errorText}>{errors.otherEducation}</span>}
          </div>
        )}
        {/* --- NEW EDUCATION FIELD END --- */}

        <div style={styles.inputGroup} className="input-group">
          <textarea 
            style={styles.textarea}
            placeholder="Tell us about yourself and your teaching experience (Optional)" 
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows="3"
          />
        </div>
        <div style={styles.inputGroup} className="input-group">
          <input 
            style={{...styles.input, borderColor: errors.password ? '#ff6b6b' : 'rgba(255, 255, 255, 0.2)'}}
            type="password" 
            placeholder="Create Password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required 
          />
          <span style={styles.inputIcon}>🔒</span>
          {errors.password && <span style={styles.errorText}>{errors.password}</span>}
        </div>
        
        <button type="submit" style={styles.submitBtn} className="submit-btn" disabled={isLoading}>
          {isLoading ? <div style={styles.spinner}></div> : 'Create Account'}
        </button>
      </form>

      <div style={styles.divider} className="divider">
        <span>or</span>
      </div>

      <button style={styles.googleBtn} className="google-btn" onClick={handleGoogleAuth} disabled={isLoading}>
        <svg style={styles.googleIcon} viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Sign up with Google
      </button>

      <p style={styles.authLink} className="auth-link">
        Already have an account? 
        <span onClick={() => handleModeChange('login')} style={{cursor: 'pointer', textDecoration: 'underline'}}> Sign in</span>
      </p>
      <p style={styles.authLink} className="auth-link">
        <span onClick={() => handleModeChange('choose')} style={{cursor: 'pointer', textDecoration: 'underline'}}>← Back to role selection</span>
      </p>
    </>
  );

      case 'login':
  return (
    <>
      <div style={styles.authHeader}>
        <h2 style={{margin: '0 0 8px 0', fontSize: '28px', fontWeight: '700'}}>Welcome Back!</h2>
        <p style={{margin: 0, color: 'rgba(255, 255, 255, 0.8)', fontSize: '16px'}}>Sign in to continue your journey</p>
      </div>
      
      {message && (
        <div style={message.includes('failed') || message.includes('error') || message.includes('Incorrect') || message.includes('No account') ? styles.errorMessage : styles.successMessage}>
          {message}
        </div>
      )}
      
      <form style={styles.authForm} onSubmit={handleSubmit}>
        <div style={styles.inputGroup} className="input-group">
          <input 
            style={{...styles.input, borderColor: errors.email ? '#ff6b6b' : 'rgba(255, 255, 255, 0.2)'}}
            type="email" 
            placeholder="Email Address" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required 
          />
          <span style={styles.inputIcon}>✉️</span>
          {errors.email && <span style={styles.errorText}>{errors.email}</span>}
        </div>
        <div style={styles.inputGroup} className="input-group">
          <input 
            style={{...styles.input, borderColor: errors.password ? '#ff6b6b' : 'rgba(255, 255, 255, 0.2)'}}
            type="password" 
            placeholder="Password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required 
          />
          <span style={styles.inputIcon}>🔒</span>
          {errors.password && <span style={styles.errorText}>{errors.password}</span>}
        </div>
        
        <button type="submit" style={styles.submitBtn} className="submit-btn" disabled={isLoading}>
          {isLoading ? <div style={styles.spinner}></div> : 'Sign In'}
        </button>
      </form>

      <p style={styles.forgotLink} className="auth-link">
        <span onClick={() => handleModeChange('forgot')} style={{cursor: 'pointer', textDecoration: 'underline'}}>
          Forgot your password?
        </span>
      </p>

      <div style={styles.divider} className="divider">
        <span>or</span>
      </div>

      <button style={styles.googleBtn} className="google-btn" onClick={handleGoogleAuth} disabled={isLoading}>
        <svg style={styles.googleIcon} viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Sign in with Google
      </button>

      <p style={styles.authLink} className="auth-link">
        Don't have an account? 
        <span onClick={() => handleModeChange('choose')} style={{cursor: 'pointer', textDecoration: 'underline'}}> Sign up here</span>
      </p>
    </>
  );
      case 'forgot':
        return (
          <>
            <div style={styles.authHeader}>
              <h2 style={{margin: '0 0 8px 0', fontSize: '28px', fontWeight: '700'}}>Reset Password</h2>
              <p style={{margin: 0, color: 'rgba(255, 255, 255, 0.8)', fontSize: '16px'}}>Enter your email to receive reset instructions</p>
            </div>
            
            {message && (
              <div style={message.includes('No account') ? styles.errorMessage : styles.successMessage}>
                {message}
              </div>
            )}
            
            <form style={styles.authForm} onSubmit={handleForgotPassword}>
              <div style={styles.inputGroup} className="input-group">
                <input 
                  style={{...styles.input, borderColor: errors.email ? '#ff6b6b' : 'rgba(255, 255, 255, 0.2)'}}
                  type="email" 
                  placeholder="Email Address" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
                <span style={styles.inputIcon}>✉️</span>
                {errors.email && <span style={styles.errorText}>{errors.email}</span>}
              </div>
              
              <button type="submit" style={styles.submitBtn} className="submit-btn" disabled={isLoading}>
                {isLoading ? <div style={styles.spinner}></div> : 'Send Reset Email'}
              </button>
            </form>

            <p style={styles.authLink} className="auth-link">
              Remember your password? 
              <span onClick={() => handleModeChange('login')} style={{cursor: 'pointer', textDecoration: 'underline'}}> Sign in</span>
            </p>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div style={styles.authOverlay} className="auth-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={styles.authContainer} className="auth-container">
        <button style={styles.closeBtn} className="close-btn" onClick={onClose}>
          ×
        </button>
        
        <div style={styles.authContent}>
          {renderContent()}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to { 
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .role-card:hover {
          background: rgba(255, 255, 255, 0.15) !important;
          border-color: rgba(255, 255, 255, 0.3) !important;
          transform: translateY(-4px) !important;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2) !important;
        }
        
        .input-group input:focus, .input-group textarea:focus {
          border-color: #667eea !important;
          background: rgba(255, 255, 255, 0.15) !important;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1) !important;
        }
        
        .input-group input::placeholder, .input-group textarea::placeholder {
          color: rgba(255, 255, 255, 0.6);
        }
        
        .submit-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%) !important;
          transform: translateY(-2px) !important;
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3) !important;
        }
        
        .google-btn:hover:not(:disabled) {
          background: rgba(255, 255, 255, 1) !important;
          transform: translateY(-2px) !important;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1) !important;
        }
        
        .auth-link span:hover {
          color: #667eea !important;
        }
        
        .close-btn:hover {
          background: rgba(255, 255, 255, 0.1) !important;
          color: white !important;
          transform: rotate(90deg) !important;
        }
        
        .divider::before, .divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: rgba(255, 255, 255, 0.2);
          margin: 0 16px;
        }
        
        .auth-content::-webkit-scrollbar {
          width: 6px;
        }
        
        .auth-content::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
        }
        
        .auth-content::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 3px;
        }
        
        .auth-content::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.5);
        }
        
        @media (max-width: 480px) {
          .auth-container {
            margin: 20px;
            padding: 24px !important;
            max-width: none !important;
          }
          
          .role-selection {
            grid-template-columns: 1fr !important;
          }
          
          .auth-header h2 {
            font-size: 24px !important;
          }
        }
      `}</style>
    </div>
  );
};
export default AuthPop;