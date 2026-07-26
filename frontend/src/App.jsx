import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import HeroSection from './components/HeroSection';
import ChatContainer from './components/ChatContainer';
import { Play, Sparkles, Compass, ShieldCheck, Users, Info } from 'lucide-react';

const PRESETS = [
  {
    id: 'rules-placement',
    title: 'Exam Rules & Placement Cell',
    category: 'Institutional Guidelines',
    query: 'What are the rules for exam attendance and where is the placement cell?',
    icon: '📜'
  },
  {
    id: 'events-clubs',
    title: 'Clubs & Upcoming Fests',
    category: 'Campus Activities',
    query: 'What are the active campus clubs and upcoming tech fest events?',
    icon: '🎉'
  },
  {
    id: 'general-info',
    title: 'General Campus Facilities',
    category: 'Campus Info',
    query: 'Where is the library, central canteen, and administrative block located?',
    icon: '🏫'
  }
];

export default function App() {
  const [theme, setTheme] = useState('dark');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedPreset, setSelectedPreset] = useState(PRESETS[0]);
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentExecution, setCurrentExecution] = useState(null);
  const [history, setHistory] = useState([]);
  const [activeHistoryId, setActiveHistoryId] = useState(null);

  // Check backend health on mount and periodically
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch('http://127.0.0.1:8000/health');
        if (res.ok) {
          setIsBackendConnected(true);
        } else {
          setIsBackendConnected(false);
        }
      } catch (err) {
        setIsBackendConnected(false);
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  // Update theme on body
  useEffect(() => {
    document.body.className = `${theme}-theme`;
  }, [theme]);

  // Execute Workflow Trigger
  const handleExecuteWorkflow = async () => {
    const startTime = Date.now();
    const executionId = `exec-${Date.now()}`;
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setIsLoading(true);
    setCurrentExecution(null);
    setActiveHistoryId(executionId);

    const historyItem = {
      id: executionId,
      title: selectedPreset.title,
      query: selectedPreset.query,
      timestamp,
      status: 'loading'
    };

    setHistory((prev) => [historyItem, ...prev]);

    try {
      const response = await fetch('http://127.0.0.1:8000/execute-workflow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: selectedPreset.query })
      });

      const data = await response.json();
      const durationSeconds = ((Date.now() - startTime) / 1000).toFixed(2);

      if (response.ok && data.status === 'success') {
        const resultObj = {
          id: executionId,
          query: data.query || selectedPreset.query,
          result: data.result,
          status: 'success',
          executionTime: `${durationSeconds}s`,
          timestamp
        };

        setCurrentExecution(resultObj);
        setHistory((prev) =>
          prev.map((item) => (item.id === executionId ? { ...item, status: 'success' } : item))
        );
      } else {
        throw new Error(data.message || 'Execution error returned by backend.');
      }
    } catch (error) {
      console.error('Workflow Execution Failed:', error);
      const errorObj = {
        id: executionId,
        query: selectedPreset.query,
        status: 'error',
        message: error.message || 'Failed to connect to FastAPI backend at http://127.0.0.1:8000/execute-workflow',
        timestamp
      };

      setCurrentExecution(errorObj);
      setHistory((prev) =>
        prev.map((item) => (item.id === executionId ? { ...item, status: 'error' } : item))
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewExecution = () => {
    setCurrentExecution(null);
    setActiveHistoryId(null);
  };

  const handleSelectHistoryItem = (item) => {
    setActiveHistoryId(item.id);
    if (item.id === currentExecution?.id) return;
    // Find matching full current execution or rebuild preview
    if (item.status === 'success' || item.status === 'error') {
      setCurrentExecution({
        id: item.id,
        query: item.query,
        result: item.result || 'Execution completed.',
        status: item.status,
        executionTime: item.executionTime || '1.0s',
        timestamp: item.timestamp
      });
    }
  };

  return (
    <div className="app-container">
      <Sidebar
        isOpen={isSidebarOpen}
        onNewExecution={handleNewExecution}
        history={history}
        activeHistoryId={activeHistoryId}
        onSelectHistoryItem={handleSelectHistoryItem}
        presets={PRESETS}
        selectedPreset={selectedPreset}
        onSelectPreset={setSelectedPreset}
        onCloseSidebar={() => setIsSidebarOpen(false)}
      />

      <div className="main-content">
        <Header
          theme={theme}
          setTheme={setTheme}
          isBackendConnected={isBackendConnected}
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          activeQuery={selectedPreset.query}
        />

        <main className="content-scrollable">
          {/* Top Sticky Bar when Result or Thinking is active */}
          {(currentExecution || isLoading) && (
            <div className="top-action-bar">
              <div className="bar-left">
                <Sparkles size={16} className="text-purple" />
                <span className="bar-title">{selectedPreset.title}</span>
              </div>
              <button 
                className="execute-btn-sm"
                onClick={handleExecuteWorkflow}
                disabled={isLoading}
              >
                <Play size={15} fill="currentColor" />
                <span>{isLoading ? 'Running...' : 'Execute Workflow'}</span>
              </button>
            </div>
          )}

          {/* Hero View when Idle */}
          {!currentExecution && !isLoading && (
            <HeroSection
              onExecute={handleExecuteWorkflow}
              isLoading={isLoading}
              selectedPreset={selectedPreset}
              presets={PRESETS}
              onSelectPreset={setSelectedPreset}
            />
          )}

          {/* Chat Container View when Execution active or in progress */}
          {(currentExecution || isLoading) && (
            <ChatContainer
              currentExecution={currentExecution}
              onExecute={handleExecuteWorkflow}
              isLoading={isLoading}
            />
          )}
        </main>
      </div>

      <style>{`
        .content-scrollable {
          flex: 1;
          overflow-y: auto;
          position: relative;
          padding-bottom: 40px;
        }

        .top-action-bar {
          position: sticky;
          top: 0;
          z-index: 5;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 24px;
          background: rgba(14, 14, 17, 0.85);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--border-color);
        }

        .bar-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .bar-title {
          font-family: var(--font-heading);
          font-weight: 600;
          font-size: 0.95rem;
          color: var(--text-primary);
        }

        .execute-btn-sm {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 20px;
          border-radius: 99px;
          background: var(--gemini-gradient-btn);
          color: #fff;
          font-family: var(--font-heading);
          font-weight: 600;
          font-size: 0.88rem;
          border: none;
          cursor: pointer;
          transition: var(--transition-fast);
          box-shadow: 0 4px 12px rgba(26, 115, 232, 0.3);
        }

        .execute-btn-sm:hover {
          background: var(--gemini-gradient-btn-hover);
          transform: translateY(-1px);
        }

        .execute-btn-sm:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
