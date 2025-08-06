// File: server.js (Updated)

import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';

// ❌ The unused import has been removed from here.

// Import your route files
import quizRoutes from './routes/quizRoutes.js';
import volunteerRoutes from './routes/volunteerRoutes.js';
import recommendationRoutes from './routes/recommendationRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import forumRoutes from './routes/forumRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware setup
app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(bodyParser.json());

// API Routes setup
// Express will now pass requests to these files.
// These files are responsible for importing 'db' and 'model' themselves.
app.use('/api', recommendationRoutes);
app.use('/api/ai', aiRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/volunteers", volunteerRoutes);
app.use('/api/forum', forumRoutes);

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});