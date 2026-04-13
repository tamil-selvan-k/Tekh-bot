const axios = require("axios");

async function searchWeb(query) {
  const res = await axios.post(
    "https://api.tavily.com/search",
    {
      query,
      search_depth: "basic",
    },
    {
      headers: {
        // Tavily v2+ requires the key in the Authorization header, not the body.
        Authorization: `Bearer ${process.env.TAVILY_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  const results = res.data.results;
  if (!results || results.length === 0) return "";

  return results.map((r) => r.content).join("\n");
}

module.exports = { searchWeb };