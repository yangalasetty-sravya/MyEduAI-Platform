import express from 'express';
import { generateQuizFromGemini, analyzeUserPerformance } from '../services/geminiService.js';
import { saveAssessmentResults } from '../services/firestoreService.js';

const router = express.Router();

router.post("/generate-quiz", async (req, res) => {
  try {
    const { educationLevel, subjects, language } = req.body;

    if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {
      return res.status(400).json({ error: "Subjects must be a non-empty array." });
    }

    const prompt = `
      You are an AI assistant designed to create educational quizzes.
      Generate 10 unique, multiple-choice quiz questions based on the following criteria:
      - Student's Education Level: ${educationLevel}
      - Subjects of Interest: ${subjects.join(", ")}
      - Language for the quiz: ${language}

      Each question must have 4 options and a correct answer index (0-3).
      Format the entire response STRICTLY as a JSON array of objects, where each object has these keys: "question", "options" (an array of 4 strings), and "correct" (the index of the correct answer).
      Do not include any text, markdown, or explanations outside of the JSON array itself.
    `;

    const result = await generateQuizFromGemini(prompt);
    const content = result?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      throw new Error("No content received from Gemini API.");
    }

    const cleanedContent = content.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanedContent);
    res.json({ questions: parsed });

  } catch (err) {
    console.error("Gemini quiz error:", err);
    res.status(500).json({ error: "Failed to generate quiz from AI.", details: err.message });
  }
});

// --- Analyze assessment ---
router.post("/analyze-assessment", async (req, res) => {
  try {
    const { userId, questions, answers, userSetupData } = req.body;

    if (!userId || !questions || !answers || !userSetupData) {
      return res.status(400).json({ message: "Missing required data for analysis." });
    }

    const analysisResult = await analyzeUserPerformance({
      questions,
      answers,
      userSetupData
    });

    await saveAssessmentResults(userId, analysisResult);

    res.status(200).json({
      message: 'Assessment analyzed and saved successfully!',
      analysis: analysisResult
    });

  } catch (err) {
    console.error("Error analyzing assessment:", err);
    res.status(500).json({ error: "Failed to analyze assessment.", details: err.message });
  }
});

export default router;
