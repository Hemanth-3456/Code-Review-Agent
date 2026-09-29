const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const reviewRoutes = require('./routes/reviewRoutes');

const app = express();

// Security and middleware
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Health Check API endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// API Routes
app.use('/api', reviewRoutes);

// Static file serving for React frontend production build
const clientDistPath = path.resolve(__dirname, '../client/dist');
const clientIndexPath = path.join(clientDistPath, 'index.html');

if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
}

// SPA fallback: any non-API route serves React app index.html
app.use((req, res, next) => {
  // If it's an API route that wasn't handled, return 404 JSON
  if (req.path.startsWith('/api')) {
    return res.status(404).json({
      success: false,
      error: `API route ${req.method} ${req.path} not found`
    });
  }

  // Otherwise, serve the React frontend index.html if built
  if (fs.existsSync(clientIndexPath)) {
    return res.sendFile(clientIndexPath);
  }

  // If frontend hasn't been built yet (e.g. initial dev state)
  return res.status(200).send(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <title>Code Review Agent</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0B0F17; color: #F3F4F6; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
          .card { background: #161F30; border: 1px solid #1F2937; padding: 2rem; border-radius: 12px; max-width: 500px; text-align: center; }
          h1 { color: #6366F1; margin-bottom: 0.5rem; }
          p { color: #9CA3AF; line-height: 1.6; }
          code { background: #111827; padding: 0.2rem 0.5rem; border-radius: 4px; color: #38BDF8; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>Code Review Agent Server</h1>
          <p>The Express backend is running. React production build was not found at <code>client/dist</code>.</p>
          <p>Please run <code>npm run build</code> to generate the client build.</p>
        </div>
      </body>
    </html>
  `);
});

// Centralized error handling middleware
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  const statusCode = err.statusCode || err.status || 500;
  const userMessage = err.message || 'An unexpected error occurred during code review.';

  // Return clean, safe error JSON (no internal stack traces leaked)
  res.status(statusCode).json({
    success: false,
    error: userMessage,
    code: err.code || (statusCode === 400 ? 'VALIDATION_ERROR' : 'SERVER_ERROR')
  });
});

// Bind to PORT and 0.0.0.0 as required by Render
const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
  console.log(`Code Review Agent server listening on http://${HOST}:${PORT}`);
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

module.exports = app;
