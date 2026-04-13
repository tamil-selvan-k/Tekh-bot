# Tekh-bot

Tekh-bot is a user-facing technical learning assistant designed to help students and professionals overcome gaps in tech knowledge through a simple web chat interface. It focuses on clear explanations, practical guidance, and reliable responses when live context is needed. It is not primarily an open-source project, but it can be extended or shared that way if desired.

## Project Structure

- `server/` - Express API, RAG pipeline, web search, and LLM integration
- `client/` - Browser chat UI

## Features

- Clean chat experience for technical questions and everyday learning prompts
- Context-aware answers using retrieval and web search when needed
- Safe fallback handling so the assistant keeps responding even when a provider fails
- Health checks and structured error responses for reliable operation

## Requirements

- Node.js 20 or newer
- A valid `.env` file inside `server/`

## Server Setup

1. Open a terminal in `server/`
2. Install dependencies:

```bash
npm install
```

3. Start the backend:

```bash
npm run start
```

4. For development with auto-restart:

```bash
npm run dev
```

The server runs on port `5000` by default.

## Environment Variables

Create `server/.env` with the following values:

```env
NODE_ENV=development
PORT=5000
CLIENT_URL=http://127.0.0.1:5500/client/index.html

PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX=your_pinecone_index_name

TAVILY_API_KEY=your_tavily_api_key
LLM_API_KEY=your_groq_api_key
HF_TOKEN=your_huggingface_token
LLM_MODEL=llama-3.1-8b-instant
```

Note: `CLIENT_URL` may include a page path, but the server normalizes it to the browser origin for CORS.

## API Endpoints

Base URL: `http://localhost:5000/api/v1`

### `GET /health`

Returns a basic health response.

Example response:

```json
{
	"success": true,
	"message": "Server is healthy",
	"timestamp": "2026-04-14T00:00:00.000Z"
}
```

### `POST /chat/message`

Request body:

```json
{
	"message": "What is Python?",
	"history": []
}
```

The `history` field is optional.

Example response:

```json
{
	"success": true,
	"answer": "...",
	"source": "RAG"
}
```

## Client Usage

If you are using the included static client, serve the `client/` folder through a local server and open `client/index.html` in the browser. The chat interface sends requests to `http://localhost:5000/api/v1/chat/message`.

## Error Handling

- Invalid chat requests return HTTP `400`
- Unknown routes return a JSON `404`
- Server errors return a JSON `500` with a stack trace in development

## Notes

- The server is designed to keep the conversation moving even when a retrieval or provider step fails.
- Cache writes are non-fatal and should not block the user from receiving an answer.
