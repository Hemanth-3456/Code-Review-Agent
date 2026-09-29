import React from 'react';
import SeverityBadge from './SeverityBadge';
import { Bug, ShieldAlert, Zap, Sparkles, BookOpen, Lightbulb } from 'lucide-react';

export default function IssueCard({ issue }) {
  const getCategoryIcon = (category) => {
    const cat = (category || '').toLowerCase();
    if (cat.includes('bug')) return <Bug size={16} color="#F87171" />;
    if (cat.includes('security')) return <ShieldAlert size={16} color="#FB923C" />;
    if (cat.includes('performance')) return <Zap size={16} color="#FBBF24" />;
    if (cat.includes('practice')) return <BookOpen size={16} color="#818CF8" />;
    if (cat.includes('suggestion')) return <Lightbulb size={16} color="#38BDF8" />;
    return <Sparkles size={16} color="#34D399" />;
  };

  return (
    <article className="issue-card" aria-label={`Issue: ${issue.title}`}>
      <div className="issue-card-header">
        <div className="issue-title-group">
          <span className="issue-category-icon" aria-hidden="true">
            {getCategoryIcon(issue.category)}
          </span>
          <h4 className="issue-title">{issue.title}</h4>
        </div>

        <div className="issue-meta">
          {issue.line && (
            <span className="line-badge">Line {issue.line}</span>
          )}
          <SeverityBadge severity={issue.severity} />
        </div>
      </div>

      <div className="issue-body">
        <p className="issue-description">{issue.description}</p>

        {issue.whyItMatters && (
          <div className="issue-why-it-matters">
            <strong>Why it matters:</strong> {issue.whyItMatters}
          </div>
        )}

        {issue.suggestion && (
          <div className="issue-suggestion">
            <strong>Suggested fix:</strong> {issue.suggestion}
          </div>
        )}
      </div>
    </article>
  );
}
