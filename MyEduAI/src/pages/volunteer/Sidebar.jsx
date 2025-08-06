// src/components/Sidebar.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

// --- SVG ICONS (Self-contained for easy integration in this file) ---
const Icon = ({ name, style }) => {
    const icons = {
        dashboard: <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8v-6h-8v6zm0-18v6h8V3h-8z" />,
        post: <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 14h-8v-2h8v2zm0-4h-8v-2h8v2zm-3-5V3.5L18.5 9H13z" />,
        messages: <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z" />,
        community: <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />,
        achievements: <path d="M10 20H5v2h5v2l3-3-3-3v2zm4 0v2h5v-2h-5zm3-20H7C5.9 0 5 .9 5 2v14c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V2c0-1.1-.9-2-2-2zm-4 10h-2v2h-2v-2H7v-2h2V8h2v2h2v2z" />,
        logout: <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />,
        edit: <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />,
    };
    return <svg style={style} viewBox="0 0 24 24" fill="currentColor">{icons[name] || null}</svg>;
};

const Sidebar = ({ user, onLogout }) => {
    const location = useLocation();

    const {
        name = 'Volunteer',
        email = 'loading...',
        photoURL = 'https://i.pravatar.cc/150',
    } = user || {};

    // Updated paths to be relative to the /volunteer-dashboard parent route
    const menuItems = [
        { name: 'Dashboard', icon: 'dashboard', path: '/volunteer-dashboard' },
        { name: 'Post Content', icon: 'post', path: '/volunteer-dashboard/post' },
        { name: 'Messages', icon: 'messages', path: '/volunteer-dashboard/messages' },
        { name: 'Community', icon: 'community', path: '/volunteer-dashboard/community' },
        { name: 'Achievements', icon: 'achievements', path: '/volunteer-dashboard/achievements' },
    ];

    return (
        <>
            <style>
                {`
                /* Responsive adjustments for smaller screens, specific to sidebar */
                @media (max-width: 768px) {
                    .sidebar {
                        width: 100% !important; height: auto !important; position: static !important;
                        flex-direction: row !important; align-items: center; padding: 0 10px !important;
                        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                        overflow-y: visible !important;
                        justify-content: space-between; /* Distribute items */
                    }
                    .sidebar-profile, .sidebar-community-card { display: none !important; }
                    .sidebar-menu-nav { 
                        flex-direction: row !important; 
                        width: auto; /* Allow menu items to fit */ 
                        justify-content: space-evenly; 
                        flex-grow: 1; /* Allow menu to take available space */
                    }
                    .sidebar-menu-item span { display: none; }
                    .sidebar-logout { margin-left: auto !important; margin-top: 0 !important; }
                    /* Adjust menu icon size for smaller screens if needed */
                    .sidebar-menu-item svg { width: 24px; height: 24px; margin-right: 0; }
                }
                `}
            </style>
            <aside style={styles.sidebar} className="sidebar">
                <div style={styles.profileSection} className="sidebar-profile">
                    <img src={photoURL} alt="Avatar" style={styles.avatar} />
                    <h3 style={styles.profileName}>{name}</h3>
                    <p style={styles.profileEmail}>{email}</p>
                    <button style={styles.editProfileButton}>
                        <Icon name="edit" style={styles.editIcon}/>
                        <span>Edit Profile</span>
                    </button>
                </div>
                <nav style={styles.menuNav} className="sidebar-menu-nav">
                    {menuItems.map((item) => (
                        <Link
                            to={item.path}
                            key={item.name}
                            // Use location.pathname to check if the current path matches the item's path
                            style={location.pathname === item.path ? {...styles.menuItem, ...styles.menuItemActive} : styles.menuItem}
                            className="sidebar-menu-item"
                        >
                            <Icon name={item.icon} style={styles.menuIcon} />
                            <span>{item.name}</span>
                        </Link>
                    ))}
                </nav>
                <div style={styles.communityCard} className="sidebar-community-card">
                    <svg width="80" height="60" viewBox="0 0 100 80" fill="none" xmlns="http://www.w3.org/2000/svg" style={{marginBottom: '10px'}}>
                        <circle cx="30" cy="30" r="10" fill="#374151"/>
                        <path d="M20 50 C20 40, 40 40, 40 50 C40 65, 20 65, 20 50 Z" fill="#374151"/>
                        <circle cx="70" cy="30" r="10" fill="#4f46e5"/>
                        <path d="M60 50 C60 40, 80 40, 80 50 C80 65, 60 65, 60 50 Z" fill="#4f46e5"/>
                        <rect x="0" y="70" width="100" height="10" rx="5" fill="rgba(255,255,255,0.05)"/>
                    </svg>
                    <h4 style={{margin: '0 0 5px 0', color: '#fff'}}>Community Connect</h4>
                    <p style={{fontSize: '0.8rem', color: '#9ca3af', margin: 0}}>Join the discussion.</p>
                </div>
                <button
  onClick={onLogout}
  style={{ ...styles.menuItem, marginTop: 'auto', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
  className="sidebar-logout"
>
  <Icon name="logout" style={styles.menuIcon} />
  <span>Logout</span>
</button>

            </aside>
        </>
    );
};

const styles = {
    sidebar: { width: '260px', backgroundColor: '#1f2937', padding: '25px 15px', display: 'flex', flexDirection: 'column', position: 'fixed', height: '100%', color: '#d1d5db', overflowY: 'auto', zIndex: 100 },
    profileSection: { textAlign: 'center', paddingBottom: '20px', borderBottom: '1px solid #374151' },
    avatar: { width: '80px', height: '80px', borderRadius: '50%', border: '3px solid #4f46e5', marginBottom: '15px', objectFit: 'cover' },
    profileName: { margin: '0 0 5px 0', fontSize: '1.2rem', color: '#ffffff', fontWeight: 600 },
    profileEmail: { margin: 0, fontSize: '0.8rem', color: '#9ca3af' },
    editProfileButton: { background: 'transparent', border: '1px solid #4f46e5', color: '#d1d5db', borderRadius: '8px', padding: '8px 12px', marginTop: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', transition: 'background-color 0.2s, border-color 0.2s' },
    editIcon: { width: '14px', height: '14px', marginRight: '8px' },
    menuNav: { display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '20px' },
    menuItem: { display: 'flex', alignItems: 'center', padding: '12px 15px', borderRadius: '8px', color: '#d1d5db', textDecoration: 'none', transition: 'background-color 0.2s, color 0.2s, transform 0.2s' },
    menuItemActive: { backgroundColor: '#4f46e5', color: '#ffffff', boxShadow: '0 4px 15px rgba(17, 98, 107, 0.2)' },
    menuIcon: { width: '20px', height: '20px', marginRight: '15px' },
    communityCard: { background: '#374151', padding: '20px', borderRadius: '12px', textAlign: 'center', marginTop: '25px' },
};

export default Sidebar;