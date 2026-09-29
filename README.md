# Code Review Agent

An AI-powered, production-ready Code Review Agent that performs automated, in-depth code reviews across 13 programming languages. It acts as an automated senior software engineer to identify bugs, security vulnerabilities, performance bottlenecks, and code quality issues, providing actionable fixes and refactored code.

The application is architected as a single deployable service: the Node.js/Express backend serves the production React/Vite frontend while exposing REST APIs for code analysis and health checks.

---

## Features

- **Multi-Language Analysis**: Supports 13 popular programming languages:
  - JavaScript, TypeScript, Python, Java, C, C++, C#, Go, Rust, PHP, HTML, CSS, SQL.
- **Categorized Issue Detection**:
  - 🐞 **Bugs & Logic Errors**: Off-by-one errors, null dereferences, unhandled edge cases, and memory leaks.
  - 🔐 **Security Vulnerabilities**: SQL injection, XSS, insecure hashing, exposed credentials, buffer overflows.
  - ⚡ **Performance Bottlenecks**: Algorithmic complexity, unnecessary memory allocations, blocking operations.
  - 🧹 **Code Quality & Maintainability**: Clean code principles, DRY violations, naming conventions.
  - 📚 **Best Practices & Idioms**: Language-specific design patterns, typing best practices.
  - 💡 **Actionable Suggestions & Refactored Code**: High-level architectural guidance and complete copy-ready refactored code.
- **Severity Classification**:
  - Detailed severity breakdown with visual counters: **Critical**, **High**, **Medium**, and **Low**.
- **Interactive UI**:
  - Dark developer-focused dashboard with high contrast and monospace font.
  - Built-in sample code snippets for each language featuring intentional reviewable issues.
  - Category filters to easily inspect specific issue types.
  - One-click copy for improved code and review summaries with instant visual feedback.
  - Real-time API connectivity indicator.
- **Zero-Setup & Out-of-the-Box Support**:
  - **Works without any API key or LLM**: If no `AI_API_KEY` is provided, the application automatically activates its built-in static analysis & heuristic code reviewer to scan for bugs, security risks, performance flaws, and generate refactored code immediately.
  - When an `AI_API_KEY` is provided, it seamlessly switches to the external LLM provider.
- **Provider Agnostic AI Integration**:
  - Fully compatible with any OpenAI-compatible API (OpenAI, Groq, Together AI, DeepSeek, OpenRouter, Ollama).
  - Secure: AI API keys are strictly confined to the backend and never exposed to the client.
- **Single Service Deployment**:
  - Built specifically for zero-hassle deployment on Render as a single Web Service.
  - Express serves the React production build with SPA fallback handling.

---

## Technology Stack

- **Frontend**:
  - React 19
  - Vite 8
  - Modern CSS (Custom Dark Developer Theme tokens)
  - Lucide React (Developer-grade icons)
- **Backend**:
  - Node.js (v18+)
  - Express.js
  - dotenv (Environment configuration)
  - cors (Cross-Origin Resource Sharing)
- **AI Abstraction**:
  - OpenAI-compatible REST API integration
  - JSON schema enforcement with resilient fallback parsing
- **Deployment**:
  - Render (Single Web Service with `render.yaml`)

---

## Project Structure

