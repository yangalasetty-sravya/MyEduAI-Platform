import React, { useState, useEffect,useCallback } from 'react';
import { db,auth } from '../../firebase';
import { limit, getDoc } from 'firebase/firestore'; // Import getDoc to read user document

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';


// Import necessary Firestore functions
import { doc, collection, addDoc, updateDoc, increment, query, where, orderBy, getDocs,setDoc } from 'firebase/firestore';

// --- SVG ICONS (Self-contained for easy integration) ---
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
        certificate: <path d="M22 10v6c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V4h18c1.1 0 2 .9 2 2v4zm-2 0h-4c0-1.1.9-2 2-2s2 .9 2 2zm-12 8h8v-2H8v2zm0-4h8v-2H8v2zm0-4h8V8H8v2zm12-4H4V6h16v2z"/>, // Example certificate icon
    };
    return <svg style={style} viewBox="0 0 24 24" fill="currentColor">{icons[name] || null}</svg>;
};

// --- Badge Definitions ---
// In a real application, these might be fetched from a Firestore collection



const badgeDefinitions = {
    'first_video_hero': {
        name: 'First Lesson Hero',
        description: 'Uploaded your very first lesson!',
        condition: (stats) => stats.videosPosted === 1,
        icon: 'badges', 
        color: '#8b5cf6'
    },
    'five_lessons_pro': {
        name: 'Five Lessons Pro',
        description: 'Published 5 or more lessons.',
        condition: (stats) => stats.videosPosted >= 5,
        icon: 'badges',
        color: '#22c55e'
    },
    'ten_lessons_master': {
        name: 'Ten Lessons Master',
        description: 'Reached 10 published lessons.',
        condition: (stats) => stats.videosPosted >= 10,
        icon: 'badges',
        color: '#f59e0b'
    },
    'feedback_collector': { // Example: Badge for receiving feedback
        name: 'Feedback Collector',
        description: 'Received feedback from 5 or more learners.',
        condition: (stats, feedbackCount) => feedbackCount >= 5, // Condition relies on feedback count
        icon: 'messages',
        color: '#ef4444'
    }
};

// --- Main Dashboard Component ---
const VolunteerDashboard = ({ user, onVideoPostedSuccess }) => {
    console.log("User UID (on component load):", user?.uid);

    const {
        name = 'Volunteer',
        stats = { videosPosted: 0, learnersHelped: 0, badgesEarned: 0 },
    } = user || {};

    const [postStatus, setPostStatus] = useState(null); // 'loading', 'success', 'error', null
    const [showCelebration, setShowCelebration] = useState(false);
    const [showVideoForm, setShowVideoForm] = useState(false);
    const [videoTitle, setVideoTitle] = useState('');
    const [videoFile, setVideoFile] = useState(null);

    // States for managing and displaying the volunteer's videos
    const [volunteerVideos, setVolunteerVideos] = useState([]);
    const [loadingVideos, setLoadingVideos] = useState(true);
    
    // States for feedback and badges
    const [learnerFeedback, setLearnerFeedback] = useState([]);
    const [loadingFeedback, setLoadingFeedback] = useState(true);
    const [totalFeedbackCount, setTotalFeedbackCount] = useState(0);
    const [positiveFeedbackCount, setPositiveFeedbackCount] = useState(0);
    const [negativeFeedbackCount, setNegativeFeedbackCount] = useState(0);
    const [earnedBadgesDisplay, setEarnedBadgesDisplay] = useState([]); // To display earned badges

    const [refreshContentTrigger, setRefreshContentTrigger] = useState(0); // Trigger re-fetching content

    // Cloudinary Configuration (from .env)
    const cloudinaryCloudName = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
    const cloudinaryUploadPreset = 'eduai_video_upload'; 
    const [volunteerData, setVolunteerData] = useState(null);
    const engagementData = [
  { name: 'Videos', count: volunteerData?.stats?.videosPosted || 0 },
  { name: 'Topics', count: volunteerData?.stats?.topicsCovered || 0 },
  { name: 'Feedback', count: volunteerData?.stats?.totalFeedback || 0 },
  { name: 'Forum Replies', count: volunteerData?.stats?.forumReplies || 0 },
];



    useEffect(() => {
  const fetchVolunteerData = async () => {
    const user = auth.currentUser;
    if (user) {
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setVolunteerData(docSnap.data());
      }
    }
  };

  fetchVolunteerData();
}, []);



    const fetchVolunteerVideos = useCallback(async () => {
  if (!user?.uid) {
    setLoadingVideos(false);
    console.warn("User UID is not available to fetch videos. Skipping fetch.");
    return;
  }

  setLoadingVideos(true);
  try {
    const videosRef = collection(db, "videos");
    const q = query(videosRef, where("userId", "==", user.uid), orderBy("uploadedAt", "desc"), limit(2));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      setVolunteerVideos([]);
    } else {
      const fetchedVideos = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setVolunteerVideos(fetchedVideos);
    }
  } catch (error) {
    console.error("Error fetching volunteer videos:", error);
  } finally {
    setLoadingVideos(false);
  }
}, [user?.uid]);

