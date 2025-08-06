// src/pages/volunteer/VolunteerPostContent.jsx
// Note: This file name is retained as per user's prompt, but its function is now 'manage content'.

import React, { useState, useEffect ,useCallback} from 'react';
import { db } from '../../firebase';
import { collection, query, where, orderBy, getDocs, doc, updateDoc, deleteDoc, increment, setDoc } from 'firebase/firestore';
import { Link } from 'react-router-dom'; // Still needed for the "Go to your Dashboard" link

import VolunteerCourseManager from '../../components/VolunteerCourseManager'; // Import the new component

// Re-import Icon component (as per original file's pattern and prompt)
const Icon = ({ name, style }) => {
    const icons = {
        dashboard: <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8v-6h-8v6zm0-18v6h8V3h-8z" />,
        post: <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 14h-8v-2h8v2zm0-4h-8v-2h8v2zm-3-5V3.5L18.5 9H13z" />,
        messages: <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z" />,
        community: <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />,
        achievements: <path d="M10 20H5v2h5v2l3-3-3-3v2zm4 0v2h5v-2h-5zm3-20H7C5.9 0 5 .9 5 2v14c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V2c0-1.1-.9-2-2-2zm-4 10h-2v2h-2v-2H7v-2h2V8h2v2h2v2z" />,
        logout: <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />,
        edit: <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />,
        plus: <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />,
        videos: <path d="M4 6.47L5.76 10H20v8H4V6.47M22 4h-4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4z"/>,
        learners: <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>,
        check: <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>,
        badges: <path d="M12 1l-9 4v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>,
        trash: <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>,
        save: <path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.11 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/>,
        book: <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 18H6V4h12v16zM9 10h6v2H9z"/> // New book icon
    };
    return <svg style={style} viewBox="0 0 24 24" fill="currentColor">{icons[name] || null}</svg>;
};

const VolunteerPostContent = ({ user }) => {
  const [activeTab, setActiveTab] = useState('videos'); // State to manage active tab
  const [volunteerVideos, setVolunteerVideos] = useState([]);
  const [loadingVideos, setLoadingVideos] = useState(true);
  const [editingVideo, setEditingVideo] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editTags, setEditTags] = useState('');

  // No longer need cloudinaryCloudName here as it's not used in this display component
  // const cloudinaryCloudName = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;

  const fetchVideos = useCallback(async () => {
  if (!user?.uid) {
    setLoadingVideos(false);
    console.warn("User UID is not available. Cannot fetch videos for Post Content.");
    return;
  }

  setLoadingVideos(true);
  try {
    const videosRef = collection(db, "videos");
    const q = query(
      videosRef,
      where("userId", "==", user.uid),
      orderBy("uploadedAt", "desc")
    );

    const querySnapshot = await getDocs(q);

    const fetchedVideos = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      notes: doc.data().notes || '',
      tags: doc.data().tags || [],
    }));

    setVolunteerVideos(fetchedVideos);
    console.log("Videos fetched for Post Content:", fetchedVideos);
  } catch (error) {
    console.error("Error fetching videos for Post Content:", error);
    alert("Failed to load your videos on this page. Check console for details.");
  } finally {
    setLoadingVideos(false);
  }
}, [user?.uid, setVolunteerVideos]); // ✅ Include all required dependencies

