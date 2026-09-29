import React, { useState } from 'react';
import IssueCard from './IssueCard';
import {
  FileCheck,
  AlertCircle,
  Copy,
  Check,
  Layers,
  Sparkles,
  Lightbulb,
  Code
} from 'lucide-react';

export default function ReviewResult({
  review,
  isLoading,
  error
}) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [activeFilter, setActiveFilter] = useState('ALL');

  const handleCopyCode = async () => {
    if (!review?.improvedCode) return;
    try {
      await navigator.clipboard.writeText(review.improvedCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      // Fallback
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleCopySummary = async () => {
    if (!review?.summary) return;
    try {
      const summaryText = `Code Review Summary (Score: ${review.score}/100):\n${review.summary}\n\nIssues Found:\n- Critical: ${review.severity?.critical || 0}\n- High: ${review.severity?.high || 0}\n- Medium: ${review.severity?.medium || 0}\n- Low: ${review.severity?.low || 0}`;
      await navigator.clipboard.writeText(summaryText);
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2000);
    } catch {
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2000);
    }
  };

  // Score styling logic
  const getScoreClass = (score) => {
    if (score >= 80) return 'high';
    if (score >= 50) return 'medium';
    return 'low';
  };

  // Filter issues by category
  const issues = review?.issues || [];
  const filteredIssues = activeFilter === 'ALL'
    ? issues
    : issues.filter(i => (i.category || '').toLowerCase().includes(activeFilter.toLowerCase()));

  // Category counts for filter tabs
  const getCategoryCount = (keyword) => {
    return issues.filter(i => (i.category || '').toLowerCase().includes(keyword.toLowerCase())).length;
  };

  return (
    <section className="panel" aria-label="Review Results Section">
      <div className="panel-header">
        <div className="panel-title">
          <Layers size={18} color="#6366F1" />
          <span>Code Review</span>
        </div>

        {review && (
          <div className="panel-actions">
            <button
              type="button"
              className={`btn-copy ${copiedSummary ? 'copied' : ''}`}
              onClick={handleCopySummary}
              title="Copy review summary"
            >
              {copiedSummary ? <Check size={14} /> : <Copy size={14} />}
              <span>{copiedSummary ? 'Copied!' : 'Copy Summary'}</span>
            </button>
          </div>
        )}
      </div>

      <div className="review-panel-body">
        {/* Loading State */}
        {isLoading && (
          <div className="state-loading" role="status" aria-live="polite">
            <div className="loading-spinner-large" aria-hidden="true" />
            <h3>Analyzing your code...</h3>
            <p>Scanning for bugs, security risks, performance bottlenecks, and best practices.</p>
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div className="state-error" role="alert">
            <AlertCircle className="error-icon" size={24} />
            <div className="error-content">
              <h4>Review Request Failed</h4>
              <p>{error}</p>
              <div className="error-hint">
                <strong>Tip:</strong> If you are testing locally or on Render, ensure you configured the <code>AI_API_KEY</code> environment variable in your <code>.env</code> file or Render Environment tab.
              </div>
            </div>
          </div>
        )}

        {/* Initial / Empty State */}
        {!isLoading && !error && !review && (
          <div className="state-empty">
            <div className="empty-icon-wrapper">
              <FileCheck size={32} />
            </div>
            <h3>Ready for Review</h3>
            <p>Paste your source code in the editor on the left and click "Review Code" to get an AI-powered code analysis.</p>
          </div>
        )}

        {/* Success Review Content */}
        {!isLoading && !error && review && (
          <div className="review-content">
            {/* Overall Review & Score */}
            <div className="summary-card">
              <div className="summary-header">
                <span className="summary-title">Overall Review</span>
                {typeof review.score === 'number' && (
                  <div className={`score-badge ${getScoreClass(review.score)}`}>
                    <span className="score-value">{review.score}</span>
                    <span className="score-scale">/100 Quality</span>
                  </div>
                )}
              </div>
              <p className="summary-text">{review.summary}</p>
            </div>

            {/* Severity Counter Grid */}
            <div className="severity-grid" aria-label="Severity Summary">
              <div className="severity-counter-card critical">
                <span className="sev-counter-label">Critical</span>
                <span className="sev-counter-count">{review.severity?.critical || 0}</span>
              </div>
              <div className="severity-counter-card high">
                <span className="sev-counter-label">High</span>
                <span className="sev-counter-count">{review.severity?.high || 0}</span>
              </div>
              <div className="severity-counter-card medium">
                <span className="sev-counter-label">Medium</span>
                <span className="sev-counter-count">{review.severity?.medium || 0}</span>
              </div>
              <div className="severity-counter-card low">
                <span className="sev-counter-label">Low</span>
                <span className="sev-counter-count">{review.severity?.low || 0}</span>
              </div>
            </div>

            {/* Filter Tabs */}
            {issues.length > 0 && (
              <div className="filter-tabs" role="tablist" aria-label="Filter issues by category">
                <button
                  type="button"
                  className={`tab-btn ${activeFilter === 'ALL' ? 'active' : ''}`}
                  onClick={() => setActiveFilter('ALL')}
                >
                  All ({issues.length})
                </button>
                {getCategoryCount('bug') > 0 && (
                  <button
                    type="button"
                    className={`tab-btn ${activeFilter === 'bug' ? 'active' : ''}`}
                    onClick={() => setActiveFilter('bug')}
                  >
                    🐞 Bugs ({getCategoryCount('bug')})
                  </button>
                )}
                {getCategoryCount('security') > 0 && (
                  <button
                    type="button"
                    className={`tab-btn ${activeFilter === 'security' ? 'active' : ''}`}
                    onClick={() => setActiveFilter('security')}
                  >
                    🔐 Security ({getCategoryCount('security')})
                  </button>
                )}
                {getCategoryCount('performance') > 0 && (
                  <button
                    type="button"
                    className={`tab-btn ${activeFilter === 'performance' ? 'active' : ''}`}
                    onClick={() => setActiveFilter('performance')}
                  >
                    ⚡ Performance ({getCategoryCount('performance')})
                  </button>
                )}
                {getCategoryCount('quality') > 0 && (
                  <button
                    type="button"
                    className={`tab-btn ${activeFilter === 'quality' ? 'active' : ''}`}
                    onClick={() => setActiveFilter('quality')}
                  >
                    🧹 Quality ({getCategoryCount('quality')})
                  </button>
                )}
                {getCategoryCount('practice') > 0 && (
                  <button
                    type="button"
                    className={`tab-btn ${activeFilter === 'practice' ? 'active' : ''}`}
                    onClick={() => setActiveFilter('practice')}
                  >
                    📚 Practices ({getCategoryCount('practice')})
                  </button>
                )}
              </div>
            )}

            {/* Issues List */}
            {filteredIssues.length > 0 ? (
              <div className="issues-list">
                {filteredIssues.map((issue) => (
                  <IssueCard key={issue.id || issue.title} issue={issue} />
                ))}
              </div>
            ) : issues.length > 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                No issues found matching this filter category.
              </p>
            ) : (
              <div className="suggestions-box">
                <h4>
                  <Sparkles size={16} color="#10B981" />
                  <span>No Critical Issues Detected</span>
                </h4>
                <p style={{ fontSize: '0.84375rem', color: '#D1D5DB' }}>
                  The submitted code is clean, well-structured, and adheres to recommended practices.
                </p>
              </div>
            )}

            {/* General Suggestions */}
            {review.suggestions && review.suggestions.length > 0 && (
              <div className="suggestions-box">
                <h4>
                  <Lightbulb size={16} color="#38BDF8" />
                  <span>Key Recommendations</span>
                </h4>
                <ul className="suggestions-list">
                  {review.suggestions.map((sug, idx) => (
                    <li key={idx}>{sug}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Improved / Refactored Code */}
            {review.improvedCode && (
              <div className="code-block-section">
                <div className="code-block-header">
                  <div className="code-block-title">
                    <Code size={16} color="#6366F1" />
                    <span>Improved Code</span>
                  </div>
                  <button
                    type="button"
                    id="copy-improved-code-btn"
                    className={`btn-copy ${copiedCode ? 'copied' : ''}`}
                    onClick={handleCopyCode}
                  >
                    {copiedCode ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
                  </button>
                </div>
                <pre className="improved-code-pre">
                  <code>{review.improvedCode}</code>
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
