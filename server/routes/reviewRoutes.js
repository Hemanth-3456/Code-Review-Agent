const express = require('express');
const router = express.Router();
const { generateCodeReview } = require('../services/aiService');

const SUPPORTED_LANGUAGES = [
  'javascript',
  'typescript',
  'python',
  'java',
  'c',
  'c++',
  'cpp',
  'c#',
  'csharp',
  'go',
  'rust',
  'php',
  'html',
  'css',
  'sql'
];

const MAX_CODE_LENGTH = 60000; // ~60,000 characters (sufficient for realistic scripts / modules)

/**
 * POST /api/review
 * Validates request payload and generates structured AI code review
 */
router.post('/review', async (req, res, next) => {
  try {
    const { code, language } = req.body || {};

    // 1. Validate code presence and type
    if (code === undefined || code === null) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: "code". Please provide code to review.'
      });
    }

    if (typeof code !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid type for "code": must be a string.'
      });
    }

    const trimmedCode = code.trim();
    if (trimmedCode.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Code cannot be empty. Please enter or paste some code to review.'
      });
    }

    if (trimmedCode.length > MAX_CODE_LENGTH) {
      return res.status(400).json({
        success: false,
        error: `Code is too large (${trimmedCode.length} characters). Maximum allowed is ${MAX_CODE_LENGTH} characters.`
      });
    }

    // 2. Validate language
    if (!language || typeof language !== 'string' || !language.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid "language". Please select a programming language.'
      });
    }

    const normalizedLang = language.trim().toLowerCase();
    if (!SUPPORTED_LANGUAGES.includes(normalizedLang)) {
      return res.status(400).json({
        success: false,
        error: `Unsupported language "${language}". Supported languages: JavaScript, TypeScript, Python, Java, C, C++, C#, Go, Rust, PHP, HTML, CSS, SQL.`
      });
    }

    // 3. Call AI service
    const review = await generateCodeReview({
      code: trimmedCode,
      language: language.trim()
    });

    return res.status(200).json({
      success: true,
      review
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
