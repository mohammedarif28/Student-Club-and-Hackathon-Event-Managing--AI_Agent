import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './index.css';

function App() {
  const [chats, setChats] = useState(() => {
    try {
      const saved = localStorage.getItem('campus_all_chats');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error("Error loading chats", e);
    }
    return [{
      id: Date.now(),
      title: 'Campus Info Session',
      messages: [{ role: 'assistant', content: "Hello! I'm your Campus Info AI. How can I help you today?" }]
    }];
  });

  const [activeChatId, setActiveChatId] = useState(() => chats[0]?.id);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const currentChat = chats.find(c => c.id === activeChatId) || chats[0];
  const messages = currentChat ? currentChat.messages : [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  useEffect(() => {
    try {
      localStorage.setItem('campus_all_chats', JSON.stringify(chats));
    } catch (e) {
      console.error("Error saving chats", e);
    }
  }, [chats]);

  const handleNewChat = () => {
    const newChat = {
      id: Date.now(),
      title: 'New Conversation',
      messages: [{ role: 'assistant', content: "New chat started. What's on your mind?" }]
    };
    setChats(prev => [newChat, ...prev]);
    setActiveChatId(newChat.id);
  };

  const handleDeleteChat = (e, chatId) => {
    e.stopPropagation();
    const updatedChats = chats.filter(c => c.id !== chatId);
    
    if (updatedChats.length === 0) {
      const freshChat = {
        id: Date.now(),
        title: 'New Conversation',
        messages: [{ role: 'assistant', content: "Hello! I'm your Campus Info AI. How can I help you today?" }]
      };
      setChats([freshChat]);
      setActiveChatId(freshChat.id);
    } else {
      setChats(updatedChats);
      if (activeChatId === chatId) {
        setActiveChatId(updatedChats[0].id);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const userMessage = input.trim();
    if (!userMessage || loading) return;

    setInput('');

    // 1. Determine title if it's the first message
    let chatTitle = currentChat.title;
    if (chatTitle === 'New Conversation' || chatTitle === 'Campus Info Session') {
      chatTitle = userMessage.length > 25 ? userMessage.substring(0, 25) + '...' : userMessage;
    }

    // 2. Append user message locally first
    const newMessagesList = [...currentChat.messages, { role: 'user', content: userMessage }];

    setChats(prev => prev.map(chat => {
      if (chat.id === activeChatId) {
        return { ...chat, title: chatTitle, messages: newMessagesList };
      }
      return chat;
    }));

    setLoading(true);

    try {
      // 3. Send request to backend FastAPI workflow endpoint
      const response = await axios.post('http://127.0.0.1:8000/api/chat', {
        message: userMessage
      });

      const botReply = response.data.result || response.data.reply || response.data.response || 'No response received.';

      // 4. Append assistant response
      setChats(prev => prev.map(chat => {
        if (chat.id === activeChatId) {
          return {
            ...chat,
            messages: [...chat.messages, { role: 'assistant', content: botReply }]
          };
        }
        return chat;
      }));
    } catch (error) {
      console.error('Error communicating with backend:', error);
      setChats(prev => prev.map(chat => {
        if (chat.id === activeChatId) {
          return {
            ...chat,
            messages: [...chat.messages, { role: 'assistant', content: 'Error: Could not connect to the backend server.' }]
          };
        }
        return chat;
      }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="gemini-app-layout">
      {/* Sidebar */}
      <aside className="gemini-sidebar">
        <div className="sidebar-header">
          <button className="new-chat-btn" onClick={handleNewChat}>
            <span>+</span> New Chat
          </button>
        </div>
        <div className="sidebar-history">
          <div className="history-title">Recent Conversations</div>
          <div className="history-list" style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 180px)' }}>
            {chats.map(chat => (
              <div 
                key={chat.id}
                onClick={() => setActiveChatId(chat.id)}
                className={`history-item ${chat.id === activeChatId ? 'active' : ''}`}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  padding: '8px 10px',
                  marginBottom: '4px',
                  borderRadius: '6px',
                  backgroundColor: chat.id === activeChatId ? 'rgba(255,255,255,0.1)' : 'transparent'
                }}
              >
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px', fontSize: '13px' }}>
                  {chat.title}
                </span>
                <button 
                  onClick={(e) => handleDeleteChat(e, chat.id)}
                  title="Delete Chat"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#aaa',
                    cursor: 'pointer',
                    fontSize: '12px',
                    padding: '2px 4px',
                  }}
                  onMouseOver={(e) => e.target.style.color = '#ff4d4d'}
                  onMouseOut={(e) => e.target.style.color = '#aaa'}
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
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
                  <div className="sender-indicator">🌙</div>
                  <div className="message-text thinking-animation">
                    <span>.</span><span>.</span><span>.</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
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