```
Code-Review-Agent/
├── client/                     # Frontend React + Vite application
│   ├── public/                 # Static public assets
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx          # Header with branding and API status
│   │   │   ├── CodeEditor.jsx      # Code input, language selector, actions
│   │   │   ├── ReviewResult.jsx    # Review dashboard, severity grid, code view
│   │   │   ├── IssueCard.jsx       # Individual issue card with category & fix
│   │   │   └── SeverityBadge.jsx   # Severity indicator pill
│   │   ├── data/
│   │   │   └── sampleCodes.js      # Authentic sample snippets for all 13 languages
│   │   ├── styles/
│   │   │   └── index.css           # Complete responsive dark theme stylesheet
│   │   ├── App.jsx                 # Main React component
│   │   └── main.jsx                # React application entry point
│   ├── index.html              # HTML shell with Google Fonts
│   ├── package.json            # Client dependencies and build scripts
│   └── vite.config.js          # Vite config with API development proxy
│
├── server/                     # Backend Node.js + Express application
│   ├── routes/
│   │   └── reviewRoutes.js     # /api/review endpoint with input validation
│   ├── services/
│   │   └── aiService.js        # AI provider client, JSON parser, and validator
│   └── server.js               # Express server, static file host & SPA fallback
│
├── .env.example                # Sample environment variables configuration
├── .gitignore                  # Git ignore rules
├── package.json                # Root orchestration package.json
├── render.yaml                 # Render infrastructure-as-code specification
└── README.md                   # Project documentation
```

---

## Environment Variables

Create a `.env` file in the root directory by copying `.env.example`:

```bash
cp .env.example .env
```

| Variable | Description | Default | Example |
| :--- | :--- | :--- | :--- |
| `AI_API_KEY` | **Required**. API key for the AI provider | _None_ | `sk-proj-...` |
| `AI_API_URL` | Base URL of the OpenAI-compatible endpoint | `https://api.openai.com/v1` | `https://api.groq.com/openai/v1` |
| `AI_MODEL` | Model identifier to use for analysis | `gpt-4o-mini` | `llama-3.3-70b-versatile` |
| `PORT` | Local server port (automatically set by Render) | `5000` | `5000` |
| `NODE_ENV` | Runtime environment | `development` | `production` |

### Provider Configuration Examples

- **OpenAI**:
  ```ini
  AI_API_KEY=sk-...
  AI_API_URL=https://api.openai.com/v1
  AI_MODEL=gpt-4o-mini
  ```
- **Groq**:
  ```ini
  AI_API_KEY=gsk_...
  AI_API_URL=https://api.groq.com/openai/v1
  AI_MODEL=llama-3.3-70b-versatile
  ```
- **DeepSeek**:
  ```ini
  AI_API_KEY=sk-...
  AI_API_URL=https://api.deepseek.com/v1
  AI_MODEL=deepseek-chat
  ```
- **OpenRouter**:
  ```ini
  AI_API_KEY=sk-or-...
  AI_API_URL=https://openrouter.ai/api/v1
  AI_MODEL=openai/gpt-4o-mini
  ```

---

## Local Setup

### 1. Prerequisites
- Node.js 18.0.0 or higher
- npm 9.0.0 or higher

### 2. Clone Repository & Install Dependencies

```bash
git clone https://github.com/Hemanth-3456/Code-Review-Agent.git
cd Code-Review-Agent
npm install
```

> **Note**: Running `npm install` in the root automatically runs `npm install` inside the `client` directory via the `postinstall` hook.

### 3. Configure Environment

Copy `.env.example` to `.env` and fill in your `AI_API_KEY`:

```bash
cp .env.example .env
```

---

## How to Run

### Development Mode

To run both backend and frontend development server with hot-reloading:

```bash
# Terminal 1: Start backend server
npm run server

# Terminal 2: Start Vite client dev server (with proxy to port 5000)
npm run client
```

Open `http://localhost:5173` in your browser.

### Production Mode (Simulate Render Environment)

To test the unified production build where Express serves the React bundle:

```bash
# 1. Build the React frontend
npm run build

# 2. Start the Express production server
npm start
```

Open `http://localhost:5000` in your browser.

---

## How to Deploy to Render

This repository is optimized for deployment as a **Single Web Service** on Render.

### Option A: Using Blueprint (`render.yaml`)

