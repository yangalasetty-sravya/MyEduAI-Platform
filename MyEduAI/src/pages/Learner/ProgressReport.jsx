// File: src/pages/Learner/ProgressReport.jsx

import React, { useEffect, useState } from 'react';
import { auth, db } from '../../firebase'; // Corrected path from previous fix
import { collection, query, getDocs } from 'firebase/firestore';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Link } from 'react-router-dom';
import './ProgressReport.css';

const ProgressReport = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userProgress, setUserProgress] = useState([]);
  const [overallSummary, setOverallSummary] = useState({
    totalCourses: 0,
    completedCourses: 0,
    inProgressCourses: 0,
    notStartedCourses: 0,
    overallCompletionPercentage: 0,
    totalPossibleVideosOverall: 0 // ✨ ADDED THIS TO STATE ✨
  });

  useEffect(() => {
    const fetchUserProgress = async () => {
      setLoading(true);
      setError(null);
      const user = auth.currentUser;

      if (!user) {
        setError("Please log in to view your progress.");
        setLoading(false);
        return;
      }

      try {
        const progressCollectionRef = collection(db, 'users', user.uid, 'courseProgress');
        const q = query(progressCollectionRef);
        const querySnapshot = await getDocs(q);

        const progressData = [];
        let totalWatchedVideosOverall = 0;
        let totalPossibleVideosOverallSum = 0; // Renamed for clarity in this scope
        let completedCoursesCount = 0;
        let inProgressCoursesCount = 0;
        let notStartedCoursesCount = 0;

        for (const docSnapshot of querySnapshot.docs) {
          const data = docSnapshot.data();
          const courseId = docSnapshot.id;

          const watchedCount = Array.isArray(data.watchedVideoIds) ? data.watchedVideoIds.length : 0;
          const totalCount = data.totalVideosInCourse || 0; // This is the crucial part that might be 0

          let percentage = 0;
          if (totalCount > 0) {
            percentage = Math.round((watchedCount / totalCount) * 100);
          } else if (data.isCompleted) {
             percentage = 100; // If course has 0 videos and is explicitly marked completed, show 100%
          }

          const isCompleted = data.isCompleted || (totalCount > 0 && watchedCount >= totalCount);

          progressData.push({
            courseId: courseId,
            courseTitle: data.courseTitle || 'Unknown Course',
            watchedCount: watchedCount,
            totalCount: totalCount,
            percentage: percentage,
            isCompleted: isCompleted,
            lastAccessed: data.lastAccessed?.toDate ? data.lastAccessed.toDate() : (data.lastAccessed || null)
          });

          if (isCompleted) {
            completedCoursesCount++;
          } else if (watchedCount > 0) {
            inProgressCoursesCount++;
          } else {
            notStartedCoursesCount++;
          }

          // Summing actual video counts for overall video completion calculation
          totalWatchedVideosOverall += watchedCount;
          totalPossibleVideosOverallSum += totalCount;
        }

        const totalCourses = progressData.length;
        const overallCompletionPercentage = totalPossibleVideosOverallSum > 0
          ? Math.round((totalWatchedVideosOverall / totalPossibleVideosOverallSum) * 100)
          : 0;

        setUserProgress(progressData);
        setOverallSummary({
          totalCourses: totalCourses,
          completedCourses: completedCoursesCount,
          inProgressCourses: inProgressCoursesCount,
          notStartedCourses: notStartedCoursesCount,
          overallCompletionPercentage: overallCompletionPercentage,
          totalPossibleVideosOverall: totalPossibleVideosOverallSum // ✨ UPDATED STATE HERE ✨
        });

      } catch (err) {
        console.error("Error fetching user progress:", err);
        setError("Failed to load progress data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserProgress();
  }, []);

  // Data for the Pie Chart
  const pieChartData = [
    { name: 'Completed', value: overallSummary.completedCourses },
    { name: 'In Progress', value: overallSummary.inProgressCourses },
    { name: 'Not Started', value: overallSummary.notStartedCourses },
  ].filter(item => item.value > 0);

  // Colors for the Pie Chart slices
  const COLORS = ['#28a745', '#007bff', '#6c757d'];

  if (loading) {
    return (
      <div className="progress-report-container loading">
        <div className="loading-spinner"></div>
        <p>Loading your personalized progress report...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="progress-report-container error">
        <p className="error-message">⚠️ {error}</p>
      </div>
    );
  }

  if (userProgress.length === 0) {
    return (
      <div className="progress-report-container no-data">
        <h2>Your Progress Report</h2>
        <p>It looks like you haven't started any courses yet. Start your learning journey by exploring our <Link to="/courses">Course Catalog</Link>!</p>
      </div>
    );
  }

  return (
    <div className="progress-report-container">
      <h1 className="report-title">Your Learning Progress</h1>

      {/* Overall Summary Cards */}
      <div className="overall-summary-cards">
        <div className="summary-card total">
          <h3>Total Courses</h3>
          <p>{overallSummary.totalCourses}</p>
        </div>
        <div className="summary-card completed">
          <h3>Completed</h3>
          <p>{overallSummary.completedCourses}</p>
        </div>
        <div className="summary-card in-progress">
          <h3>In Progress</h3>
          <p>{overallSummary.inProgressCourses}</p>
        </div>
        <div className="summary-card not-started">
          <h3>Not Started</h3>
          <p>{overallSummary.notStartedCourses}</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        {/* Course Status Distribution Pie Chart */}
        <div className="chart-card">
          <h3>Course Status Distribution</h3>
          {pieChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p>No course data to display for the chart.</p>
          )}
        </div>

        {/* Overall Video Completion Progress Bar - Conditional Rendering */}
        <div className="chart-card">
          <h3>Overall Video Completion</h3>
          {overallSummary.totalPossibleVideosOverall > 0 ? ( // ✨ CONDITIONAL RENDERING HERE ✨
            <>
              <div className="overall-progress-bar-container">
                <div
                  className="overall-progress-bar"
                  style={{ width: `${overallSummary.overallCompletionPercentage}%` }}
                >
                  <span className="progress-text">{overallSummary.overallCompletionPercentage}%</span>
                </div>
              </div>
              <p className="overall-progress-description">
                You've completed {overallSummary.overallCompletionPercentage}% of all video lessons across your started courses.
              </p>
            </>
          ) : (
            <p className="overall-progress-description no-videos-message">
              No video lessons found in your started courses to calculate overall video completion.
              {/* Optional detailed message if all courses are completed and had no videos */}
              {overallSummary.totalCourses > 0 && overallSummary.completedCourses === overallSummary.totalCourses ?
                 ` All your current courses are completed and contained no video lessons.` :
                 ` Explore more courses to start watching videos.`
              }
            </p>
          )}
        </div>
      </div>

      {/* Individual Course Progress List */}
      <div className="course-list-section">
        <h2>Individual Course Progress</h2>
        {userProgress.length > 0 ? (
          <ul className="course-progress-list">
            {userProgress.map((course, index) => (
              <li key={index} className="course-progress-item">
                <Link to={`/course/${course.courseId}`} className="course-link">
                  <div className="course-info">
                    <h3>{course.courseTitle}</h3>
                    <p>Status: {course.isCompleted ? 'Completed' : (course.watchedCount > 0 ? 'In Progress' : 'Not Started')}</p>
                    {course.lastAccessed && (
                      <p className="last-accessed">Last accessed: {course.lastAccessed.toLocaleDateString()}</p>
                    )}
                  </div>
                  <div className="progress-details">
                    <span className="progress-percentage">{course.percentage}%</span>
                    <div className="progress-bar-container">
                      <div className="progress-bar" style={{ width: `${course.percentage}%` }}></div>
                    </div>
                    <span className="video-count">
                      {course.watchedCount} / {course.totalCount} videos
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p>No detailed course progress to display.</p>
        )}
      </div>
    </div>
  );
};

export default ProgressReport;