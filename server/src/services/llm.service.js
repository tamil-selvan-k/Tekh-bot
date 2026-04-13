const axios = require("axios");

const PROMPT = `You are a friendly, experienced tech assistant.

Respond in a natural, conversational tone. Be clear, concise, and helpful.

- Understand intent first  
- Give direct answers, then brief explanation if needed  
- Use simple words and practical examples  
- For greetings: reply casually (e.g., “Hey! How can I help?”)  
- For technical queries: explain step-by-step when needed  

Avoid:
- Robotic or formal tone  
- Over-explaining simple things  
- Repeating the question  

Goal: help users quickly understand and solve problems.
`;

async function generateAnswer(prompt, history = []) {
  const preferredModels = [
    process.env.LLM_MODEL,
    "llama-3.1-8b-instant",
    "llama3-8b-8192",
  ].filter(Boolean);

  let lastError;

  // Format incoming history specifically for OpenAI API spec
  const historyMessages = history.map((msg) => ({
    role: msg.role === "bot" ? "assistant" : "user",
    content: msg.content,
  }));

  for (const model of preferredModels) {
    try {
      const res = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          model,
          messages: [
            { role: "system", content: PROMPT },
            ...historyMessages,
            { role: "user", content: prompt },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.LLM_API_KEY}`,
          },
          timeout: 15000,
        }
      );

      const content = res.data?.choices?.[0]?.message?.content;
      if (content) {
        return content;
      }
    } catch (error) {
      lastError = error;
      const status = error.response?.status;
      const code = error.response?.data?.error?.code;

      if (status === 404 || code === "model_not_found") {
        continue;
      }

      throw error;
    }
  }

  throw lastError || new Error("Unable to generate answer from LLM provider.");
}

module.exports = { generateAnswer };