1. Push your repository to GitHub.
2. In the [Render Dashboard](https://dashboard.render.com/), click **New +** and select **Blueprint**.
3. Connect your repository. Render will automatically detect `render.yaml`.
4. Add your secret `AI_API_KEY` under Environment Variables.
5. Click **Apply**.

### Option B: Manual Web Service Setup

1. In the Render Dashboard, click **New +** > **Web Service**.
2. Connect your GitHub repository.
3. Configure the following settings:
   - **Name**: `code-review-agent`
   - **Region**: Choose your nearest region (e.g., Oregon, Frankfurt, Singapore)
   - **Branch**: `main`
   - **Root Directory**: _(leave empty)_
   - **Runtime**: `Node`
   - **Build Command**:
     ```bash
     npm install && npm run build
     ```
   - **Start Command**:
     ```bash
     npm start
     ```
4. Add the following **Environment Variables**:
   - `AI_API_KEY`: Your AI provider API key *(Secret)*
   - `AI_API_URL`: `https://api.openai.com/v1` *(or your custom provider)*
   - `AI_MODEL`: `gpt-4o-mini`
   - `NODE_ENV`: `production`
5. Click **Deploy Web Service**.

When deployment completes, your app will be live at `https://your-service-name.onrender.com/`.

---

## API Endpoints

### 1. Health Check
Checks backend service availability.

- **URL**: `GET /api/health`
- **Response**:
  ```json
  {
    "status": "ok"
  }
  ```

### 2. Code Review Analysis
Submits source code for AI-powered evaluation.

- **URL**: `POST /api/review`
- **Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "code": "async function getUser(id) { const q = 'SELECT * FROM users WHERE id = ' + id; return db.query(q); }",
    "language": "JavaScript"
  }
  ```
- **Response** (HTTP 200):
  ```json
  {
    "success": true,
    "review": {
      "summary": "The function contains a critical SQL injection vulnerability caused by raw string concatenation with untrusted input.",
      "score": 60,
      "severity": {
        "critical": 1,
        "high": 0,
        "medium": 1,
        "low": 0
      },
      "issues": [
        {
          "id": "issue-1",
          "category": "Security",
          "severity": "Critical",
          "title": "SQL Injection Vulnerability",
          "description": "User input 'id' is directly concatenated into the SQL statement without sanitization or parameter binding.",
          "whyItMatters": "Enables attackers to execute arbitrary SQL commands, potentially extracting or deleting the entire database.",
          "line": 1,
          "suggestion": "Use parameterized queries or prepared statements: db.query('SELECT * FROM users WHERE id = $1', [id])"
        }
      ],
      "suggestions": [
        "Enforce parameterized SQL queries across all database drivers.",
        "Add input validation middleware to verify IDs conform to expected types."
      ],
      "improvedCode": "async function getUser(id) {\n  if (!id) throw new Error('Missing ID');\n  return db.query('SELECT * FROM users WHERE id = $1', [id]);\n}"
    }
  }
  ```

---

## Troubleshooting

### 1. `AI API key is not configured on the server`
- **Cause**: The server cannot find `AI_API_KEY` in environment variables.
- **Fix**: For local development, ensure `.env` contains `AI_API_KEY=your_key`. On Render, add `AI_API_KEY` in the **Environment** tab of your Web Service.

### 2. `Authentication failed: Invalid AI API Key`
- **Cause**: The API key provided is expired, revoked, or incorrect.
- **Fix**: Verify your API key at your provider's dashboard (e.g. [OpenAI Platform](https://platform.openai.com/api-keys) or [Groq Console](https://console.groq.com/keys)).

### 3. `AI provider rate limit reached or quota exceeded`
- **Cause**: Your AI account has hit request limits or run out of credits.
- **Fix**: Check your account billing balance, or switch to another supported provider like Groq or DeepSeek by setting `AI_API_URL` and `AI_MODEL`.

### 4. Root URL displays blank or 404
- **Cause**: Frontend build was not generated before server start.
- **Fix**: Ensure your Build Command runs `npm install && npm run build` so that `client/dist` exists before `npm start` is invoked.

---

## License

MIT &copy; 2026 Code Review Agent Team
