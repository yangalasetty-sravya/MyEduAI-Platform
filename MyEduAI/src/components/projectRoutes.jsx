// src/components/ProtectedRoute.js

import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase'; // Make sure this path is correct

const ProtectedRoute = () => {
    const [user, loading] = useAuthState(auth);

    // 1. Show a loading screen while Firebase is checking the user's status.
    //    This is the key to preventing the race condition.
    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#111827', color: 'white' }}>
                <h2>Loading...</h2>
            </div>
        );
    }

    // 2. If there is a user, allow access to the page.
    //    <Outlet /> will render the actual page component (e.g., LearnerDashboard).
    if (user) {
        return <Outlet />;
    }

    // 3. If there is no user, redirect them to the login page.
    return <Navigate to="/login" replace />;
};

export default ProtectedRoute;