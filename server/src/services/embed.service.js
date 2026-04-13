const { HfInference } = require("@huggingface/inference");

async function getEmbedding(text) {
  if (!text || typeof text !== "string" || !text.trim()) {
    return [];
  }

  // Initialize HF client with the token from .env
  const hf = new HfInference(process.env.HF_TOKEN);

  try {
    const embedding = await hf.featureExtraction({
      model: "sentence-transformers/all-MiniLM-L6-v2",
      inputs: text,
    });

    const normalized = Array.isArray(embedding[0]) ? embedding[0] : embedding;

    if (!Array.isArray(normalized) || normalized.length === 0) {
      throw new Error("Embedding generation failed: invalid embedding output.");
    }

    return normalized;
  } catch (error) {
    if (error.message?.includes("permissions") || error.status === 403) {
      throw new Error(
        "HuggingFace Token Error: Your HF_TOKEN lacks inference permissions. Please generate a new fine-grained token with 'Make calls to the Inference API' checked."
      );
    }

    if (error.status === 404 || error.message?.includes("not found")) {
      throw new Error("Embedding model not found or unavailable from provider.");
    }

    throw error;
  }
}

module.exports = { getEmbedding };