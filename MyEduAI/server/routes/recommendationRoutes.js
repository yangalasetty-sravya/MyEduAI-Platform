import express from 'express';
import { getRecommendedVideosForLearner } from '../services/aiMatcher.js';

const router = express.Router();

router.get('/recommendations/:learnerId', async (req, res) => {
  try {
    const videos = await getRecommendedVideosForLearner(req.params.learnerId);
    res.json(videos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to get recommendations', error: err.message });
  }
});

export default router;
