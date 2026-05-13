# Setup Instructions

## Complete Setup Guide

### Step 1: Install uv (Python Package Manager)

If you don't have `uv` installed:

```bash
# Windows (PowerShell)
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"

# macOS/Linux
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### Step 2: Backend Setup

```bash
# Navigate to backend
cd backend

# Install Python dependencies using uv
uv pip install -e .

# Create environment file
cp .env.example .env

# Edit .env file and add your OpenAI API key
# Use your preferred editor:
# - Windows: notepad .env
# - macOS/Linux: nano .env or vim .env
```

Edit `.env` and add:
```
OPENAI_API_KEY=sk-your-actual-api-key-here
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:8000
```

### Step 3: Frontend Setup

```bash
# Navigate to frontend (from project root)
cd frontend

# Install Node.js dependencies
npm install

# Create environment file
echo NEXT_PUBLIC_API_URL=http://localhost:8000 > .env.local
```

### Step 4: Run the Application

**Terminal 1 - Backend:**
```bash
cd backend
uvicorn main:app --reload
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Step 5: Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## Verify Installation

1. Check backend is running:
   ```bash
   curl http://localhost:8000/health
   ```
   Should return: `{"status":"healthy"}`

2. Check frontend loads at http://localhost:3000

3. Test the API:
   ```bash
   curl -X POST http://localhost:8000/api/agent \
     -H "Content-Type: application/json" \
     -d '{"query": "Hello", "agent_type": "seo"}'
   ```

## Next Steps

- Add your OpenAI API key to backend/.env
- Customize agents in backend/agents/agents.py
- Customize UI in frontend/src/components/
- Add OG image to frontend/public/og-image.jpg (1200x630px)

## Troubleshooting

### Python/uv Issues
- Ensure Python 3.11+ is installed: `python --version`
- If `uv` command not found, add it to PATH or use full path

### Node.js Issues
- Ensure Node.js 18+ is installed: `node --version`
- Delete `node_modules` and `package-lock.json`, then run `npm install` again

### Port Already in Use
- Backend (8000): Change port in `uvicorn main:app --reload --port 8001`
- Frontend (3000): Change port in `npm run dev -- -p 3001`
- Update `NEXT_PUBLIC_API_URL` in frontend `.env.local` if backend port changes

### CORS Errors
- Ensure `FRONTEND_URL` in backend `.env` matches your frontend URL
- Check browser console for specific CORS error messages






