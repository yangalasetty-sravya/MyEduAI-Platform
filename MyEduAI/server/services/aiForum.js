import { model } from './gemini.js';

export const getGeminiSummary = async (thread) => {
  const prompt = `
    Summarize this community discussion in bullet points.

    🧵 **Thread Title**: ${thread.title}

    📄 **Description**:
    ${thread.content}

    💬 **Replies**:
    ${(thread.replies || []).map((r, i) => `• (${r.authorRole}) ${r.content}`).join('\n')}
  `;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const summary = await response.text();

  return summary;
};

