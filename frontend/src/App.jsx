import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './index.css';

function App() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hello! I'm your Campus Info AI. How can I help you today?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');

    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = await axios.post('http://127.0.0.1:8000/api/chat', {
        message: userMessage
      });

      const botReply = response.data.result || response.data.reply || response.data.response || 'No response received.';

      setMessages((prev) => [...prev, { role: 'assistant', content: botReply }]);
    } catch (error) {
      console.error('Error communicating with backend:', error);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Error: Could not connect to the backend server.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="gemini-app-layout">
      {/* Sidebar (Gemini Style) */}
      <aside className="gemini-sidebar">
        <div className="sidebar-header">
          <button className="new-chat-btn" onClick={() => setMessages([{ role: 'assistant', content: "New chat started. What's on your mind?" }])}>
            <span>+</span> New Chat
          </button>
        </div>
        <div className="sidebar-history">
          <div className="history-title">Recent</div>
          <div className="history-item active">Campus Info Session</div>
        </div>
        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="avatar-circle">M</div>
            <span>Mohammed</span>
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="gemini-main">
        <header className="gemini-topbar">
          <h2>Campus AI <span className="sparkle-badge">Campus Agent</span></h2>
        </header>

        <div className="gemini-chat-viewport">
          <div className="messages-scroll-area">
            {messages.map((msg, index) => (
              <div key={index} className={`gemini-message-row ${msg.role}`}>
                <div className="message-content-wrapper">
                  <div className="sender-indicator">
                    {msg.role === 'assistant' ? '🌙' : 'You'}
                  </div>
                  <div className="message-text">
                    {msg.content}
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="gemini-message-row assistant">
                <div className="message-content-wrapper">
                  <div className="sender-indicator">✦</div>
                  <div className="message-text thinking-animation">
                    <span>.</span><span>.</span><span>.</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Floating Input Box */}
          <div className="gemini-input-container">
            <form onSubmit={handleSubmit} className="gemini-form">
              <input
                type="text"
                className="gemini-text-input"
                placeholder="Ask Campus AI anything..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <button type="submit" className="gemini-send-btn" disabled={!input.trim() || loading}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="19" x2="12" y2="5"></line>
                  <polyline points="5 12 12 5 19 12"></polyline>
                </svg>
              </button>
            </form>
            <div className="disclaimer-text">AI may display inaccurate info about campus events or regulations.</div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;