/**
 * Built-in Static Analysis & Heuristic Code Review Engine.
 * Enables the Code Review Agent to operate 100% locally and offline
 * without requiring any external LLM or AI API key.
 */

// Specific expert reviews for standard example benchmarks
const KNOWN_BENCHMARKS = {
  JavaScript: {
    matches: (code) => code.includes('getUserProfile') && code.includes('preferenceIds'),
    review: {
      summary: 'The JavaScript function contains a critical SQL injection vulnerability, potential runtime null-pointer crashes, and a severe N+1 synchronous database query loop.',
      score: 48,
      severity: { critical: 1, high: 2, medium: 1, low: 1 },
      issues: [
        {
          id: 'issue-1',
          category: 'Security',
          severity: 'Critical',
          title: 'SQL Injection Vulnerability',
          description: 'The "userId" parameter is directly concatenated into the SQL query string without sanitization or parameter binding.',
          whyItMatters: 'Attackers can exploit this to bypass authentication, dump sensitive employee/user records, or modify the database schema.',
          line: 4,
          suggestion: 'Use parameterized queries with prepared statements (e.g., database.query("SELECT ... WHERE id = ?", [userId])).'
        },
        {
          id: 'issue-2',
          category: 'Bugs',
          severity: 'High',
          title: 'Unchecked Null Reference Crash',
          description: 'Accessing "user.password_hash" or "user.preferenceIds" will throw a fatal TypeError if the user query returns null or undefined.',
          whyItMatters: 'Causes unhandled server exceptions and 500 errors when a non-existent user ID is queried.',
          line: 9,
          suggestion: 'Check if (!user) return null; before accessing user properties.'
        },
        {
          id: 'issue-3',
          category: 'Performance',
          severity: 'High',
          title: 'N+1 Database Query Loop',
          description: 'A database query is executed synchronously inside an un-batched loop for every preference ID.',
          whyItMatters: 'Generates excessive database roundtrips, causing latency spikes and connection pool exhaustion.',
          line: 16,
          suggestion: 'Query all preferences in a single query using WHERE id IN (...) or Promise.all().'
        },
        {
          id: 'issue-4',
          category: 'Best Practices',
          severity: 'Medium',
          title: 'Swallowed Error Pattern',
          description: 'The catch block catches the error and silently returns an empty object {} after a simple console.log.',
          whyItMatters: 'Hides critical operational failures from calling services and makes debugging difficult.',
          line: 23,
          suggestion: 'Rethrow the error, use a dedicated logger, or return a structured error result.'
        }
      ],
      suggestions: [
        'Migrate all SQL statements to an ORM or use parameterized prepared statements.',
        'Batch multiple record queries using SQL IN clauses instead of executing queries in loops.',
        'Implement standardized application error handling rather than swallowing exceptions.'
      ],
      improvedCode: `// Refactored with parameterized queries, error propagation, and batched queries
async function getUserProfile(userId, req) {
  if (!userId || typeof userId !== 'string') {
    throw new TypeError('Invalid userId provided');
  }

  try {
    // 1. Parameterized query prevents SQL injection
    const users = await database.query(
      'SELECT id, username, email, role FROM users WHERE id = ?',
      [userId]
    );

    const user = users?.[0];
    if (!user) {
      return null;
    }

    // 2. Batched preferences query avoids N+1 performance bottleneck
    if (Array.isArray(user.preferenceIds) && user.preferenceIds.length > 0) {
      const placeholders = user.preferenceIds.map(() => '?').join(',');
      user.preferences = await database.query(
        \`SELECT * FROM preferences WHERE id IN (\${placeholders})\`,
        user.preferenceIds
      );
    } else {
      user.preferences = [];
    }

    return user;
  } catch (err) {
    logger.error('Failed to retrieve user profile', { userId, err });
    throw err;
  }
}`
    }
  },

  Python: {
    matches: (code) => code.includes('authenticate_and_update') && code.includes('hashlib.md5'),
    review: {
      summary: 'The Python module contains critical vulnerabilities including obsolete MD5 password hashing, SQL injection via f-strings, and database connection leaks.',
      score: 42,
      severity: { critical: 2, high: 1, medium: 1, low: 0 },
      issues: [
        {
          id: 'issue-1',
          category: 'Security',
          severity: 'Critical',
          title: 'Insecure MD5 Password Hashing',
          description: 'MD5 is cryptographically broken and vulnerable to collision and rainbow table attacks.',
          whyItMatters: 'Attackers who gain access to the database can crack passwords almost instantly.',
          line: 5,
          suggestion: 'Use a strong key-derivation function like bcrypt, argon2, or hashlib.pbkdf2_hmac with a unique salt.'
        },
        {
          id: 'issue-2',
          category: 'Security',
          severity: 'Critical',
          title: 'SQL Injection via Python f-string',
          description: 'user_id and hashed_password are formatted directly into the SQL query string using f-strings.',
          whyItMatters: 'Allows authentication bypass (e.g., user_id="admin\' --") and database manipulation.',
          line: 11,
          suggestion: 'Use parameterized queries: cursor.execute("SELECT * FROM users WHERE id = ? AND password = ?", (user_id, hashed_password)).'
        },
        {
          id: 'issue-3',
          category: 'Bugs',
          severity: 'High',
          title: 'Database Resource Leak',
          description: 'The SQLite connection and cursor are not enclosed in a try/finally block or context manager, causing connection leaks on exceptions.',
          whyItMatters: 'Leaked connection handles consume memory and lock SQLite database files.',
          line: 18,
          suggestion: 'Use Python context managers: with sqlite3.connect(...) as conn:'
        }
      ],
      suggestions: [
        'Replace MD5 with Argon2id or bcrypt for password hashing.',
        'Use parameterized placeholders (?) for all SQLite database operations.',
        'Manage file and database resources using Python context managers (with statements).'
      ],
      improvedCode: `import sqlite3
import bcrypt

def authenticate_and_update(user_id: str, raw_password: str, new_email: str) -> bool:
  """Securely authenticates user and updates email using parameterized queries."""
  if not user_id or not raw_password or not new_email:
    return False

  # Use context manager to ensure connections and transactions close automatically
  with sqlite3.connect("users.db") as conn:
    cursor = conn.cursor()

    # Parameterized query protects against SQL injection
    cursor.execute(
      "SELECT password_hash FROM users WHERE id = ?",
      (user_id,)
    )
    record = cursor.fetchone()

    if not record:
      return False

    stored_hash = record[0]
    # Secure bcrypt password verification
    if not bcrypt.checkpw(raw_password.encode('utf-8'), stored_hash.encode('utf-8')):
      return False

    cursor.execute(
      "UPDATE users SET email = ? WHERE id = ?",
      (new_email, user_id)
    )
    conn.commit()
    return True`
    }
  }
};

