import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { MessageSquare, Send, Trash2, ShieldAlert, Cpu, Sparkles } from 'lucide-react';

const ChatAssistant = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  const presetQueries = [
    "Show critical issues",
    "Which assets are missing?",
    "What requires immediate attention?",
    "Explain configuration drift anomalies"
  ];

  const fetchChatHistory = async () => {
    try {
      const res = await axios.get('/api/chat/history');
      setMessages(res.data);
    } catch (err) {
      console.error(err);
      setError('Could not download historical chat transcript.');
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    fetchChatHistory();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, sending]);

  const handleSendMessage = async (textToSend) => {
    const messageText = textToSend || input;
    if (!messageText.trim()) return;

    if (!textToSend) setInput('');
    setSending(true);

    // Optimistically add user message to list
    const tempUserMsg = { id: Date.now(), role: 'user', message: messageText, created_at: new Date().toISOString() };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const res = await axios.post('/api/chat', { message: messageText });
      const assistantReply = { 
        id: Date.now() + 1, 
        role: 'assistant', 
        message: res.data.response, 
        created_at: new Date().toISOString() 
      };
      setMessages(prev => [...prev, assistantReply]);
    } catch (err) {
      console.error(err);
      const errorReply = {
        id: Date.now() + 1,
        role: 'assistant',
        message: 'I apologize, but I failed to communicate with my reconciliation models. Please verify API configurations.',
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorReply]);
    } finally {
      setSending(false);
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm("Are you sure you want to purge your conversation history?")) return;
    try {
      await axios.delete('/api/chat/history');
      setMessages([]);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] space-y-4">
        <div className="border-4 border-slate-800 border-t-violet-500 h-12 w-12 rounded-full animate-spin"></div>
        <p className="text-slate-400 text-sm">Opening secure chat channel...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[78vh] max-w-5xl mx-auto select-none space-y-4">
      {/* Header Panel */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight flex items-center space-x-2">
            <Cpu className="h-5 w-5 text-violet-400" />
            <span>AI Reconciliation Assistant</span>
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">Queries assets discrepancies, state drifts, and security recommendations directly.</p>
        </div>
        <button
          onClick={handleClearHistory}
          disabled={messages.length === 0}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-800 hover:border-rose-500/30 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 transition-all duration-200"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>Clear Logs</span>
        </button>
      </div>

      {/* Main Panel grid */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Dialogue area */}
        <div className="lg:col-span-8 flex flex-col h-full bg-slate-900/30 border border-slate-800/80 rounded-2xl overflow-hidden glass">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 max-w-sm mx-auto select-none py-10">
                <MessageSquare className="h-10 w-10 text-slate-600" />
                <h3 className="text-sm font-bold text-slate-400">Secure Consultation Port</h3>
                <p className="text-slate-500 text-xs leading-relaxed">
                  I possess context on your latest asset reconciliation telemetry. Ask me to find drift anomalies, count mismatch parameters, or advise audit mitigations.
                </p>
              </div>
            ) : (
              messages.map((msg) => {
                const isUser = msg.role === 'user';
                return (
                  <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex items-start space-x-2.5 max-w-[80%] ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
                      <div className={`h-8 w-8 rounded-full flex-shrink-0 flex items-center justify-center border text-xs font-semibold ${
                        isUser 
                          ? 'bg-violet-600/30 text-violet-400 border-violet-500/20' 
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/10'
                      }`}>
                        {isUser ? 'U' : 'AI'}
                      </div>
                      
                      <div className={`p-4 rounded-2xl text-xs leading-relaxed font-normal whitespace-pre-wrap ${
                        isUser 
                          ? 'bg-violet-600 text-white rounded-tr-none' 
                          : 'bg-slate-950/80 text-slate-200 border border-slate-800 rounded-tl-none font-medium'
                      }`}>
                        {msg.message}
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {/* Typing Loader */}
            {sending && (
              <div className="flex justify-start">
                <div className="flex items-start space-x-2.5 max-w-[80%]">
                  <div className="h-8 w-8 rounded-full flex-shrink-0 flex items-center justify-center border bg-emerald-500/10 text-emerald-400 border-emerald-500/10 text-xs font-semibold">
                    AI
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 rounded-tl-none flex items-center space-x-1.5 py-3">
                    <span className="h-1.5 w-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="h-1.5 w-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="h-1.5 w-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Form input */}
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
            className="p-4 bg-slate-950/40 border-t border-slate-800/80 flex items-center space-x-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about discrepancies (e.g., 'Show critical issues')..."
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 transition-all text-xs"
            />
            <button
              type="submit"
              disabled={!input.trim() || sending}
              className="p-3 bg-violet-600 hover:bg-violet-500 disabled:bg-slate-800 disabled:text-slate-600 rounded-xl transition-all border border-violet-500/20"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>

        {/* Sidebar help tips / preset queries */}
        <div className="lg:col-span-4 space-y-4">
          <div className="glass p-5 rounded-2xl border border-slate-800/80 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
              <Sparkles className="h-4 w-4 text-violet-400" />
              <span>Prompt Templates</span>
            </h3>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Select one of the pre-configured parameters below to perform a quick diagnostics scan:
            </p>
            <div className="space-y-2">
              {presetQueries.map((query, index) => (
                <button
                  key={index}
                  onClick={() => handleSendMessage(query)}
                  disabled={sending}
                  className="w-full text-left p-3 bg-slate-950 border border-slate-900 hover:border-violet-500/30 rounded-xl text-xs text-slate-300 font-medium hover:text-violet-400 transition-all duration-200 hover:bg-violet-950/5"
                >
                  {query}
                </button>
              ))}
            </div>
          </div>

          <div className="glass p-5 rounded-2xl border border-slate-800/80 flex items-start space-x-3 text-[11px] text-slate-500 leading-relaxed">
            <ShieldAlert className="h-5 w-5 text-violet-400 flex-shrink-0 mt-0.5" />
            <span>
              The assistant relies on LLM reasoning based on SQLite snapshot mappings. Cross-verify critical hardware flags before modifying production records.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatAssistant;
