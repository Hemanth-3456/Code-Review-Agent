import React, { useState } from 'react';
import Header from './components/Header';
import CodeEditor from './components/CodeEditor';
import ReviewResult from './components/ReviewResult';
import { SAMPLE_CODES } from './data/sampleCodes';

export default function App() {
  const [language, setLanguage] = useState('JavaScript');
  const [code, setCode] = useState(SAMPLE_CODES['JavaScript'] || '');
  const [review, setReview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
  };

  const handleLoadExample = () => {
    const example = SAMPLE_CODES[language];
    if (example) {
      setCode(example);
      setError(null);
    }
  };

  const handleClear = () => {
    setCode('');
    setReview(null);
    setError(null);
  };

  const handleSubmitReview = async () => {
    if (!code || code.trim().length === 0) {
      setError('Please paste or write some code before requesting a review.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code,
          language
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || `Server responded with status ${response.status}`);
      }

      setReview(data.review);
    } catch (err) {
      setError(err.message || 'An unexpected network error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container">
      <Header />

      <main className="main-layout">
        <CodeEditor
          code={code}
          setCode={setCode}
          language={language}
          setLanguage={handleLanguageChange}
          onLoadExample={handleLoadExample}
          onClear={handleClear}
          onSubmit={handleSubmitReview}
          isLoading={isLoading}
        />

        <ReviewResult
          review={review}
          isLoading={isLoading}
          error={error}
        />
      </main>

      <footer className="app-footer">
        <p>Code Review Agent &bull; Production-ready AI code analysis &bull; Deployable as a single Render Web Service</p>
      </footer>
    </div>
  );
}
