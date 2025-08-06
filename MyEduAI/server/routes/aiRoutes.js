
import { db } from '../config/firebase.js';
// Adjust if needed
import { getRecommendedVideosForLearner } from '../services/aiMatcher.js';
import { generateTranscript } from '../services/aiTranscriptService.js';
import express from 'express';


const router = express.Router();

/**
 * ✅ GET /api/ai/recommendations/:learnerId
 * For Learner Dashboard: fetches AI-matched recommended videos
 */
router.get('/recommendations/:learnerId', async (req, res) => {
  try {
    const { learnerId } = req.params;

    const userDoc = await db.collection('users').doc(learnerId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'Learner not found' });
    }

    const recommendedVideos = await getRecommendedVideosForLearner(learnerId);
    res.json({ recommendedVideos });
  } catch (err) {
    console.error('❌ Error fetching recommended videos:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * ✅ Optional: POST method for flexibility (not needed if GET is used)
 */
router.post('/match-videos', async (req, res) => {
  try {
    const { learnerId } = req.body;
    if (!learnerId) return res.status(400).json({ error: 'Missing learnerId' });

    const userDoc = await db.collection('users').doc(learnerId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'Learner not found' });
    }

    const recommendedVideos = await getRecommendedVideosForLearner(learnerId);
    res.json({ recommendedVideos });
  } catch (err) {
    console.error('❌ Error in POST match-videos:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * ✅ Transcript Generator (already correct)
 */
router.get('/transcript/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    const transcript = await generateTranscript(videoId);
    res.json({ transcript });
  } catch (err) {
    console.error('Transcript Generation Error:', err);
    res.status(500).json({ error: 'Failed to generate transcript', details: err.message });
  }
});

export default router;