// ✅ 2. fetchLearnerFeedback wrapped with useCallback
const fetchLearnerFeedback = useCallback(async () => {
  if (!user?.uid) {
    setLoadingFeedback(false);
    return;
  }

  setLoadingFeedback(true);
  try {
    const feedbackRef = collection(db, "volunteer_feedback");
    const q = query(feedbackRef, where("volunteerId", "==", user.uid), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);

    let fetchedAllFeedback = [];
    let positiveCount = 0;
    let negativeCount = 0;

    if (!querySnapshot.empty) {
      fetchedAllFeedback = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      }));

      fetchedAllFeedback.forEach(item => {
        const feedbackText = item.feedback ? item.feedback.toLowerCase() : '';
        if (feedbackText.includes("good") || feedbackText.includes("great") || feedbackText.includes("excellent") || feedbackText.includes("helpful") || feedbackText.includes("awesome") || feedbackText.includes("love")) {
          positiveCount++;
        } else if (feedbackText.includes("bad") || feedbackText.includes("poor") || feedbackText.includes("not good") || feedbackText.includes("needs improvement") || feedbackText.includes("confusing")) {
          negativeCount++;
        }
      });
    }

    setLearnerFeedback(fetchedAllFeedback.slice(0, 2));
    setTotalFeedbackCount(fetchedAllFeedback.length);
    setPositiveFeedbackCount(positiveCount);
    setNegativeFeedbackCount(negativeCount);

    await checkAndAwardBadges(user?.uid, user.stats, fetchedAllFeedback.length);
  } catch (error) {
    console.error("Error fetching learner feedback:", error);
  } finally {
    setLoadingFeedback(false);
  }
}, [user?.uid, user?.stats]);

