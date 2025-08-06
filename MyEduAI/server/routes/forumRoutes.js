import express from 'express';
import {
  postThread,
  replyToThread,
  generateAISummary,
} from '../../server/controllers/forumController.js';

const router = express.Router();

router.post('/post', postThread);
router.post('/reply', replyToThread);
router.post('/ai-summary/:threadId', generateAISummary);

export default router;
