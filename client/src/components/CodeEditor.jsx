import React, { useRef } from 'react';
import { Play, RotateCcw, FileCode, Code2 } from 'lucide-react';
import { LANGUAGE_OPTIONS } from '../data/sampleCodes';

export default function CodeEditor({
  code,
  setCode,
  language,
  setLanguage,
  onLoadExample,
  onClear,
  onSubmit,
  isLoading
}) {
  const textareaRef = useRef(null);

  // Tab key indentation support in textarea
  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      const newCode = code.substring(0, start) + '  ' + code.substring(end);
      setCode(newCode);

      // Restore cursor position
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }
  };

  const lineCount = code ? code.split('\n').length : 0;
  const charCount = code ? code.length : 0;
  const isSubmitDisabled = isLoading || !code || code.trim().length === 0;

  return (
    <section className="panel" aria-label="Code Input Section">
      <div className="panel-header">
        <div className="panel-title">
          <Code2 size={18} color="#6366F1" />
          <span>Your Code</span>
        </div>

        <div className="panel-actions">
          <label htmlFor="language-select" className="sr-only" style={{ display: 'none' }}>
            Select Programming Language
          </label>
          <select
            id="language-select"
            className="select-input"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            disabled={isLoading}
            aria-label="Select programming language"
          >
            {LANGUAGE_OPTIONS.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>

          <button
            type="button"
            className="btn-secondary"
            onClick={onLoadExample}
            disabled={isLoading}
            title={`Load sample ${language} code with reviewable issues`}
          >
            <FileCode size={14} />
            <span>Load Example</span>
          </button>

          <button
            type="button"
            className="btn-secondary"
            onClick={onClear}
            disabled={isLoading || !code}
            title="Clear code editor"
          >
            <RotateCcw size={14} />
            <span>Clear</span>
          </button>
        </div>
      </div>

      <div className="editor-container">
        <textarea
          ref={textareaRef}
          id="code-editor-input"
          className="code-textarea"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`// Paste your ${language} code here, or click "Load Example" above...`}
          spellCheck="false"
          autoCapitalize="off"
          autoCorrect="off"
          aria-label="Code editor"
        />

        <div className="editor-footer">
          <div className="editor-stats">
            <span>{lineCount} {lineCount === 1 ? 'line' : 'lines'}</span>
            <span>{charCount} characters</span>
          </div>
          <div>
            <span>{language}</span>
          </div>
        </div>
      </div>

      <div className="panel-footer-action">
        <button
          type="button"
          id="review-code-btn"
          className="btn-primary"
          onClick={onSubmit}
          disabled={isSubmitDisabled}
          aria-busy={isLoading}
        >
          {isLoading ? (
            <>
              <div className="spinner" aria-hidden="true" />
              <span>Analyzing your code...</span>
            </>
          ) : (
            <>
              <Play size={16} />
              <span>Review Code</span>
            </>
          )}
        </button>
      </div>
    </section>
  );
}
