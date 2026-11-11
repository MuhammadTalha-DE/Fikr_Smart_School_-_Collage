import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ChatButton from './ChatButton';
import ChatSidebar from './ChatSidebar';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { useAuth } from '../../context/AuthContext';
import ChatQuickActions from './ChatQuickActions';
import { ChatSettings } from './ChatSettings';
import confetti from 'canvas-confetti';
import {
  FiCpu, FiGlobe, FiX, FiTrash2, FiSettings,
} from 'react-icons/fi';
import api from '../../services/api';
import './ChatAI.css';

const ChatAI = () => {
  const { user } = useAuth();
  // Authentication token (used for streaming fetch)
  const authToken = user?.token || localStorage.getItem('authToken');

  // ─── Core state ─────────────────────────────────
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState('general');            // 'general' | 'system'
  const [provider, setProvider] = useState('groq');       // 'groq' | 'deepseek'

  // Conversations
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [convsLoading, setConvsLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef(null);

  // Settings
  const [showSettings, setShowSettings] = useState(false);
  const [chatSettings, setChatSettings] = useState({
    model: localStorage.getItem('chatModel') || 'llama-3.1-8b-instant',
    temperature: parseFloat(localStorage.getItem('chatTemp') || '0.7'),
  });

  // ─── Helpers ────────────────────────────────────
  // Always return the correct model based on the provider toggle
  const getEffectiveModel = () => {
    if (provider === 'deepseek') return 'deepseek-v4-flash';   // or 'deepseek-v4-pro'
    return chatSettings.model;
  };

  // ─── Auto‑scroll ─────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ─── Fetch conversations when panel opens ───────
  useEffect(() => {
    if (isOpen) fetchConversations();
  }, [isOpen]);

  useEffect(() => {
    const openFikrAI = () => setIsOpen(true);
    window.addEventListener('fikr-ai:open', openFikrAI);
    return () => window.removeEventListener('fikr-ai:open', openFikrAI);
  }, []);

  // ─── Load messages of active conversation ───────
  useEffect(() => {
    if (activeConvId) {
      fetchMessages(activeConvId);
    } else {
      setMessages([]);
    }
  }, [activeConvId]);

  const fetchConversations = async () => {
    setConvsLoading(true);
    try {
      const { data } = await api.get('/chatbot/conversations');
      setConversations(data);
      if (!activeConvId && data.length > 0) {
        setActiveConvId(data[0]._id);
      }
    } catch (err) {
      // Sidebar will show empty state
    } finally {
      setConvsLoading(false);
    }
  };

  const fetchMessages = async (convId) => {
    try {
      const { data } = await api.get(`/chatbot/conversations/${convId}`);
      setMessages(data.messages);
    } catch (err) {
      setMessages([]);
    }
  };

  // ─── Conversation management ────────────────────
  const handleNewConversation = () => {
    setActiveConvId(null);
    setMessages([]);
  };

  const handleSelectConversation = (id) => setActiveConvId(id);

  const handleDeleteConversation = async (id) => {
    try {
      await api.delete(`/chatbot/conversations/${id}`);
      setConversations(prev => prev.filter(c => c._id !== id));
      if (id === activeConvId) {
        setActiveConvId(null);
        setMessages([]);
      }
    } catch (err) { /* ignore */ }
  };

  const handleClearCurrent = () => handleNewConversation();

  // Feedback (thumbs up/down)
  const handleFeedback = async (convId, msgId, feedback) => {
    try {
      await api.put(`/chatbot/conversations/${convId}/messages/${msgId}/feedback`, { feedback });
    } catch (err) { /* ignore */ }
  };

  // ─── Image sending (vision) ─────────────────────
  const sendImage = async (file, caption) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    formData.append('message', caption || '');
    formData.append('mode', mode);
    if (activeConvId) formData.append('conversationId', activeConvId);
    formData.append('history', JSON.stringify(messages.map(m => ({ role: m.role, content: m.content }))));
    formData.append('model', getEffectiveModel());   // ✅ provider‑aware
    formData.append('temperature', chatSettings.temperature);

    setLoading(true);
    try {
      const { data } = await api.post('/chatbot/vision', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (!activeConvId) setActiveConvId(data.conversationId);
      fetchConversations();
      setMessages(prev => [
        ...prev,
        { role: 'user', content: `📷 ${caption || 'Image'}` },
        { role: 'assistant', content: data.reply },
      ]);
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.9 },
        colors: ['#6366f1', '#a78bfa', '#f472b6'],
      });
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: '❌ Image analysis failed' }]);
    } finally {
      setLoading(false);
    }
  };

  // ─── Core send with streaming + fallback ───────
  const sendMessage = async (text) => {
    if (!text.trim() || loading) return;

    const userMsg = { role: 'user', content: text };
    const assistantPlaceholder = { role: 'assistant', content: '' };

    setMessages(prev => [...prev, userMsg, assistantPlaceholder]);
    const assistantIndex = messages.length + 1;  // index of the placeholder
    setLoading(true);

    const updateAssistant = (newContent) => {
      setMessages(prev => {
        const updated = [...prev];
        if (updated[assistantIndex]) {
          updated[assistantIndex] = { ...updated[assistantIndex], content: newContent };
        }
        return updated;
      });
    };

    try {
      const streamSuccess = await tryStream(text, updateAssistant);
      if (!streamSuccess) throw new Error('Stream failed');

      fetchConversations();
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.9 },
        colors: ['#6366f1', '#a78bfa', '#f472b6'],
      });
    } catch (streamErr) {
      console.warn('Streaming failed, falling back to non‑streaming:', streamErr);
      setMessages(prev => prev.slice(0, -1)); // remove placeholder

      // Fallback: standard non‑streaming request
      try {
        const { data } = await api.post('/chatbot/message', {
          message: text,
          mode,
          history: messages.map(m => ({ role: m.role, content: m.content })),
          conversationId: activeConvId,
          model: getEffectiveModel(),          // ✅ provider‑aware
          temperature: chatSettings.temperature,
        });
        if (!activeConvId) setActiveConvId(data.conversationId);
        fetchConversations();
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.9 },
          colors: ['#6366f1', '#a78bfa', '#f472b6'],
        });
      } catch (fallbackErr) {
        setMessages(prev => [...prev, { role: 'assistant', content: '❌ Sorry, something went wrong.' }]);
      }
    } finally {
      setLoading(false);
    }
  };

  // ─── Streaming fetch with proper auth and model ─
  const tryStream = async (text, updateAssistant) => {
    const response = await fetch('/api/chatbot/message/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        message: text,
        mode,
        history: messages.map(m => ({ role: m.role, content: m.content })),
        conversationId: activeConvId,
        model: getEffectiveModel(),            // ✅ provider‑aware
        temperature: chatSettings.temperature,
      }),
    });

    if (!response.ok) return false;

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let assistantReply = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          if (data === '[DONE]') return true;
          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              assistantReply += parsed.content;
              updateAssistant(assistantReply);
            }
          } catch (e) { /* ignore malformed */ }
        }
      }
    }

    return false;
  };

  const toggleOpen = () => setIsOpen(!isOpen);

  // ─── Render ─────────────────────────────────────
  const chatbot = (
    <>
      {!isOpen && <ChatButton onClick={toggleOpen} />}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] glass-overlay flex items-center justify-center p-2 md:p-4"
          >
            {/* Floating orbs background */}
            <div className="absolute inset-0 overflow-hidden opacity-30 pointer-events-none">
              {Array.from({ length: 8 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute rounded-full blur-3xl"
                  style={{
                    background: `radial-gradient(circle, rgba(99,102,241,0.3), transparent)`,
                    width: `${100 + Math.random() * 150}px`,
                    height: `${100 + Math.random() * 150}px`,
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                  }}
                  animate={{
                    x: [0, 30, 0],
                    y: [0, -20, 0],
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 5 + Math.random() * 5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              ))}
            </div>

            <motion.div
              initial={{ scale: 0.9, opacity: 0, rotateX: 10 }}
              animate={{ scale: 1, opacity: 1, rotateX: 0 }}
              exit={{ scale: 0.9, opacity: 0, rotateX: 10 }}
              transition={{ type: 'spring', stiffness: 120, damping: 20 }}
              className="glass-panel rounded-3xl w-full max-w-5xl h-[90vh] flex overflow-hidden shadow-2xl"
              style={{ perspective: 1000 }}
            >
              {/* Sidebar */}
              <ChatSidebar
                conversations={conversations}
                activeId={activeConvId}
                onSelect={handleSelectConversation}
                onDelete={handleDeleteConversation}
                onNew={handleNewConversation}
                isOpen={sidebarOpen}
                onToggle={() => setSidebarOpen(!sidebarOpen)}
                loading={convsLoading}
              />

              {/* Main Chat Area */}
              <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <div className="h-16 px-6 flex items-center justify-between border-b border-white/10 shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                      <FiCpu className="text-white text-lg" />
                    </div>
                    <div>
                      <h2 className="font-bold text-white text-lg">Fikr AI</h2>
                      <p className="text-xs text-gray-400">School Assistant</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* ── Provider Toggle ── */}
                    <div className="flex bg-white/10 rounded-lg p-0.5">
                      <button
                        onClick={() => setProvider('groq')}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1 ${
                          provider === 'groq'
                            ? 'bg-indigo-500 text-white shadow'
                            : 'text-white/70 hover:text-white'
                        }`}
                      >
                        ⚡ Groq
                      </button>
                      <button
                        onClick={() => setProvider('deepseek')}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1 ${
                          provider === 'deepseek'
                            ? 'bg-indigo-500 text-white shadow'
                            : 'text-white/70 hover:text-white'
                        }`}
                      >
                        🧠 DeepSeek
                      </button>
                    </div>

                    {/* ── Mode Toggle ── */}
                    <div className="flex bg-white/10 rounded-lg p-0.5">
                      <button
                        onClick={() => setMode('general')}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1 ${
                          mode === 'general' ? 'bg-indigo-500 text-white shadow' : 'text-white/70 hover:text-white'
                        }`}
                      >
                        <FiGlobe className="w-3.5 h-3.5" /> General
                      </button>
                      <button
                        onClick={() => setMode('system')}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1 ${
                          mode === 'system' ? 'bg-indigo-500 text-white shadow' : 'text-white/70 hover:text-white'
                        }`}
                      >
                        <FiCpu className="w-3.5 h-3.5" /> System
                      </button>
                    </div>

                    <button
                      onClick={() => setShowSettings(!showSettings)}
                      className="p-1.5 text-white/60 hover:text-white transition"
                      title="Chat settings"
                    >
                      <FiSettings className="w-4 h-4" />
                    </button>
                    <button onClick={handleClearCurrent} className="p-1.5 text-white/60 hover:text-red-400 transition" title="Clear chat">
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                    <button onClick={toggleOpen} className="p-1.5 text-white/60 hover:text-white transition">
                      <FiX className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Settings Panel */}
                {showSettings && (
                  <ChatSettings
                    currentModel={chatSettings.model}
                    currentTemperature={chatSettings.temperature}
                    onSave={(model, temp) => {
                      setChatSettings({ model, temperature: temp });
                      setShowSettings(false);
                    }}
                    onClose={() => setShowSettings(false)}
                  />
                )}

                {/* Quick Actions */}
                {messages.length === 0 && !loading && (
                  <ChatQuickActions onAction={sendMessage} mode={mode} />
                )}

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 chat-scroll">
                  {messages.map((msg, i) => (
                    <ChatMessage
                      key={i}
                      message={msg}
                      conversationId={activeConvId}
                      messageIndex={i}
                      onFeedback={(feedback) => handleFeedback(activeConvId, msg._id, feedback)}
                    />
                  ))}
                  {loading && (
                    <div className="flex justify-start">
                      <div className="bg-white/10 backdrop-blur-md rounded-2xl px-4 py-3 flex gap-1.5">
                        <span className="typing-dot" />
                        <span className="typing-dot" />
                        <span className="typing-dot" />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t border-white/10 shrink-0">
                  <ChatInput onSend={sendMessage} onSendImage={sendImage} loading={loading} />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );

  if (typeof document === 'undefined') {
    return chatbot;
  }

  return createPortal(chatbot, document.body);
};

export default ChatAI;
