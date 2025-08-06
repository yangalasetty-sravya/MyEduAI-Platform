// backend/services/trainingGenerator.js
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

export const getGeminiAvailabilityQuestions = async (profile) => {
  const apiKey = process.env.GEMINI_SKILL_KEY;
  if (!apiKey) {
    throw new Error("Missing Gemini API key");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const prompt = `
You are an AI onboarding assistant helping new volunteers share their availability for remote volunteering.

Generate 5 to 6 open-ended (non-MCQ) questions to assess:
- their weekly availability (days/hours)
- preferred volunteering times (morning, evening, etc.)
- access to internet and devices
- time zone or region
- comfort with online platforms

Respond only in this exact JSON format:
[
  { "question": "Which days of the week are you available to volunteer?" },
  { "question": "How many hours per week can you dedicate to volunteering?" },
  { "question": "Do you have access to a reliable internet connection and digital device?" }
  ...
]
  `.trim();

  const body = {
    contents: [{ parts: [{ text: prompt }] }],
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await res.json();

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    const jsonMatch = text.match(/\[.*?\]/s);

    if (!jsonMatch) throw new Error("Invalid Gemini output");

    const questions = JSON.parse(jsonMatch[0]);
    return questions;

  } catch (error) {
    console.error("Gemini availability error:", error);
    throw error;
  }
};
    