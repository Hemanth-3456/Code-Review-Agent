/**
 * AI Service for Code Review Agent
 * Compatible with OpenAI API format and any OpenAI-compatible provider
 * (OpenAI, Groq, Together AI, DeepSeek, OpenRouter, Ollama, etc.)
 */

const SYSTEM_PROMPT = `You are a Senior Principal Software Engineer and Code Review Specialist.
Your task is to conduct an in-depth, rigorous, practical, and highly constructive code review.

You must analyze the code for:
1. Real bugs and logic errors (off-by-one, null references, concurrency, resource leaks)
2. Security vulnerabilities (OWASP top 10, injection, input validation, secret leaks)
3. Performance problems (algorithmic complexity, memory overhead, unnecessary re-computation)
4. Code quality & maintainability (readability, modularity, DRY, naming conventions)
5. Language-specific best practices and idioms
6. Potential edge cases (boundary values, unexpected input types, error handling)
7. Improved/refactored code that resolves the identified issues cleanly

IMPORTANT GUIDELINES:
- Focus on real issues in the submitted code. Do not hallucinate or invent problems that do not exist.
- If the code is well-written and has few or no issues, reflect that honestly with a high score and positive summary.
- Always provide a clean, complete refactored/improved version of the code in "improvedCode".
- You MUST respond ONLY with a single valid JSON object. Do not include introductory text, conversational pleasantries, or markdown formatting outside the JSON object.

JSON OUTPUT SCHEMA:
{
  "summary": "Clear, executive summary of the overall code quality and primary findings (2-4 sentences).",
  "score": 85, // Integer from 0 to 100 representing overall quality rating
  "severity": {
    "critical": 0, // Number of critical issues
    "high": 1,     // Number of high severity issues
    "medium": 2,   // Number of medium severity issues
    "low": 1       // Number of low severity issues
  },
  "issues": [
    {
      "category": "Security", // Must be one of: "Bugs", "Security", "Performance", "Code Quality", "Best Practices", "Suggestions"
      "severity": "High",     // Must be one of: "Critical", "High", "Medium", "Low"
      "title": "Short descriptive title of the issue",
      "description": "Clear explanation of what the problem is in the code.",
      "whyItMatters": "Why this is dangerous, inefficient, or problematic in production.",
      "line": 12,             // Line number integer where the issue occurs, or null if general
      "suggestion": "Specific, actionable guidance on how to fix it."
    }
  ],
  "suggestions": [
    "High level actionable suggestion 1",
    "High level actionable suggestion 2"
  ],
  "improvedCode": "// Complete, cleanly refactored version of the code resolving identified issues"
}`;

/**
 * Extracts and parses JSON from raw LLM output even if surrounded by markdown codeblocks
 */
function extractAndParseJSON(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    throw new Error('Empty response received from AI model');
  }

  let text = rawText.trim();

  // Strip ```json and ``` if present
  if (text.startsWith('```')) {
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    text = text.trim();
  }

  // Find boundaries of the outermost JSON object
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error('AI output did not contain a valid JSON structure');
  }

  const jsonSubstring = text.substring(firstBrace, lastBrace + 1);

  try {
    return JSON.parse(jsonSubstring);
  } catch (parseError) {
    // If standard parse failed, try cleaning potential trailing commas or escaped newlines
    try {
      const sanitized = jsonSubstring
        .replace(/,\s*([}\]])/g, '$1'); // remove trailing commas
      return JSON.parse(sanitized);
    } catch {
      throw new Error(`Failed to parse AI JSON response: ${parseError.message}`);
    }
  }
}

/**
 * Validates and normalizes structured review output
 */
