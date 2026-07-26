import React from 'react';
import { Sparkles, Sun, Moon, Server, Menu } from 'lucide-react';

export default function Header({
  theme,
  setTheme,
  isBackendConnected,
  toggleSidebar,
  activeQuery
}) {
  return (
    <header className="header-bar">
      <div className="header-left">
        <button
          className="icon-btn sidebar-toggle-btn"
          onClick={toggleSidebar}
          title="Toggle Sidebar"
        >
          <Menu size={20} />
        </button>

        <div className="brand-logo">
          <div className="sparkle-badge">
            <Sparkles size={18} className="sparkle-icon-animated" />
          </div>
          <div className="brand-titles">
            <span className="brand-name gemini-gradient-text">Campus Agent</span>
            <span className="brand-sub">Campus Multi-Agent System</span>
          </div>
        </div>
      </div>

      <div className="header-center">
        <div className="status-chip">
          <span className="status-dot green"></span>
          <span className="status-text">Supervisor Router Active</span>
        </div>
      </div>

      <div className="header-right">
        <div className={`backend-badge ${isBackendConnected ? 'online' : 'offline'}`}>
          <Server size={14} />
          <span>{isBackendConnected ? 'FastAPI 8000: Live' : 'Connecting...'}</span>
        </div>

        <button
          className="icon-btn theme-toggle-btn"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      <style>{`
        .header-bar {
          height: 64px;
          padding: 0 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid var(--border-color);
          background: var(--bg-sidebar);
          z-index: 10;
        }

        .header-left, .header-right, .header-center {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .icon-btn {
          background: transparent;
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          width: 38px;
          height: 38px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: var(--transition-fast);
        }

        .icon-btn:hover {
          background: var(--bg-card-hover);
          color: var(--text-primary);
          border-color: var(--text-muted);
        }

        .brand-logo {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .sparkle-badge {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: var(--gemini-gradient-btn);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
        }

        .brand-titles {
          display: flex;
          flex-direction: column;
        }

        .brand-name {
          font-family: var(--font-heading);
          font-weight: 700;
          font-size: 1.1rem;
          line-height: 1.2;
        }

        .brand-sub {
          font-size: 0.72rem;
          color: var(--text-muted);
        }

        .status-chip {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          border-radius: 99px;
          background: rgba(66, 133, 244, 0.08);
          border: 1px solid rgba(66, 133, 244, 0.2);
          font-size: 0.8rem;
          color: var(--accent-blue);
          font-weight: 500;
        }

        .status-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--accent-green);
          box-shadow: 0 0 8px var(--accent-green);
        }

        .backend-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.78rem;
          padding: 5px 12px;
          border-radius: 8px;
          border: 1px solid var(--border-color);
        }

        .backend-badge.online {
          color: var(--accent-green);
          background: rgba(16, 185, 129, 0.08);
          border-color: rgba(16, 185, 129, 0.25);
        }

        .backend-badge.offline {
          color: var(--accent-amber);
          background: rgba(245, 158, 11, 0.08);
          border-color: rgba(245, 158, 11, 0.25);
        }

        @media (max-width: 768px) {
          .header-center {
            display: none;
          }
        }
      `}</style>
    </header>
  );
}
