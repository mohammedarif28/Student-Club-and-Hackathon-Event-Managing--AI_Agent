import React, { useState, useEffect } from 'react';
import { Sparkles, Cpu, GitBranch, Database, CheckCircle2 } from 'lucide-react';

const STEPS = [
  { id: 1, label: 'Initializing LangGraph Workflow...', icon: <Cpu size={16} /> },
  { id: 2, label: 'Evaluating Supervisor Router Conditions...', icon: <GitBranch size={16} /> },
  { id: 3, label: 'Retrieving Vector DB Embeddings & Club Rules...', icon: <Database size={16} /> },
  { id: 4, label: 'Synthesizing Final Structured Response...', icon: <Sparkles size={16} /> }
];

export default function ThinkingSpinner({ startTime }) {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const timer1 = setTimeout(() => setActiveStep(1), 1200);
    const timer2 = setTimeout(() => setActiveStep(2), 2600);
    const timer3 = setTimeout(() => setActiveStep(3), 4200);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  return (
    <div className="thinking-container glass-card pulse-glow">
      <div className="thinking-header">
        <div className="gemini-avatar">
          <Sparkles size={20} className="sparkle-icon-animated" />
        </div>
        <div className="thinking-title-area">
          <span className="thinking-label gemini-gradient-text">Thinking & Executing Workflow...</span>
          <span className="thinking-sub">Multi-Agent LangGraph Execution Pipeline</span>
        </div>
      </div>

      <div className="steps-pipeline">
        {STEPS.map((step, idx) => {
          const isDone = idx < activeStep;
          const isCurrent = idx === activeStep;

          return (
            <div 
              key={step.id} 
              className={`pipeline-step ${isDone ? 'done' : ''} ${isCurrent ? 'current' : ''}`}
            >
              <div className="step-icon">
                {isDone ? <CheckCircle2 size={16} className="text-green" /> : step.icon}
              </div>
              <span className="step-label">{step.label}</span>
              {isCurrent && <span className="step-spinner"></span>}
            </div>
          );
        })}
      </div>

      <style>{`
        .thinking-container {
          padding: 24px;
          border-radius: 18px;
          background: var(--bg-card);
          border: 1px solid var(--border-highlight);
          display: flex;
          flex-direction: column;
          gap: 20px;
          margin: 20px 0;
          animation: slideUp 0.3s ease-out;
        }

        .thinking-header {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .gemini-avatar {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          background: var(--gemini-gradient-btn);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          box-shadow: 0 4px 16px rgba(123, 31, 162, 0.4);
        }

        .thinking-title-area {
          display: flex;
          flex-direction: column;
        }

        .thinking-label {
          font-family: var(--font-heading);
          font-weight: 700;
          font-size: 1.1rem;
        }

        .thinking-sub {
          font-size: 0.78rem;
          color: var(--text-muted);
        }

        .steps-pipeline {
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding-left: 8px;
        }

        .pipeline-step {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 0.88rem;
          color: var(--text-muted);
          transition: var(--transition-fast);
        }

        .pipeline-step.done {
          color: var(--text-secondary);
        }

        .pipeline-step.current {
          color: var(--text-primary);
          font-weight: 600;
        }

        .step-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
        }

        .step-spinner {
          width: 14px;
          height: 14px;
          border: 2px solid var(--accent-blue);
          border-top-color: transparent;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin-left: auto;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
