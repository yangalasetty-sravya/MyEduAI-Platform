// src/layouts/VolunteerDashboardLayout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../volunteer/Sidebar'; // Adjust path based on where you save Sidebar.jsx

const VolunteerDashboardLayout = ({ user, onLogout }) => {
    return (
        <>
            <style>
                {`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

                /* Responsive adjustments for overall layout */
                @media (max-width: 768px) {
                    .dashboard-layout-container { flex-direction: column; height: auto; }
                    .main-content-area { padding: 20px 15px !important; margin-left: 0 !important; }
                }
                `}
            </style>
            <div style={styles.dashboardContainer} className="dashboard-layout-container">
                <Sidebar user={user} onLogout={onLogout} />
                <main style={styles.mainContent} className="main-content-area">
                    <Outlet /> {/* Renders the child route content here */}
                </main>
            </div>
        </>
    );
};

const styles = {
    dashboardContainer: {
        display: 'flex',
        height: '100vh', // Full viewport height
        overflow: 'hidden', // Hide overflow to prevent scrollbars on the container itself
        backgroundColor: '#f4f7fa',
        fontFamily: "'Segoe UI', 'Roboto', 'Helvetica Neue', sans-serif"
    },
    mainContent: {
        flex: 1, // Takes up remaining space
        marginLeft: '260px', // Pushes content to the right of the fixed sidebar
        padding: '30px 40px',
        overflowY: 'auto', // Allows vertical scrolling within the main content area
        animation: 'fadeIn 0.5s ease-in-out'
    }
};

export default VolunteerDashboardLayout;