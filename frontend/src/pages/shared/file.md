import { useState, useEffect, useRef } from 'react';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  FiMessageSquare, FiSend, FiTrash2, FiPlus,
  FiSearch, FiX, FiChevronLeft, FiZap, FiEdit2, FiCheck,
  FiDownload, FiFileText, FiCopy
} from 'react-icons/fi';
import jsPDF from 'jspdf';
import toast from 'react-hot-toast';

const ChatPage = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [showMobileSidebar, setShowMobileSidebar] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [streamingMessage, setStreamingMessage] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { fetchConversations(); }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingMessage]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [activeConvId]);

  const fetchConversations = async () => {
    try {
      const { data } = await api.get('/chat/conversations');
      setConversations(data.conversations || []);
    } catch (err) {
      console.error('Failed to load conversations', err);
    }
  };

  const loadConversation = async (convId) => {
    try {
      const { data } = await api.get(`/chat/conversations/${convId}`);
      setMessages(data.conversation.messages || []);
      setActiveConvId(convId);
      setShowMobileSidebar(false);
      await api.put(`/chat/conversations/${convId}/read`);
      fetchConversations();
    } catch (err) {
      console.error('Failed to load conversation', err);
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setActiveConvId(null);
    setShowMobileSidebar(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const deleteConversation = async (convId) => {
    if (!window.confirm('Delete this conversation?')) return;
    try {
      await api.delete(`/chat/conversations/${convId}`);
      fetchConversations();
      if (activeConvId === convId) startNewChat();
    } catch (err) {
      console.error('Failed to delete conversation', err);
    }
  };

  const startRename = (convId, currentTitle) => {
    setEditingId(convId);
    setEditTitle(currentTitle);
  };

  const submitRename = async (convId) => {
    if (editTitle.trim()) {
      await api.put(`/chat/conversations/${convId}`, { title: editTitle.trim() });
      fetchConversations();
    }
    setEditingId(null);
    setEditTitle('');
  };

  const handleSend = async (e) => {
    e.preventDefault();
    const trimmed = newMessage.trim();
    if (!trimmed) return;

    const userMsg = { role: 'user', content: trimmed };
    setMessages(prev => [...prev, userMsg]);
    setNewMessage('');
    setLoading(true);
    setStreamingMessage('');

    try {
      const token = localStorage.getItem('token') ||
                    JSON.parse(localStorage.getItem('user'))?.token;

      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          conversationId: activeConvId,
          message: trimmed,
        }),
      });

      if (!response.ok) throw new Error('Stream failed');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      let finalData = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.replace('data: ', '').trim();
            if (dataStr === '[DONE]') continue;
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.token) {
                fullText += parsed.token;
                setStreamingMessage(fullText);
              }
              if (parsed.done) finalData = parsed;
              if (parsed.error) throw new Error(parsed.error);
            } catch (e) {}
          }
        }
      }

      if (fullText) {
        setMessages(prev => [...prev, { role: 'assistant', content: fullText }]);
      }
      setStreamingMessage('');

      if (finalData) {
        if (!activeConvId) {
          setActiveConvId(finalData.conversationId);
          fetchConversations();
        }
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '⚠️ Sorry, I had trouble responding. Please try again.',
      }]);
      setStreamingMessage('');
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  // ─── EXPORT AS TEXT ─────────────────────────────────────────
  const exportAsText = () => {
    if (messages.length === 0) return toast.error('No messages to export');
    const conv = conversations.find(c => c._id === activeConvId);
    const title = conv?.title || 'Chat';
    const text = messages
      .map(m => `[${m.role === 'user' ? 'You' : 'EduBot'}] ${m.content}`)
      .join('\n\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Downloaded as text file');
  };

  // ─── EXPORT AS PDF ──────────────────────────────────────────
  const exportAsPDF = () => {
    if (messages.length === 0) return toast.error('No messages to export');
    const conv = conversations.find(c => c._id === activeConvId);
    const title = conv?.title || 'Chat';

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(title, 14, 20);
    doc.setFontSize(10);
    doc.text(`Exported on ${new Date().toLocaleString()}`, 14, 28);

    let y = 40;
    messages.forEach((msg) => {
      const prefix = msg.role === 'user' ? 'You: ' : 'EduBot: ';
      const lines = doc.splitTextToSize(prefix + msg.content, 180);
      if (y + lines.length * 5 > 280) {
        doc.addPage();
        y = 20;
      }
      doc.setFont(undefined, msg.role === 'user' ? 'bold' : 'normal');
      doc.text(lines, 14, y);
      y += lines.length * 5 + 5;
    });

    doc.save(`${title.replace(/\s+/g, '_')}.pdf`);
    toast.success('Downloaded as PDF');
  };

  // ─── COPY MESSAGE ───────────────────────────────────────────
  const copyMessage = (content) => {
    navigator.clipboard.writeText(content);
    toast.success('Copied to clipboard');
  };

  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(sidebarSearch.toLowerCase())
  );

  return (
    <Layout role={user?.role}>
      <div className="flex h-[calc(100vh-4rem)] bg-gray-50">
        {/* ─── LEFT SIDEBAR ─── */}
        <div className={`${showMobileSidebar ? 'flex' : 'hidden'} md:flex flex-col w-full md:w-80 lg:w-96 border-r bg-white`}>
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <FiMessageSquare className="text-blue-600" /> Conversations
              </h2>
              <button onClick={startNewChat} className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition" title="New Chat">
                <FiPlus size={18} />
              </button>
            </div>
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={sidebarSearch}
                onChange={(e) => setSidebarSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none text-sm"
              />
              {sidebarSearch && (
                <button onClick={() => setSidebarSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <FiX size={16} />
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                {sidebarSearch ? 'No conversations found.' : 'No conversations yet. Start a new chat!'}
              </div>
            ) : (
              filteredConversations.map(conv => (
                <div
                  key={conv._id}
                  onClick={() => loadConversation(conv._id)}
                  className={`flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 transition border-b border-gray-100 ${
                    activeConvId === conv._id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    {editingId === conv._id ? (
                      <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                        <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)}
                          className="flex-1 px-2 py-1 border border-blue-300 rounded text-sm" autoFocus />
                        <button onClick={() => submitRename(conv._id)} className="text-green-600">
                          <FiCheck size={16} />
                        </button>
                      </div>
                    ) : (
                      <p className="text-sm font-medium text-gray-800 truncate">{conv.title}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-0.5">{new Date(conv.updatedAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {conv.unreadCount > 0 && (
                      <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">{conv.unreadCount}</span>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); startRename(conv._id, conv.title); }}
                      className="p-1 text-gray-400 hover:text-blue-500 transition" title="Rename"><FiEdit2 size={14} /></button>
                    <button onClick={(e) => { e.stopPropagation(); deleteConversation(conv._id); }}
                      className="p-1 text-gray-400 hover:text-red-500 transition" title="Delete"><FiTrash2 size={14} /></button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ─── MAIN CHAT AREA ─── */}
        <div className="flex-1 flex flex-col">
          {/* Header with export buttons */}
          <div className="hidden md:flex items-center justify-between px-6 py-3 border-b bg-white">
            <h2 className="font-semibold text-gray-800">
              {activeConvId ? conversations.find(c => c._id === activeConvId)?.title : 'New Chat'}
            </h2>
            {messages.length > 0 && (
              <div className="flex gap-2">
                <button onClick={exportAsText}
                  className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition flex items-center gap-1 text-sm"
                  title="Export as Text">
                  <FiFileText size={16} /> TXT
                </button>
                <button onClick={exportAsPDF}
                  className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition flex items-center gap-1 text-sm"
                  title="Export as PDF">
                  <FiDownload size={16} /> PDF
                </button>
              </div>
            )}
          </div>

          {/* Mobile header */}
          <div className="md:hidden p-3 border-b flex items-center gap-2">
            <button onClick={() => setShowMobileSidebar(!showMobileSidebar)} className="p-2 hover:bg-gray-100 rounded-lg">
              <FiChevronLeft className={showMobileSidebar ? 'rotate-180' : ''} />
            </button>
            <h2 className="font-semibold text-gray-800 flex-1">
              {activeConvId ? conversations.find(c => c._id === activeConvId)?.title : 'New Chat'}
            </h2>
            {messages.length > 0 && (
              <div className="flex gap-1">
                <button onClick={exportAsText} className="p-2 text-gray-500" title="TXT"><FiFileText size={16} /></button>
                <button onClick={exportAsPDF} className="p-2 text-gray-500" title="PDF"><FiDownload size={16} /></button>
              </div>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <FiZap className="w-16 h-16 mb-4 text-blue-300" />
                <p className="text-lg font-medium">Welcome to EduBot AI</p>
                <p className="text-sm mt-2">Start a conversation or select one from the sidebar.</p>
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-md">
                  {['How can I improve my grades?', 'What is my attendance?', 'Tell me a fun fact', 'Explain photosynthesis'].map(prompt => (
                    <button key={prompt}
                      onClick={() => { setNewMessage(prompt); inputRef.current?.focus(); }}
                      className="text-left px-3 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition">
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div key={idx} className={`flex group ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`relative max-w-[75%] px-4 py-3 rounded-2xl text-sm ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-md'
                      : 'bg-white border text-gray-800 rounded-bl-md shadow-sm'
                  }`}>
                    {msg.content}
                    {/* Copy button on hover */}
                    <button
                      onClick={() => copyMessage(msg.content)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition p-1 rounded hover:bg-black/10"
                      title="Copy">
                      <FiCopy size={14} className={msg.role === 'user' ? 'text-white' : 'text-gray-400'} />
                    </button>
                  </div>
                </div>
              ))
            )}

            {loading && !streamingMessage && (
              <div className="flex justify-start">
                <div className="bg-white border rounded-2xl px-4 py-3 text-sm text-gray-500 shadow-sm">
                  <span className="animate-pulse">EduBot is thinking...</span>
                </div>
              </div>
            )}

            {streamingMessage && (
              <div className="flex justify-start">
                <div className="bg-white border rounded-2xl px-4 py-3 text-sm text-gray-800 rounded-bl-md shadow-sm max-w-[75%]">
                  {streamingMessage}
                  <span className="inline-block w-2 h-4 bg-blue-600 animate-pulse ml-1"></span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="border-t p-4 bg-white">
            <div className="flex gap-2 max-w-4xl mx-auto">
              <input ref={inputRef} type="text" value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)} onKeyDown={handleKeyDown}
                placeholder="Ask EduBot anything..." disabled={loading}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition" />
              <button type="submit" disabled={loading || !newMessage.trim()}
                className="px-5 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition flex items-center gap-2">
                <FiSend size={18} />
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default ChatPage;