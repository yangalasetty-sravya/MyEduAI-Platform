// server/services/geminiService.js
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent";

/**
 * Generates a quiz from Gemini based on the given prompt.
 */
export async function generateQuizFromGemini(promptText) {
  const res = await axios.post(
    `${GEMINI_URL}?key=${process.env.GEMINI_MOCK_KEY}`,
    {
      contents: [{ parts: [{ text: promptText }] }],
    }
  );
  return res.data;
}

/**
 * Analyzes the user's quiz performance and gives learning insights.
 */
export async function analyzeUserPerformance({ questions, answers, userSetupData }) {
  const analysisPrompt = `
    You are an educational AI assistant.
    Analyze the user's quiz performance and provide learning insights.

    User Setup:
    ${JSON.stringify(userSetupData)}

    Quiz Questions:
    ${JSON.stringify(questions)}

    User's Answers:
    ${JSON.stringify(answers)}

    Respond strictly in this JSON format:
    {
      "summary": "short overview",
      "strengths": ["area1", "area2"],
      "weaknesses": ["topic1", "topic2"],
      "recommendations": ["next topic 1", "next topic 2"]
    }
  `;

  const res = await axios.post(
    `${GEMINI_URL}?key=${process.env.GEMINI_API_KEY}`,
    {
      contents: [{ parts: [{ text: analysisPrompt }] }],
    }
  );

  const text = res.data?.candidates?.[0]?.content?.parts?.[0]?.text;
  const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();

  return JSON.parse(cleaned);
}
