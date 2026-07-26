import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Sparkles, Copy, Check, RotateCcw, AlertTriangle, Play, Terminal, ShieldCheck } from 'lucide-react';
import ThinkingSpinner from './ThinkingSpinner';

export default function ChatContainer({ 
  currentExecution, 
  onExecute, 
  isLoading 
}) {
  const [copied, setCopied] = useState(false);

  if (!currentExecution && !isLoading) {
    return null;
  }

  const handleCopy = () => {
    if (currentExecution?.result) {
      navigator.clipboard.writeText(currentExecution.result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="chat-container">
      {/* Target Triggered Prompt Display */}
      {currentExecution?.query && (
        <div className="user-prompt-card glass-card">
          <div className="user-avatar">EX</div>
          <div className="prompt-content">
            <div className="prompt-badge">Executed Action</div>
            <p className="prompt-text">"{currentExecution.query}"</p>
          </div>
        </div>
      )}

      {/* Thinking State */}
      {isLoading && <ThinkingSpinner />}

      {/* Result Response Container */}
      {!isLoading && currentExecution?.status === 'success' && (
        <div className="ai-response-card glass-card">
          <div className="response-header">
            <div className="ai-avatar">
              <Sparkles size={18} />
            </div>
            <div className="header-meta">
              <span className="ai-name gemini-gradient-text">Gemini Agent Response</span>
              <span className="ai-model">LangGraph Router Node</span>
            </div>
            <div className="actions-group">
              <button className="action-btn" onClick={handleCopy} title="Copy Output">
                {copied ? <Check size={16} className="text-green" /> : <Copy size={16} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <div className="response-body">
            <div className="markdown-body">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {currentExecution.result}
              </ReactMarkdown>
            </div>
          </div>

          <div className="response-footer">
            <div className="footer-stats">
              <span className="stat-chip">
                <ShieldCheck size={12} /> Status: 200 OK
              </span>
              <span className="stat-chip">
                <Terminal size={12} /> Execution: {currentExecution.executionTime || '0.8s'}
              </span>
            </div>
            <button className="run-again-btn" onClick={onExecute} disabled={isLoading}>
              <RotateCcw size={14} />
              <span>Run Again</span>
            </button>
          </div>
        </div>
      )}

      {/* Error Card State */}
      {!isLoading && currentExecution?.status === 'error' && (
        <div className="error-card glass-card">
          <div className="error-header">
            <AlertTriangle size={22} className="text-red" />
            <div className="error-title">Execution Error Occurred</div>
          </div>
          <p className="error-message">
            {currentExecution.message || 'Could not connect to FastAPI server at http://127.0.0.1:8000. Please ensure the backend is running.'}
          </p>
          <div className="error-actions">
            <button className="retry-btn" onClick={onExecute}>
              <Play size={16} fill="currentColor" />
              <span>Retry Execution</span>
            </button>
          </div>
        </div>
      )}

      <style>{`
        .chat-container {
          max-width: 860px;
          width: 100%;
          margin: 0 auto;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          animation: fadeIn 0.3s ease-out;
        }

        .user-prompt-card {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          padding: 16px 20px;
          border-radius: 16px;
          background: var(--bg-chat-user);
          border: 1px solid var(--border-color);
          align-self: flex-end;
          max-width: 85%;
        }

        .user-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--accent-purple);
          color: #fff;
          font-weight: 700;
          font-size: 0.78rem;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .prompt-content {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .prompt-badge {
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--text-muted);
        }

        .prompt-text {
          font-size: 0.95rem;
          color: var(--text-primary);
          font-weight: 500;
        }

        .ai-response-card {
          padding: 24px;
          border-radius: 20px;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          box-shadow: var(--shadow-card);
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .response-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding-bottom: 14px;
          border-bottom: 1px solid var(--border-color);
        }

        .ai-avatar {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: var(--gemini-gradient-btn);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
        }

        .header-meta {
          display: flex;
          flex-direction: column;
        }

        .ai-name {
          font-family: var(--font-heading);
          font-weight: 700;
          font-size: 1rem;
        }

        .ai-model {
          font-size: 0.72rem;
          color: var(--text-muted);
        }

        .actions-group {
          margin-left: auto;
          display: flex;
          gap: 8px;
        }

        .action-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 8px;
          background: transparent;
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          font-size: 0.8rem;
          cursor: pointer;
          transition: var(--transition-fast);
        }

        .action-btn:hover {
          background: var(--bg-card-hover);
          color: var(--text-primary);
        }

        .response-body {
          padding: 4px 0;
        }

        .response-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 14px;
          border-top: 1px solid var(--border-color);
        }

        .footer-stats {
          display: flex;
          gap: 10px;
        }

        .stat-chip {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.74rem;
          color: var(--text-muted);
          background: rgba(255, 255, 255, 0.04);
          padding: 4px 8px;
          border-radius: 6px;
        }

        .run-again-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: 8px;
          background: var(--bg-card-hover);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          transition: var(--transition-fast);
        }

        .run-again-btn:hover {
          border-color: var(--accent-blue);
          color: var(--accent-blue);
        }

        .error-card {
          padding: 24px;
          border-radius: 18px;
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.3);
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .error-header {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .error-title {
          font-family: var(--font-heading);
          font-weight: 700;
          font-size: 1.1rem;
          color: #f87171;
        }

        .error-message {
          font-size: 0.92rem;
          color: var(--text-secondary);
          line-height: 1.5;
        }

        .retry-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          border-radius: 8px;
          background: #ef4444;
          color: #fff;
          font-weight: 600;
          font-size: 0.88rem;
          border: none;
          cursor: pointer;
          transition: var(--transition-fast);
        }

        .retry-btn:hover {
          background: #dc2626;
        }

        .text-red { color: #ef4444; }
      `}</style>
    </div>
  );
}
