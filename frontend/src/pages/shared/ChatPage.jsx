// ──────────────────────────────────────────────────────────────────────────────
// ChatPage – AI Chatbot with File/Image Upload, Streaming, Export, Rename,
//            Unread Badges, Copy, Mode Toggle (ERP / General)
// ──────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useRef } from 'react';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  FiMessageSquare, FiSend, FiTrash2, FiPlus,
  FiSearch, FiX, FiChevronLeft, FiZap, FiEdit2, FiCheck,
  FiDownload, FiFileText, FiCopy, FiMenu,
  FiPaperclip, FiFile, FiExternalLink, FiUser
} from 'react-icons/fi';
import jsPDF from 'jspdf';
import toast from 'react-hot-toast';

// ─── Colour constants ────────────────────────────────────────
const COLORS = {
  primary: 'blue-600',
  primaryHover: 'blue-700',
  primaryLight: 'blue-50',
  primaryBorder: 'blue-500',
};

// ─── Helper: format date ─────────────────────────────────────
const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString();

// ─── Component ────────────────────────────────────────────────
const ChatPage = () => {
  const { user } = useAuth();

  // ── State ──────────────────────────────────────────────────
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [streamingMessage, setStreamingMessage] = useState('');
  const [chatMode, setChatMode] = useState('erp');             // 'erp' or 'general'
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  // ── Effects ────────────────────────────────────────────────
  useEffect(() => { fetchConversations(); }, []);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingMessage]);
  useEffect(() => {
    inputRef.current?.focus();
  }, [activeConvId]);

  // ── Data fetching ──────────────────────────────────────────
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
      setSidebarOpen(false);
      await api.put(`/chat/conversations/${convId}/read`);
      fetchConversations();
    } catch (err) {
      console.error('Failed to load conversation', err);
    }
  };

  // ── Conversation management ────────────────────────────────
  const startNewChat = () => {
    setMessages([]);
    setActiveConvId(null);
    setSidebarOpen(false);
    setSelectedFile(null);
    setFilePreview('');
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

  const startRename = (convId, title) => {
    setEditingId(convId);
    setEditTitle(title);
  };

  const submitRename = async (convId) => {
    if (editTitle.trim()) {
      await api.put(`/chat/conversations/${convId}`, { title: editTitle.trim() });
      fetchConversations();
    }
    setEditingId(null);
    setEditTitle('');
  };

  // ── File handling ──────────────────────────────────────────
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File must be under 10 MB');
      return;
    }
    setSelectedFile(file);
    if (file.type.startsWith('image/')) {
      setFilePreview(URL.createObjectURL(file));
    } else {
      setFilePreview('');
    }
    e.target.value = ''; // allow re-selecting the same file
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    setFilePreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Core: Send message (text + optional file) with streaming ──
  const handleSend = async (e) => {
    e.preventDefault();
    const trimmed = newMessage.trim();

    if (!trimmed && !selectedFile) return;

    setLoading(true);
    let fileUrl = '';
    let fileType = '';
    let fileName = '';

    try {
      // 1. Upload file if present
      if (selectedFile) {
        setUploadingFile(true);
        const formData = new FormData();
        formData.append('file', selectedFile);
        const uploadRes = await api.post('/chat/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        fileUrl = uploadRes.data.fileUrl;
        fileType = uploadRes.data.fileType;
        fileName = uploadRes.data.fileName;
        setUploadingFile(false);
        clearSelectedFile();
      }

      // 2. Build user message content
      const userContent = trimmed || (fileName ? `Shared a file: ${fileName}` : '');
      const userMsg = {
        role: 'user',
        content: userContent,
        attachment: fileUrl ? { url: fileUrl, type: fileType, name: fileName } : undefined,
      };
      setMessages(prev => [...prev, userMsg]);
      setNewMessage('');
      setStreamingMessage('');

      // 3. Stream AI response
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
          message: userContent,
          mode: chatMode,                   // ERP or general
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
            } catch (e) {
              // ignore non‑JSON lines
            }
          }
        }
      }

      if (fullText) {
        setMessages(prev => [...prev, { role: 'assistant', content: fullText }]);
      }
      setStreamingMessage('');

      if (finalData && !activeConvId) {
        setActiveConvId(finalData.conversationId);
        fetchConversations();
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '⚠️ Sorry, I had trouble responding. Please try again.',
      }]);
      setStreamingMessage('');
    } finally {
      setLoading(false);
      setUploadingFile(false);
      inputRef.current?.focus();
    }
  };

  // ── Keyboard handler ────────────────────────────────────────
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  // ── Export as text ──────────────────────────────────────────
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

  // ── Export as PDF ───────────────────────────────────────────
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

  // ── Copy message ────────────────────────────────────────────
  const copyMessage = (content) => {
    navigator.clipboard.writeText(content);
    toast.success('Copied to clipboard');
  };

  // ── Filter conversations ────────────────────────────────────
  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(sidebarSearch.toLowerCase())
  );

  const currentTitle = activeConvId
    ? conversations.find(c => c._id === activeConvId)?.title
    : 'New Chat';

  const hasMessages = messages.length > 0;

  // ── Render a message bubble (text + attachment) ─────────────
  const renderMessageContent = (msg) => (
    <>
      {msg.content && <p className="whitespace-pre-wrap break-words">{msg.content}</p>}
      {msg.attachment && (
        <div className="mt-2">
          {msg.attachment.type?.startsWith('image/') ? (
            <img src={msg.attachment.url} alt="attachment" className="max-w-full rounded-lg max-h-60 object-cover shadow-sm" />
          ) : (
            <a href={msg.attachment.url} target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-2 p-2 bg-gray-100 rounded-lg text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition">
              <FiFile size={16} /> {msg.attachment.name || 'Download file'} <FiExternalLink size={14} />
            </a>
          )}
        </div>
      )}
    </>
  );

  // ──────────────────────────────────────────────────────────────
  // JSX RENDER
  // ──────────────────────────────────────────────────────────────
  return (
    <Layout role={user?.role}>
      <div className="flex h-[calc(100vh-4rem)] bg-gray-50 relative overflow-hidden">

        {/* ═══════════════════════════════════════════
              SLIDING SIDEBAR – hidden by default
            ═══════════════════════════════════════════ */}
        <div
          className={`fixed md:absolute inset-y-0 left-0 z-40 w-80 lg:w-96 bg-white border-r shadow-2xl transform transition-transform duration-300 ease-in-out ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="h-full flex flex-col">
            {/* Sidebar header */}
            <div className="p-5 border-b flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span className="p-1.5 bg-blue-100 rounded-lg">
                  <FiMessageSquare className="text-blue-600" size={18} />
                </span>
                Chats
              </h2>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition"
                title="Close"
              >
                <FiX size={20} />
              </button>
            </div>

            {/* New Chat + Search */}
            <div className="p-4 border-b space-y-3">
              <button
                onClick={startNewChat}
                className="w-full py-2.5 bg-blue-600 text-white rounded-xl flex items-center justify-center gap-2 text-sm font-semibold hover:bg-blue-700 transition-all shadow-sm shadow-blue-200"
              >
                <FiPlus size={16} /> New Chat
              </button>
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={sidebarSearch}
                  onChange={(e) => setSidebarSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none text-sm bg-gray-50 transition"
                />
              </div>
            </div>

            {/* Conversation list */}
            <div className="flex-1 overflow-y-auto">
              {filteredConversations.length === 0 ? (
                <div className="p-6 text-center text-gray-400 text-sm">
                  {sidebarSearch ? 'No conversations found.' : 'No conversations yet.\nStart a new chat!'}
                </div>
              ) : (
                filteredConversations.map(conv => (
                  <div
                    key={conv._id}
                    onClick={() => loadConversation(conv._id)}
                    className={`group px-4 py-3.5 cursor-pointer hover:bg-gray-50 transition border-b border-gray-100 ${
                      activeConvId === conv._id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        {editingId === conv._id ? (
                          <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                            <input
                              type="text"
                              value={editTitle}
                              onChange={e => setEditTitle(e.target.value)}
                              className="flex-1 px-2 py-1 border border-blue-300 rounded text-sm focus:outline-none"
                              autoFocus
                            />
                            <button onClick={() => submitRename(conv._id)} className="text-green-600 hover:bg-green-50 p-1 rounded">
                              <FiCheck size={14} />
                            </button>
                          </div>
                        ) : (
                          <p className="text-sm font-medium text-gray-800 truncate">{conv.title}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-0.5">{formatDate(conv.updatedAt)}</p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {conv.unreadCount > 0 && (
                          <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                            {conv.unreadCount}
                          </span>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); startRename(conv._id, conv.title); }}
                          className="p-1 text-gray-400 hover:text-blue-500 transition"
                          title="Rename"
                        >
                          <FiEdit2 size={14} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteConversation(conv._id); }}
                          className="p-1 text-gray-400 hover:text-red-500 transition"
                          title="Delete"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Overlay for mobile when sidebar is open */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/30 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ═══════════════════════════════════════════
                    MAIN CHAT AREA – full width
            ═══════════════════════════════════════════ */}
        <div className="flex-1 flex flex-col w-full">
          {/* Header */}
          <div className="flex items-center justify-between px-5 md:px-8 py-4 border-b bg-white shadow-sm">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 hover:bg-gray-100 rounded-xl transition"
                title="Chat history"
              >
                <FiMenu size={20} />
              </button>
              <div>
                <h2 className="font-bold text-gray-800 text-lg">{currentTitle}</h2>
                {activeConvId && (
                  <p className="text-xs text-gray-400">
                    {conversations.find(c => c._id === activeConvId)?.messages?.length || 0} messages
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              {hasMessages && (
                <>
                  <button
                    onClick={exportAsText}
                    className="p-2.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition text-sm hidden sm:flex items-center gap-1"
                    title="Export TXT"
                  >
                    <FiFileText size={16} /> TXT
                  </button>
                  <button
                    onClick={exportAsPDF}
                    className="p-2.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition text-sm hidden sm:flex items-center gap-1"
                    title="Export PDF"
                  >
                    <FiDownload size={16} /> PDF
                  </button>
                  <button
                    onClick={() => setChatMode(prev => prev === 'erp' ? 'general' : 'erp')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                      chatMode === 'erp' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                    }`}
                    title={`Current mode: ${chatMode === 'erp' ? 'School ERP' : 'General AI'}`}
                  >
                    {chatMode === 'erp' ? '🏫 ERP' : '🌐 General'}
                  </button>
                </>
              )}
              <button
                onClick={startNewChat}
                className="p-2.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition"
                title="New Chat"
              >
                <FiPlus size={18} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6">
            {messages.length === 0 && !streamingMessage ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <div className="p-6 bg-blue-50 rounded-full mb-6">
                  <FiZap className="w-12 h-12 text-blue-500" />
                </div>
                <p className="text-xl font-semibold text-gray-600">Welcome to EduBot AI</p>
                <p className="text-sm mt-2 text-center max-w-md">
                  Start a conversation, upload a file, or ask anything about your school data.
                </p>
                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
                  {['How can I improve my grades?', 'What is my attendance?', 'Tell me a fun fact', 'Explain photosynthesis'].map(p => (
                    <button
                      key={p}
                      onClick={() => { setNewMessage(p); inputRef.current?.focus(); }}
                      className="text-left px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-blue-50 hover:border-blue-200 transition bg-white shadow-sm"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div key={idx} className={`flex group ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold mr-2 mt-1 flex-shrink-0">
                      <FiZap size={14} />
                    </div>
                  )}
                  <div
                    className={`relative max-w-[75%] px-5 py-3.5 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white rounded-br-xl'
                        : 'bg-white border border-gray-200 text-gray-800 rounded-bl-xl shadow-sm'
                    }`}
                  >
                    {renderMessageContent(msg)}
                    <button
                      onClick={() => copyMessage(msg.content || msg.attachment?.url)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition p-1 rounded hover:bg-black/10"
                      title="Copy"
                    >
                      <FiCopy size={14} className={msg.role === 'user' ? 'text-white' : 'text-gray-400'} />
                    </button>
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-xs font-bold ml-2 mt-1 flex-shrink-0">
                      <FiUser size={14} />
                    </div>
                  )}
                </div>
              ))
            )}

            {/* Typing / uploading indicator */}
            {loading && !streamingMessage && (
              <div className="flex justify-start items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                  <FiZap size={14} />
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl px-5 py-3.5 text-sm text-gray-500 shadow-sm">
                  <span className="animate-pulse">
                    {uploadingFile ? 'Uploading file...' : 'EduBot is thinking...'}
                  </span>
                </div>
              </div>
            )}

            {/* Streaming response */}
            {streamingMessage && (
              <div className="flex justify-start items-start gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                  <FiZap size={14} />
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl px-5 py-3.5 text-sm text-gray-800 rounded-bl-xl shadow-sm max-w-[75%]">
                  {streamingMessage}
                  <span className="inline-block w-2 h-4 bg-blue-600 animate-pulse ml-1 align-middle"></span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSend} className="border-t bg-white px-4 md:px-8 py-4">
            {/* File preview bar */}
            {selectedFile && (
              <div className="max-w-4xl mx-auto mb-3 flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                {filePreview ? (
                  <img src={filePreview} alt="preview" className="h-14 w-14 object-cover rounded-lg border" />
                ) : (
                  <div className="h-14 w-14 flex items-center justify-center bg-blue-100 rounded-lg">
                    <FiFile size={24} className="text-blue-600" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                </div>
                <button
                  onClick={clearSelectedFile}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                >
                  <FiX size={18} />
                </button>
              </div>
            )}

            <div className="flex gap-2 max-w-4xl mx-auto">
              {/* Hidden file input + trigger button */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
                accept="image/*,.pdf,.doc,.docx,.zip,.mp4,.mov,.mp3,.wav"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-3.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition"
                title="Attach file"
              >
                <FiPaperclip size={20} />
              </button>

              {/* Message input */}
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask EduBot anything..."
                  disabled={loading}
                  className="w-full pl-5 pr-5 py-3.5 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition disabled:bg-gray-100 text-sm"
                />
              </div>

              {/* Send button */}
              <button
                type="submit"
                disabled={loading || (!newMessage.trim() && !selectedFile)}
                className="p-3.5 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 disabled:opacity-40 transition flex items-center justify-center shadow-sm shadow-blue-200"
                title="Send message"
              >
                <FiSend size={20} />
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default ChatPage;