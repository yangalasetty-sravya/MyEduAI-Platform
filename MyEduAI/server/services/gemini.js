import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_MOCK_KEY);

// Choose the model (e.g. gemini-1.5-flash or gemini-pro)
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

export { model };
