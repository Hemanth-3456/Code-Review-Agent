import React, { useEffect, useState } from 'react';
import { Terminal, ShieldCheck, Activity } from 'lucide-react';

export default function Header() {
  const [apiOnline, setApiOnline] = useState(null);

  useEffect(() => {
    // Health check ping on mount
    fetch('/api/health')
      .then(res => res.json())
      .then(data => {
        if (data && data.status === 'ok') {
          setApiOnline(true);
        } else {
          setApiOnline(false);
        }
      })
      .catch(() => {
        setApiOnline(false);
      });
  }, []);

  return (
    <header className="app-header">
      <div className="header-content">
        <div className="brand-section">
          <div className="brand-icon">
            <Terminal size={20} />
          </div>
          <div>
            <h1 className="brand-title">
              Code Review <span>Agent</span>
            </h1>
          </div>
        </div>

        <div className="header-actions">
          <div className="status-badge">
            <ShieldCheck size={14} color="#6366F1" />
            <span>AI Code Analysis</span>
          </div>

          <div className="status-badge" title="Backend API Health Status">
            <span
              className="status-dot"
              style={{
                backgroundColor: apiOnline === false ? '#EF4444' : '#10B981',
                boxShadow: apiOnline === false ? '0 0 6px rgba(239, 68, 68, 0.6)' : '0 0 6px rgba(16, 185, 129, 0.6)'
              }}
            />
            <span>{apiOnline === false ? 'API Offline' : 'API Online'}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
