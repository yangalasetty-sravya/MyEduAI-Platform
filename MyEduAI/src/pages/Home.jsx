/* eslint-disable jsx-a11y/anchor-is-valid */
// Home.jsx

import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore'; // Keep updateDoc, getDoc is for debug log

import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import AuthPop from '../components/AuthPop';
import LearningSetupPopup from './LearningSetupPopup';
import {
  ChevronUp, Brain, Users, Wifi, Trophy, Play, ArrowRight, Menu, X, Sun, Moon,
  Facebook, Twitter, Linkedin, Mail
} from 'lucide-react';
import '../App.css';


const Home = ({ user, userRole, hasIncompleteSetup: appHasIncompleteSetup, setHasIncompleteSetup /*, refreshUserData */ }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showAuthPopup, setShowAuthPopup] = useState(false);
  const [showLearningSetup, setShowLearningSetup] = useState(false);
  

  const navigate = useNavigate();

  useEffect(() => {
    if (isDark) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [isDark]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);


  useEffect(() => {
    if (user) {
      console.log(`Home Effect: userUID=${user?.uid}, role=${userRole}, appHasIncompleteSetup=${appHasIncompleteSetup}, showLearningSetup=${showLearningSetup}`);

      if (userRole === 'learner') {
        if (appHasIncompleteSetup) {
          console.log('Home: Learner logged in, appHasIncompleteSetup is true. Ensuring LearningSetupPopup is shown.');
          if (!showLearningSetup) {
            setShowLearningSetup(true);
          }
        } else {
          console.log('Home: Learner logged in, initial setup complete. Hiding LearningSetupPopup if visible.');
          if (showLearningSetup) setShowLearningSetup(false);
        }
      } else if (userRole === 'volunteer') {
        console.log('Home: Volunteer logged in. App.js handles primary navigation.');
      } else if (user && !userRole && appHasIncompleteSetup) {
        console.log('Home: User logged in, role/core fields missing, appHasIncompleteSetup is true. Staying on Home for setup.');
      }
    } else if (!user && showLearningSetup) {
      setShowLearningSetup(false);
    }
  }, [user, userRole, appHasIncompleteSetup, showAuthPopup, showLearningSetup]); 

 

  const handleAuthSuccess = async (firebaseUser) => {
    console.log('Home: Auth success reported from AuthPop for user:', firebaseUser.uid);
    setShowAuthPopup(false);

    // This block is for debug logging only. Navigation is handled by App.js.
    try {
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userSnap = await getDoc(userDocRef); 
      if (userSnap.exists()) {
        console.log('Home: User data immediately after auth success (for debug):', userSnap.data());
      } else {
        console.warn('Home: No user document found right after auth success (for debug)');
      }
    } catch (err) {
      console.error('Home: Error fetching user data after auth success (for debug):', err);
    }
  };

  const handleLearningSetupComplete = async (setupData) => {
    if (!user || userRole !== 'learner') {
      console.error("Home: No learner logged in or incorrect role for learning setup.");
      setShowLearningSetup(false);
      return;
    }
    console.log('Home: Learner setup complete. Saving data:', setupData);
    const userDocRef = doc(db, 'users', user.uid);
    try {
      await updateDoc(userDocRef, {
        ...setupData,
        setupComplete: true,
        setupSkipped: false,
        setupCompletedAt: new Date(),
        assessmentPending: true // Critical flag for App.js
      });
      console.log('Home: Learner setup data saved. Firestore will notify App.js.');

      setShowLearningSetup(false);   // Hide the popup
      setHasIncompleteSetup(false);  // Update App.js state directly, if it's passed down for immediate UI feedback.
                                     // The onSnapshot will re-sync it anyway.

      // REMOVE direct navigation from here. App.js will navigate when its user state updates via onSnapshot.
      // navigate('/mock-assessment', { state: { userSetupData: setupData, fromSetup: true } });

    } catch (error) {
      console.error("Home: Error saving learning setup:", error);
      setShowLearningSetup(false); // Ensure popup is closed on error
    }
  };

  const handleLearningSetupSkip = async () => {
    if (!user || userRole !== 'learner') {
      console.error("Home: No learner logged in or incorrect role for skipping setup.");
      return;
    }
    console.log('Home: Learning setup popup explicitly skipped.');
    const userDocRef = doc(db, 'users', user.uid);
    try {
      await updateDoc(userDocRef, {
        setupComplete: true,
        setupSkipped: true,
        setupCompletedAt: new Date()
      });
      console.log('Home: Learner skipped setup. Firestore will notify App.js.');

      setShowLearningSetup(false);
      setHasIncompleteSetup(false); // Update App.js state directly

      // REMOVE direct navigation from here. App.js will navigate when its user state updates via onSnapshot.
      // navigate('/learner-dashboard');

    } catch (error) {
      console.error("Home: Error on learning setup skip:", error);
    }
  };

  const handleLearningSetupDismiss = () => {
    console.log('Home: Learning setup popup dismissed (X clicked). Hiding popup.');
    setShowLearningSetup(false);
  };

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    if (isMenuOpen) setIsMenuOpen(false);
  };

  useEffect(() => {
    console.log('Home props from App.js (debug log):', { userUID: user?.uid, userRole, appHasIncompleteSetup });
  }, [user, userRole, appHasIncompleteSetup]);

  return (
    <div className={`app ${isDark ? 'dark' : ''}`}>
      {/* ... (Navbar, Hero, Features, etc. - unchanged) ... */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-logo">
            <span className="logo-text">EduAI</span>
          </div>

          <div className={`nav-links ${isMenuOpen ? 'active' : ''}`}>
            <a href="#home" onClick={(e) => { e.preventDefault(); scrollToSection('home'); }}>Home</a>
            <a href="#courses" onClick={(e) => { e.preventDefault(); scrollToSection('courses'); }}>Courses</a>
            <a href="#volunteer" onClick={(e) => { e.preventDefault(); scrollToSection('volunteer'); }}>Volunteer</a>
            <a href="#about" onClick={(e) => { e.preventDefault(); scrollToSection('about'); }}>About</a>
            <a href="#contact" onClick={(e) => { e.preventDefault(); scrollToSection('contact'); }}>Contact</a>

            {!user ? (
              <>
                <button className="auth-btn" onClick={() => setShowAuthPopup(true)}>Login</button>
                <button className="auth-btn register" onClick={() => setShowAuthPopup(true)}>Register</button>
              </>
            ) : (
              <span className="text-white px-3">Welcome, {user.displayName || user.email}!</span>
            )}
          </div>

          <div className="nav-controls">
            <button className="theme-toggle" onClick={() => setIsDark(!isDark)}>
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button className="menu-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="hero">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              AI-Powered Education for <span className="gradient-text">Everyone</span>
            </h1>
            <p className="hero-subtitle">
              Bridging the education gap with community and technology.
              Free, personalized learning for underserved communities worldwide.
            </p>
            <div className="hero-buttons">
              <button
                className="cta-btn primary"
                onClick={() => {
                  if (user) {
                    if (userRole === 'learner') {
                      if (appHasIncompleteSetup) {
                        setShowLearningSetup(true);
                      } else {
                        // Let App.js determine navigation after initial setup
                        // This button just triggers a login/popup or sends to dashboard/assessment
                        // based on current user state *as known by App.js*.
                        if (user.assessmentPending) {
                           navigate('/mock-assessment');
                        } else {
                           navigate('/learner-dashboard');
                        }
                      }
                    }
                    else if (userRole === 'volunteer') {
                      if (appHasIncompleteSetup) {
                        navigate('/skill-assessment');
                      } else {
                        navigate('/volunteer-dashboard');
                      }
                    } else {
                      navigate('/');
                    }
                  } else {
                    setShowAuthPopup(true);
                  }
                }}
              >
                {user ? 'Go to Dashboard' : 'Get Started'} <ArrowRight size={20} />
              </button>
              <button className="cta-btn secondary" onClick={() => scrollToSection('volunteer')}>
                <Users size={20} /> Become a Volunteer
              </button>
            </div>
          </div>
          <div className="hero-visual">
            <div className="floating-elements">
              <div className="float-item item-1"><Brain size={40} /></div>
              <div className="float-item item-2"><Trophy size={35} /></div>
              <div className="float-item item-3"><Users size={30} /></div>
              <div className="float-item item-4"><Play size={25} /></div>
            </div>
            <div className="hero-illustration">
              <div className="learning-circle">
                <div className="inner-circle"><Brain size={60} className="brain-icon" /></div>
              </div>
            </div>
          </div>
        </div>
        <div className="hero-wave">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".25"></path>
            <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" opacity=".5"></path>
            <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z"></path>
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section id="courses" className="features">
        <div className="container">
          <div className="section-header">
            <h2>Transforming Education Through Innovation</h2>
            <p>Discover how our AI-powered platform makes quality education accessible to everyone</p>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon"><Brain size={40} /></div>
              <h3>AI-Personalized Learning</h3>
              <p>Smart algorithms adapt to each learner's pace, style, and needs, creating personalized learning paths that maximize understanding and retention.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><Users size={40} /></div>
              <h3>Community-Driven Teaching</h3>
              <p>Connect with volunteer educators and peer learners in a supportive community that fosters collaboration and shared growth.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><Wifi size={40} /></div>
              <h3>Offline Access</h3>
              <p>Download courses and learn anywhere, even in remote areas with limited internet connectivity. Education shouldn't stop when WiFi does.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><Trophy size={40} /></div>
              <h3>Gamification & Progress</h3>
              <p>Stay motivated with achievements, progress tracking, and interactive challenges that make learning engaging and fun.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works">
        <div className="container">
          <div className="section-header">
            <h2>How It Works</h2>
            <p>Your journey to personalized learning in four simple steps</p>
          </div>
          <div className="steps-container">
            <div className="step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3>Sign Up</h3>
                <p>Create your free account and tell us about your learning goals</p>
              </div>
            </div>
            <div className="step-connector"></div>
            <div className="step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3>Select Courses</h3>
                <p>Choose from our diverse catalog of AI-curated courses</p>
              </div>
            </div>
            <div className="step-connector"></div>
            <div className="step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3>Learn Online/Offline</h3>
                <p>Study at your own pace, online or offline, with personalized content</p>
              </div>
            </div>
            <div className="step-connector"></div>
            <div className="step">
              <div className="step-number">4</div>
              <div className="step-content">
                <h3>Track Progress</h3>
                <p>Monitor your achievements and unlock new learning opportunities</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Volunteer Impact */}
      <section id="volunteer" className="volunteer-impact">
        <div className="container">
          <div className="section-header">
            <h2>Volunteer Impact</h2>
            <p>See how our amazing volunteers are changing lives around the world</p>
          </div>
          <div className="impact-content">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-number">1,000+</div>
                <div className="stat-label">Hours Taught</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">200+</div>
                <div className="stat-label">Learners Reached</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">50+</div>
                <div className="stat-label">Countries Served</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">95%</div>
                <div className="stat-label">Success Rate</div>
              </div>
            </div>
            <div className="testimonials">
              <div className="testimonial">
                <p>"Teaching through EduAI has been incredibly rewarding. The platform makes it easy to connect with learners and track their progress."</p>
                <div className="testimonial-author"><strong>Sarah Chen</strong> - Volunteer Math Teacher</div>
              </div>
              <div className="testimonial">
                <p>"I've helped over 30 students improve their English skills. The AI tools help me personalize lessons for each learner's needs."</p>
                <div className="testimonial-author"><strong>Marcus Rodriguez</strong> - Language Volunteer</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Join Section */}
      <section id="about" className="join-section">
        <div className="container">
          <div className="section-header">
            <h2>Join Our Mission</h2>
            <p>Whether you want to learn or teach, there's a place for you in our community</p>
          </div>
          <div className="join-cards">
            <div className="join-card learner">
              <div className="join-icon"><Brain size={50} /></div>
              <h3>Become a Learner</h3>
              <p>Access free, personalized education tailored to your goals and learning style. Join thousands of learners already transforming their lives.</p>
              <button className="join-btn" onClick={() => {
                if (user && userRole === 'learner') {
                  if (appHasIncompleteSetup) setShowLearningSetup(true);
                  else {
                     if (user.assessmentPending) {
                       navigate('/mock-assessment');
                     } else {
                       navigate('/learner-dashboard');
                     }
                  }
                } else {
                  setShowAuthPopup(true);
                }
              }}>Start Learning</button>
            </div>
            <div className="join-card volunteer">
              <div className="join-icon"><Users size={50} /></div>
              <h3>Become a Volunteer</h3>
              <p>Share your knowledge and make a difference. Help bridge the education gap by teaching what you're passionate about.</p>
              <button className="join-btn" onClick={() => {
                if (user && userRole === 'volunteer') {
                  if (appHasIncompleteSetup) {
                    navigate('/skill-assessment');
                  } else {
                    navigate('/volunteer-dashboard');
                  }
                } else {
                  setShowAuthPopup(true);
                }
              }}>Start Teaching</button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <h3>EduAI</h3>
              <p>Empowering communities through AI-driven education. Making quality learning accessible to everyone, everywhere.</p>
            </div>
            <div className="footer-section">
              <h4>Quick Links</h4>
              <div className="footer-links">
                <a href="#home" onClick={(e) => { e.preventDefault(); scrollToSection('home'); }}>Home</a>
                <a href="#courses" onClick={(e) => { e.preventDefault(); scrollToSection('courses'); }}>Courses</a>
                <a href="#volunteer" onClick={(e) => { e.preventDefault(); scrollToSection('volunteer'); }}>Volunteer</a>
                <a href="#about" onClick={(e) => { e.preventDefault(); scrollToSection('about'); }}>About</a>
                <a href="#contact" onClick={(e) => { e.preventDefault(); scrollToSection('contact'); }}>Contact</a>
              </div>
            </div>
            <div className="footer-section">
              <h4>Contact</h4>
              <p>Email: hello@eduai.org</p>
              <p>Phone: +1 (555) 123-4567</p>
            </div>
            <div className="footer-section">
              <h4>Follow Us</h4>
              <div className="social-links">
                <a href="#" aria-label="Facebook"><Facebook size={20} /></a>
                <a href="#" aria-label="Twitter"><Twitter size={20} /></a>
                <a href="#" aria-label="LinkedIn"><Linkedin size={20} /></a>
                <a href="#" aria-label="Email"><Mail size={20} /></a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>© 2025 EduAI. Made with ❤️.</p>
          </div>
        </div>
      </footer>


      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button className="scroll-top" onClick={scrollToTop}><ChevronUp size={24} /></button>
      )}

      {/* Auth Popup */}
      {showAuthPopup && (
        <AuthPop
          onClose={() => setShowAuthPopup(false)}
          onAuthSuccess={handleAuthSuccess}
        />
      )}

      {/* Learning Setup Popup */}
      {userRole === 'learner' && showLearningSetup && appHasIncompleteSetup && (
        <LearningSetupPopup
          isOpen={showLearningSetup}
          onClose={handleLearningSetupDismiss}
          onSkip={handleLearningSetupSkip}
          onComplete={handleLearningSetupComplete}
        />
      )}
    </div>
  );
};

export default Home;