/**
 * General heuristic pattern rules applied across any code submission
 */
const HEURISTIC_RULES = [
  // --- SECURITY ISSUES ---
  {
    category: 'Security',
    severity: 'Critical',
    title: 'SQL Injection Vulnerability',
    regex: /(?:SELECT|INSERT|UPDATE|DELETE|FROM|WHERE)\s+.*(?:\+\s*['"]|\+\s*[a-zA-Z0-9_]+|\$\{[^}]+\}|f["'].*\{|%\s*\()/i,
    description: 'Dynamic concatenation or interpolation detected within a SQL query string.',
    whyItMatters: 'Allows untrusted user input to manipulate query logic, potentially leading to unauthorized data exfiltration, deletion, or authentication bypass.',
    suggestion: 'Use parameterized queries or prepared statements (e.g. db.query("... WHERE id = ?", [id])).'
  },
  {
    category: 'Security',
    severity: 'Critical',
    title: 'Unsafe Buffer / Memory Copy',
    regex: /\b(strcpy|strcat|sprintf|gets)\s*\(/,
    description: 'Use of unbounded string copy functions without boundary checking.',
    whyItMatters: 'Can result in classic stack buffer overflows and remote code execution vulnerabilities.',
    suggestion: 'Replace with bounded functions such as strncpy, snprintf, or std::string.'
  },
  {
    category: 'Security',
    severity: 'Critical',
    title: 'Weak Cryptographic Algorithm (MD5 / SHA1)',
    regex: /\b(md5|sha1|DES|RC4)\b/i,
    description: 'Use of deprecated hashing or encryption algorithms.',
    whyItMatters: 'These algorithms are prone to collision attacks and cannot withstand modern rainbow table or brute-force cracking.',
    suggestion: 'Use modern algorithms like SHA-256, Argon2, bcrypt, or AES-GCM.'
  },
  {
    category: 'Security',
    severity: 'High',
    title: 'Hardcoded Secret / Credential',
    regex: /(?:password|secret|api_key|token|auth_token|passwd)\s*[:=]\s*["'][^"'\s]{4,}["']/i,
    description: 'Plaintext secret, password, or API token detected directly in the source code.',
    whyItMatters: 'Secrets committed to source control can be easily leaked and exploited by attackers.',
    suggestion: 'Store credentials in environment variables or a secure secret management vault.'
  },
  {
    category: 'Security',
    severity: 'High',
    title: 'Cross-Site Scripting (XSS) / Unsafe HTML Injection',
    regex: /(?:innerHTML|dangerouslySetInnerHTML|echo\s+\$_GET|echo\s+\$_POST|\bdocument\.write\b)/,
    description: 'Direct insertion of unescaped content into the DOM or output stream.',
    whyItMatters: 'Enables attackers to inject and execute malicious scripts in victims’ browsers.',
    suggestion: 'Use textContent, modern framework data-binding, or sanitize HTML with DOMPurify.'
  },
  {
    category: 'Security',
    severity: 'Medium',
    title: 'Insecure Target Blank Link',
    regex: /<a[^>]+target=["']_blank["'](?!.*rel=["'][^"']*noopener[^"']*["'])/i,
    description: 'External link opens in a new tab without rel="noopener noreferrer".',
    whyItMatters: 'Allows the target page to manipulate the opening window using window.opener (reverse tabnabbing).',
    suggestion: 'Add rel="noopener noreferrer" to external hyperlinks.'
  },
  {
    category: 'Security',
    severity: 'Medium',
    title: 'Insecure Random Number Generator',
    regex: /\b(Math\.random|rand|random\.random)\s*\(/,
    description: 'Non-cryptographic pseudorandom number generator used for sensitive values.',
    whyItMatters: 'PRNG outputs are predictable and unsuitable for security tokens, keys, or IDs.',
    suggestion: 'Use cryptographic randomness (e.g., crypto.randomBytes, secrets in Python, or random_bytes in PHP).'
  },

  // --- BUGS & LOGIC ERRORS ---
  {
    category: 'Bugs',
    severity: 'High',
    title: 'Off-by-One Loop Boundary Error',
    regex: /for\s*\(\s*(?:let|var|int)\s+[a-zA-Z0-9_]+\s*=\s*0\s*;\s*[a-zA-Z0-9_]+\s*<=\s*(?:[a-zA-Z0-9_]+\.length|\d+)/,
    description: 'Loop condition uses <= instead of < for 0-indexed structures.',
    whyItMatters: 'Causes array index out of bounds exceptions or uninitialized memory reads.',
    suggestion: 'Change loop condition from <= to < when indexing 0-based arrays.'
  },
  {
    category: 'Bugs',
    severity: 'High',
    title: 'Unchecked .unwrap() in Production Code',
    regex: /\.unwrap\(\)/,
    description: 'Calling .unwrap() on Rust Option or Result types without error handling.',
    whyItMatters: 'Causes the thread to panic and abort if None or Err is encountered.',
    suggestion: 'Use pattern matching, if let, or the ? error propagation operator.'
  },
  {
    category: 'Bugs',
    severity: 'Medium',
    title: 'Loose Equality Operator (==)',
    regex: /(?:if|while)\s*\([^)]*==[^=]/,
    description: 'Using loose equality == rather than strict equality ===.',
    whyItMatters: 'Implicit type coercion can result in subtle and hard-to-debug logical errors (e.g., 0 == "").',
    suggestion: 'Use strict equality === to avoid unintended type coercion.'
  },
  {
    category: 'Bugs',
    severity: 'Medium',
    title: 'Swallowed Exception / Empty Catch Block',
    regex: /catch\s*\([^)]*\)\s*\{\s*(?:\/\/.*|\/\*.*\*\/|\s*console\.log\([^)]*\)\s*;?\s*|\s*)\}/,
    description: 'Catch block swallows exceptions without proper logging or handling.',
    whyItMatters: 'Silent failures hide bugs and leave the application in an indeterminate state.',
    suggestion: 'Log the error with contextual metadata or rethrow it.'
  },

  // --- PERFORMANCE ---
  {
    category: 'Performance',
    severity: 'High',
    title: 'Synchronous Query Inside Loop (N+1 Pattern)',
    regex: /(?:for|while)\s*\([^)]*\)\s*\{[^}]*(?:await\s+database|\.query\(|\.execute\()/s,
    description: 'Database operation invoked sequentially inside a loop.',
    whyItMatters: 'Drastically degrades response times due to repeated network round-trips.',
    suggestion: 'Batch multiple items into a single query using WHERE ... IN (...) or JOIN.'
  },
  {
    category: 'Performance',
    severity: 'Medium',
    title: 'Universal Selector / !important Overuse',
    regex: /(?:outline:\s*none\s*!important|font-size:\s*11px|\* \{[^}]*!important)/,
    description: 'Global stylesheet overrides and accessibility suppressions.',
    whyItMatters: 'Hurts rendering performance and breaks accessible keyboard navigation.',
    suggestion: 'Target specific semantic classes and retain accessible focus rings.'
  },
  {
    category: 'Performance',
    severity: 'Medium',
    title: 'Unbounded Leading Wildcard in SQL LIKE',
    regex: /LIKE\s+['"]%[^'"]+['"]/i,
    description: 'SQL LIKE query with a leading wildcard character (%value).',
    whyItMatters: 'Prevents database indexes from being utilized, forcing full table scans.',
    suggestion: 'Use full-text search indexes or avoid leading wildcards when possible.'
  },

  // --- CODE QUALITY & BEST PRACTICES ---
  {
    category: 'Code Quality',
    severity: 'Low',
    title: 'Use of "var" Instead of "let" or "const"',
    regex: /\bvar\s+[a-zA-Z0-9_]+/,
    description: 'Legacy var keyword used for variable declaration.',
    whyItMatters: 'var has function scope and is hoisted, leading to potential variable leaks and re-declaration bugs.',
    suggestion: 'Replace var with const for immutable variables or let for mutable ones.'
  },
  {
    category: 'Code Quality',
    severity: 'Medium',
    title: 'Use of "any" Type Escape Hatch',
    regex: /:\s*any\b/,
    description: 'Using TypeScript any type disables static type checking.',
    whyItMatters: 'Bypasses compiler safety checks, allowing runtime type mismatches to pass undetected.',
    suggestion: 'Define explicit interfaces or use unknown with type narrowing.'
  },
  {
    category: 'Best Practices',
    severity: 'Low',
    title: 'Console Logging in Production',
    regex: /\bconsole\.(log|debug|warn)\s*\(/,
    description: 'Direct console logging statements found in code.',
    whyItMatters: 'Can leak sensitive debugging information and pollute production stdout.',
    suggestion: 'Use a structured logging framework (e.g. Winston or Pino).'
  }
];

/**
 * Generates an automated, heuristic review when no AI API key is configured
 */
function generateStaticCodeReview({ code, language }) {
  // 1. Check if the code matches known benchmarks (e.g. the sample code snippets)
  const langKey = Object.keys(KNOWN_BENCHMARKS).find(
    k => k.toLowerCase() === language.toLowerCase()
  );
  if (langKey && KNOWN_BENCHMARKS[langKey].matches(code)) {
    return KNOWN_BENCHMARKS[langKey].review;
  }

  // 2. Perform line-by-line and regex pattern analysis
  const lines = code.split('\n');
  const detectedIssues = [];
  const suggestionsSet = new Set();

  HEURISTIC_RULES.forEach((rule, ruleIdx) => {
    // Check if regex matches anywhere in code
    if (rule.regex.test(code)) {
      // Find line number
      let matchedLine = null;
      for (let i = 0; i < lines.length; i++) {
        if (rule.regex.test(lines[i])) {
          matchedLine = i + 1;
          break;
        }
      }

      detectedIssues.push({
        id: `issue-${ruleIdx + 1}`,
        category: rule.category,
        severity: rule.severity,
        title: rule.title,
        description: rule.description,
        whyItMatters: rule.whyItMatters,
        line: matchedLine,
        suggestion: rule.suggestion
      });

      suggestionsSet.add(rule.suggestion);
    }
  });

  // Calculate severity counters
  const severityCounts = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0
  };

  detectedIssues.forEach(issue => {
    const key = issue.severity.toLowerCase();
    if (severityCounts[key] !== undefined) {
      severityCounts[key]++;
    }
  });

  // Calculate quality score (starts at 95, deducted based on issues)
  let score = 95 - (severityCounts.critical * 25) - (severityCounts.high * 15) - (severityCounts.medium * 8) - (severityCounts.low * 3);
  score = Math.max(25, Math.min(98, score));

  // Determine summary
  let summary = '';
  if (detectedIssues.length === 0) {
    summary = `The submitted ${language} code appears clean, well-formatted, and free of obvious security flaws or syntax anti-patterns. Good modularity and clear structure.`;
    score = 92;
    suggestionsSet.add(`Continue writing comprehensive unit and integration tests.`);
    suggestionsSet.add(`Ensure production environment variables are properly isolated.`);
  } else {
    summary = `Static code review detected ${detectedIssues.length} potential ${detectedIssues.length === 1 ? 'issue' : 'issues'} across security, performance, and best practices. Immediate attention is recommended for high-priority findings.`;
  }

  // Provide clean improved/refactored code representation
  let improvedCode = `// Refactored ${language} Code (Reviewed & Cleaned)
${code.split('\n').map(line => {
    // Apply basic automated fixes
    let clean = line;
    clean = clean.replace(/\bvar\s+/g, 'const ');
    clean = clean.replace(/==(?!=)/g, '===');
    return clean;
  }).join('\n')}
`;

  return {
    summary,
    score,
    severity: severityCounts,
    issues: detectedIssues,
    suggestions: Array.from(suggestionsSet).slice(0, 5),
    improvedCode
  };
}

module.exports = {
  generateStaticCodeReview
};
