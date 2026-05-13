# AI News Backend

FastAPI backend with OpenAI Agents SDK for AI news aggregation.

## Setup

1. Install dependencies using `uv`:
```bash
uv pip install -e .
```

2. Create a `.env` file from `.env.example`:
```bash
cp .env.example .env
```

3. Add your OpenAI API key to `.env`:
```
OPENAI_API_KEY=your_key_here
```

## Running

```bash
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`

## API Endpoints

- `GET /` - Root endpoint
- `GET /health` - Health check
- `POST /api/agent` - Run a specific agent
- `POST /api/news` - Get news from multiple agents

## Agents

- **SEO Agent**: Generates SEO-optimized content
- **YouTube Agent**: Analyzes YouTube content
- **Forbes Agent**: Analyzes Forbes articles
- **Web Search Agent**: Searches the web for AI news






