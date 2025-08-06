// In App.js (AppContent component)

import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore'; 
import { auth, db } from './firebase';
import CloudinaryTestUploader from "./CloudinaryTestUploader";
import CourseDetailPage from './pages/Learner/CourseDetailPage'; 

// Main Pages
import Home from './pages/Home';
import LearnerDashboard from './pages/LearnerDashboard';
// Import the new layout component
import VolunteerDashboardLayout from './pages/volunteer/VolunteerDashboardLayout'; 
import MockAssessment from './pages/MockAssessment';
import SkillAssessment from './pages/SkillAssessmentpage';

//volunteer Sub pages (these will now be children of VolunteerDashboardLayout)
import VolunteerDashboard from './pages/volunteer/VolunteerDashboard'; 
import VolunteerPostContent from './pages/volunteer/VolunteerPostContent';
// Assuming these placeholder components exist
import VolunteerMessages from './pages/volunteer/VolunteerMessages'; 

import VolunteerAchievements from './pages/volunteer/VolunteerAchievements'; 
import VideoDetailPage from './pages/volunteer/VideoDetailPage'; // This is correct, it's a specific page

// Learner Sub Pages
import Profile from './pages/Learner/Profile';
import LearningPath from './pages/Learner/LearningPath';
import Assessments from './pages/Learner/Assessments';
import Achievements from './pages/Learner/Achievements';
import ForumPage from './pages/shared/ForumPage'; // Import ForumPage
import Mentorship from './pages/Learner/Mentorship';
import ProgressReport from './pages/Learner/ProgressReport';
import Settings from './pages/Learner/Settings';
import RecommendedVideos from './pages/Learner/RecommendedVideos';
import VideoViewer from './pages/Learner/VideoViewer'; // 👈 make sure this path is correct


