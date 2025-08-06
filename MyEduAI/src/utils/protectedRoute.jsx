import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
// You'll need a way to get the current user and their role.
// This can be from a context, Redux, or a custom hook.
import { useAuth } from '../services/authService'; // Assuming you create this hook

const ProtectedRoute = () => {
  const { currentUser, userRole } = useAuth(); // Example auth hook

  if (!currentUser) {
    // If not logged in, redirect to login page
    return <Navigate to="/login" />;
  }

  if (userRole !== 'learner') {
    // If logged in but not a learner, redirect to home or an error page
    return <Navigate to="/" />;
  }

  // If logged in and is a learner, render the nested component (e.g., LearnerDashboard)
  return <Outlet />;
};

export default ProtectedRoute;