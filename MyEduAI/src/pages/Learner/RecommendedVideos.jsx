import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useOutletContext } from 'react-router-dom';
import Card from '../../components/common/Card'; // Make sure this path is correct
import { Link } from 'react-router-dom';
import './LearningPath.css'; // Import the CSS file that defines .video-grid and .video-card

const RecommendedVideos = ({ additionalCourses = [] }) => {
  const outletContext = useOutletContext() || {};
const learnerData = outletContext.learnerData || null;

  const [recommendedVideos, setRecommendedVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!learnerData) return;
    const fetchRecommendations = async () => {
      setLoading(true);
      setError(null);

      try {
        console.log("Calling AI API with learnerId:", learnerData?.uid);

        if (!learnerData?.uid) {
          setRecommendedVideos([]);
          setLoading(false);
          return;
        }

        const response = await axios.post('/api/ai/match-videos', {
          learnerId: learnerData.uid,
        });

        setRecommendedVideos(response.data.recommendedVideos || []);
      } catch (error) {
        console.error('Error fetching recommended videos:', error);
        if (error.response && error.response.data && error.response.data.message) {
          setError(`Failed to fetch recommendations: ${error.response.data.message}`);
        } else {
          setError("Failed to fetch recommended videos. Please try again later.");
        }
      } finally {
        setLoading(false);
      }
    };

    if (learnerData) {
      fetchRecommendations();
    }
  }, [learnerData]);

  if (loading) {
    return <p>Loading recommendations...</p>;
  }

  if (error) {
    return <p className="error-box">{error}</p>;
  }

  if (recommendedVideos.length === 0 && additionalCourses.length === 0) {
    return <p>No recommendations found. Try updating your interests or check back later.</p>;
  }

  return (
    <div className="video-grid">
      {recommendedVideos.map((video) => (
        <Card key={video.id} className="video-card">
          <Link to={`/videos/${video.id}`} className="video-card-link">
            <img
              src={video.thumbnailUrl || video.cloudinaryUrl || 'https://via.placeholder.com/400x200'}
              alt={video.title || 'Video thumbnail'}
              className="video-thumbnail"
            />
            <div className="video-card-content">
              {(video.providerLogoUrl || video.providerName) && (
                <div className="video-provider">
                  {video.providerLogoUrl && <img src={video.providerLogoUrl} alt={video.providerName || 'Provider logo'} className="provider-logo" />}
                  {video.providerName && <span className="provider-name">{video.providerName}</span>}
                </div>
              )}
              <h4>{video.title}</h4>
              {(video.notes || video.topics?.length > 0) && (
                <p className="skills-gained">
                  <span className="skills-label">Skills you'll gain:</span>{' '}
                  {video.topics?.length > 0 ?
                    video.topics.join(', ').length > 100 ? video.topics.join(', ').substring(0, 100) + '...' : video.topics.join(', ')
                    : video.notes?.length > 100 ? video.notes.substring(0, 100) + '...' : video.notes}
                </p>
              )}
              {(video.level || video.duration) && (
                <p className="video-meta">
                  {video.level && <span className="video-level">{video.level}</span>}
                  {video.level && video.duration && ' · '}
                  {video.duration && <span className="video-duration">{video.duration}</span>}
                </p>
              )}
            </div>
          </Link>
        </Card>
      ))}

      {additionalCourses.map((course) => (
        <Card key={course.id} className="video-card">
          <Link to={`/courses/${course.id}`} className="video-card-link">
            <img
              src={course.thumbnailUrl || 'https://via.placeholder.com/400x200'}
              alt={course.title}
              className="video-thumbnail"
            />
            <div className="video-card-content">
              <h4>{course.title}</h4>
              <p>{course.description?.length > 100 ? course.description.slice(0, 100) + '...' : course.description || 'No description available.'}</p>
              <p><strong>Modules:</strong> {course.modules?.length || 0}</p>
              <p><strong>Grade:</strong> {course.gradeLevel?.join(', ')}</p>
              <p><strong>Category:</strong> {course.category}</p>
              <Link to={`/courses/${course.id}`} className="btn">View Course</Link>
            </div>
          </Link>
        </Card>
      ))}
    </div>
  );
};

export default RecommendedVideos;