const FullPageLoader = () => (
  <div style={{ height: '100vh', width: '100vw', backgroundColor: '#111827', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
    <p>Loading Application...</p>
  </div>
);

// ROUTE GUARDS (keeping them as they are for now)
const LearnerRoute = ({ user, loading, hasIncompleteSetup }) => {
  if (loading) return <FullPageLoader />;
  if (!user || hasIncompleteSetup || user.role !== 'learner') {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
};

const VolunteerRoute = ({ user, loading, hasIncompleteSetup }) => {
  if (loading) return <FullPageLoader />;
  if (!user || hasIncompleteSetup || user.role !== 'volunteer') {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
};

function AppContent() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasIncompleteSetup, setHasIncompleteSetup] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let authUnsubscribe;
    let firestoreUnsubscribe;

    authUnsubscribe = onAuthStateChanged(auth, async (userAuth) => {
      if (firestoreUnsubscribe) {
        firestoreUnsubscribe();
        firestoreUnsubscribe = null;
      }

      if (userAuth) {
        setLoading(true);
        const docRef = doc(db, 'users', userAuth.uid);

        firestoreUnsubscribe = onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
            const fullUserProfile = {
              uid: userAuth.uid,
              email: userAuth.email,
              ...docSnap.data()
            };
            setUser(fullUserProfile);

            console.log("App.js: onSnapshot fetched User Profile:", fullUserProfile);
            console.log("App.js: User role:", fullUserProfile.role);
            console.log("App.js: Learner setupComplete:", fullUserProfile.setupComplete);
            console.log("App.js: Learner assessmentPending:", fullUserProfile.assessmentPending);

            if (fullUserProfile.role && fullUserProfile.name) {
              if (fullUserProfile.role === 'learner') {
                setHasIncompleteSetup(!(fullUserProfile.setupComplete === true));
              } else if (fullUserProfile.role === 'volunteer') {
                const isVolunteerReady = fullUserProfile.volunteerAssessmentComplete === true;
                setHasIncompleteSetup(!isVolunteerReady);
              } else {
                setHasIncompleteSetup(false);
              }
            } else {
              console.warn("Core user document fields are missing for UID:", userAuth.uid);
              setHasIncompleteSetup(true);
            }
          } else {
            console.warn("No user document found for UID:", userAuth.uid);
            setUser({ uid: userAuth.uid, email: userAuth.email });
            setHasIncompleteSetup(true);
          }
          setLoading(false);
        }, (error) => {
          console.error("Error listening to user data (onSnapshot):", error);
          setUser({ uid: userAuth.uid, email: userAuth.email });
          setHasIncompleteSetup(true);
          setLoading(false);
        });

      } else {
        setUser(null);
        setHasIncompleteSetup(false);
        setLoading(false);
      }
    });

    return () => {
      if (authUnsubscribe) authUnsubscribe();
      if (firestoreUnsubscribe) firestoreUnsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error("Logout error:", error);
      alert("Failed to logout. Try again.");
    }
  };

  const handleVideoPostedSuccess = () => {
    console.log("Video posted success callback received in AppContent.");
  };


  if (loading) return <FullPageLoader />;

  return (
    <Routes>
      <Route
        path="/"
        element={
          user ? (
            user.role === 'learner' ? (
              console.log("App.js Routes: Evaluating Learner Navigation."),
              console.log("App.js Routes: Learner hasIncompleteSetup:", hasIncompleteSetup),
              console.log("App.js Routes: Learner assessmentPending:", user.assessmentPending),
              hasIncompleteSetup ? (
                <Home
                  user={user}
                  userRole="learner"
                  hasIncompleteSetup={hasIncompleteSetup}
                  setHasIncompleteSetup={setHasIncompleteSetup}
                />
              ) : (
                user.assessmentPending === true ? (
                  console.log("App.js Routes: Navigating to /mock-assessment."),
                  <Navigate to="/mock-assessment" replace />
                ) : (
                  console.log("App.js Routes: Navigating to /learner-dashboard."),
                  <Navigate to="/learner-dashboard" replace />
                )
              )
            ) : user.role === 'volunteer' ? (
              console.log("App.js Routes: Evaluating Volunteer Navigation."),
              console.log("App.js Routes: Volunteer hasIncompleteSetup:", hasIncompleteSetup),
              hasIncompleteSetup ? (
                <Home
                  user={user}
                  userRole="volunteer"
                  hasIncompleteSetup={hasIncompleteSetup}
                  setHasIncompleteSetup={setHasIncompleteSetup}
                />
              ) : (
                <Navigate to="/volunteer-dashboard" replace />
              )
            ) : (
              console.log("App.js Routes: Unknown Role, Navigating to /."),
              <Navigate to="/" replace />
            )
          ) : (
            console.log("App.js Routes: User not logged in, Navigating to Home."),
            <Home
              user={null}
              userRole={null}
              hasIncompleteSetup={false}
              setHasIncompleteSetup={setHasIncompleteSetup}
            />
          )
        }
      />
      <Route path="/upload-test" element={<CloudinaryTestUploader />} />


      {/* Routes that are direct pages */}
      <Route path="/skill-assessment" element={<SkillAssessment user={user} onSetupComplete={() => setHasIncompleteSetup(false)} />} />
      <Route path="/mock-assessment" element={<MockAssessment user={user} />} />

      {/* Learner Dashboard and its nested routes */}
      <Route element={<LearnerRoute user={user} loading={loading} hasIncompleteSetup={hasIncompleteSetup} />}>
        {/* The LearnerDashboard component is the layout for learner routes */}
        <Route path="/learner-dashboard" element={<LearnerDashboard user={user} />}>
          <Route index element={<Navigate to="learning-path" replace />} />
          {/* CORRECTED: VideoDetailPage path is now relative to /learner-dashboard */}
          <Route path="videos/:videoId" element={<VideoDetailPage />} /> 
          <Route path="profile" element={<Profile />} />
          <Route path="learning-path" element={<LearningPath />} />
          <Route path="assessments" element={<Assessments />} />
          <Route path="achievements" element={<Achievements />} />
          {/* REMOVED INCORRECT NESTING for ForumPage */}
          {/* <Route path="/learner-dashboard" element={<LearnerDashboard />}>
              <Route path="forum" element={<ForumPage />} />
          </Route> */}
          {/* ADDED ForumPage as a direct child route */}
          <Route path="forum" element={<ForumPage />} />

          <Route path="mentorship" element={<Mentorship />} />
          <Route path="progress-report" element={<ProgressReport />} />
          <Route path="settings" element={<Settings />} />
          <Route path="recommended-videos" element={<RecommendedVideos />} />
        </Route>
      </Route>
      <Route path="/videos/:id" element={<VideoViewer />} />
      <Route path="/progress" element={<ProgressReport />} />
      <Route path="/courses/:id" element={<CourseDetailPage />} />


      {/* Volunteer Dashboard Layout and its specific sub-routes */}
      {/* The VolunteerRoute guard protects access to the layout */}
      <Route element={<VolunteerRoute user={user} loading={loading} hasIncompleteSetup={hasIncompleteSetup} />}>
        {/* All child routes will render inside the VolunteerDashboardLayout's Outlet */}
        <Route path="/volunteer-dashboard" element={<VolunteerDashboardLayout user={user} onLogout={handleLogout} />}>
            {/* The index route for /volunteer-dashboard, rendering the main dashboard content */}
            <Route index element={<VolunteerDashboard user={user} onVideoPostedSuccess={handleVideoPostedSuccess} />} />
           
            <Route
                path="post" // This path becomes /volunteer-dashboard/post
                element={<VolunteerPostContent user={user} />}
            />
            <Route
                path="messages" // This path becomes /volunteer-dashboard/messages
                element={<VolunteerMessages user={user} />} 
            />
           
            {/* REMOVED INCORRECT NESTING for ForumPage */}
            {/* <Route path="/volunteer-dashboard" element={<VolunteerDashboardLayout />}>
                <Route path="forum" element={<ForumPage />} />
            </Route> */}
            {/* ADDED ForumPage as a direct child route for "Community" */}
            <Route path="community" element={<ForumPage />} />
            
            <Route
                path="achievements" // This path becomes /volunteer-dashboard/achievements
                element={<VolunteerAchievements user={user} />} 
            />
             {/* If Volunteer also has video details, it would go here */}
             {/* <Route path="videos/:videoId" element={<VideoDetailPage />} */}
        </Route>
      </Route>

      {/* Catch-all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;