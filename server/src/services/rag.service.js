const { Pinecone } = require("@pinecone-database/pinecone");
const { getEmbedding } = require("./embed.service");

const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const index = pc.index(process.env.PINECONE_INDEX);

async function queryRAG(query) {
  const embedding = await getEmbedding(query);

  if (!Array.isArray(embedding) || embedding.length === 0) {
    return [];
  }

  const res = await index.query({
    vector: embedding,
    topK: 3,
    includeMetadata: true,
  });

  return Array.isArray(res.matches) ? res.matches : [];
}

// Embed text and store it in Pinecone with proper vector + metadata shape.
async function upsertToRAG(text) {
  if (!text || typeof text !== "string" || !text.trim()) {
    return false;
  }

  const embedding = await getEmbedding(text);

  if (!Array.isArray(embedding) || embedding.length === 0) {
    return false;
  }

    await index.upsert({
      records: [
        {
          id: Date.now().toString(),
          values: embedding, // required: 1-D float array
          metadata: { chunk_text: text },
        },
      ],
    });

  return true;
}

module.exports = { queryRAG, upsertToRAG };
