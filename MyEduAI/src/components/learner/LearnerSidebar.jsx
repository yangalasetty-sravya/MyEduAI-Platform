import React, { useState } from 'react';

import { NavLink } from 'react-router-dom';
import {
  User, BrainCircuit, BarChart3, MessageSquare, Award,
  BarChartHorizontal, Users, Settings, LogOut, Menu, X
} from 'lucide-react';
import { auth } from '../../firebase';
import { signOut } from 'firebase/auth';

const professionalSidebarStyles = `
  /* Base styles for sidebar container - Mobile First */
  .sidebar-container {
    width: 280px; /* Slightly wider for mobile slide-in */
    background-color: #111827; /* Darker background */
    display: flex;
    flex-direction: column;
    padding: 1.5rem 1rem; /* More padding */
    flex-shrink: 0;
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    transform: translateX(-100%); /* Hidden off-screen by default */
    transition: transform 0.3s ease-out; /* Smooth slide transition */
    z-index: 1000;
    box-shadow: 0 0 15px rgba(0, 0, 0, 0.5);
    overflow-y: auto;
  }

  .sidebar-container.is-open {
    transform: translateX(0%); /* Slide into view */
  }

  .sidebar-toggle-button {
    display: block;
    background: none;
    border: none;
    color: #fff;
    font-size: 2rem;
    cursor: pointer;
    padding: 0.75rem;
    position: fixed;
    top: 1rem;
    left: 1rem;
    z-index: 1001;
    border-radius: 8px;
    transition: background-color 0.2s ease;
  }

  .sidebar-toggle-button:hover {
    background-color: #1f2937;
  }

  .sidebar-backdrop {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: rgba(0, 0, 0, 0.6);
    z-index: 999;
  }

  .sidebar-backdrop.is-open {
    display: block;
  }

  @media (min-width: 768px) {
    .sidebar-container {
      width: 260px;
      position: sticky;
      top: 0;
      transform: translateX(0%);
      height: 100vh;
      border-right: 1px solid #1f2937;
      box-shadow: none;
    }
    .sidebar-toggle-button,
    .sidebar-backdrop {
      display: none;
    }
  }

  .sidebar-header {
    padding: 0 0.5rem;
    margin-bottom: 2rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .sidebar-close-button {
    display: none;
    background: none;
    border: none;
    color: #9ca3af;
    cursor: pointer;
    padding: 0.5rem;
    transition: color 0.2s ease;
  }
  .sidebar-close-button:hover {
    color: #fff;
  }

  @media (max-width: 767px) {
    .sidebar-close-button {
      display: block;
    }
  }
  
  .sidebar-title {
    font-size: 1.75rem;
    font-weight: 700;
    letter-spacing: 2px;
    background: linear-gradient(90deg, #22d3ee, #0891b2);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
  
  .sidebar-nav {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
  }

  /* --- MODIFIED LINK STYLE --- */
  .nav-link {
    display: flex;
    align-items: center;
    padding: 0.8rem 1rem;
    margin: 0.2rem 0;
    border-radius: 8px;
    /* 1. Changed color to a lighter gray for better contrast */
    color: #d1d5db; 
    text-decoration: none;
    transition: all 0.2s ease-in-out;
    font-weight: 500;
  }

  .nav-link:hover {
    background-color: #1f2937;
    color: #fff; /* On hover, text becomes pure white */
  }
  .nav-link-active {
    background-color: #0891b2;
    color: #fff; /* Active link text is pure white */
    box-shadow: 0 4px 14px 0 rgba(8, 145, 178, 0.3);
  }
  .sidebar-icon {
    margin-right: 1rem;
    width: 22px;
    height: 22px;
  }
  .logout-button {
    background: none;
    border: none;
    width: 100%;
    cursor: pointer;
    margin-top: auto;
    text-align: left;
  }
`;

const navItems = [
    { name: 'Profile', icon: User, path: 'profile' },
    { name: 'My Learning Path', icon: BrainCircuit, path: 'learning-path' },
    { name: 'Assessments', icon: BarChart3, path: 'assessments' },
    { name: 'Discussions', icon: MessageSquare, path:'forum' },
    { name: 'Achievements', icon: Award, path: 'achievements' },
    { name: 'Progress Report', icon: BarChartHorizontal, path: 'progress-report' },
    { name: 'Mentorship', icon: Users, path: 'mentorship' },
    { name: 'Settings', icon: Settings, path: 'settings' },
];

const LearnerSidebar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    await signOut(auth);
    setIsOpen(false);
  };

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const closeSidebar = () => {
    setIsOpen(false);
  };

  return (
    <>
      <style>{professionalSidebarStyles}</style>

      <button className="sidebar-toggle-button" onClick={toggleSidebar}>
        {isOpen ? <X size={32} /> : <Menu size={32} />}
      </button>

      <div
        className={`sidebar-backdrop ${isOpen ? 'is-open' : ''}`}
        onClick={closeSidebar}
      ></div>

      <div className={`sidebar-container ${isOpen ? 'is-open' : ''}`}>
        <div className="sidebar-header">
          <h1 className="sidebar-title">EDU-AI</h1>
          <button className="sidebar-close-button" onClick={closeSidebar}>
            <X size={24} />
          </button>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `nav-link ${isActive ? 'nav-link-active' : ''}`
              }
              onClick={closeSidebar} 
            >
              <item.icon className="sidebar-icon" />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>
        <button onClick={handleLogout} className="nav-link logout-button">
          <LogOut className="sidebar-icon" />
          <span>Logout</span>
        </button>
      </div>
    </>
  );
};

export default LearnerSidebar;