useEffect(() => {
  if (activeTab === 'videos' && user?.uid) {
    fetchVideos(); // ✅ No warning now
  }
}, [user?.uid, activeTab, fetchVideos]);// ✅ added fetchVideos
 // Dependency array includes activeTab

  const handleEditClick = (video) => {
    setEditingVideo(video);
    setEditTitle(video.title);
    setEditNotes(video.notes);
    setEditTags(video.tags.join(', '));
  };

  const handleSaveEdit = async () => {
    if (!editingVideo) return;

    setLoadingVideos(true);
    try {
      const videoDocRef = doc(db, "videos", editingVideo.id);
      const updatedTags = editTags.split(',').map(tag => tag.trim()).filter(tag => tag !== '');

      // Update the volunteer's private video document
      await updateDoc(videoDocRef, {
        title: editTitle,
        notes: editNotes,
        tags: updatedTags,
      });

      // 🔥 Copy/Update to public_videos for learners
      // setDoc with { merge: true } will create the document if it doesn't exist, or update it if it does.
      const publicVideoRef = doc(db, "public_videos", editingVideo.id);
      await setDoc(publicVideoRef, {
        title: editTitle,
        notes: editNotes,
        tags: updatedTags,
        cloudinaryUrl: editingVideo.cloudinaryUrl, // Ensure this field is retained
        uploadedAt: editingVideo.uploadedAt, // Ensure this field is retained (Firestore Timestamp)
        volunteerId: user.uid,
        status: "Published" // Ensure status is set/updated
      }, { merge: true });

      alert('Video updated successfully!');
      setEditingVideo(null);
      setEditTitle('');
      setEditNotes('');
      setEditTags('');
      fetchVideos(); // Re-fetch to update the list
    } catch (error) {
      console.error("Error updating video:", error);
      alert("Failed to update video: " + error.message);
    } finally {
      setLoadingVideos(false);
    }
  };

  const handleDeleteClick = async (videoId, videoTitle) => {
    if (window.confirm(`Are you sure you want to delete "${videoTitle}"? This action cannot be undone.`)) {
      setLoadingVideos(true);
      try {
        const videoDocRef = doc(db, "videos", videoId);
        await deleteDoc(videoDocRef);

        // Also delete from public_videos collection
        const publicVideoRef = doc(db, "public_videos", videoId);
        await deleteDoc(publicVideoRef);

        if (user && user.uid) {
            const userDocRef = doc(db, "users", user.uid);
            await updateDoc(userDocRef, {
                "stats.videosPosted": increment(-1)
            });
        }

        alert('Video deleted successfully!');
        fetchVideos(); // Re-fetch to update the list
      } catch (error) {
        console.error("Error deleting video:", error);
        alert("Failed to delete video: " + error.message);
      } finally {
        setLoadingVideos(false);
      }
    }
  };

  // Styles for the content management page - Adjusted to be a card-like component
  const contentPageStyles = {
    container: { padding: '30px', background: '#fff', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' },
    header: { color: '#111827', borderBottom: '1px solid #e5e7eb', paddingBottom: '15px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    tabContainer: { display: 'flex', marginBottom: '20px', borderBottom: '2px solid #e5e7eb' },
    tabButton: {
      padding: '10px 20px',
      border: 'none',
      background: 'transparent',
      cursor: 'pointer',
      fontSize: '1rem',
      fontWeight: 500,
      color: '#6b7280',
      borderBottom: '2px solid transparent',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'all 0.3s ease',
      borderTopLeftRadius: '8px',
      borderTopRightRadius: '8px',
      // Adding hover effect
      '&:hover': { backgroundColor: '#f0f4ff' }
    },
    activeTabButton: {
      color: '#4f46e5',
      borderBottom: '2px solid #0891b2',
      backgroundColor: '#eff6ff',
      fontWeight: '600'
    },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '25px', flexGrow: 1 },
    videoCard: { border: '1px solid #e5e7eb', borderRadius: '12px', padding: '15px', display: 'flex', flexDirection: 'column', gap: '10px', backgroundColor: '#f9fafb', overflow: 'hidden', position: 'relative' },
    videoPlayer: { width: '100%', height: 'auto', maxHeight: '200px', borderRadius: '8px', backgroundColor: '#000', objectFit: 'cover' },
    videoDetails: { flexGrow: 1 },
    videoTitle: { margin: '0', color: '#374151', fontSize: '1.2rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
    videoInfo: { fontSize: '0.85rem', color: '#6b7280', margin: '5px 0' },
    tagsContainer: { fontSize: '0.75rem', color: '#4f46e5', margin: '5px 0' },
    tag: { display: 'inline-block', background: '#eef2ff', padding: '4px 8px', borderRadius: '6px', marginRight: '5px', marginBottom: '5px' },
    statusBadge: { fontSize: '0.8rem', fontWeight: 500, padding: '4px 8px', borderRadius: '12px', alignSelf: 'flex-start' },
    notesSection: { borderTop: '1px solid #e5e7eb', paddingTop: '10px', marginTop: '10px', fontSize: '0.9rem', color: '#4b5563', overflow: 'auto', maxHeight: '80px' },
    notesText: { whiteSpace: 'pre-wrap', margin: 0 },
    actions: { display: 'flex', gap: '10px', marginTop: '15px', borderTop: '1px solid #e5e7eb', paddingTop: '15px' },
    actionButton: { padding: '8px 12px', borderRadius: '8px', border: '1px solid #d1d5db', background: '#f3f4f6', color: '#374151', cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '5px', transition: 'background-color 0.2s', '&:hover': { backgroundColor: '#e5e7eb' } },
    deleteButton: { background: '#fee2e2', borderColor: '#ef4444', color: '#b91c1c', '&:hover': { backgroundColor: '#fecaca' } },
    placeholder: { textAlign: 'center', marginTop: '50px', color: '#6b7280' },
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
    modalContent: { background: '#fff', borderRadius: '16px', padding: '30px', minWidth: '400px', maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '15px', boxShadow: '0 8px 20px rgba(0,0,0,0.2)' },
    modalTitle: { margin: 0, color: '#111827', fontSize: '1.5rem', marginBottom: '10px' },
    modalInput: { width: 'calc(100% - 20px)', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '1rem', color: '#374151' },
    modalTextarea: { width: 'calc(100% - 20px)', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '1rem', color: '#374151', minHeight: '80px', resize: 'vertical' },
    modalLabel: { fontSize: '0.9rem', color: '#4b5563', marginBottom: '5px' },
    modalActions: { display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '15px' },
    modalButton: { padding: '10px 20px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#f3f4f6', color: '#374151', cursor: 'pointer', fontSize: '0.95rem', fontWeight: 500, transition: 'background-color 0.2s' },
    modalPrimaryButton: { background: '#4f46e5', color: '#fff', border: '1px solidrgb(17, 149, 134)', '&:hover': { background: '#6366f1' } },
    modalCancelButton: { '&:hover': { background: '#e5e7eb' } },
  };

  return (
    <div style={contentPageStyles.container}>
      <header style={contentPageStyles.header}>
        <h1>Your Content Management</h1>
      </header>

      <div style={contentPageStyles.tabContainer}>
        <button
          onClick={() => setActiveTab('videos')}
          style={{
            ...contentPageStyles.tabButton,
            ...(activeTab === 'videos' ? contentPageStyles.activeTabButton : {})
          }}
        >
          <Icon name="videos" style={{width: '20px', height: '20px'}} /> 🎞 My Videos
        </button>
        <button
          onClick={() => setActiveTab('courses')}
          style={{
            ...contentPageStyles.tabButton,
            ...(activeTab === 'courses' ? contentPageStyles.activeTabButton : {})
          }}
        >
          <Icon name="book" style={{width: '20px', height: '20px'}} /> 📚 My Courses
        </button>
      </div>

      {activeTab === 'videos' && (
        <>
          {loadingVideos ? (
            <p style={contentPageStyles.placeholder}>Loading your videos...</p>
          ) : volunteerVideos.length > 0 ? (
            <div style={contentPageStyles.grid}>
              {volunteerVideos.map(video => (
                <div key={video.id} style={contentPageStyles.videoCard}>
                  <h4 style={contentPageStyles.videoTitle} title={video.title}>{video.title}</h4>
                  <video controls style={contentPageStyles.videoPlayer} src={video.cloudinaryUrl}>
                    Your browser does not support the video tag.
                  </video>
                  <div style={contentPageStyles.videoDetails}>
                    <p style={contentPageStyles.videoInfo}>Uploaded: {video.uploadedAt?.toDate()?.toLocaleDateString() || 'N/A'}</p>
                    {video.tags && video.tags.length > 0 && (
                      <div style={contentPageStyles.tagsContainer}>
                        <strong>Tags: </strong>
                        {video.tags.map((tag, index) => (
                          <span key={index} style={contentPageStyles.tag}>{tag}</span>
                        ))}
                      </div>
                    )}
                    <span style={{...contentPageStyles.statusBadge, ...(video.status === 'Published' ? {background: '#dcfce7', color: '#166534'} : {background: '#fef3c7', color: '#92400e'})}}>
                      {video.status}
                    </span>
                    {video.notes && (
                      <div style={contentPageStyles.notesSection}>
                        <strong style={{color: '#374151'}}>Notes:</strong>
                        <p style={contentPageStyles.notesText}>{video.notes}</p>
                      </div>
                    )}
                  </div>
                  <div style={contentPageStyles.actions}>
                    <button
                      onClick={() => handleEditClick(video)}
                      style={contentPageStyles.actionButton}
                    >
                      <Icon name="edit" style={{width: '18px', height: '18px'}} /> Edit
                    </button>
                    <button
                      onClick={() => handleDeleteClick(video.id, video.title)}
                      style={{...contentPageStyles.actionButton, ...contentPageStyles.deleteButton}}
                    >
                      <Icon name="trash" style={{width: '18px', height: '18px'}} /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={contentPageStyles.placeholder}>
              <p style={{ fontSize: '1.1rem' }}>You haven't posted any videos yet.</p>
              <p style={{ color: '#9ca3af' }}>Go to your <Link to="/volunteer-dashboard" style={{color: '#4f46e5', textDecoration: 'underline'}}>Dashboard</Link> and click "Post a New Video" to get started!</p>
            </div>
          )}
        </>
      )}

      {activeTab === 'courses' && (
        // Render the VolunteerCourseManager component for the 'courses' tab
        <VolunteerCourseManager user={user} Icon={Icon} />
      )}

      {/* Edit Video Modal (Remains within VolunteerPostContent, only appears when activeTab is 'videos' and editingVideo is set) */}
      {editingVideo && (
        <div style={contentPageStyles.modalOverlay}>
          <div style={contentPageStyles.modalContent}>
            <h3 style={contentPageStyles.modalTitle}>Edit Video: {editingVideo.title}</h3>

            <div>
              <label htmlFor="editTitle" style={contentPageStyles.modalLabel}>Video Title</label>
              <input
                id="editTitle"
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                style={contentPageStyles.modalInput}
              />
            </div>

            <div>
              <label htmlFor="editNotes" style={contentPageStyles.modalLabel}>Notes (Private)</label>
              <textarea
                id="editNotes"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                style={contentPageStyles.modalTextarea}
                placeholder="Add private notes about this video (e.g., topics covered, intended audience, improvement ideas)."
              />
            </div>

            <div>
              <label htmlFor="editTags" style={contentPageStyles.modalLabel}>Tags (Comma-separated, for AI recommendations)</label>
              <input
                id="editTags"
                type="text"
                value={editTags}
                onChange={(e) => setEditTags(e.target.value)}
                style={contentPageStyles.modalInput}
                placeholder="e.g., Math, Algebra, Grade 5, Fractions"
              />
            </div>

            <div style={contentPageStyles.modalActions}>
              <button
                onClick={() => setEditingVideo(null)}
                style={{...contentPageStyles.modalButton, ...contentPageStyles.modalCancelButton}}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                style={{...contentPageStyles.modalButton, ...contentPageStyles.modalPrimaryButton}}
                disabled={loadingVideos}
              >
                <Icon name="save" style={{width: '18px', height: '18px', marginRight: '5px'}} />
                {loadingVideos ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VolunteerPostContent;