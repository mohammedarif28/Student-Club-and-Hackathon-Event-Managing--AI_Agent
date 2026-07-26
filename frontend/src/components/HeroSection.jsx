import React from 'react';
import { Sparkles, Play, ShieldCheck, Compass, Users2, Zap } from 'lucide-react';

export default function HeroSection({ 
  onExecute, 
  isLoading, 
  selectedPreset, 
  presets, 
  onSelectPreset 
}) {
  return (
    <div className="hero-container">
      <div className="hero-badge">
        <Sparkles size={16} className="sparkle-icon-animated" />
        <span>Powered by LangGraph & Multi-Agent Architecture</span>
      </div>

      <h1 className="hero-title">
        Hello, <span className="gemini-gradient-text">Campus AI Explorer</span>
      </h1>
      <p className="hero-subtitle">
        Trigger end-to-end multi-agent workflow execution to retrieve campus rules, examination guidelines, placement locations, and active club events.
      </p>

      {/* Prominent Execute Workflow Button */}
      <div className="hero-action-wrapper">
        <button 
          className="execute-btn-lg pulse-glow"
          onClick={onExecute}
          disabled={isLoading}
        >
          <Play size={22} fill="currentColor" />
          <span>{isLoading ? 'Executing Workflow...' : 'Execute Workflow'}</span>
          <Sparkles size={20} className="sparkle-icon-animated" />
        </button>
      </div>

      {/* Selected Preset Details Card */}
      <div className="active-preset-card glass-card">
        <div className="card-header">
          <Zap size={16} className="text-amber" />
          <span className="card-title">Target Workflow Payload</span>
        </div>
        <div className="preset-details">
          <span className="preset-name">{selectedPreset.title}</span>
          <p className="preset-query">"{selectedPreset.query}"</p>
        </div>
      </div>

      {/* Quick Select Preset Grid */}
      <div className="presets-grid-container">
        <div className="grid-label">Select Workflow Target:</div>
        <div className="presets-grid">
          {presets.map((preset) => (
            <div 
              key={preset.id}
              className={`preset-card glass-card ${selectedPreset.id === preset.id ? 'active' : ''}`}
              onClick={() => onSelectPreset(preset)}
            >
              <div className="preset-icon-large">{preset.icon}</div>
              <div className="preset-card-title">{preset.title}</div>
              <div className="preset-card-category">{preset.category}</div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .hero-container {
          max-width: 840px;
          margin: 0 auto;
          padding: 40px 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 24px;
          animation: fadeIn 0.4s ease-out;
        }

        .hero-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 16px;
          border-radius: 99px;
          background: rgba(168, 85, 247, 0.1);
          border: 1px solid rgba(168, 85, 247, 0.25);
          color: var(--accent-purple);
          font-size: 0.82rem;
          font-weight: 600;
        }

        .hero-title {
          font-family: var(--font-heading);
          font-size: 2.8rem;
          font-weight: 700;
          letter-spacing: -0.5px;
          line-height: 1.15;
        }

        .hero-subtitle {
          font-size: 1.05rem;
          color: var(--text-secondary);
          max-width: 640px;
          line-height: 1.6;
        }

        .hero-action-wrapper {
          margin: 12px 0 8px 0;
        }

        .active-preset-card {
          width: 100%;
          max-width: 600px;
          padding: 16px 20px;
          text-align: left;
          background: var(--bg-card);
          border-left: 4px solid var(--accent-blue);
        }

        .card-header {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.76rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--text-muted);
          margin-bottom: 6px;
        }

        .preset-name {
          font-family: var(--font-heading);
          font-weight: 600;
          font-size: 0.95rem;
          color: var(--text-primary);
        }

        .preset-query {
          font-size: 0.88rem;
          color: var(--text-secondary);
          margin-top: 4px;
          font-style: italic;
        }

        .presets-grid-container {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 12px;
          text-align: left;
          margin-top: 8px;
        }

        .grid-label {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .presets-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 14px;
        }

        .preset-card {
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          cursor: pointer;
          border: 1px solid var(--border-color);
          transition: var(--transition-normal);
        }

        .preset-card:hover {
          background: var(--bg-card-hover);
          transform: translateY(-3px);
          border-color: var(--accent-purple);
        }

        .preset-card.active {
          border-color: var(--accent-blue);
          background: rgba(66, 133, 244, 0.08);
          box-shadow: 0 4px 16px rgba(66, 133, 244, 0.15);
        }

        .preset-icon-large {
          font-size: 1.4rem;
        }

        .preset-card-title {
          font-family: var(--font-heading);
          font-weight: 600;
          font-size: 0.92rem;
          color: var(--text-primary);
        }

        .preset-card-category {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .text-amber { color: var(--accent-amber); }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 640px) {
          .hero-title {
            font-size: 2rem;
          }
          .execute-btn-lg {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}