function validateReviewStructure(parsed) {
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('AI response structure is not a valid object');
  }

  // Ensure summary is present
  const summary = typeof parsed.summary === 'string' && parsed.summary.trim().length > 0
    ? parsed.summary.trim()
    : 'Code review completed. Please inspect the issues and suggestions below.';

  // Ensure score is valid integer between 0 and 100
  let score = typeof parsed.score === 'number' && !isNaN(parsed.score)
    ? Math.max(0, Math.min(100, Math.round(parsed.score)))
    : 75;

  // Normalize issues array
  const rawIssues = Array.isArray(parsed.issues) ? parsed.issues : [];
  const validCategories = ['Bugs', 'Security', 'Performance', 'Code Quality', 'Best Practices', 'Suggestions'];
  const validSeverities = ['Critical', 'High', 'Medium', 'Low'];

  const issues = rawIssues.map((item, idx) => {
    // Normalize category
    let category = 'Code Quality';
    if (typeof item.category === 'string') {
      const matched = validCategories.find(c => c.toLowerCase() === item.category.trim().toLowerCase());
      if (matched) category = matched;
    }

    // Normalize severity
    let severity = 'Medium';
    if (typeof item.severity === 'string') {
      const matched = validSeverities.find(s => s.toLowerCase() === item.severity.trim().toLowerCase());
      if (matched) severity = matched;
    }

    return {
      id: `issue-${idx + 1}`,
      category,
      severity,
      title: typeof item.title === 'string' && item.title.trim() ? item.title.trim() : `Issue in ${category}`,
      description: typeof item.description === 'string' && item.description.trim() ? item.description.trim() : 'Potential improvement identified.',
      whyItMatters: typeof item.whyItMatters === 'string' && item.whyItMatters.trim() ? item.whyItMatters.trim() : 'Impacts reliability or maintainability.',
      line: typeof item.line === 'number' && !isNaN(item.line) && item.line > 0 ? Math.round(item.line) : null,
      suggestion: typeof item.suggestion === 'string' && item.suggestion.trim() ? item.suggestion.trim() : 'Refactor according to language best practices.'
    };
  });

  // Calculate or normalize severity counts
  const severityCounts = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0
  };

  issues.forEach(issue => {
    const sevKey = issue.severity.toLowerCase();
    if (severityCounts[sevKey] !== undefined) {
      severityCounts[sevKey] += 1;
    }
  });

  // If parsed provided valid numeric severity counts, we can cross-check
  if (parsed.severity && typeof parsed.severity === 'object') {
    ['critical', 'high', 'medium', 'low'].forEach(k => {
      if (typeof parsed.severity[k] === 'number' && parsed.severity[k] >= 0) {
        severityCounts[k] = Math.max(severityCounts[k], Math.round(parsed.severity[k]));
      }
    });
  }

  // Normalize suggestions
  const suggestions = Array.isArray(parsed.suggestions)
    ? parsed.suggestions.filter(s => typeof s === 'string' && s.trim().length > 0).map(s => s.trim())
    : [];

  // Normalize improved code
  const improvedCode = typeof parsed.improvedCode === 'string' ? parsed.improvedCode : '';

  return {
    summary,
    score,
    severity: severityCounts,
    issues,
    suggestions,
    improvedCode
  };
}

const { generateStaticCodeReview } = require('./staticReviewService');

/**
 * Main review function calling the AI provider, or falling back to built-in analyzer if no key is configured
 */
async function generateCodeReview({ code, language }) {
  const apiKey = process.env.AI_API_KEY;
  const apiUrl = (process.env.AI_API_URL || 'https://api.openai.com/v1').replace(/\/+$/, '');
  const model = process.env.AI_MODEL || 'gpt-4o-mini';

  // If no API key is provided, use the built-in intelligent review engine (Zero API key needed)
  if (!apiKey || apiKey === 'your_api_key_here' || apiKey.trim() === '') {
    return generateStaticCodeReview({ code, language });
  }

  const userPrompt = `Review the following ${language} code:\n\n\`\`\`${language.toLowerCase()}\n${code}\n\`\`\`\n\nAnalyze for bugs, security vulnerabilities, performance bottlenecks, code quality, edge cases, and best practices. Return strictly the required JSON object.`;

  const endpoint = `${apiUrl}/chat/completions`;

  const requestBody = {
    model: model,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.2,
    response_format: { type: 'json_object' }
  };

  let response;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
  } catch (fetchErr) {
    if (fetchErr.name === 'AbortError') {
      const err = new Error('AI provider request timed out. Please try again with shorter code or later.');
      err.statusCode = 504;
      throw err;
    }
    const err = new Error(`Unable to reach AI provider: ${fetchErr.message}`);
    err.statusCode = 502;
    throw err;
  }

  if (!response.ok) {
    let errorDetail = '';
    try {
      const errJson = await response.json();
      errorDetail = errJson.error?.message || JSON.stringify(errJson);
    } catch {
      errorDetail = await response.text();
    }

    if (response.status === 401) {
      const err = new Error('Authentication failed: Invalid AI API Key. Please check your AI_API_KEY environment variable.');
      err.statusCode = 401;
      throw err;
    } else if (response.status === 429) {
      const err = new Error('AI provider rate limit reached or quota exceeded. Please check your account limits.');
      err.statusCode = 429;
      throw err;
    } else if (response.status === 404) {
      const err = new Error(`AI model "${model}" or endpoint "${endpoint}" not found. Verify AI_MODEL and AI_API_URL.`);
      err.statusCode = 404;
      throw err;
    } else {
      const err = new Error(`AI provider returned status ${response.status}: ${errorDetail || 'Unknown error'}`);
      err.statusCode = response.status >= 500 ? 502 : response.status;
      throw err;
    }
  }

  const responseData = await response.json();
  const rawContent = responseData.choices?.[0]?.message?.content;

  if (!rawContent) {
    const err = new Error('AI provider returned an empty response.');
    err.statusCode = 502;
    throw err;
  }

  const parsedJson = extractAndParseJSON(rawContent);
  const validatedReview = validateReviewStructure(parsedJson);

  return validatedReview;
}

module.exports = {
  generateCodeReview,
  extractAndParseJSON,
  validateReviewStructure
};
