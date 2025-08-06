import React, { useEffect, useState, useMemo } from 'react';
import { doc, getDoc, collection,query, getDocs,where } from 'firebase/firestore';
import { auth, db } from '../../firebase'; // Adjust path if firebase.js is elsewhere
import Card from '../../components/common/Card'; // Adjust path if Card.js is elsewhere
import RecommendedVideos from './RecommendedVideos';
import { useOutletContext } from 'react-router-dom';
import { Link } from 'react-router-dom';
import './LearningPath.css'; // Make sure this is created and contains the necessary styles

const LearningPath = () => {
  const [learningPath, setLearningPath] = useState([]);
  const [loadingLearningPath, setLoadingLearningPath] = useState(true);
  const [errorLearningPath, setErrorLearningPath] = useState(null);
  const [publicVideos, setPublicVideos] = useState([]);
  const [loadingPublicVideos, setLoadingPublicVideos] = useState(true);
  const [errorPublicVideos, setErrorPublicVideos] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { learnerData } = useOutletContext(); // This provides learner's data, including preferences
  const [publishedCourses, setPublishedCourses] = useState([]);   


  const getStatusIcon = (status) => {
    switch (status) {
      case 'Completed': return '✅';
      case 'In Progress': return '🔄';
      default: return '🕒';
    }
  };
  console.log("Learner data:", learnerData);

  useEffect(() => {
    const fetchLearningPath = async (user) => {
      if (!user) {
        setLoadingLearningPath(false);
        setErrorLearningPath("Please log in to view your learning path.");
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (!userDoc.exists()) {
          setErrorLearningPath("User data not found.");
          return;
        }
        const data = userDoc.data();
        setLearningPath(data.learningPath || []);
      } catch (err) {
        setErrorLearningPath("Failed to load your learning path.");
      } finally {
        setLoadingLearningPath(false);
      }
    };

    const unsubscribe = auth.onAuthStateChanged(user => {
      setLoadingLearningPath(true);
      fetchLearningPath(user);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchPublicVideos = async () => {
      setLoadingPublicVideos(true);
      try {
        const snapshot = await getDocs(collection(db, 'public_videos'));
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPublicVideos(data);
      } catch (err) {
        setErrorPublicVideos("Failed to load public videos.");
      } finally {
        setLoadingPublicVideos(false);
      }
    };

    fetchPublicVideos();
  }, []);
  useEffect(() => {
  const fetchPublishedCourses = async () => {
    try {
      const q = query(
        collection(db, 'courses'),
        where('status', '==', 'Published')
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPublishedCourses(data);
      console.log("Published courses fetched:", data);
    } catch (err) {
      console.error("Error fetching published courses:", err);
    }
  };

  fetchPublishedCourses();
}, []);


  const filteredPublicVideos = useMemo(() => {
    if (!searchTerm) return publicVideos;
    const lower = searchTerm.toLowerCase();
    return publicVideos.filter(video =>
      (video.title || '').toLowerCase().includes(lower) ||
      (video.notes || '').toLowerCase().includes(lower) ||
      (video.topics || []).some(topic => topic.toLowerCase().includes(lower))
    );
  }, [publicVideos, searchTerm]);

  if (loadingLearningPath && loadingPublicVideos) {
    return <div className="loader">Loading your content...</div>;
  }

  if (errorLearningPath) {
    return (
      <div className="error-box">
        <p>{errorLearningPath}</p>
        {!auth.currentUser && <Link to="/login" className="btn">Login</Link>}
      </div>
    );
  }

  return (
    <div className="learning-container">
      <h1 className="page-title">🚀 Your Personalized Learning Path</h1>

      {learningPath.length > 0 ? (
        <div className="module-grid">
          {learningPath.map((module, i) => (
            <Card key={i} className="module-card">
              <div className="module-status">{getStatusIcon(module.status)}</div>
              <h3>{module?.module || 'Untitled Module'}</h3>
              <p>Topics: {(module?.topics || []).join(', ')}</p>
              <button className="btn">Start Module</button>
            </Card>
          ))}
        </div>
      ) : (
        <p>Your learning path is currently empty. Start exploring recommended videos or browse all public videos!</p>
      )}

      {/* Recommended Videos Section - now uses the same UI structure */}
      <div className="section">
        <h2>💡 Recommended Videos for You</h2>
        <RecommendedVideos additionalCourses={publishedCourses} />
 {/* learnerData is handled by useOutletContext directly now */}
      </div>
      <div className="section">
  <h2>🌟 Featured Volunteer Courses</h2>
  <div className="video-grid">
    {publishedCourses.map(course => (
      <Card key={course.id} className="video-card">
        <img
          src={course.thumbnailUrl || 'https://via.placeholder.com/400x200'}
          alt={course.title}
          className="video-thumbnail"
        />
        <div className="video-card-content">
          <h4>{course.title}</h4>
          <p>{course.description || "No description provided."}</p>
          <p><strong>Modules:</strong> {course.modules?.length || 0}</p>
          <p><strong>Category:</strong> {course.category}</p>
          <p><strong>Grade:</strong> {course.gradeLevel?.join(', ')}</p>
          <Link to={`/courses/${course.id}`} className="btn">View Course</Link>
        </div>
      </Card>
    ))}
  </div>
</div>


      {/* Browse All Volunteer Public Videos Section */}
      <div className="section">
        <h2>📚 Browse All Volunteer Public Videos</h2>
        <input
          type="text"
          className="search-input"
          placeholder="Search videos by title, topics, etc..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {loadingPublicVideos ? (
          <p>Loading videos...</p>
        ) : errorPublicVideos ? (
          <p className="error-box">{errorPublicVideos}</p>
        ) : (
          <div className="video-grid">
            {filteredPublicVideos.map((video) => (
              <Card key={video.id} className="video-card">
                <Link to={`/videos/${video.id}`} className="video-card-link"> {/* New class for the Link */}
                  <img
                    src={video.thumbnailUrl || 'https://via.placeholder.com/400x200'} // Adjust placeholder size
                    alt={video.title || 'Video thumbnail'}
                    className="video-thumbnail"
                  />
                  <div className="video-card-content">
                    {/* New: Provider section */}
                    {(video.providerLogoUrl || video.providerName) && (
                      <div className="video-provider">
                        {video.providerLogoUrl && <img src={video.providerLogoUrl} alt={video.providerName || 'Provider logo'} className="provider-logo" />}
                        {video.providerName && <span className="provider-name">{video.providerName}</span>}
                      </div>
                    )}
                    <h4>{video.title}</h4>
                    {/* New: Skills section - combining notes/topics */}
                    {(video.notes || video.topics?.length > 0) && (
                      <p className="skills-gained">
                        <span className="skills-label">Skills you'll gain:</span>{' '}
                        {video.topics?.length > 0 ?
                            video.topics.join(', ') :
                            video.notes?.length > 100 ? video.notes.substring(0, 100) + '...' : video.notes}
                      </p>
                    )}
                    {/* New: Level and duration */}
                    {(video.level || video.duration) && (
                      <p className="video-meta">
                        {video.level && <span className="video-level">{video.level}</span>}
                        {video.level && video.duration && ' · '}
                        {video.duration && <span className="video-duration">{video.duration}</span>}
                      </p>
                    )}
                    {/* No explicit "Watch Now" button, the whole card is clickable */}
                  </div>
                </Link>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LearningPath;