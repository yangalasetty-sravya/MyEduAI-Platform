// backend/controllers/forumController.js

import { db } from '../config/firebase.js';
import { getGeminiSummary } from '../services/aiForum.js';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';

export const postThread = async (req, res) => {
  try {
    const { title, content, authorId, authorRole } = req.body;

    const threadRef = await db.collection('forums').add({
      title,
      content,
      authorId,
      authorRole,
      createdAt: Timestamp.now(),
      replies: [],
    });

    res.status(200).json({ id: threadRef.id });
  } catch (err) {
    console.error('Error posting thread:', err);
    res.status(500).json({ message: 'Failed to post thread' });
  }
};

export const replyToThread = async (req, res) => {
  try {
    const { threadId, reply } = req.body;

    const threadRef = db.collection('forums').doc(threadId);
    await threadRef.update({
      replies: FieldValue.arrayUnion({
        ...reply,
        createdAt: Timestamp.now(),
      }),
    });

    res.status(200).json({ message: 'Reply posted' });
  } catch (err) {
    console.error('Error replying to thread:', err);
    res.status(500).json({ message: 'Failed to post reply' });
  }
};

export const generateAISummary = async (req, res) => {
  try {
    const { threadId } = req.params;

    const docRef = db.collection('forums').doc(threadId);
    const docSnap = await docRef.get();
    if (!docSnap.exists) return res.status(404).json({ message: 'Thread not found' });

    const thread = docSnap.data();
    const summary = await getGeminiSummary(thread);

    await docRef.update({ aiSummary: summary });
    res.json({ summary });
  } catch (err) {
    console.error('AI summary error:', err);
    res.status(500).json({ message: 'Failed to summarize' });
  }
};
