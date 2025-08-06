// src/components/VolunteerCourseManager.jsx

import React, { useState, useEffect,useCallback } from 'react';
import { db } from '../firebase'; // Adjust path if necessary
import { collection, getDocs, query, where, addDoc, doc, updateDoc, deleteDoc, orderBy } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid'; // For unique IDs, ensure 'uuid' is installed (npm install uuid)

import './VolunteerCourseManager.css'; // Specific CSS for this component

const VolunteerCourseManager = ({ user, Icon }) => {
  const [courses, setCourses] = useState([]); // State to hold list of courses
  const [loadingCourses, setLoadingCourses] = useState(true);
  // activeCourseForm: null for list view, 'new' for new course form, or course object for edit
  const [activeCourseForm, setActiveCourseForm] = useState(null);
  const [courseForm, setCourseForm] = useState({
    title: '',
    description: '',
    category: '',
    gradeLevel: [], // Initialize as an array
    status: 'Draft',
    thumbnailUrl: '',
    modules: [], // Array of { id, title, description, lessons: [] }
  });

  const [availableVideos, setAvailableVideos] = useState([]);
  const [loadingAvailableVideos, setLoadingAvailableVideos] = useState(true);
  const [errorAvailableVideos, setErrorAvailableVideos] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const handlePublishCourse = async (courseId) => {
  try {
    await updateDoc(doc(db, "courses", courseId), {
      status: "Published",
      publishedAt: new Date(),
    });
    alert("Course published successfully!");
    fetchCourses(); // Refresh list
  } catch (error) {
    console.error("Failed to publish course:", error);
    alert("Error publishing course");
  }
};


  // Load courses for current volunteer
 const fetchCourses = useCallback(async () => {
  if (!user?.uid) {
    setLoadingCourses(false);
    return;
  }

  setLoadingCourses(true);
  try {
    const q = query(
      collection(db, 'courses'),
      where('volunteerId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    const fetchedCourses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setCourses(fetchedCourses);
    console.log("Courses fetched:", fetchedCourses);
  } catch (error) {
    console.error("Error fetching courses:", error);
    alert("Failed to load your courses. Check console for details.");
  } finally {
    setLoadingCourses(false);
  }
}, [user?.uid]);

// ✅ 2. fetchAvailableVideos with useCallback
const fetchAvailableVideos = useCallback(async () => {
  if (!user?.uid) {
    setLoadingAvailableVideos(false);
    setErrorAvailableVideos("User not logged in. Cannot fetch videos for course creation.");
    return;
  }

  setLoadingAvailableVideos(true);
  setErrorAvailableVideos(null);
  try {
    const q = query(
      collection(db, 'videos'),
      where('userId', '==', user.uid),
      orderBy('uploadedAt', 'desc')
    );
    const snapshot = await getDocs(q);
    const videos = snapshot.docs.map(doc => ({ id: doc.id, title: doc.data().title }));
    setAvailableVideos(videos);
  } catch (error) {
    console.error("Error fetching available videos:", error);
    setErrorAvailableVideos("Failed to load your videos for selection.");
  } finally {
    setLoadingAvailableVideos(false);
  }
}, [user?.uid]);

  useEffect(() => {
  fetchCourses();
  fetchAvailableVideos();
}, [user?.uid, fetchCourses, fetchAvailableVideos]);
 // Re-run when user changes

  const handleCourseFormChange = (e) => {
    const { name, value } = e.target;
    if (name === 'gradeLevel') {
      setCourseForm(prev => ({ ...prev, [name]: value.split(',').map(s => s.trim()).filter(Boolean) }));
    } else {
      setCourseForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAddModule = () => {
    setCourseForm(prev => ({
      ...prev,
      modules: [...prev.modules, {
        id: uuidv4(), // Unique ID for each module
        title: `Module ${prev.modules.length + 1}`,
        description: '',
        lessons: [], // lessons now store { id, videoId, videoTitle }
        currentVideoSelection: '', // For the dropdown in each module
      }],
    }));
  };

  const handleModuleChange = (moduleId, field, value) => {
    const newModules = courseForm.modules.map(mod =>
      mod.id === moduleId ? { ...mod, [field]: value } : mod
    );
    setCourseForm(prev => ({ ...prev, modules: newModules }));
  };

  const handleRemoveModule = (moduleId) => {
    if (courseForm.modules.length > 1) {
      setCourseForm(prev => ({
        ...prev,
        modules: prev.modules.filter(mod => mod.id !== moduleId),
      }));
    } else {
      alert("You must have at least one module in a course.");
    }
  };

  const handleVideoSelectForModule = (moduleId, event) => {
    const selectedVideoId = event.target.value;
    setCourseForm(prev => ({
      ...prev,
      modules: prev.modules.map(mod =>
        mod.id === moduleId ? { ...mod, currentVideoSelection: selectedVideoId } : mod
      ),
    }));
  };

  const handleAddLessonToModule = (moduleId) => {
    setCourseForm(prev => {
      return {
        ...prev,
        modules: prev.modules.map(mod => {
          if (mod.id === moduleId) {
            const selectedVideoId = mod.currentVideoSelection;
            if (selectedVideoId) {
              const videoToAdd = availableVideos.find(v => v.id === selectedVideoId);
              if (videoToAdd) {
                const lessonExists = mod.lessons.some(lesson => lesson.videoId === videoToAdd.id);
                if (!lessonExists) {
                  return {
                    ...mod,
                    lessons: [
                      ...mod.lessons,
                      { id: uuidv4(), videoId: videoToAdd.id, videoTitle: videoToAdd.title }
                    ],
                    currentVideoSelection: '' // Reset dropdown
                  };
                } else {
                  alert("This video is already added to this module.");
                }
              }
            }
          }
          return mod;
        })
      };
    });
  };

  const handleRemoveLessonFromModule = (moduleId, lessonId) => {
    setCourseForm(prev => ({
      ...prev,
      modules: prev.modules.map(mod =>
        mod.id === moduleId
          ? { ...mod, lessons: mod.lessons.filter(lesson => lesson.id !== lessonId) }
          : mod
      )
    }));
  };

  const handleSaveCourse = async () => {
    if (!user?.uid) {
      setSaveError("You must be logged in to save a course.");
      return;
    }
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    // Basic Validation
    if (!courseForm.title.trim()) {
        setSaveError("Course title is required.");
        setIsSaving(false);
        return;
    }
    if (courseForm.modules.length === 0) {
        setSaveError("At least one module is required for the course.");
        setIsSaving(false);
        return;
    }
    const hasEmptyModuleTitle = courseForm.modules.some(mod => !mod.title.trim());
    if (hasEmptyModuleTitle) {
      setSaveError("All modules must have a title.");
      setIsSaving(false);
      return;
    }
    const hasModuleWithNoLessons = courseForm.modules.some(mod => mod.lessons.length === 0);
     if (hasModuleWithNoLessons) {
      setSaveError("All modules must have at least one lesson.");
      setIsSaving(false);
      return;
    }

    try {
      const courseDataToSave = {
        title: courseForm.title,
        description: courseForm.description,
        category: courseForm.category,
        gradeLevel: courseForm.gradeLevel,
        status: courseForm.status || 'Draft',
        thumbnailUrl: courseForm.thumbnailUrl,
        volunteerId: user.uid,
        volunteerName: user.displayName || 'Unknown Volunteer', // Use user.displayName or a field from user profile
        modules: courseForm.modules.map((mod, idx) => ({
          id: mod.id, // Keep the module's UUID
          title: mod.title,
          description: mod.description,
          lessons: mod.lessons.map(lesson => ({ // Store only essential lesson data
            videoId: lesson.videoId,
            videoTitle: lesson.videoTitle
          })),
          moduleOrder: idx, // Assign order based on array index
        })),
      };

      if (activeCourseForm && activeCourseForm !== 'new') {
        // Update existing course
        await updateDoc(doc(db, "courses", activeCourseForm.id), {
          ...courseDataToSave,
          updatedAt: new Date(),
        });
        setSaveSuccess(true);
        console.log('Course updated successfully!');
      } else {
        // Create new course
        await addDoc(collection(db, "courses"), {
          ...courseDataToSave,
          createdAt: new Date(),
        });
        setSaveSuccess(true);
        console.log('Course created successfully!');
      }
      setActiveCourseForm(null); // Go back to course list view
      fetchCourses(); // Re-fetch courses list
      // Reset form to initial empty state
      setCourseForm({ title: '', description: '', category: '', gradeLevel: [], status: 'Draft', thumbnailUrl: '', modules: [] });
    } catch (error) {
      console.error("Error saving course:", error);
      setSaveError("Failed to save course: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCourse = async (courseId, courseTitle) => {
    if (window.confirm(`Are you sure you want to delete the course "${courseTitle}"? This will NOT delete the individual videos.`)) {
      setLoadingCourses(true);
      try {
        await deleteDoc(doc(db, "courses", courseId));
        alert('Course deleted successfully!');
        fetchCourses(); // Re-fetch list
      } catch (error) {
        console.error("Error deleting course:", error);
        alert("Failed to delete course: " + error.message);
      } finally {
        setLoadingCourses(false);
      }
    }
  };

  const handleEditCourse = (course) => {
    // Ensure that 'modules' and 'lessons' (if they store just IDs) are reconstructed
    // or loaded in a way that matches the form's state structure if coming from DB.
    // For now, assuming lessons in DB are stored as { videoId, videoTitle } as per save logic.
    setCourseForm({
      ...course,
      gradeLevel: Array.isArray(course.gradeLevel) ? course.gradeLevel : [],
      // Ensure modules also have 'currentVideoSelection' for form use
      modules: course.modules.map(mod => ({ ...mod, currentVideoSelection: '' })),
    });
    setActiveCourseForm(course);
  };

  const handleCancelEdit = () => {
    setActiveCourseForm(null); // Exit form view
    // Reset form to initial empty state
    setCourseForm({ title: '', description: '', category: '', gradeLevel: [], status: 'Draft', thumbnailUrl: '', modules: [] });
    setSaveError(null);
    setSaveSuccess(false);
  };

  // Render Course Creation/Editing Form
  if (activeCourseForm === 'new' || activeCourseForm?.id) {
    return (
      <div className="course-form-section">
        <h2 className="course-form-title">
          {activeCourseForm === 'new' ? 'Create New Course' : `Edit Course: ${courseForm.title}`}
        </h2>

        <label htmlFor="courseTitle" className="input-label">Course Title</label>
        <input
          id="courseTitle"
          name="title"
          type="text"
          value={courseForm.title}
          onChange={handleCourseFormChange}
          className="text-input"
          placeholder="e.g., Introduction to Algebra"
          required
        />

        <label htmlFor="courseDescription" className="input-label">Course Description</label>
        <textarea
          id="courseDescription"
          name="description"
          value={courseForm.description}
          onChange={handleCourseFormChange}
          className="textarea-input"
          placeholder="Describe what learners will achieve in this course."
          rows="4"
        />

        <label htmlFor="courseCategory" className="input-label">Category</label>
        <input
          id="courseCategory"
          name="category"
          type="text"
          value={courseForm.category}
          onChange={handleCourseFormChange}
          className="text-input"
          placeholder="e.g., Math, Science, Arts"
        />

        <label htmlFor="courseGradeLevel" className="input-label">Grade Level (comma-separated, e.g., Grade 5, High School)</label>
        <input
          id="courseGradeLevel"
          name="gradeLevel"
          type="text"
          value={Array.isArray(courseForm.gradeLevel) ? courseForm.gradeLevel.join(', ') : courseForm.gradeLevel}
          onChange={handleCourseFormChange}
          className="text-input"
          placeholder="e.g., Grade 5, Middle School, High School"
        />

        <label htmlFor="courseThumbnailUrl" className="input-label">Thumbnail URL (Optional)</label>
        <input
          id="courseThumbnailUrl"
          name="thumbnailUrl"
          type="text"
          value={courseForm.thumbnailUrl}
          onChange={handleCourseFormChange}
          className="text-input"
          placeholder="URL for course thumbnail image"
        />

        <h3 className="section-heading">Course Modules</h3>
        {courseForm.modules.length === 0 && (
            <p className="no-modules-message">No modules added yet. Click "Add New Module" below.</p>
        )}
        {courseForm.modules.map((module, moduleIndex) => (
          <div key={module.id} className="module-card">
            <div className="module-header-actions">
              <div className="module-title-group">
                  <label className="input-label">Module Title</label>
                  <input
                      type="text"
                      className="text-input module-title-input"
                      placeholder={`Module ${moduleIndex + 1} Title`}
                      value={module.title}
                      onChange={(e) => handleModuleChange(module.id, 'title', e.target.value)}
                      required
                  />
              </div>
              <button
                className="remove-module-btn"
                onClick={() => handleRemoveModule(module.id)}
              >
                <Icon name="trash" style={{width: '16px', height: '16px'}} /> Remove Module
              </button>
            </div>

            <label className="input-label">Module Description (Optional)</label>
            <textarea
              className="textarea-input"
              placeholder={`Description for Module ${moduleIndex + 1}`}
              value={module.description}
              onChange={(e) => handleModuleChange(module.id, 'description', e.target.value)}
              rows="3"
            ></textarea>

            <div className="lessons-section">
              <p className="lessons-heading">Lessons in this Module:</p>
              {module.lessons.length === 0 ? (
                <p className="no-lessons-message">No lessons added.</p>
              ) : (
                <ul className="lessons-list">
                  {module.lessons.map((lesson) => (
                    <li key={lesson.id} className="lesson-item">
                      <span>{lesson.videoTitle}</span>
                      <button
                        className="remove-lesson-btn"
                        onClick={() => handleRemoveLessonFromModule(module.id, lesson.id)}
                      >
                        <Icon name="times" style={{width: '16px', height: '16px'}} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <p className="add-video-label">Add a video to this module:</p>
              <div className="add-video-control">
                {loadingAvailableVideos ? (
                  <select className="select-input" disabled>
                      <option value="">Loading your videos...</option>
                  </select>
                ) : errorAvailableVideos ? (
                  <select className="select-input" disabled>
                      <option value="">{errorAvailableVideos}</option>
                  </select>
                ) : (
                  <select
                    className="select-input"
                    value={module.currentVideoSelection}
                    onChange={(e) => handleVideoSelectForModule(module.id, e)}
                  >
                    <option value="">Select a video...</option>
                    {availableVideos.length === 0 ? (
                        <option value="" disabled>No videos available. Upload some first!</option>
                    ) : (
                        availableVideos
                            .filter(video => !module.lessons.some(lesson => lesson.videoId === video.id)) // Filter out already added videos
                            .map((video) => (
                                <option key={video.id} value={video.id}>
                                {video.title}
                                </option>
                            ))
                    )}
                  </select>
                )}
                <button
                  className="add-lesson-btn"
                  onClick={() => handleAddLessonToModule(module.id)}
                  disabled={!module.currentVideoSelection || loadingAvailableVideos || availableVideos.length === 0}
                >
                  <Icon name="plus" style={{width: '16px', height: '16px'}} /> Add Lesson
                </button>
              </div>
            </div>
          </div>
        ))}
        <button className="add-new-module-block-btn" onClick={handleAddModule}>
          <Icon name="plus" style={{width: '20px', height: '20px'}} /> Add New Module
        </button>

        <div className="form-footer-actions">
          {saveError && <p className="form-error-message">{saveError}</p>}
          {saveSuccess && <p className="form-success-message">Course saved successfully!</p>}
          <button
            className="cancel-course-btn"
            onClick={handleCancelEdit}
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            className="save-course-btn"
            onClick={handleSaveCourse}
            disabled={isSaving}
          >
            <Icon name="save" style={{width: '18px', height: '18px'}} />
            {isSaving ? 'Saving...' : 'Save Course'}
          </button>
        </div>
      </div>
    );
  }

  // Render Course List View
  return (
    <div className="course-list-container">
      <div className="course-list-header">
        <h2 className="course-list-title">My Courses</h2>
        <button
          onClick={() => {
            setActiveCourseForm('new');
            // Reset form for new course, ensuring modules is an empty array
            setCourseForm({ title: '', description: '', category: '', gradeLevel: [], status: 'Draft', thumbnailUrl: '', modules: [] });
          }}
          className="create-course-btn"
        >
          <Icon name="plus" style={{width: '18px', height: '18px'}} /> Create New Course
        </button>
      </div>

      {loadingCourses ? (
        <p className="placeholder-message">Loading your courses...</p>
      ) : courses.length > 0 ? (
        <div className="course-grid">
          {courses.map(course => (
            <div key={course.id} className="course-card">
              {course.thumbnailUrl && (
                  <img src={course.thumbnailUrl} alt={course.title} className="course-thumbnail" />
              )}
              <div className="course-card-content">
                  <h4 className="course-card-title" title={course.title}>{course.title}</h4>
                  {course.category && <p className="course-card-info">Category: {course.category}</p>}
                  {course.gradeLevel && course.gradeLevel.length > 0 &&
                    <p className="course-card-info">Grade Level: {Array.isArray(course.gradeLevel) ? course.gradeLevel.join(', ') : course.gradeLevel}</p>}
                  <p className="course-card-info">Modules: {course.modules?.length || 0}</p>
                  <span className={`status-badge ${course.status === 'Published' ? 'status-published' : 'status-pending'}`}>
                    {course.status}
                  </span>
              </div>
              <div className="course-actions-container">
                <button
                  onClick={() => handleEditCourse(course)}
                  className="course-action-button"
                >
                  <Icon name="edit" style={{width: '18px', height: '18px'}} /> Edit
                </button>
                 {course.status !== "Published" && (
    <button onClick={() => handlePublishCourse(course.id)} className="course-action-button course-success-button">
      <Icon name="upload" style={{width: '18px', height: '18px'}} /> Publish
    </button>
  )}
                <button
                  onClick={() => handleDeleteCourse(course.id, course.title)}
                  className="course-action-button course-danger-button"
                >
                  <Icon name="trash" style={{width: '18px', height: '18px'}} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="placeholder-message">
          <p className="no-content-text">You haven't created any courses yet.</p>
          <p className="call-to-action-text">Click "Create New Course" above to get started!</p>
        </div>
      )}
    </div>
  );
};

export default VolunteerCourseManager;