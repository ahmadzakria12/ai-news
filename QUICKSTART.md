# Quick Start Guide

## Prerequisites

- Python 3.11+ with `uv` installed
- Node.js 18+ and npm
- OpenAI API key

## Setup Steps

### 1. Backend Setup

```bash
cd backend

# Install dependencies using uv
uv pip install -e .

# Create .env file
cp .env.example .env

# Edit .env and add your OpenAI API key
# OPENAI_API_KEY=your_key_here

# Run the backend
uvicorn main:app --reload
```

Backend will be available at `http://localhost:8000`

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env.local file
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

# Run the frontend
npm run dev
```

Frontend will be available at `http://localhost:3000`

## Usage

1. Open `http://localhost:3000` in your browser
2. Select one or more AI agents (SEO, YouTube, Forbes, Web Search)
3. Enter your query in the search box
4. Click search or press Enter
5. View results from selected agents

## API Testing

You can test the API directly:

```bash
# Test single agent
curl -X POST http://localhost:8000/api/agent \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Latest AI news",
    "agent_type": "seo"
  }'

# Test multiple agents
curl -X POST http://localhost:8000/api/news \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Latest AI news",
    "agents": ["seo", "youtube", "forbes", "web_search"]
  }'
```

## Troubleshooting

### Backend Issues

- Make sure `OPENAI_API_KEY` is set in `.env`
- Check that port 8000 is not in use
- Verify Python version is 3.11+

### Frontend Issues

- Make sure backend is running on port 8000
- Check `NEXT_PUBLIC_API_URL` in `.env.local`
- Clear `.next` folder and rebuild if needed

### CORS Issues

- Update `FRONTEND_URL` in backend `.env` if frontend runs on different port






