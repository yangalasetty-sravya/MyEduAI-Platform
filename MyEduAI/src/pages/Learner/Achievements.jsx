import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { Link } from 'react-router-dom';
import { generateCertificate } from '../../utils/certificateGenerator'; // Import the utility
import './Achievements.css'; // Assuming you have a CSS file for achievements

const Achievements = () => {
  const [completedCourses, setCompletedCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCompletedCourses = async () => {
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        setError("Please log in to view your achievements.");
        return;
      }

      try {
        setLoading(true);
        const q = query(
          collection(db, 'users', user.uid, 'courseProgress'),
          where('isCompleted', '==', true)
        );
        const querySnapshot = await getDocs(q);
        const fetchedCourses = [];

        for (const docSnapshot of querySnapshot.docs) {
          const progressData = docSnapshot.data();
          // Fetch the actual course details using courseId from progressData
          const courseDoc = await getDoc(doc(db, 'courses', progressData.courseId));
          if (courseDoc.exists()) {
            fetchedCourses.push({
              id: courseDoc.id,
              ...courseDoc.data(),
              completedAt: progressData.completedAt?.toDate(), // Convert Firestore Timestamp to Date
            });
          }
        }
        setCompletedCourses(fetchedCourses);
      } catch (err) {
        console.error("Error fetching completed courses:", err);
        setError("Failed to load your completed courses.");
      } finally {
        setLoading(false);
      }
    };

    fetchCompletedCourses();
  }, []);

  const handleDownloadCertificate = (courseTitle, courseId) => {
    generateCertificate(courseTitle, courseId);
  };

  if (loading) {
    return <p className="loading-message">Loading your achievements...</p>;
  }

  if (error) {
    return <p className="error-message">{error}</p>;
  }

  return (
    <div className="achievements-container">
      <h1 className="achievements-title">Your Achievements</h1>

      {completedCourses.length === 0 ? (
        <div className="no-achievements-message">
          <p>You haven't completed any courses yet.</p>
          <p>Start learning and earn your first certificate!</p>
          <Link to="/courses" className="browse-courses-link">Browse Courses</Link>
        </div>
      ) : (
        <div className="completed-courses-list">
          {completedCourses.map((course) => (
            <div key={course.id} className="achievement-card">
              {/* Add an inline style here for the animation to trigger */}
              <div className="achievement-icon" style={{ opacity: 1, animationDelay: '0.2s' }}>🏆</div> {/* Trophy icon */}
              <div className="achievement-info">
                <h3>{course.title}</h3>
                <p>Completed on: {course.completedAt ? course.completedAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</p>
              </div>
              <button
                className="btn-download-certificate"
                onClick={() => handleDownloadCertificate(course.title, course.id)}
              >
                ⬇️ Download Certificate
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Achievements;