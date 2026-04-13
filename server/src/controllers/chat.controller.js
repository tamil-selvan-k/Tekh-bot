const asyncHandler = require("../utils/async-handler");
const { queryRAG, upsertToRAG } = require("../services/rag.service");
const { searchWeb } = require("../services/webSearch.service");
const { generateAnswer } = require("../services/llm.service");

const chatController = asyncHandler(async function (req, res) {
  const { message, history = [] } = req.body;

  // --- Input validation ---
  if (!message || typeof message !== "string" || message.trim() === "") {
    return res.status(400).json({
      success: false,
      message: "message field is required and must be a non-empty string.",
    });
  }

  const trimmedMessage = message.trim();

  // --- RAG lookup ---
  let ragResults = [];

  try {
    ragResults = await queryRAG(trimmedMessage);
  } catch (error) {
    ragResults = [];
  }

  let context = "";
  let source = "RAG";

  if (
    ragResults &&
    ragResults.length > 0 &&
    ragResults[0].score > 0.75
  ) {
    // Pinecone stores our text under metadata.chunk_text (not fields.chunk_text).
    context = ragResults
      .map((r) => r.metadata && r.metadata.chunk_text)
      .filter(Boolean)
      .join("\n");
  } else {
    // Fall back to live web search and cache the result in Pinecone.
    context = await searchWeb(trimmedMessage);
    source = "WEB";
    if (context) {
      try {
        await upsertToRAG(context);   // embed + upsert with correct shape
      } catch (error) {
        // Cache write failures should not block answering the user.
      }
    }
  }

  // --- Prompt construction ---
  const prompt = `Context: ${context || "No context available."}

Question/Greeting/Chat: ${trimmedMessage}

Answer clearly and concisely.`;

  const answer = await generateAnswer(prompt, history);

  return res.status(200).json({ success: true, answer, source });
});

module.exports = { chatController };