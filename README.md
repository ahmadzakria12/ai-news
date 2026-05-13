# AI News Website

A modern AI-powered news aggregation platform with multiple specialized AI agents, built with FastAPI backend and Next.js frontend.

## Project Structure

```
ai-news/
├── backend/          # FastAPI backend with OpenAI Agents SDK
│   ├── agents/       # AI agent implementations
│   ├── main.py       # FastAPI application
│   └── pyproject.toml
├── frontend/         # Next.js frontend
│   ├── src/
│   │   ├── app/      # Next.js app directory
│   │   └── components/ # React components
│   └── package.json
└── README.md
```

## Features

### Backend
- FastAPI REST API
- OpenAI Agents SDK integration
- Multiple specialized agents:
  - **SEO Agent**: Generates SEO-optimized content
  - **YouTube Agent**: Analyzes YouTube content
  - **Forbes Agent**: Analyzes Forbes articles
  - **Web Search Agent**: Aggregates web search results
- Session management
- Guardrails for content safety
- CORS support

### Frontend
- Modern, animated UI
- Agent selection interface
- Real-time news feed
- Responsive design
- SEO optimized
- Smooth animations with Framer Motion

## Setup

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies using `uv`:
```bash
uv pip install -e .
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Add your OpenAI API key to `.env`:
```
OPENAI_API_KEY=your_openai_api_key_here
FRONTEND_URL=http://localhost:3000
```

5. Run the backend:
```bash
uvicorn main:app --reload
```

Backend will run on `http://localhost:8000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env.local` file:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

4. Run the frontend:
```bash
npm run dev
```

Frontend will run on `http://localhost:3000`

## API Endpoints

### `POST /api/agent`
Run a specific agent.

**Request:**
```json
{
  "query": "Latest AI news",
  "agent_type": "seo",
  "session_id": "optional-session-id"
}
```

**Response:**
```json
{
  "result": "Agent response...",
  "session_id": "session-id",
  "agent_type": "seo"
}
```

### `POST /api/news`
Get news from multiple agents.

**Request:**
```json
{
  "query": "Latest AI news",
  "agents": ["seo", "youtube", "forbes", "web_search"],
  "session_id": "optional-session-id"
}
```

**Response:**
```json
{
  "results": {
    "seo": "SEO content...",
    "youtube": "YouTube content...",
    "forbes": "Forbes content...",
    "web_search": "Web search content..."
  },
  "session_id": "session-id"
}
```

## Agents

### SEO Agent
Generates SEO-optimized meta titles, descriptions, and content. Analyzes keywords and provides SEO recommendations.

### YouTube Agent
Searches and analyzes YouTube videos related to AI news. Extracts insights from video content.

### Forbes Agent
Searches and analyzes Forbes articles related to AI and technology. Provides expert opinions and analysis.

### Web Search Agent
Searches the web for the latest AI news and aggregates information from multiple sources.

## Technologies

- **Backend**: FastAPI, OpenAI SDK, Python
- **Frontend**: Next.js, React, TypeScript, Tailwind CSS, Framer Motion
- **AI**: OpenAI Agents SDK with guardrails, sessions, and handoffs

## License

MIT






