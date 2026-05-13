# Vercel Deployment Guide

## Issue: Bad Request on Vercel

The "Bad Request" error on Vercel is typically caused by:
1. **Frontend trying to connect to localhost backend** - The API URL is not configured
2. **CORS issues** - Backend not allowing Vercel domains
3. **Backend not deployed** - Backend is only running locally

## Solution Steps

### 1. Deploy Your Backend

You need to deploy your FastAPI backend to a hosting service. Options:

#### Option A: Railway (Recommended - Easy)
1. Go to [Railway.app](https://railway.app)
2. Sign up/login
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your backend folder or create a new repo with just backend
5. Add environment variables:
   - `OPENAI_API_KEY=your_key`
   - `FRONTEND_URL=https://your-vercel-app.vercel.app`
   - `ENVIRONMENT=production`
6. Railway will give you a URL like: `https://your-app.railway.app`

#### Option B: Render
1. Go to [Render.com](https://render.com)
2. Create new "Web Service"
3. Connect your GitHub repo
4. Set root directory to `backend`
5. Build command: `uv sync && uv run uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
7. Add environment variables (same as Railway)

#### Option C: Fly.io
1. Go to [Fly.io](https://fly.io)
2. Install flyctl: `curl -L https://fly.io/install.sh | sh`
3. In backend folder: `fly launch`
4. Add environment variables

### 2. Configure Vercel Environment Variables

1. Go to your Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. Add these variables:

```
NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app
```

Replace `https://your-backend-url.railway.app` with your actual backend URL.

**Important**: 
- Variable name must start with `NEXT_PUBLIC_` to be accessible in the browser
- After adding, **redeploy** your Vercel app

### 3. Update Backend CORS (Already Done)

The backend CORS has been updated to allow Vercel domains. Make sure your backend has:

```python
FRONTEND_URL=https://your-vercel-app.vercel.app
ENVIRONMENT=production
```

### 4. Verify Deployment

1. **Check Backend**: Visit `https://your-backend-url.railway.app/health`
   - Should return: `{"status": "healthy"}`

2. **Check Frontend**: Visit your Vercel URL
   - Open browser console (F12)
   - Check Network tab for API calls
   - Should see requests going to your backend URL, not localhost

### 5. Common Issues & Fixes

#### Issue: Still getting "Bad Request"
- **Check**: Is `NEXT_PUBLIC_API_URL` set in Vercel?
- **Fix**: Add it and redeploy

#### Issue: CORS errors
- **Check**: Is backend `FRONTEND_URL` set correctly?
- **Fix**: Update backend environment variable to your Vercel URL

#### Issue: Backend not responding
- **Check**: Is backend actually deployed and running?
- **Fix**: Check backend logs on Railway/Render

#### Issue: Environment variables not working
- **Check**: Did you redeploy after adding env vars?
- **Fix**: Vercel requires redeploy for env vars to take effect

### 6. Quick Test

After deployment, test in browser console:

```javascript
fetch('https://your-backend-url.railway.app/health')
  .then(r => r.json())
  .then(console.log)
```

Should return: `{status: "healthy"}`

## Environment Variables Summary

### Vercel (Frontend)
```
NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app
```

### Backend (Railway/Render/Fly.io)
```
OPENAI_API_KEY=your_openai_key
FRONTEND_URL=https://your-vercel-app.vercel.app
ENVIRONMENT=production
```

## Need Help?

1. Check browser console for specific error messages
2. Check backend logs on your hosting platform
3. Verify all environment variables are set correctly
4. Make sure both frontend and backend are deployed






