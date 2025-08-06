// backend/controllers/volunteerController.js
import { getGeminiAvailabilityQuestions } from "../services/trainingGenerator.js";
import { createCourse } from "../services/firestoreService.js";

// 🔹 1. Generate Availability Form (existing)
export const generateAvailabilityForm = async (req, res) => {
  try {
    const profile = req.body;

    const questions = await getGeminiAvailabilityQuestions(profile);

    if (!Array.isArray(questions)) {
      return res.status(500).json({ error: "Gemini did not return questions." });
    }

    res.status(200).json({ questions });
  } catch (err) {
    console.error("Error in availability form generation:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// 🔹 2. Create Course (new)
export const createCourseController = async (req, res) => {
  try {
    const { volunteerId, courseData } = req.body;

    if (!volunteerId || !courseData || !courseData.title) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    const courseId = await createCourse(volunteerId, courseData);

    res.status(201).json({
      message: "✅ Course created successfully.",
      courseId
    });
  } catch (error) {
    console.error("❌ Error in createCourseController:", error.message);
    res.status(500).json({ error: "Failed to create course." });
  }
};
