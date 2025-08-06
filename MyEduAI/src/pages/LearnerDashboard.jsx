import React, { useState, useEffect } from 'react';
// 1. MODIFIED: Added useLocation to check the current URL
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import LearnerSidebar from '../components/learner/LearnerSidebar';
import { Bell, Sun, Moon } from 'lucide-react';


//------------------------------------------------------------------
// THEME STYLES COMPONENT
//------------------------------------------------------------------

// Variables for each theme
const lightThemeVariables = `
  --bg-primary: #f1f5f9;      /* Slate 100 */
  --bg-secondary: #ffffff;   /* White */
  --bg-card: #ffffff;         /* White */
  --border-color: #e2e8f0;     /* Slate 200 */
  --text-primary: #0f172a;     /* Slate 900 */
  --text-secondary: #64748b; /* Slate 500 */
  --accent-color: #0891b2;     /* Cyan 700 */
  --accent-color-hover: #06b6d4; /* Cyan 600 */
`;

const darkThemeVariables = `
  --bg-primary: #0f172a;      /* Slate 900 */
  --bg-secondary: #1e293b;   /* Slate 800 */
  --bg-card: #1e293b;         /* Slate 800 */
  --border-color: #334155;     /* Slate 700 */
  --text-primary: #f8fafc;     /* Slate 50 */
  --text-secondary: #94a3b8; /* Slate 400 */
  --accent-color: #0891b2;     /* Cyan 700 */
  --accent-color-hover: #06b6d4; /* Cyan 600 */
`;

// Base styles that don't change between themes
const baseStyles = `
  /* Global Font Import */
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

  /* Layout */
  .dashboard-layout { display: flex; height: 100vh; background-color: var(--bg-primary); color: var(--text-primary); font-family: 'Inter', sans-serif; overflow: hidden; transition: background-color 0.3s, color 0.3s; }
  .content-wrapper { flex-grow: 1; display: flex; flex-direction: column; }
  .main-content { flex-grow: 1; overflow-y: auto; background-color: var(--bg-primary); padding: 2rem; transition: background-color 0.3s; }
  
  /* Header */
  .dashboard-header { flex-shrink: 0; background-color: var(--bg-card); border-bottom: 1px solid var(--border-color); height: 64px; padding: 0 2rem; display: flex; align-items: center; justify-content: space-between; transition: background-color 0.3s, border-color 0.3s; }
  .header-actions { display: flex; align-items: center; gap: 1rem; }
  .user-profile { display: flex; align-items: center; gap: 0.75rem; }
  .user-profile-image { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; border: 2px solid var(--accent-color); }
  .user-details { display: flex; flex-direction: column; align-items: flex-start; }
  .user-name { font-weight: 600; color: var(--text-primary); line-height: 1; transition: color 0.3s; }
  .user-role { font-size: 0.8rem; color: var(--text-secondary); text-transform: capitalize; line-height: 1; transition: color 0.3s; }
  
  /* Reusable Components for all pages */
  .card {
    background-color: var(--bg-card);
    border-radius: 12px;
    border: 1px solid var(--border-color);
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    box-shadow: 0 1px 3px 0 rgba(0,0,0,0.05);
    transition: background-color 0.3s, border-color 0.3s;
  }
  .page-header { font-size: 2.25rem; font-weight: 700; margin-bottom: 1.5rem; color: var(--text-primary); transition: color 0.3s; }
  .section-title { font-size: 1.25rem; font-weight: 600; margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 1px solid var(--border-color); color: var(--text-primary); transition: color 0.3s, border-color 0.3s; }
  
  /* Other styles (buttons, badges, grid, etc.) */
  .button-primary { background-color: var(--accent-color); color: white; border: none; padding: 0.6rem 1.2rem; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
  .button-primary:hover { background-color: var(--accent-color-hover); box-shadow: 0 4px 14px 0 rgba(8, 145, 178, 0.3); }
  .badge { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; text-transform: capitalize; }
  .badge-green { background-color: #15803d; color: #f0fdf4; }
  .badge-blue { background-color: #1d4ed8; color: #eef2ff; }
  .badge-yellow { background-color: #b45309; color: #fffbeb; }
  .grid-container { display: grid; gap: 1.5rem; }
  .grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
  
  /* Loading Spinner Styles */
  .loading-container { height: 100vh; width: 100vw; display: flex; flex-direction: column; align-items: center; justify-content: center; background-color: var(--bg-primary); color: var(--text-primary); transition: background-color 0.3s, color 0.3s; }
  .spinner { height: 4rem; width: 4rem; border-radius: 50%; border-top: 4px solid var(--accent-color); border-right: 4px solid transparent; animation: spin 1s linear infinite; }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

  /* Theme button style */
  .theme-toggle-button { background: none; border: none; color: var(--text-secondary); cursor: pointer; padding: 4px; border-radius: 6px; display: flex; align-items: center; justify-content: center; transition: color 0.2s, background-color 0.2s; }
  .theme-toggle-button:hover { color: var(--text-primary); background-color: rgba(148, 163, 184, 0.2); }
`;

