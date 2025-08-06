const { callOpenAIToGenerateQuiz, callOpenAIToEvaluate } = require('../services/geminiService');
const { saveResultsToFirestore } = require('../services/firestoreService');

exports.generateQuiz = async (req, res) => {
  const { interests, educationLevel } = req.body;
  try {
    const questions = await callOpenAIToGenerateQuiz(interests, educationLevel);
    res.json({ questions });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate quiz' });
  }
};

exports.evaluateQuiz = async (req, res) => {
  const { answers, userId } = req.body;
  try {
    const result = await callOpenAIToEvaluate(answers);
    await saveResultsToFirestore(userId, result);
    res.json({ result });
  } catch (error) {
    res.status(500).json({ error: 'Failed to evaluate quiz' });
  }
};
