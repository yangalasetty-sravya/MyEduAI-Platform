import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const db = getFirestore();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_MOCK_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export async function getRecommendedVideosForLearner(learnerId) {
  try {
    if (!learnerId || typeof learnerId !== 'string') {
      console.error('❌ Invalid learnerId:', learnerId);
      throw new Error('Invalid learner ID');
    }

    const learnerDoc = await db.collection('users').doc(learnerId).get();
    if (!learnerDoc.exists) throw new Error('Learner profile not found');

    const learnerData = learnerDoc.data();
    const learnerProfile = {
      subjects: (learnerData.subjects || []).map(s => s.toLowerCase()),
      educationLevel: learnerData.educationLevel || '',
      preferredLanguage: learnerData.preferredLanguage || 'English',
    };

    const videosSnapshot = await db.collection('public_videos')
      .where('status', '==', 'Published')
      .get();

    const videos = videosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    if (videos.length === 0) return [];

    const prompt = `
You're an AI tutor recommending educational videos to learners.

Learner Profile:
- Education Level: ${learnerProfile.educationLevel}
- Subjects: ${learnerProfile.subjects.join(', ')}
- Preferred Language: ${learnerProfile.preferredLanguage}

Here are some available videos:
${videos.map((v, i) => `${i + 1}. ID: ${v.id}, Title: ${v.title}, Tags: ${v.tags?.join(', ')}`).join('\n')}

Return the top 3 most relevant video IDs in this format: ["id1", "id2", "id3"]
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    console.log("🤖 Gemini raw response:", text);

    // ✅ Robust ID extraction
    let recommendedIds = [];
    try {
      const match = text.match(/\[(.*?)\]/s);
      if (match) {
        const raw = `[${match[1]}]`.replace(/['"`]/g, '"');
        recommendedIds = JSON.parse(raw);
      } else {
        console.warn("⚠️ Unexpected Gemini response format:", text);
      }
    } catch (err) {
      console.error("❌ Error parsing Gemini response:", err.message);
    }

    if (!Array.isArray(recommendedIds) || recommendedIds.length === 0) return [];

    const recommendedVideos = videos.filter(video => recommendedIds.includes(video.id));
    return recommendedVideos;

  } catch (error) {
    console.error("🔥 getRecommendedVideosForLearner Error:", error.message);
    return [];
  }
}
