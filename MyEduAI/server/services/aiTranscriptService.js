// services/aiTranscriptService.js

// 1. ✨ IMPORTANT: Import db and model from your main server file ✨
//    Adjust the path based on your exact project structure.
//    If your server.js is in the root of your project, and this file is in 'services/',
//    then the path would likely be '../../server.js'.
//    e.g., your-project/server.js and your-project/services/aiTranscriptService.js
import { db, model } from '../config/aiAndFirestore.js';





// 2. ❌ REMOVE THESE IMPORTS AND INITIALIZATIONS FROM HERE ❌
//    They should only be in your main server.js file.
// import admin from 'firebase-admin';
// import { GoogleGenerativeAI } from '@google/generative-ai';
// import dotenv from 'dotenv';
// dotenv.config();
// const db = admin.firestore();
// const genAI = new GoogleGenerativeAI(process.env.GEMINI_MOCK_KEY);
// const model = genAI.getGenerativeModel({ model: 'gemini-pro' });


export async function generateTranscript(videoId) {
  try {
    // db and model are now imported and already initialized from server.js
    const videoDoc = await db.collection('public_videos').doc(videoId).get();

    if (!videoDoc.exists) {
      console.warn(`Video with ID ${videoId} not found in 'public_videos' collection.`);
      // Throw a specific error that your calling code (e.g., aiRoutes.js) can catch
      throw new Error('Video not found');
    }

    const videoData = videoDoc.data();

    // Validate essential fields
    if (!videoData.title) {
        console.warn(`Video ${videoId} is missing a title.`);
        // You might decide to throw an error or use a default
        // throw new Error('Video data missing essential fields (title)');
    }

    const prompt = `
You're an expert educational assistant.

Based on the following metadata, generate a detailed, structured transcript assuming a standard educational lecture format:

Video Title: ${videoData.title || 'Untitled Video'}
Topics: ${videoData.topics?.join(', ') || 'N/A'}
Language: ${videoData.language || 'English'}
Notes: ${videoData.notes || 'N/A'}

Output a plain text transcript using subheadings, bullet points, and paragraph structure.
`;

    console.log(`[aiTranscriptService] Sending prompt to Gemini API for video "${videoData.title || videoId}"...`);
    // Uncomment the next line for detailed prompt debugging if needed
    // console.log("Prompt content:", prompt);

    const result = await model.generateContent(prompt);
    const textResponse = result.response.text();
    console.log(`[aiTranscriptService] Transcript generated successfully for video "${videoData.title || videoId}".`);
    return textResponse;

  } catch (error) {
    console.error(`[aiTranscriptService] Error generating transcript for videoId ${videoId}:`, error);

    // Re-throw a more informative error message to the caller (e.g., aiRoutes.js)
    // The calling route can then decide how to present this error to the client.
    if (error.message === 'Video not found') {
      throw error; // Re-throw the specific "Video not found" error
    } else if (error.response && error.response.error) {
        // Handle Gemini API specific errors if available in the response object
        throw new Error(`Gemini API Error: ${error.response.error.message || 'Unknown API error'}`);
    } else {
      throw new Error(`Failed to generate transcript: ${error.message || 'An unknown internal error occurred.'}`);
    }
  }
}