import React from 'react';
import { Plus, History, Bot, Sparkles, CheckCircle2, Clock, Layers, ChevronLeft } from 'lucide-react';

export default function Sidebar({ 
  isOpen, 
  onNewExecution, 
  history, 
  activeHistoryId, 
  onSelectHistoryItem,
  presets,
  selectedPreset,
  onSelectPreset,
  onCloseSidebar
}) {
  return (
    <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-top">
        <button className="new-exec-btn" onClick={onNewExecution}>
          <Plus size={18} />
          <span>New Execution</span>
        </button>

        <button className="icon-btn close-sidebar-btn" onClick={onCloseSidebar} title="Close Sidebar">
          <ChevronLeft size={18} />
        </button>
      </div>

      <div className="sidebar-section">
        <div className="section-header">
          <Layers size={15} />
          <span>Workflow Presets</span>
        </div>
        <div className="preset-list">
          {presets.map((preset) => (
            <button
              key={preset.id}
              className={`preset-item ${selectedPreset.id === preset.id ? 'active' : ''}`}
              onClick={() => onSelectPreset(preset)}
            >
              <div className="preset-icon">{preset.icon}</div>
              <div className="preset-info">
                <div className="preset-title">{preset.title}</div>
                <div className="preset-desc">{preset.category}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="sidebar-section flex-1 overflow-y">
        <div className="section-header">
          <History size={15} />
          <span>Execution History ({history.length})</span>
        </div>
        <div className="history-list">
          {history.length === 0 ? (
            <div className="empty-history">
              <Clock size={20} className="text-muted" />
              <span>No prior executions</span>
            </div>
          ) : (
            history.map((item) => (
              <button
                key={item.id}
                className={`history-item ${activeHistoryId === item.id ? 'active' : ''}`}
                onClick={() => onSelectHistoryItem(item)}
              >
                <div className="history-status">
                  {item.status === 'loading' ? (
                    <span className="pulse-dot"></span>
                  ) : item.status === 'success' ? (
                    <CheckCircle2 size={14} className="text-green" />
                  ) : (
                    <span className="error-dot">!</span>
                  )}
                </div>
                <div className="history-details">
                  <div className="history-title">{item.title}</div>
                  <div className="history-time">{item.timestamp}</div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="sidebar-footer">
        <div className="agent-info-card glass-card">
          <Bot size={18} className="text-purple" />
          <div className="agent-text">
            <span className="agent-name">Campus AI Multi-Agent</span>
            <span className="agent-sub">LangGraph Supervisor</span>
          </div>
        </div>
      </div>

      <style>{`
        .sidebar {
          width: 280px;
          height: 100vh;
          background: var(--bg-sidebar);
          border-right: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          padding: 16px 12px;
          gap: 16px;
          transition: transform var(--transition-normal), width var(--transition-normal);
          z-index: 20;
        }

        .sidebar.closed {
          transform: translateX(-100%);
          width: 0;
          padding: 0;
          overflow: hidden;
          border-right: none;
        }

        .sidebar-top {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .new-exec-btn {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 18px;
          border-radius: 12px;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          font-family: var(--font-heading);
          font-weight: 600;
          font-size: 0.92rem;
          cursor: pointer;
          transition: var(--transition-fast);
        }

        .new-exec-btn:hover {
          background: var(--bg-card-hover);
          border-color: var(--accent-blue);
          box-shadow: 0 4px 12px rgba(66, 133, 244, 0.15);
        }

        .close-sidebar-btn {
          display: none;
        }

        .sidebar-section {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .section-header {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.76rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--text-muted);
          padding: 0 6px;
        }

        .preset-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .preset-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          border-radius: 10px;
          background: transparent;
          border: 1px solid transparent;
          color: var(--text-secondary);
          text-align: left;
          cursor: pointer;
          transition: var(--transition-fast);
        }

        .preset-item:hover {
          background: var(--bg-card-hover);
          color: var(--text-primary);
        }

        .preset-item.active {
          background: rgba(66, 133, 244, 0.12);
          border-color: rgba(66, 133, 244, 0.3);
          color: var(--accent-blue);
        }

        .preset-icon {
          font-size: 1.1rem;
        }

        .preset-info {
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .preset-title {
          font-size: 0.85rem;
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .preset-desc {
          font-size: 0.7rem;
          color: var(--text-muted);
        }

        .history-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
          max-height: 280px;
          overflow-y: auto;
        }

        .empty-history {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 16px;
          font-size: 0.8rem;
          color: var(--text-muted);
        }

        .history-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 10px;
          background: transparent;
          border: 1px solid transparent;
          color: var(--text-secondary);
          text-align: left;
          cursor: pointer;
          transition: var(--transition-fast);
        }

        .history-item:hover {
          background: var(--bg-card-hover);
          color: var(--text-primary);
        }

        .history-item.active {
          background: var(--bg-card);
          border-color: var(--border-highlight);
          color: var(--text-primary);
        }

        .history-title {
          font-size: 0.82rem;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .history-time {
          font-size: 0.68rem;
          color: var(--text-muted);
        }

        .text-green { color: var(--accent-green); }
        .text-purple { color: var(--accent-purple); }

        .pulse-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--accent-blue);
          animation: pulse 1.2s infinite;
        }

        .error-dot {
          display: inline-block;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #ef4444;
          color: #fff;
          font-size: 10px;
          font-weight: bold;
          text-align: center;
          line-height: 14px;
        }

        @keyframes pulse {
          0% { transform: scale(0.8); opacity: 0.5; }
          50% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(0.8); opacity: 0.5; }
        }

        .sidebar-footer {
          margin-top: auto;
        }

        .agent-info-card {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px;
        }

        .agent-text {
          display: flex;
          flex-direction: column;
        }

        .agent-name {
          font-size: 0.82rem;
          font-weight: 600;
        }

        .agent-sub {
          font-size: 0.68rem;
          color: var(--text-muted);
        }

        @media (max-width: 768px) {
          .sidebar {
            position: fixed;
            top: 0;
            left: 0;
            height: 100vh;
            box-shadow: var(--shadow-card);
          }
          .close-sidebar-btn {
            display: flex;
          }
        }
      `}</style>
    </aside>
  );
}
