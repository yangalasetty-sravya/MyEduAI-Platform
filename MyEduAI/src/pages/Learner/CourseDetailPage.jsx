import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, setDoc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore'; // Ensure all Firestore methods are imported
import { db, auth } from '../../firebase'; // Ensure auth is imported from firebase
import './CourseDetailPage.css';
import { generateCertificate } from '../../utils/certificateGenerator';


const CourseDetailPage = () => {
  const { id } = useParams(); // This 'id' is the Firestore document ID for the course
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openModules, setOpenModules] = useState({});
  const [selectedVideoInfo, setSelectedVideoInfo] = useState(null); // Stores basic info from course.modules.lessons
  const [activeTab, setActiveTab] = useState('overview');

  // New states for the currently loaded video's full data and transcript
  const [currentVideoFullData, setCurrentVideoFullData] = useState(null); // Stores data fetched from 'public_videos'
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoError, setVideoError] = useState(null);
  const [transcriptContent, setTranscriptContent] = useState('');
  const [transcriptLoading, setTranscriptLoading] = useState(false);
  const [transcriptError, setTranscriptError] = useState(null);
  const [courseCompleted, setCourseCompleted] = useState(false);
  // Using Set to efficiently store unique video IDs that have been watched
  const [watchedVideos, setWatchedVideos] = useState(new Set());
  const [feedbackText, setFeedbackText] = useState('');
  const [rating, setRating] = useState(0);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);


  const handleSubmitFeedback = async () => {
    const user = auth.currentUser;
    console.log('handleSubmitFeedback called.');
    const currentUser = auth.currentUser;
    console.log('Current User (auth.currentUser):', user);
    console.log('Course Data:', course);
    console.log('Course ID:', course?.id); // Check course.id
    console.log('Course Volunteer ID:', course?.volunteerId); // Check course.volunteerId

    if (!user) {
      console.warn("User not logged in. Cannot submit feedback.");
      alert("Login required to submit feedback.");
      return;
    }
    if (!course || !course.volunteerId || !course.id) {
      console.warn("Course data incomplete. Cannot submit feedback.", { course, volunteerId: course?.volunteerId, courseId: course?.id });
      alert("Course data missing or incomplete. Cannot submit feedback.");
      return;
    }

    if (!feedbackText || rating === 0) {
      alert('Please write feedback and choose a rating');
      console.warn('Feedback text or rating is missing.', { feedbackText, rating });
      return;
    }

    console.log('Attempting to submit feedback with:', {
      learnerId: user.uid,
      volunteerId: course.volunteerId,
      courseId: course.id,
      feedback: feedbackText,
      rating,
      createdAt: 'serverTimestamp()' // For logging purposes, actual value will be server timestamp
    });

    try {
      const docRef = await addDoc(collection(db, 'volunteer_feedback'), {
        learnerId: user.uid,
        volunteerId: course.volunteerId,
        courseId: course.id,
        feedback: feedbackText,
         learnerName: currentUser.displayName || 'Anonymous Learner', // Get name from currentUser
            learnerAvatar: currentUser.photoURL || 'https://i.pravatar.cc/40?img=placeholder',
        rating,
        createdAt: serverTimestamp()
      });

      console.log("Feedback submitted successfully with ID:", docRef.id);
      setFeedbackSuccess(true);
      setFeedbackText('');
      setRating(0);
    } catch (err) {
      console.error("Error submitting feedback:", err);
      alert("Failed to submit feedback. Please check console for details or try again later.");
    }
  };


  // State to hold the total number of videos in the course
  const [totalVideosInCourse, setTotalVideosInCourse] = useState(0);


  // Helper function to check if all videos in the course have been watched
  const isCourseFullyWatched = () => {
    console.log(`isCourseFullyWatched check: Watched: ${watchedVideos.size}, Total: ${totalVideosInCourse}`);
    // Ensure both are positive and watched count is greater than or equal to total
    return totalVideosInCourse > 0 && watchedVideos.size >= totalVideosInCourse;
  };

  // Function to mark a video as watched when it ends
  const handleVideoEnded = (videoId) => {
    console.log(`handleVideoEnded called for videoId: ${videoId}`);
    if (!videoId) {
      console.warn("handleVideoEnded: videoId is missing, cannot mark video as watched.");
      return;
    }
    setWatchedVideos((prev) => {
      const newSet = new Set(prev);
      if (!newSet.has(videoId)) {
        newSet.add(videoId);
        console.log(`✅ Video ${videoId} marked as watched. Current watched videos count: ${newSet.size}`);
      } else {
        console.log(`Video ${videoId} was already marked as watched. No change.`);
      }
      return newSet;
    });
  };

  // New function to handle only certificate download
  const handleDownloadCertificateOnly = async () => {
    // Call the shared utility function
    generateCertificate(course.title, id);
  };


  const handleCompleteCourse = async () => {
    const user = auth.currentUser;
    if (!user) {
      alert("Login required to complete course and download certificate.");
      return;
    }

    // Double-check before allowing completion
    if (!isCourseFullyWatched()) {
      alert("Please watch all videos fully to complete the course and download your certificate.");
      return;
    }

    try {
      // Update course progress to mark it as completed
      const userProgressRef = doc(db, 'users', user.uid, 'courseProgress', id);
      await setDoc(userProgressRef, {
        isCompleted: true,
        completedAt: new Date(),
        watchedVideoIds: Array.from(watchedVideos) // Ensure all watched IDs are saved
      }, { merge: true });

      setCourseCompleted(true);
      alert("Congratulations! Course completed!");

      // Call the new function to download the certificate
      handleDownloadCertificateOnly();

    } catch (error) {
      console.error("Error completing course or generating certificate:", error);
      alert("Failed to complete course or generate certificate. Please try again.");
    }
  };

  // Effect to fetch course details and initialize selected video
  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setLoading(true);
        const courseDoc = await getDoc(doc(db, 'courses', id));
        if (courseDoc.exists()) {
          const courseData = courseDoc.data();
          // --- CRUCIAL CHANGE: Add the document ID to the course object ---
          setCourse({
            ...courseData,
            id: courseDoc.id // Add the course document ID to the state
          });
          console.log("Course Data fetched and ID added:", { ...courseData, id: courseDoc.id });
          // --- END CRUCIAL CHANGE ---

          // Calculate total videos
          let count = 0;
          const initialOpenState = {};
          if (courseData.modules && courseData.modules.length > 0) {
            initialOpenState[0] = true; // Open the first module by default
            courseData.modules.forEach(module => {
              count += module.lessons?.length || 0;
              // Add a check for missing video IDs in course data
              module.lessons?.forEach(lesson => {
                if (!lesson.videoId) {
                  console.error(`Missing videoId for lesson: ${lesson.videoTitle} in module: ${module.title}`);
                }
              });
            });
            // Set the first lesson's basic info as selected by default
            if (courseData.modules[0].lessons && courseData.modules[0].lessons.length > 0) {
              setSelectedVideoInfo(courseData.modules[0].lessons[0]);
            }
          }
          setTotalVideosInCourse(count); // Store total count
          setOpenModules(initialOpenState);
          console.log(`Course '${courseData.title}' loaded. Expected total videos: ${count}`);

          // --- IMPORTANT: Load user's watched videos from Firebase ---
          const user = auth.currentUser;
          if (user) {
            const userProgressRef = doc(db, 'users', user.uid, 'courseProgress', id);
            const userProgressSnap = await getDoc(userProgressRef);
            if (userProgressSnap.exists()) {
              const progressData = userProgressSnap.data();
              if (progressData.watchedVideoIds && Array.isArray(progressData.watchedVideoIds)) {
                setWatchedVideos(new Set(progressData.watchedVideoIds));
                console.log("Loaded previously watched videos:", progressData.watchedVideoIds);
              }
              if (progressData.isCompleted) {
                setCourseCompleted(true);
                console.log("Course already marked as completed for this user in Firestore.");
              }
            } else {
              console.log("No existing progress found for this course and user.");
            }
          } else {
            console.log("User not logged in. Progress will not be saved or loaded.");
          }

        } else {
          console.warn('Course not found:', id);
          setCourse(null);
        }
      } catch (err) {
        console.error('Failed to load course:', err);
        setCourse(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [id]);

  // Effect to save watched videos to Firebase whenever watchedVideos state changes
 useEffect(() => {
  const saveProgress = async () => {
    const user = auth.currentUser;

    const isCourseFullyWatched = () => {
      return totalVideosInCourse > 0 && watchedVideos.size === totalVideosInCourse;
    };

    if (user && course && totalVideosInCourse >= 0) {
      const userProgressRef = doc(db, 'users', user.uid, 'courseProgress', id);
      const currentCompletionStatus = isCourseFullyWatched();
      try {
        await setDoc(userProgressRef, {
          courseId: id,
          courseTitle: course.title,
          watchedVideoIds: Array.from(watchedVideos),
          isCompleted: currentCompletionStatus,
          lastAccessed: new Date(),
        }, { merge: true });
        console.log(`Progress saved to Firestore. Watched: ${watchedVideos.size}, Completed: ${currentCompletionStatus}`);
      } catch (error) {
        console.error("Error saving user progress to Firestore:", error);
      }
    }
  };

  const saveTimeout = setTimeout(() => {
    if (watchedVideos) {
      saveProgress();
    }
  }, 1000);

  return () => clearTimeout(saveTimeout);
}, [watchedVideos, course, totalVideosInCourse, id]);
 // Re-run when these dependencies change


  // Effect to fetch full video details and transcript when selectedVideoInfo changes
  useEffect(() => {
    const fetchVideoDetailsAndTranscript = async () => {
      if (!selectedVideoInfo || !selectedVideoInfo.videoId) {
        console.log("No selected video info or videoId, clearing video data.");
        // Clear previous video data if no video is selected or videoId is missing
        setCurrentVideoFullData(null);
        setTranscriptContent('');
        setVideoError(null);
        setTranscriptError(null);
        return;
      }

      setVideoLoading(true);
      setTranscriptLoading(true);
      setVideoError(null);
      setTranscriptError(null);
      console.log(`Attempting to load full video data for videoId: ${selectedVideoInfo.videoId}`);

      // Fetch video details from public_videos collection
      try {
        const videoRef = doc(db, 'public_videos', selectedVideoInfo.videoId);
        const videoSnap = await getDoc(videoRef);

        if (videoSnap.exists()) {
          const videoData = videoSnap.data();
          setCurrentVideoFullData(videoData);
          console.log("Successfully loaded full video data:", videoData.videoId);
          // Crucial: ensure the videoId from selectedVideoInfo matches the fetched video's ID
          if (videoData.videoId !== selectedVideoInfo.videoId) {
            console.warn(`Mismatch: selectedVideoInfo.videoId (${selectedVideoInfo.videoId}) does not match fetched videoData.videoId (${videoData.videoId})`);
          }
        } else {
          setVideoError(`❌ Video data not found in 'public_videos' for ID: ${selectedVideoInfo.videoId}.`);
          setCurrentVideoFullData(null);
          console.error(`Video data not found for ID: ${selectedVideoInfo.videoId}`);
        }
      } catch (err) {
        console.error('🔥 Error fetching video details from public_videos:', err);
        setVideoError('⚠️ Failed to load video details.');
        setCurrentVideoFullData(null);
      } finally {
        setVideoLoading(false);
      }

      // Fetch transcript from backend API
      try {
        const response = await fetch(`/api/ai/transcript/${selectedVideoInfo.videoId}`);
        const data = await response.json();

        if (response.ok && data.transcript) {
          setTranscriptContent(data.transcript);
          console.log("Transcript loaded successfully.");
        } else {
          setTranscriptError('⚠️ AI transcript not available.');
          setTranscriptContent('');
          console.warn(`Transcript not available for ${selectedVideoInfo.videoId}:`, data.message || response.statusText);
        }
      } catch (err) {
        console.error('🧠 Error fetching transcript:', err);
        setTranscriptError('⚠️ Failed to generate transcript.');
        setTranscriptContent('');
      } finally {
        setTranscriptLoading(false);
      }
    };

    fetchVideoDetailsAndTranscript();
  }, [selectedVideoInfo]); // This effect runs whenever selectedVideoInfo changes

  const toggleModule = (index) => {
    setOpenModules(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handleVideoSelect = (lesson) => {
    console.log("Lesson selected:", lesson.videoTitle, "with videoId:", lesson.videoId);
    setSelectedVideoInfo(lesson);
    // Optionally reset active tab to 'transcript' or 'overview' when a new video is selected
    setActiveTab('transcript'); // Or 'overview'
  };

  if (loading) {
    return (
      <div className="loading-state">
        <div className="loading-spinner"></div>
        <p>Loading course details...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="error-state">
        <div className="error-icon">⚠️</div>
        <h2>Course Not Found</h2>
        <p>The course you're looking for doesn't exist or an error occurred.</p>
      </div>
    );
  }

  return (
    <div className="course-detail-page-container">
      {/* Navigation Breadcrumb */}
      <div className="course-breadcrumb">
        <div className="breadcrumb-inner">
          <span>Course</span>
          <span className="breadcrumb-separator">›</span>
          <span>{course.category}</span>
          <span className="breadcrumb-separator">›</span>
          <span className="breadcrumb-current">{course.title}</span>
        </div>
      </div>

      {/* Main Content Wrapper (Centered, shadowed block) */}
      <div className="main-content-wrapper">
        {/* Course Header Section (Now inside the centered block) */}
        <div className="course-header-section">
          <div className="course-header-content">
            <div className="course-title-section">
              <h1 className="course-title">{course.title}</h1>
              <p className="course-subtitle">{course.description}</p>
              <div className="course-meta-tags">
                <span className="meta-tag">
                  <span className="tag-icon">🎓</span>
                  {course.gradeLevel?.join(', ') || 'All Levels'}
                </span>
                <span className="meta-tag">
                  <span className="tag-icon">👨‍🏫</span>
                  {course.volunteerName || 'Expert Instructor'}
                </span>
                <span className="meta-tag">
                  <span className="tag-icon">📚</span>
                  {course.modules?.length || 0} Modules
                </span>
              </div>
            </div>
            <div className="course-thumbnail-section">
              <img
                src={course.thumbnailUrl || 'https://via.placeholder.com/400x225/e0e0e0/555555?text=Course+Preview'}
                alt={course.title}
                className="course-thumbnail"
              />
            </div>
          </div>
        </div>

        {/* Main Layout Area (Sidebar + Content Panel) */}
        <div className="main-course-layout">
          {/* Sidebar Navigation */}
          <div className="course-sidebar">
            <div className="sidebar-header">
              <h3>Course Content</h3>
              {/* Display watched progress here */}
              <span className="content-count">
                {watchedVideos.size} / {totalVideosInCourse} videos watched
              </span>
            </div>

            <div className="sidebar-modules">
              {course.modules && course.modules.length > 0 ? (
                course.modules.map((module, index) => (
                  <div key={index} className="sidebar-module">
                    <div
                      className={`sidebar-module-header ${openModules[index] ? 'expanded' : ''}`}
                      onClick={() => toggleModule(index)}
                    >
                      <div className="module-info">
                        <h4>Module {index + 1}</h4>
                        <span className="module-title">{module.title}</span>
                      </div>
                      <span className="expand-icon">
                        {openModules[index] ? '∧' : '⌄'} {/* Unicode chevrons */}
                      </span>
                    </div>

                    {openModules[index] && (
                      <div className="sidebar-module-content">
                        {module.lessons && module.lessons.length > 0 ? (
                          module.lessons.map((lesson, lessonIndex) => (
                            <div
                              key={lessonIndex}
                              className={`sidebar-lesson ${selectedVideoInfo?.videoId === lesson.videoId ? 'active' : ''}`}
                              onClick={() => handleVideoSelect(lesson)}
                            >
                              <div className="lesson-icon">
                                {/* Conditional rendering for watched status */}
                                {watchedVideos.has(lesson.videoId) ? (
                                  <span className="watched-icon">✅</span> // Tick mark for watched videos
                                ) : (
                                  <span className="play-icon">▶</span> // Play icon for unwatched videos
                                )}
                              </div>
                              <div className="lesson-info">
                                <span className="lesson-title">{lesson.videoTitle}</span>
                                <span className="lesson-duration">Video</span>
                              </div>
                              {selectedVideoInfo?.videoId === lesson.videoId && (
                                <div className="lesson-status">
                                  <span className="status-dot active"></span>
                                </div>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="no-lessons-sidebar">
                            <span>No lessons available</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="no-modules-sidebar">
                  <span>No modules available</span>
                </div>
              )}
            </div>
            <div className="sidebar-certificate-section">
              {courseCompleted ? (
                <>
                  <p className="completed-text">✅ Course Completed!</p>
                  <button
                    className="btn-download-certificate"
                    onClick={handleDownloadCertificateOnly}
                  >
                    ⬇️ Download Certificate
                  </button>

                  {/* Feedback Form (only if course is completed) */}
                  <div className="feedback-section" style={{ marginTop: '1rem' }}>
                    <h4 style={{ marginBottom: '0.5rem' }}>💬 Your Feedback</h4>
                    <textarea
                      placeholder="What did you think of this course?"
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      className="feedback-textarea"
                    />
                    <div className="rating-row" style={{ marginBottom: '0.5rem' }}>
                      <label>Rating: </label>
                      <select
                        value={rating}
                        onChange={(e) => setRating(Number(e.target.value))}
                        style={{ marginLeft: '0.5rem' }}
                      >
                        <option value={0}>Select</option>
                        {[1, 2, 3, 4, 5].map(n => (
                          <option key={n} value={n}>{n} ⭐</option>
                        ))}
                      </select>
                    </div>
                    <button className="submit-btn" onClick={handleSubmitFeedback}>
                      Submit Feedback
                    </button>
                    {feedbackSuccess && (
                      <p className="success-msg" style={{ color: 'green', marginTop: '0.5rem' }}>
                        ✅ Thank you for your feedback!
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <button
                    className="btn-complete"
                    onClick={handleCompleteCourse}
                    disabled={!isCourseFullyWatched()}
                  >
                    🎓 Complete & Download Certificate
                  </button>
                  <p
                    style={{
                      fontSize: '12px',
                      color: '#888',
                      marginTop: '8px',
                      textAlign: 'center',
                    }}
                  >
                    ⚠️ Watch all videos fully to unlock your certificate.
                  </p>
                </>
              )}
            </div>

          </div>

          {/* Main Content Panel */}
          <div className="course-content-panel">
            {/* Video Player Area */}
            <div className="video-player-section">
              <div className="video-player-container">
                {videoLoading ? (
                  <div className="video-loading-overlay">
                    <div className="loading-spinner"></div>
                    <p>Loading video...</p>
                  </div>
                ) : videoError ? (
                  <div className="video-error-overlay">
                    <div className="error-icon">⚠️</div>
                    <p>{videoError}</p>
                  </div>
                ) : currentVideoFullData && currentVideoFullData.cloudinaryUrl ? (
                  <video
                    controls
                    className="main-video"
                    src={currentVideoFullData.cloudinaryUrl}
                    poster={currentVideoFullData.thumbnailUrl || ''}
                    onEnded={() => {
                      console.log("Video `onEnded` event fired.");
                      if (selectedVideoInfo && selectedVideoInfo.videoId) {
                        console.log(`onEnded: Calling handleVideoEnded with selectedVideoInfo.videoId: ${selectedVideoInfo.videoId}`);
                        handleVideoEnded(selectedVideoInfo.videoId);
                      } else if (currentVideoFullData && currentVideoFullData.videoId) {
                        console.log(`onEnded: Calling handleVideoEnded with currentVideoFullData.videoId: ${currentVideoFullData.videoId} (fallback)`);
                        handleVideoEnded(currentVideoFullData.videoId);
                      } else {
                        console.error("Video ended, but no valid videoId found for selected or current video data.");
                      }
                    }}
                  >
                    Your browser does not support the video tag.
                  </video>

                ) : (
                  <div className="video-placeholder-initial">
                    <div className="play-button-placeholder">
                      <span>▶</span>
                    </div>
                    <h3>Select a lesson to start watching</h3>
                    <p>Browse the course content on the left to begin your learning journey.</p>
                  </div>
                )}
              </div>
              <div className="video-info">
                <h2>{selectedVideoInfo?.videoTitle || 'Select a Lesson'}</h2>
                <p>{selectedVideoInfo?.videoDescription || 'Learn about this topic in detail through this comprehensive video lesson.'}</p>
              </div>
            </div>

            {/* Content Tabs */}
            <div className="content-tabs">
              <div className="tab-navigation">
                <button
                  className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
                  onClick={() => setActiveTab('overview')}
                >
                  Overview
                </button>
                <button
                  className={`tab-button ${activeTab === 'syllabus' ? 'active' : ''}`}
                  onClick={() => setActiveTab('syllabus')}
                >
                  Syllabus
                </button>
                <button
                  className={`tab-button ${activeTab === 'instructor' ? 'active' : ''}`}
                  onClick={() => setActiveTab('instructor')}
                >
                  Instructor
                </button>
                {/* Only show these video-specific tabs if a video is selected */}
                {selectedVideoInfo && (
                  <>
                    <button
                      className={`tab-button ${activeTab === 'transcript' ? 'active' : ''}`}
                      onClick={() => setActiveTab('transcript')}
                    >
                      Transcript
                    </button>
                    <button
                      className={`tab-button ${activeTab === 'notes' ? 'active' : ''}`}
                      onClick={() => setActiveTab('notes')}
                    >
                      Notes
                    </button>
                    <button
                      className={`tab-button ${activeTab === 'downloads' ? 'active' : ''}`}
                      onClick={() => setActiveTab('downloads')}
                    >
                      Downloads
                    </button>
                  </>
                )}
              </div>

              <div className="tab-content">
                {activeTab === 'overview' && (
                  <div className="overview-content">
                    <h3>About this Course</h3>
                    <p>{course.description}</p>

                    <div className="course-highlights">
                      <h4>What you'll learn</h4>
                      <ul>
                        <li>Master the fundamentals covered in this course</li>
                        <li>Apply practical skills through hands-on exercises</li>
                        <li>Build confidence in the subject matter</li>
                        <li>Prepare for advanced topics in this field</li>
                      </ul>
                    </div>

                    <div className="course-details-grid">
                      <div className="detail-item">
                        <strong>Category</strong>
                        <span>{course.category}</span>
                      </div>
                      <div className="detail-item">
                        <strong>Level</strong>
                        <span>{course.gradeLevel?.join(', ') || 'All Levels'}</span>
                      </div>
                      <div className="detail-item">
                        <strong>Duration</strong>
                        <span>{course.modules?.length || 0} modules</span>
                      </div>
                      <div className="detail-item">
                        <strong>Language</strong>
                        <span>English</span>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'syllabus' && (
                  <div className="syllabus-content">
                    <h3>Course Syllabus</h3>
                    <p>This course contains {course.modules?.length || 0} modules with comprehensive video lessons.</p>

                    {course.modules && course.modules.length > 0 ? (
                      <div className="syllabus-modules">
                        {course.modules.map((module, index) => (
                          <div key={index} className="syllabus-module">
                            <h4>Module {index + 1}: {module.title}</h4>
                            <p>{module.description}</p>
                            {module.lessons && module.lessons.length > 0 && (
                              <div className="module-lessons">
                                <span className="lesson-count">
                                  {module.lessons.length} lesson{module.lessons.length !== 1 ? 's' : ''}
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="no-content">
                        <p>Course content is being prepared. Please check back later.</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'instructor' && (
                  <div className="instructor-content">
                    <h3>Meet Your Instructor</h3>
                    <div className="instructor-card">
                      <div className="instructor-avatar">
                        <span className="avatar-placeholder">👨‍🏫</span>
                      </div>
                      <div className="instructor-info">
                        <h4>{course.volunteerName || 'Expert Instructor'}</h4>
                        <p className="instructor-title">Course Instructor</p>
                        <p className="instructor-bio">
                          Experienced educator passionate about sharing knowledge and helping students succeed.
                          Dedicated to creating engaging learning experiences that make complex topics accessible.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* New Tabs for video-specific content */}
                {selectedVideoInfo && activeTab === 'transcript' && (
                  <div className="tab-section">
                    <h3>Video Transcript</h3>
                    {transcriptLoading ? (
                      <p>🤖 Generating transcript using AI...</p>
                    ) : transcriptError ? (
                      <p>{transcriptError}</p>
                    ) : transcriptContent ? (
                      <pre className="transcript-content">{transcriptContent}</pre>
                    ) : (
                      <p>No transcript available for this video.</p>
                    )}
                  </div>
                )}

                {selectedVideoInfo && activeTab === 'notes' && (
                  <div className="tab-section">
                    <h3>Notes</h3>
                    {currentVideoFullData?.notes ? (
                      <p>{currentVideoFullData.notes}</p>
                    ) : (
                      <p>📝 No notes provided by the volunteer for this video.</p>
                    )}
                  </div>
                )}

                {selectedVideoInfo && activeTab === 'downloads' && (
                  <div className="tab-section">
                    <h3>Downloads</h3>
                    {currentVideoFullData?.resources && currentVideoFullData.resources.length > 0 ? (
                      <div className="download-list">
                        {currentVideoFullData.resources.map((res, idx) => (
                          <div key={idx} className="download-item">
                            <a href={res.url} download target="_blank" rel="noopener noreferrer">
                              📥 {res.name}
                            </a>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p>📂 No downloadable resources available for this video.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div> {/* End main-content-wrapper */}
    </div>
  );
};

export default CourseDetailPage;