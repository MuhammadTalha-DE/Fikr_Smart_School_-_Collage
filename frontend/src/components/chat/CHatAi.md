import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ChatButton from './ChatButton';
import ChatSidebar from './ChatSidebar';
import ChatMessage from './ChatMessage';
import { FixedSizeList as List } from 'react-window';
import ChatInput from './ChatInput';
import jsPDF from 'jspdf';
import ChatQuickActions from './ChatQuickActions';
import { FiCpu, FiGlobe, FiX, FiMenu, FiTrash2, FiMessageSquare,FiDownload } from 'react-icons/fi';
import api from '../../services/api';
import './ChatAI.css';

const ChatAI = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState('general');
  const [conversations, setConversations] = useState([]);       // list of { _id, title, mode, updatedAt }
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);                 // current conversation messages
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef(null);

  // Auto‑scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch conversations list on open
  useEffect(() => {
    if (isOpen) fetchConversations();
  }, [isOpen]);

  // When active conv changes, load its messages
  useEffect(() => {
    if (activeConvId) {
      fetchMessages(activeConvId);
    } else {
      setMessages([]);
    }
  }, [activeConvId]);

  

  const fetchConversations = async () => {
    try {
      const { data } = await api.get('/chatbot/conversations');
      setConversations(data);
      // If there's no active conv and list exists, select the first
      if (!activeConvId && data.length > 0) {
        setActiveConvId(data[0]._id);
      }
    } catch (err) { /* ignore */ }
  };

  const fetchMessages = async (convId) => {
    try {
      const { data } = await api.get(`/chatbot/conversations/${convId}`);
      setMessages(data.messages);
    } catch (err) {
      setMessages([]);
    }
  };

  const handleNewConversation = () => {
    // Just clear the active conversation – the backend will create one on first message
    setActiveConvId(null);
    setMessages([]);
  };
  const exportConversation = () => {
  const doc = new jsPDF();
  doc.setFontSize(12);
  doc.text('Fikr AI Chat Export', 10, 10);
  let y = 20;
  messages.forEach(msg => {
    const role = msg.role === 'user' ? 'You' : 'AI';
    const text = `${role}: ${msg.content}`;
    doc.setFontSize(10);
    doc.text(text, 10, y);
    y += 10;
    if (y > 280) { doc.addPage(); y = 20; }
  });
  doc.save(`chat-${activeConvId}.pdf`);
};

  const handleSelectConversation = (id) => {
    setActiveConvId(id);
  };

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

  const handleClearCurrent = () => {
    // We'll just start a new conversation without deleting the old one
    handleNewConversation();
  };

 
 const sendImage = async (file, caption) => {
  if (!file) return;
  const formData = new FormData();
  formData.append('image', file);
  formData.append('message', caption || '');
  formData.append('mode', mode);
  if (activeConvId) formData.append('conversationId', activeConvId);
  formData.append('history', JSON.stringify(messages.map(m => ({ role: m.role, content: m.content }))));

  setLoading(true);
  try {
    const { data } = await api.post('/chatbot/vision', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    if (!activeConvId) setActiveConvId(data.conversationId);
    fetchConversations();
    setMessages(prev => [...prev, { role: 'user', content: `📷 ${caption || 'Image'}` }, { role: 'assistant', content: data.reply }]);
  } catch (err) {
    setMessages(prev => [...prev, { role: 'assistant', content: '❌ Image analysis failed' }]);
  } finally {
    setLoading(false);
  }
};
  const sendMessage = async (text) => {
    if (!text.trim() || loading) return;

    // Optimistically add user message
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setLoading(true);

    try {
      const { data } = await api.post('/chatbot/message', {
        message: text,
        mode,
        history: messages.map(m => ({ role: m.role, content: m.content })),
        conversationId: activeConvId,
      });

      // Update conversation ID if it was newly created
      if (!activeConvId) {
        setActiveConvId(data.conversationId);
      }

      // Update conversation list (title might have changed)
      fetchConversations();

      // Append AI reply
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: '❌ Sorry, something went wrong.' }]);
    } finally {
      setLoading(false);
    }
  };

  const toggleOpen = () => setIsOpen(!isOpen);

  // ─── RENDER ─────────────────────────────────
  return (
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
                    <button onClick={handleClearCurrent} className="p-1.5 text-white/60 hover:text-red-400 transition" title="Clear chat">
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                    <button onClick={toggleOpen} className="p-1.5 text-white/60 hover:text-white transition">
                      <FiX className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Quick Actions */}
                {messages.length === 0 && (
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
                  <ChatInput onSend={sendMessage} loading={loading} />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// Feedback handler (will be implemented in Feedback section)
const handleFeedback = async (convId, msgId, feedback) => {
  try {
    await api.put(`/chatbot/conversations/${convId}/messages/${msgId}/feedback`, { feedback });
  } catch (err) { /* ignore */ }
};

export default ChatAI;