// Component to inject all styles
const ThemeStyles = () => (
  <style>
    {`
      ${baseStyles}
      :root {
        ${lightThemeVariables}
      }
      [data-theme='dark'] {
        ${darkThemeVariables}
      }
    `}
  </style>
);


//------------------------------------------------------------------
// HEADER COMPONENT
//------------------------------------------------------------------
const Header = ({ learnerData, theme, toggleTheme }) => {
  const displayName = learnerData?.name || 'Learner';
  const role = learnerData?.role || 'student';
  const profileImageUrl = learnerData?.profileImageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=0D8ABC&color=fff`;

  return (
    <header className="dashboard-header">
      <div>{/* Left side */}</div>
      <div className="header-actions">
        <button onClick={toggleTheme} className="theme-toggle-button" aria-label="Toggle theme">
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <button className="theme-toggle-button">
          <Bell size={20} />
        </button>
        <div className="user-profile">
          <img className="user-profile-image" src={profileImageUrl} alt="Profile" />
          <div className="user-details">
            <span className="user-name">{displayName}</span>
            <span className="user-role">{role}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

//------------------------------------------------------------------
// LOADING SPINNER COMPONENT
//------------------------------------------------------------------
const LoadingSpinner = () => (
  <div className="loading-container">
    <div className="spinner"></div>
    <p style={{ marginTop: '1rem', fontSize: '1.125rem' }}>Loading Dashboard...</p>
  </div>
);

//------------------------------------------------------------------
// MAIN LEARNER DASHBOARD COMPONENT
//------------------------------------------------------------------
const LearnerDashboard = () => {
  const [learnerData, setLearnerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState('light');
  const navigate = useNavigate();
  // 2. ADDED: Get the location object to check the current URL
  const location = useLocation();

  // Apply the theme to the root HTML element whenever it changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Function to toggle the theme
  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  // Effect for handling user authentication and data fetching
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setLearnerData({ uid: user.uid, ...docSnap.data() });
          } else {
            setError("User profile not found in the database.");
          }
        } catch (err) {
          setError("Error loading user data.");
        } finally {
          setLoading(false);
        }
      } else {
        navigate('/');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  // 3. ADDED: New effect to set the default page to Learning Path
  // This code will run after the user is logged in and their data is loaded.
  // Ee code user login ayyi, valla data load ayina taruvatha run avutundi.
  useEffect(() => {
    if (!loading && learnerData) {
      // Check if the current URL is the base dashboard path (e.g., "/learner").
      // Ippuduన్న URL, main dashboard path ("/learner") అవునో కాదో check cheyali.
      // Note: We assume the base path is '/learner'. If your route is different, change it here.
      // Note: Base path '/learner' ani anukuntunnam. Mee route veru ga unte, ikkada marchandi.
      const isAtBaseDashboardPath = location.pathname.toLowerCase() === '/learner' || location.pathname.toLowerCase() === '/learner/';
      
      if (isAtBaseDashboardPath) {
        // If it is, navigate to the "learning-path" page.
        // `replace: true` ensures the user can't click "back" to an empty page.
        // Ala aithe, "learning-path" page ki navigate cheyali.
        // `replace: true` vaadatam valla user "back" button press cheste, khali page ki vellakunda untaru.
        navigate('learning-path', { replace: true });
      }
    }
  }, [loading, learnerData, location.pathname, navigate]);


  // We need to render ThemeStyles even for loading/error states
  // so they are themed correctly.
  if (loading) {
    return (
        <>
            <ThemeStyles />
            <LoadingSpinner />
        </>
    );
  }

  if (error || !learnerData) {
    return (
      <>
        <ThemeStyles />
        <div className="loading-container" style={{ textAlign: 'center', padding: '1rem' }}>
          <h2 style={{ color: '#ef4444', fontSize: '1.5rem', fontWeight: 'bold' }}>An Error Occurred</h2>
          <p style={{ marginTop: '0.5rem' }}>{error || "Could not load your dashboard data."}</p>
        </div>
      </>
    );
  }

  return (
    <>
      <ThemeStyles />
      <div className="dashboard-layout">
        <LearnerSidebar />
        <div className="content-wrapper">
          <Header learnerData={learnerData} theme={theme} toggleTheme={toggleTheme} />
          <main className="main-content">
            <Outlet context={{ learnerData }} />
          </main>
        </div>
      </div>
    </>
  );
};


export default LearnerDashboard;