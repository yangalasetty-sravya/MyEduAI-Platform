import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { db, auth } from '../../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Mail, Calendar, Edit, X, Book, Star, BarChart2 } from 'lucide-react';

//-------------------------------------------------------------
// STYLES
//-------------------------------------------------------------
const profilePageStyles = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .profile-page-container {
    animation: fadeIn 0.5s ease-out;
  }
  .profile-grid { display: grid; grid-template-columns: 120px 1fr; gap: 2rem; align-items: center; }
  .profile-image-lg { width: 120px; height: 120px; border-radius: 50%; border: 3px solid var(--accent-color); object-fit: cover; }
  .profile-main-info { display: flex; justify-content: space-between; align-items: flex-start; }
  .profile-main-info h2 { font-size: 1.75rem; font-weight: 700; margin-bottom: 0.5rem; }
  .info-item { display: flex; align-items: center; gap: 0.75rem; color: var(--text-secondary); margin-bottom: 0.5rem; font-size: 0.9rem; }
  .interest-tags-container { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.5rem; }

  /* --- STATS STYLES --- */
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.5rem;
  }
  .stat-card {
    /* Use bg-secondary for a subtle difference from the page background in light mode */
    background-color: var(--bg-secondary);
    padding: 1.25rem;
    border-radius: 8px;
    border-left: 4px solid var(--accent-color);
    display: flex;
    align-items: center;
    gap: 1rem;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  .stat-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
  }
  .stat-card-icon {
    color: var(--accent-color);
  }
  .stat-card-info h4 {
    color: var(--text-secondary);
    font-size: 0.85rem;
    font-weight: 500;
    margin: 0 0 0.25rem 0;
    text-transform: uppercase;
  }
  .stat-card-info p {
    color: var(--text-primary);
    font-size: 1.1rem;
    font-weight: 600;
    margin: 0;
  }

  /* --- MODAL STYLES --- */
  .modal-overlay {
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background-color: rgba(0, 0, 0, 0.7);
    display: flex; justify-content: center; align-items: center; z-index: 1000;
  }
  .modal-content {
    background-color: var(--bg-secondary); padding: 2rem; border-radius: 12px;
    width: 90%; max-width: 500px; border: 1px solid var(--border-color); position: relative;
    animation: fadeIn 0.3s ease-out;
  }
  .modal-close-button {
    position: absolute; top: 1rem; right: 1rem;
    background: none; border: none; color: var(--text-secondary); cursor: pointer;
  }
  .modal-form { display: flex; flex-direction: column; gap: 1rem; }
  .form-group { display: flex; flex-direction: column; gap: 0.5rem; }
  .form-group label { font-weight: 600; color: var(--text-secondary); }
  .form-group input {
    background-color: var(--bg-primary); border: 1px solid var(--border-color);
    border-radius: 8px; padding: 0.75rem; color: var(--text-primary); font-size: 0.9rem;
  }
  .modal-actions { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1.5rem; }
  
  /* ✅ CHANGED: This button now works in both light and dark themes */
  .button-secondary {
    background-color: var(--border-color); /* Uses a theme-appropriate gray */
    color: var(--text-secondary);
    border: none;
    padding: 0.6rem 1.2rem; border-radius: 8px; font-weight: 600; cursor: pointer;
    transition: all 0.2s;
  }
  .button-secondary:hover {
    filter: brightness(0.95);
  }
`;

//-------------------------------------------------------------
// The Profile Page Component
//-------------------------------------------------------------
const Profile = () => {
  const { learnerData } = useOutletContext();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (learnerData) {
      setFormData({
        name: learnerData.name || '',
        educationLevel: learnerData.educationLevel || '',
        interests: learnerData.interests ? learnerData.interests.join(', ') : '',
      });
    }
  }, [learnerData]);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!auth.currentUser) {
        alert("You must be logged in to save changes.");
        return;
    }
    try {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        const interestsArray = formData.interests.split(',').map(item => item.trim()).filter(Boolean);
        await updateDoc(userRef, {
            name: formData.name,
            educationLevel: formData.educationLevel,
            interests: interestsArray,
        });
        alert("Profile updated successfully! The page will refresh to show changes.");
        setIsEditModalOpen(false);
        window.location.reload();
    } catch (error) {
        console.error("Error updating profile: ", error);
        alert("Failed to update profile.");
    }
  };

  if (!learnerData) {
    return <div className="card">Loading profile...</div>;
  }

  const joinedDate = learnerData.createdAt?.toDate ? new Date(learnerData.createdAt.toDate()).toLocaleDateString() : 'N/A';
  const profileImageUrl = learnerData.profilePicUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(learnerData.name || 'User')}&background=0D8ABC&color=fff&size=128`;
  const firstName = learnerData.name ? learnerData.name.split(' ')[0] : 'Learner';

  // Stats data
  const interestsCount = learnerData.interests ? learnerData.interests.length : 0;
  const progress = learnerData.progress || 0;
  const educationLevel = learnerData.educationLevel || 'Not Set';

  return (
    <>
      <style>{profilePageStyles}</style>
      <div className="profile-page-container">
        <h1 className="page-header">Dashboard</h1>

        <div className="card">
          <h3 style={{fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.25rem'}}>Welcome back, {firstName}!</h3>
          <p style={{color: 'var(--text-secondary)', marginTop: 0, marginBottom: '1.5rem'}}>Here's a quick look at your journey so far.</p>
          
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-card-icon"><Book size={28} /></div>
              <div className="stat-card-info">
                <h4>Education Level</h4>
                <p>{educationLevel}</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-card-icon"><Star size={28} /></div>
              <div className="stat-card-info">
                <h4>Interests Defined</h4>
                <p>{interestsCount}</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-card-icon"><BarChart2 size={28} /></div>
              <div className="stat-card-info">
                <h4>Course Progress</h4>
                <p>{progress}% Complete</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="card">
            <h3 className="section-title">Personal Information</h3>
            <div className="profile-grid">
              <img src={profileImageUrl} alt="Profile" className="profile-image-lg" />
              
              <div className="profile-main-info">
                <div>
                  <h2>{learnerData.name}</h2>
                  <div className="info-item"><Mail size={16} /><span>{learnerData.email}</span></div>
                  <div className="info-item"><Calendar size={16} /><span>Joined on {joinedDate}</span></div>
                </div>
                <button className="button-primary" onClick={() => setIsEditModalOpen(true)}>
                  <Edit size={16} style={{ marginRight: '0.5rem' }} />
                  Edit Profile
                </button>
              </div>
            </div>
        </div>
      </div>
      
      {isEditModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="modal-close-button" onClick={() => setIsEditModalOpen(false)}><X size={24} /></button>
            <h2 className="section-title">Edit Your Profile</h2>
            <form className="modal-form" onSubmit={handleSave}>
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label htmlFor="educationLevel">Education Level</label>
                <input type="text" id="educationLevel" name="educationLevel" value={formData.educationLevel} onChange={handleInputChange} placeholder="e.g. Undergraduate, High School" />
              </div>
              <div className="form-group">
                <label htmlFor="interests">Interests (comma separated)</label>
                <input type="text" id="interests" name="interests" value={formData.interests} onChange={handleInputChange} placeholder="e.g. React, AI, Node.js" />
              </div>
              <div className="modal-actions">
                <button type="button" className="button-secondary" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
                <button type="submit" className="button-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Profile;