// ✅ 3. fetchEarnedBadges wrapped with useCallback
const fetchEarnedBadges = useCallback(async () => {
  if (!user?.uid) return;

  try {
    const userDocRef = doc(db, "users", user.uid);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
      const userData = userDocSnap.data();
      const badges = userData.earnedBadges || {};

      const displayableBadges = Object.keys(badges).filter(badgeId => {
        return badgeDefinitions[badgeId] && (badges[badgeId] === true || (typeof badges[badgeId] === 'object' && badges[badgeId].earnedAt));
      });
      setEarnedBadgesDisplay(displayableBadges);
    }
  } catch (error) {
    console.error("Error fetching earned badges:", error);
  }
}, [user?.uid]);


    // Check and award badges based on current user stats and potentially feedback count
    const checkAndAwardBadges = async (userId, currentStats, currentFeedbackCount = 0) => {
        if (!userId) return;

        try {
            const userDocRef = doc(db, "users", userId);
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists()) {
                const userData = userDocSnap.data();
                const actualStats = userData.stats || { videosPosted: 0, learnersHelped: 0, badgesEarned: 0 };
                const currentEarnedBadges = userData.earnedBadges || {};

                let newBadgeAwarded = false;
                let updates = {};
                let updatedEarnedBadges = { ...currentEarnedBadges };

                for (const badgeId in badgeDefinitions) {
                    const badge = badgeDefinitions[badgeId];
                    // Check if condition met AND badge not already earned
                    // Pass currentFeedbackCount to the condition if the badge needs it
                    const conditionMet = badge.condition(actualStats, currentFeedbackCount);

                    if (conditionMet && !updatedEarnedBadges[badgeId]) { 
                        updatedEarnedBadges[badgeId] = { earnedAt: new Date(), name: badge.name };
                        updates[`earnedBadges.${badgeId}`] = { earnedAt: new Date(), name: badge.name }; // Firestore dot notation for nested map update
                        updates["stats.badgesEarned"] = increment(1); 
                        newBadgeAwarded = true;
                    }
                }

                if (newBadgeAwarded) {
                    await updateDoc(userDocRef, updates);
                    console.log("🎉 New badges awarded and user stats updated!");
                    setShowCelebration(true);
                    setTimeout(() => setShowCelebration(false), 3000); 
                    setRefreshContentTrigger(prev => prev + 1); // Trigger re-fetch of badges and stats display
                }
            }
        } catch (error) {
            console.error("Error checking or awarding badges:", error);
        }
    };


    // useEffect hook to trigger fetching when component mounts or relevant states change
  useEffect(() => {
  fetchVolunteerVideos();
  fetchLearnerFeedback();
  fetchEarnedBadges();
}, [user?.uid, refreshContentTrigger, fetchVolunteerVideos, fetchLearnerFeedback, fetchEarnedBadges]);


    // Handler for posting a new video
    const handlePostVideo = async () => {
        if (!videoFile) {
            alert("Please select a video file to upload.");
            return;
        }
        if (!videoTitle.trim()) {
            alert("Please enter a title for your video.");
            return;
        }
        if (!cloudinaryCloudName || cloudinaryCloudName === 'your_cloudinary_cloud_name_here') { 
             alert("Cloudinary Cloud Name is not configured. Please check your .env file.");
             console.error("Cloudinary Cloud Name is missing or default. Check REACT_APP_CLOUDINARY_CLOUD_NAME in .env");
             return;
        }

        setPostStatus('loading');

        const formData = new FormData();
        formData.append("file", videoFile);
        formData.append("upload_preset", cloudinaryUploadPreset);
        formData.append("context", `alt=${videoTitle}`); 
        formData.append("folder", "user_videos"); 

        try {
            const res = await fetch(
                `https://api.cloudinary.com/v1_1/${cloudinaryCloudName}/video/upload`,
                {
                    method: "POST",
                    body: formData,
                }
            );

            const data = await res.json();
            console.log("📦 Cloudinary response:", data);

            if (res.ok && data.secure_url) {
                try {
                    const videosCollectionRef = collection(db, "videos");
                   const newDocRef = await addDoc(videosCollectionRef, {
                        userId: user.uid,
                        title: videoTitle,
                        cloudinaryUrl: data.secure_url,
                        publicId: data.public_id,
                        thumbnailUrl: data.thumbnail_url || `https://res.cloudinary.com/${cloudinaryCloudName}/video/upload/w_100,h_56,c_fill,f_jpg/${data.public_id}.jpg`,
                        uploadedAt: new Date(),
                        status: 'Published',
                    });

                    const publicVideoRef = doc(db, "public_videos", newDocRef.id);
                    await setDoc(publicVideoRef, {
                        title: videoTitle,
                        cloudinaryUrl: data.secure_url,
                        uploadedAt: new Date(),
                        volunteerId: user.uid,
                        thumbnailUrl: data.thumbnail_url || `https://res.cloudinary.com/${cloudinaryCloudName}/video/upload/w_100,h_56,c_fill,f_jpg/${data.public_id}.jpg`,
                        status: "Published"
                    }, { merge: true });
                    
                    console.log("✅ Video metadata saved to Firestore!");
                } catch (firestoreError) {
                    console.error("❌ Error saving video metadata to Firestore:", firestoreError);
                    alert("Error saving video details after upload: " + firestoreError.message);
                    setPostStatus('error');
                    setTimeout(() => setPostStatus(null), 3000);
                    return; 
                }

                // Update user's video count in Firestore
                if (user && user.uid) {
                    try {
                        const userDocRef = doc(db, "users", user.uid);
                        // Increment videosPosted first
                        await updateDoc(userDocRef, {
                            "stats.videosPosted": increment(1)
                        });
                        console.log("✅ User stats updated in Firestore!");
                        // Then immediately check and award badges based on the *new* count
                        // We pass user.stats (which might be slightly old) but checkAndAwardBadges will fetch latest
                        await checkAndAwardBadges(user.uid, { ...user.stats, videosPosted: user.stats.videosPosted + 1 }); 
                    } catch (statsError) {
                        console.error("❌ Error updating user stats or awarding badges:", statsError);
                        alert("Error updating user video count: " + statsError.message);
                    }
                }

                setPostStatus('success');
                setShowVideoForm(false);
                setVideoTitle('');
                setVideoFile(null);
                alert("✅ Video uploaded and saved!");
                
                // Trigger re-fetching of content library and stats to show the new video and updated stats
                setRefreshContentTrigger(prev => prev + 1);

                if (onVideoPostedSuccess) {
                    onVideoPostedSuccess(); 
                }
            } else {
                const errorMessage = data.error?.message || "Unknown Cloudinary upload failure";
                throw new Error(errorMessage);
            }
        } catch (err) {
            console.error("❌ Upload error:", err);
            setPostStatus('error');
            alert("❌ Upload failed: " + err.message);
        } finally {
            setTimeout(() => setPostStatus(null), 3000);
        }
    };

    // Conceptual function for downloading a certificate
    const handleDownloadCertificate = (certificateType) => {
        alert(`Simulating download for "${certificateType}" Certificate. In a real app, this would trigger a backend service to generate and provide a PDF.`);
        console.log(`Certificate requested: ${certificateType}`);
        // Example: You might open a new tab to a backend endpoint:
        // window.open(`/api/generate-certificate?type=${certificateType}&userId=${user.uid}`, '_blank');
    };

  return (
    <>
      {/* CSS for animations and responsive design */}
      <style>
        {`
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes slideInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
          }
          @keyframes pulse {
            0% { transform: scale(0.9); opacity: 0.7; }
            50% { transform: scale(1); opacity: 1; }
            100% { transform: scale(0.9); opacity: 0.7; }
          }
          @keyframes celebrateFadeOut {
            0% { opacity: 1; transform: translateY(0); }
            100% { opacity: 0; transform: translateY(-50px); }
          }
          
          /* Responsive adjustments for smaller screens */
          @media (max-width: 768px) {
            .dashboard-grid { 
                grid-template-columns: 1fr !important;
                gap: 20px;
            }
            .statBox { flex-direction: column; text-align: center; gap: 5px !important; }
            .header { flex-direction: column; align-items: flex-start; gap: 20px; }
            .contentThumbnail { width: 80px; height: 45px; }
            .performanceMetrics { grid-template-columns: 1fr !important; } 
            .badgesContainer { grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)) !important; }
          }
        `}
      </style>

      {/* Celebration Overlay */}
      {showCelebration && (
        <div style={styles.celebrationOverlay}>
          <div style={styles.celebrationBox}>
            <Icon name="badges" style={styles.celebrationIcon} />
            <h2 style={styles.celebrationTitle}>Congratulations!</h2>
            <p style={styles.celebrationText}>You earned a new badge!</p>
          </div>
        </div>
      )}

          {/* Header Section */}
          <header style={styles.header}>
            <div>
              <h1 style={styles.headerTitle}>Welcome back, {name}!</h1>
              <p style={styles.headerSubtitle}>Ready to inspire and educate today?</p>
            </div>
            <div style={styles.statsContainer}>
                <div style={styles.statBox}>
                    <div style={{...styles.statIconContainer, background: '#fef3c7'}}><Icon name="videos" style={{...styles.statIcon, color: '#f59e0b'}}/></div>
                    <div><span>{stats.videosPosted}</span>Videos Posted</div>
                </div>
                <div style={styles.statBox}>
                    <div style={{...styles.statIconContainer, background: '#dcfce7'}}><Icon name="learners" style={{...styles.statIcon, color: '#22c55e'}}/></div>
                    <div><span>{stats.learnersHelped}</span>Learners Helped</div>
                </div>
                <div style={styles.statBox}>
                    <div style={{...styles.statIconContainer, background: '#ede9fe'}}><Icon name="badges" style={{...styles.statIcon, color: '#8b5cf6'}}/></div>
                    <div><span>{stats.badgesEarned}</span>Badges Earned</div>
                </div>
            </div>
          </header>

          {/* Upload Video Popup */}
          {showVideoForm && (
            <div style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0, 0, 0, 0.6)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', zIndex: 999
            }}>
              <div style={{
                background: '#fff', borderRadius: '16px', padding: '30px', minWidth: '350px',
                display: 'flex', flexDirection: 'column', gap: '20px',
                boxShadow: '0 8px 20px rgba(0,0,0,0.2)'
              }}>
                <h3 style={{margin: 0, color: '#111827'}}>Upload New Video</h3>
                <input
                    type="text"
                    placeholder="Video Title"
                    value={videoTitle}
                    onChange={(e) => setVideoTitle(e.target.value)}
                    style={uploadFormStyles.input}
                />
                <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => setVideoFile(e.target.files[0])}
                    style={uploadFormStyles.fileInput}
                />
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button
                      onClick={handlePostVideo}
                      disabled={postStatus === 'loading'}
                      style={{...uploadFormStyles.button, ...uploadFormStyles.primaryButton}}
                  >
                      {postStatus === 'loading' ? 'Uploading...' : 'Submit Video'}
                  </button>
                  <button
                      onClick={() => { setShowVideoForm(false); setVideoTitle(''); setVideoFile(null); }}
                      style={uploadFormStyles.button}
                  >
                      Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Dashboard Grid Sections */}
          <div style={styles.dashboardGrid}>
            {/* "Post a New Video" Card (Primary Action) */}
            <div
                style={{...styles.card, ...styles.primaryActionCard, cursor: postStatus === 'loading' ? 'not-allowed' : 'pointer'}}
                onClick={() => {
                    if (postStatus !== 'loading') {
                        setShowVideoForm(true);
                    }
                }}
            >
                {postStatus === 'loading' ? (
                    <div style={{
                        border: '4px solid rgba(255, 255, 255, 0.3)',
                        borderTop: '4px solid #fff',
                        borderRadius: '50%',
                        width: '30px',
                        height: '30px',
                        animation: 'spin 1s linear infinite',
                        marginBottom: '15px'
                    }}></div>
                ) : postStatus === 'success' ? (
                    <Icon name="check" style={styles.primaryActionIcon} />
                ) : postStatus === 'error' ? (
                    <Icon name="plus" style={styles.primaryActionIcon} /> 
                ) : (
                    <Icon name="plus" style={styles.primaryActionIcon} />
                )}
                <h3>
                    {postStatus === 'loading' ? 'Posting Video...' :
                     postStatus === 'success' ? 'Video Posted!' :
                     postStatus === 'error' ? 'Upload Failed!' :
                     'Post a New Lesson'}
                </h3>
                <p>
                    {postStatus === 'loading' ? 'Please wait...' :
                     postStatus === 'success' ? 'Keep up the great work!' :
                     postStatus === 'error' ? 'Please try again.' :
                     'Share your knowledge with a new lesson.'}
                </p>
            </div>
            
            {/* "Your Content Library" Card */}
            <div style={styles.card}>
                <h3 style={styles.cardTitle}>Your Content Library</h3>
                <div style={styles.contentList}>
                    {loadingVideos ? (
                        <p style={styles.placeholderText}>Loading lessons...</p>
                    ) : volunteerVideos.length > 0 ? (
                        volunteerVideos.map(item => (
                            <div key={item.id} style={styles.contentItem}>
                                <img
                                    src={item.thumbnailUrl || `https://res.cloudinary.com/${cloudinaryCloudName}/video/upload/w_100,h_56,c_fill,f_jpg/${item.publicId}.jpg`}
                                    alt={item.title}
                                    style={styles.contentThumbnail}
                                />
                                <div style={styles.contentDetails}>
                                    <span style={styles.contentTitle}>{item.title}</span>
                                    <span style={{fontSize: '0.75rem', color: '#6b7280'}}>Uploaded: {item.uploadedAt?.toDate()?.toLocaleDateString() || 'N/A'}</span>
                                    <span style={item.status === 'Published' ? styles.statusPublished : styles.statusDraft}>{item.status}</span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div style={styles.placeholderCardContent}>
                            <img src="https://via.placeholder.com/100x56?text=No+Lessons" alt="No lessons placeholder" style={styles.contentThumbnail} />
                            <p style={styles.placeholderText}>Your posted lessons will appear here.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* "Performance Overview" Card - UPDATED CONTENT */}
            <div style={{...styles.card, ...styles.performanceCard}}>
                <div style={styles.chartBackgroundIllustration} />
                <h3 style={styles.cardTitle}>Performance Overview</h3>
                <div style={styles.performanceMetrics}>
                    <div style={styles.metricItem}>
                        <Icon name="videos" style={{ ...styles.metricIcon, color: '#4f46e5' }} />
                        <div>
                            <span style={styles.metricValue}>{stats.videosPosted}</span>
                            <span style={styles.metricLabel}>Lessons Uploaded</span>
                        </div>
                    </div>
                    <div style={styles.metricItem}>
                        <Icon name="badges" style={{ ...styles.metricIcon, color: '#22c55e' }} />
                        <div>
                            {/* A simple proxy for "courses" or "topics" based on videos posted */}
                            <span style={styles.metricValue}>
                                {Math.min(stats.videosPosted, 10)} 
                            </span>
                            <span style={styles.metricLabel}>Topics Covered</span>
                        </div>
                    </div>
                    <div style={styles.metricItem}>
                        <Icon name="messages" style={{ ...styles.metricIcon, color: '#f59e0b' }} />
                        <div>
                            <span style={styles.metricValue}>{totalFeedbackCount}</span>
                            <span style={styles.metricLabel}>Total Feedback</span>
                        </div>
                    </div>
                    <div style={styles.metricItem}>
                        <Icon name="check" style={{ ...styles.metricIcon, color: '#22c55e' }} />
                        <div>
                            <span style={styles.metricValue}>{positiveFeedbackCount}</span>
                            <span style={styles.metricLabel}>Positive Feedback</span>
                        </div>
                    </div>
                    {negativeFeedbackCount > 0 && (
                        <div style={styles.metricItem}>
                            <Icon name="logout" style={{ ...styles.metricIcon, color: '#ef4444' }} /> 
                            <div>
                                <span style={styles.metricValue}>{negativeFeedbackCount}</span>
                                <span style={styles.metricLabel}>Negative Feedback</span>
                            </div>
                        </div>
                    )}
                </div>

                <h4 style={styles.subCardTitle}>Badges Earned</h4>
               <div style={styles.badgesContainer}>
  {earnedBadgesDisplay.length > 0 ? (
    earnedBadgesDisplay.map(badgeId => {
      const badge = badgeDefinitions[badgeId];
      return badge ? (
        <div key={badgeId} style={styles.badgeItem} title={badge.description}>
          <Icon name={badge.icon} style={{ ...styles.badgeIcon, color: badge.color }} />
          <span style={styles.badgeName}>{badge.name}</span>
        </div>
      ) : null;
    })
  ) : volunteerData?.earnedBadges ? (
    Object.values(volunteerData.earnedBadges).map((badge, index) => (
      <div key={index} className="badge">
        🏅 {badge.name}
      </div>
    ))
  ) : (
    <p>Earn badges by contributing more lessons!</p>
  )}
</div>


                <h4 style={styles.subCardTitle}>Certificates</h4>
                <div style={styles.certificatesContainer}>
                    {earnedBadgesDisplay.includes('first_video_hero') ? (
                        <button 
                            onClick={() => handleDownloadCertificate("First Course Completion")} 
                            style={styles.certificateButton}
                        >
                            <Icon name="certificate" style={styles.certificateIcon} />
                            Download First Lesson Certificate
                        </button>
                    ) : (
                        <p style={styles.placeholderText}>Upload your first lesson to earn a certificate!</p>
                    )}
                    {/* Add more certificate buttons for other milestones/badges if needed */}
                </div>

                <div className="engagement-chart-container" style={{ height: 300, marginTop: 20 }}>
  <ResponsiveContainer width="100%" height="100%">
    <BarChart data={engagementData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" />
      <YAxis allowDecimals={false} />
      <Tooltip />
      <Legend />
      <Bar dataKey="count" fill="#82ca9d" radius={[6, 6, 0, 0]} />
    </BarChart>
  </ResponsiveContainer>
</div>

            </div>

            {/* "Feedback from Learners" Card */}
            <div style={{...styles.card, gridColumn: 'span 2'}}>
                <h3 style={styles.cardTitle}>Feedback from Learners</h3>
                <div style={styles.feedbackList}>
                    {loadingFeedback ? (
                        <p style={styles.placeholderText}>Loading feedback...</p>
                    ) : learnerFeedback.length > 0 ? (
                        learnerFeedback.map(item => (
                            <div key={item.id} style={styles.feedbackItem}>
                                <img src={item.learnerAvatar || 'https://i.pravatar.cc/40?img=placeholder'} alt={item.learnerName || 'Anonymous Learner'} style={styles.feedbackAvatar}/>
                                <p><strong>{item.learnerName || 'Anonymous'}:</strong> "{item.feedback || 'No comment provided.'}"</p>
                            </div>
                        ))
                    ) : (
                        <div style={styles.placeholderCardContent}>
                            <img src="https://i.pravatar.cc/40?img=empty" alt="No feedback placeholder" style={styles.feedbackAvatar}/>
                            <p style={styles.placeholderText}>Feedback from learners will appear here.</p>
                        </div>
                    )}
                </div>
            </div>
          </div>
    </>
  );
};

// --- STYLES (CSS-in-JS) ---
const uploadFormStyles = {
    input: {
        width: 'calc(100% - 20px)', padding: '10px', margin: '0 0 5px 0', border: '1px solid #e5e7eb',
        borderRadius: '8px', fontSize: '1rem', color: '#374151',
    },
    fileInput: {
        width: '100%', padding: '10px 0', marginBottom: '5px', color: '#374151',
    },
    button: {
        padding: '10px 20px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#f3f4f6',
        color: '#374151', cursor: 'pointer', fontSize: '0.95rem', fontWeight: 500,
        transition: 'background-color 0.2s, border-color 0.2s',
        '&:hover': { background: '#e5e7eb' }, '&:disabled': { opacity: 0.6, cursor: 'not-allowed' },
    },
    primaryButton: {
        background: '#4f46e5', color: '#fff', border: '1px solidrgb(37, 157, 159)',
        '&:hover': { background: '#6366f1', borderColor: '#6366f1' },
    }
};

const styles = {
  celebrationOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, animation: 'fadeIn 0.3s ease-out' },
  celebrationBox: { backgroundColor: '#fff', padding: '40px', borderRadius: '20px', textAlign: 'center', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)', color: '#111827', animation: 'pulse 1.5s infinite alternate, celebrateFadeOut 3s forwards 0.5s', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: '300px' },
  celebrationIcon: { width: '80px', height: '80px', color: '#8b5cf6', marginBottom: '20px' },
  celebrationTitle: { fontSize: '2.5rem', fontWeight: 700, margin: '0 0 10px 0', color: '#4f46e5' },
  celebrationText: { fontSize: '1.2rem', margin: 0, color: '#374151' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap' },
  headerTitle: { margin: 0, fontSize: '2rem', fontWeight: 700, color: '#111827' },
  headerSubtitle: { margin: '5px 0 0 0', color: '#6b7280' },
  statsContainer: { display: 'flex', gap: '20px' },
  statBox: { display: 'flex', alignItems: 'center', gap: '15px', backgroundColor: '#ffffff', padding: '15px 20px', borderRadius: '12px', border: '1px solid #e5e7eb', color: '#6b7280' },
  'statBox > div > span': { display: 'block', fontSize: '1.5rem', fontWeight: 700, color: '#111827', lineHeight: '1.2' },
  statIconContainer: { padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  statIcon: { width: '24px', height: '24px' },
  dashboardGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '25px' },
  card: { backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '25px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)', animation: 'slideInUp 0.5s ease-out backwards', position: 'relative', overflow: 'hidden', transition: 'transform 0.2s ease, box-shadow 0.2s ease' },
  primaryActionCard: { background: '#4f46e5', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#ffffff', border: 'none', gridColumn: 'span 1' },
  primaryActionIcon: { width: '48px', height: '48px', marginBottom: '15px' },
  cardTitle: { marginTop: 0, marginBottom: '20px', borderBottom: '1px solid #e5e7eb', paddingBottom: '10px', color: '#111827', zIndex: 2, position: 'relative' },
  placeholderText: { color: '#9ca3af', fontSize: '0.9rem', textAlign: 'center', width: '100%', marginTop: '20px' },
  placeholderCardContent: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '120px' },
  contentList: { display: 'flex', flexDirection: 'column', gap: '15px' },
  contentItem: { display: 'flex', alignItems: 'center', gap: '15px' },
  contentThumbnail: { width: '100px', height: '56px', borderRadius: '8px', objectFit: 'cover', backgroundColor: '#e5e7eb', flexShrink: 0 },
  contentDetails: { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', overflow: 'hidden' },
  contentTitle: { fontWeight: 500, color: '#374151', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  statusPublished: { background: '#dcfce7', color: '#166534', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 500 },
  statusDraft: { background: '#fef3c7', color: '#92400e', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 500 },
  performanceCard: { gridColumn: 'span 2' },
  chartPlaceholder: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '180px', zIndex: 2, position: 'relative', marginTop: '20px', borderTop: '1px solid #e5e7eb', paddingTop: '20px' }, 
  chartBackgroundIllustration: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: `radial-gradient(circle at 1px 1px, #f3f4f6 1px, transparent 0), radial-gradient(circle at 10px 10px, #f3f4f6 1px, transparent 0)`, backgroundSize: '20px 20px', opacity: 0.8, zIndex: 1 },
  feedbackList: { display: 'flex', flexDirection: 'column', gap: '15px' },
  feedbackItem: { display: 'flex', alignItems: 'flex-start', gap: '15px' },
  feedbackAvatar: { width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', backgroundColor: '#e5e7eb', flexShrink: 0 },
  'feedbackItem > p': { margin: 0, color: '#4b5563', flex: 1, fontStyle: 'italic', fontSize: '0.95rem' },

  // NEW STYLES for Performance Overview Metrics & Badges & Certificates
  performanceMetrics: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
      gap: '20px',
      marginBottom: '30px',
      position: 'relative', 
      zIndex: 2,
  },
  metricItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      backgroundColor: '#f9fafb', 
      padding: '15px',
      borderRadius: '12px',
      border: '1px solid #e5e7eb',
  },
  metricIcon: {
      width: '28px',
      height: '28px',
      flexShrink: 0,
  },
  metricValue: {
      fontSize: '1.75rem',
      fontWeight: 700,
      color: '#111827',
      lineHeight: 1,
  },
  metricLabel: {
      fontSize: '0.85rem',
      color: '#6b7280',
      lineHeight: 1,
  },
  subCardTitle: {
      marginTop: '20px', 
      marginBottom: '15px',
      borderBottom: '1px solid #e5e7eb',
      paddingBottom: '10px',
      color: '#111827',
      fontSize: '1.25rem',
      position: 'relative',
      zIndex: 2,
  },
  badgesContainer: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
      gap: '15px',
      position: 'relative',
      zIndex: 2,
      marginBottom: '20px', 
  },
  badgeItem: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '8px',
      backgroundColor: '#f9fafb',
      padding: '15px',
      borderRadius: '12px',
      border: '1px solid #e5e7eb',
      textAlign: 'center',
  },
  badgeIcon: {
      width: '40px',
      height: '40px',
  },
  badgeName: {
      fontSize: '0.9rem',
      fontWeight: 600,
      color: '#374151',
  },
  certificatesContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    marginTop: '15px',
    position: 'relative',
    zIndex: 2,
  },
  certificateButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 20px',
    borderRadius: '12px',
    border: '1px solid #4f46e5',
    background: '#4f46e5',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '0.95rem',
    fontWeight: 600,
    transition: 'background-color 0.2s, border-color 0.2s, transform 0.1s',
    justifyContent: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    '&:hover': {
        background: '#6366f1',
        borderColor: '#6366f1',
        transform: 'translateY(-1px)',
    },
    '&:active': {
        transform: 'translateY(0)',
    }
  },
  certificateIcon: {
    width: '24px',
    height: '24px',
    color: '#fff',
  }
};

export default VolunteerDashboard;