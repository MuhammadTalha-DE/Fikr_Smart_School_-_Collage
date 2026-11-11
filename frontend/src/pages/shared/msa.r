import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  FiSend, FiArrowLeft, FiMessageSquare, FiPlus, FiPaperclip, FiSmile,
  FiFile, FiImage, FiCheck, FiCheckCircle, FiMoreVertical, FiSearch,
  FiX, FiUserPlus, FiMic, FiPhone, FiVideo, FiCopy, FiTrash2,
  FiArrowDown, FiCamera
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import EmojiPicker from 'emoji-picker-react';
import { useSocket } from '../../hooks/useSocket';
import { format } from 'date-fns';

const Messages = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { socket, isConnected } = useSocket();

  // ==================== STATE ====================
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(true);

  // Message input
  const [newMessage, setNewMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Reactions
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState(null);
  const commonReactions = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

  // Global user search
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // Online & typing
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

  // Responsive
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);
  const [showChat, setShowChat] = useState(false);

  // UI extras
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, message: null });
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Refs
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);
  const contextMenuRef = useRef(null);

  // ==================== HELPERS ====================
  const otherParticipant = (conversation) => {
    if (!conversation?.participants) return null;
    return conversation.participants.find(p => p._id !== user._id);
  };

  const isUserOnline = (userId) => onlineUsers.includes(userId);

  const scrollToBottom = (behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // Auto-resize textarea
  const adjustTextareaHeight = () => {
    const textarea = inputRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  };

  // ==================== API & SOCKET (unchanged logic) ====================
  const fetchConversations = async () => {
    try {
      setLoadingConversations(true);
      const { data } = await api.get('/messages/conversations');
      setConversations(data);
    } catch (error) {
      toast.error('Failed to load conversations');
    } finally {
      setLoadingConversations(false);
    }
  };

  const fetchMessages = async (convId) => {
    try {
      setLoadingMsgs(true);
      const { data } = await api.get(`/messages/conversations/${convId}`);
      setMessages(data);
      scrollToBottom();
      await markAsRead(convId);
    } catch (error) {
      toast.error('Failed to load messages');
    } finally {
      setLoadingMsgs(false);
    }
  };

  const markAsRead = async (convId) => {
    try {
      await api.put(`/messages/conversations/${convId}/read`);
      setConversations(prev =>
        prev.map(c => (c._id === convId ? { ...c, unread: 0 } : c))
      );
    } catch (error) {
      console.error('Failed to mark as read');
    }
  };

  const handleSend = async () => {
    const hasText = newMessage.trim().length > 0;
    if (!hasText || !activeConversation) return;
    try {
      const payload = { conversationId: activeConversation._id, content: newMessage.trim() };
      const { data } = await api.post(`/messages/conversations/${activeConversation._id}`, payload);
      setMessages(prev => [...prev, data]);
      setNewMessage('');
      adjustTextareaHeight();
      updateLastMessage(data);
      scrollToBottom();

      const recipient = otherParticipant(activeConversation);
      if (socket && recipient) {
        socket.emit('send-message', {
          conversationId: activeConversation._id,
          recipientId: recipient._id,
          message: data,
        });
      }
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  const handleFileUpload = async (file) => {
    if (!file || !activeConversation) return;
    const formData = new FormData();
    formData.append('file', file);
    setUploading(true);
    try {
      const { data: uploadData } = await api.post('/messages/upload', formData);
      const payload = {
        conversationId: activeConversation._id,
        fileUrl: uploadData.url,
        fileType: uploadData.fileType,
        content: '',
      };
      const { data: msg } = await api.post(`/messages/conversations/${activeConversation._id}`, payload);
      setMessages(prev => [...prev, msg]);
      updateLastMessage(msg);
      scrollToBottom();

      const recipient = otherParticipant(activeConversation);
      if (socket && recipient) {
        socket.emit('send-message', {
          conversationId: activeConversation._id,
          recipientId: recipient._id,
          message: msg,
        });
      }
    } catch (error) {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const updateLastMessage = (message) => {
    setConversations(prev =>
      prev.map(c =>
        c._id === message.conversationId
          ? {
              ...c,
              lastMessage: {
                text: message.fileUrl
                  ? message.fileType?.startsWith('image/')
                    ? '📷 Image'
                    : '📎 File'
                  : message.content,
                sender: message.sender,
                createdAt: message.createdAt,
              },
            }
          : c
      )
    );
  };

  const handleReaction = async (messageId, emoji) => {
    try {
      await api.post(`/messages/${messageId}/reaction`, { emoji });
      setShowReactionPicker(false);
      setSelectedMessageId(null);
    } catch (error) {
      toast.error('Failed to add reaction');
    }
  };

  // ==================== GLOBAL USER SEARCH ====================
  const searchUsers = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const { data } = await api.get(`/messages/search-users?q=${encodeURIComponent(query)}`);
      setSearchResults(data.filter(u => u._id !== user._id));
    } catch (error) {
      toast.error('Search failed');
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const startConversation = async (targetUser) => {
    try {
      const existing = conversations.find(c =>
        c.participants.some(p => p._id === targetUser._id)
      );
      if (existing) {
        handleConversationClick(existing);
        setShowUserSearch(false);
        return;
      }
      const { data: newConv } = await api.post('/messages/conversations', {
        recipientId: targetUser._id,
      });
      setConversations(prev => [newConv, ...prev]);
      handleConversationClick(newConv);
      setShowUserSearch(false);
      setSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      toast.error('Could not start conversation');
    }
  };

  // ==================== TYPING INDICATOR ====================
  const handleTyping = useCallback(() => {
    if (!socket || !activeConversation) return;
    if (!isTyping) {
      setIsTyping(true);
      socket.emit('typing', {
        conversationId: activeConversation._id,
        recipientId: otherParticipant(activeConversation)?._id,
        isTyping: true,
      });
    }
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      if (socket && activeConversation) {
        socket.emit('typing', {
          conversationId: activeConversation._id,
          recipientId: otherParticipant(activeConversation)?._id,
          isTyping: false,
        });
        setIsTyping(false);
      }
    }, 1000);
  }, [socket, activeConversation, isTyping]);

  // ==================== SOCKET HANDLERS (unchanged) ====================
  useEffect(() => {
    if (!socket || !user) return;

    const handleNewMessage = (data) => {
      const { conversationId, message } = data;
      if (activeConversation?._id === conversationId) {
        setMessages(prev => [...prev, message]);
        scrollToBottom();
        api.put(`/messages/conversations/${conversationId}/read`);
      }
      setConversations(prev =>
        prev.map(c =>
          c._id === conversationId
            ? {
                ...c,
                lastMessage: {
                  text: message.fileUrl
                    ? message.fileType?.startsWith('image/')
                      ? '📷 Image'
                      : '📎 File'
                    : message.content,
                  sender: message.sender,
                  createdAt: message.createdAt,
                },
                unread: c.unread + (activeConversation?._id === conversationId ? 0 : 1),
              }
            : c
        )
      );
    };

    const handleUserTyping = (data) => {
      const { conversationId, userId, isTyping: typing } = data;
      if (activeConversation?._id === conversationId && userId !== user._id) {
        setTypingUsers(prev => ({ ...prev, [conversationId]: typing ? userId : null }));
      }
    };

    const handleUserOnline = (uid) => setOnlineUsers(prev => [...new Set([...prev, uid])]);
    const handleUserOffline = (uid) => setOnlineUsers(prev => prev.filter(id => id !== uid));
    const handleMessageReaction = (data) => {
      const { messageId, reactions } = data;
      setMessages(prev => prev.map(msg => (msg._id === messageId ? { ...msg, reactions } : msg)));
    };
    const handleMessagesRead = (data) => {
      const { conversationId, readBy, at } = data;
      setMessages(prev =>
        prev.map(msg =>
          msg.conversationId === conversationId && msg.sender._id !== user._id && !msg.readAt
            ? { ...msg, read: true, readAt: at }
            : msg
        )
      );
    };

    socket.on('new-message', handleNewMessage);
    socket.on('user-typing', handleUserTyping);
    socket.on('user-online', handleUserOnline);
    socket.on('user-offline', handleUserOffline);
    socket.on('message-reaction', handleMessageReaction);
    socket.on('messages-read', handleMessagesRead);

    return () => {
      socket.off('new-message', handleNewMessage);
      socket.off('user-typing', handleUserTyping);
      socket.off('user-online', handleUserOnline);
      socket.off('user-offline', handleUserOffline);
      socket.off('message-reaction', handleMessageReaction);
      socket.off('messages-read', handleMessagesRead);
    };
  }, [socket, activeConversation, user]);

  // ==================== UI HELPERS ====================
  const groupMessagesByDate = (msgs) => {
    const groups = {};
    msgs.forEach(msg => {
      const date = format(new Date(msg.createdAt), 'MMMM d, yyyy');
      if (!groups[date]) groups[date] = [];
      groups[date].push(msg);
    });
    return groups;
  };

  const renderMessageStatus = (msg) => {
    if (msg.sender._id !== user._id) return null;
    if (msg.readAt) return <FiCheckCircle className="text-blue-500 text-xs ml-1" title="Read" />;
    if (msg.deliveredAt) return <FiCheck className="text-gray-400 text-xs ml-1" title="Delivered" />;
    return <FiCheck className="text-gray-400 text-xs ml-1 opacity-50" title="Sent" />;
  };

  const handleConversationClick = async (conversation) => {
    setActiveConversation(conversation);
    await fetchMessages(conversation._id);
    if (isMobileView) setShowChat(true);
  };

  const handleBack = () => {
    setShowChat(false);
    setActiveConversation(null);
  };

  // Copy text to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  // Context menu handlers
  const handleContextMenu = (e, msg) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      message: msg,
    });
  };

  const closeContextMenu = () => setContextMenu({ visible: false, x: 0, y: 0, message: null });

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target)) {
        closeContextMenu();
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Scroll listener for "scroll to bottom" button
  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 200;
      setShowScrollButton(!isNearBottom);
    }
  };

  // Avatar component
  const Avatar = ({ user: u, size = 'w-10 h-10', online = false }) => (
    <div className="relative">
      {u?.avatar ? (
        <img src={u.avatar} alt={u.name} className={`${size} rounded-full object-cover`} />
      ) : (
        <div className={`${size} rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white font-semibold text-lg`}>
          {u?.name?.charAt(0) || '?'}
        </div>
      )}
      {online && (
        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
      )}
    </div>
  );

  // ==================== EFFECTS ====================
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobileView(mobile);
      if (!mobile) setShowChat(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (showUserSearch) searchUsers(searchQuery);
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery, showUserSearch]);

  useEffect(() => {
    adjustTextareaHeight();
  }, [newMessage]);

  // ==================== RENDER ====================
  return (
    <Layout role={user?.role}>
      <div className="flex h-[calc(100vh-4rem)] bg-gray-100 dark:bg-gray-900">
        {/* SIDEBAR */}
        {(!isMobileView || !showChat) && (
          <div className={`${isMobileView ? 'w-full' : 'w-96'} flex flex-col border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800`}>
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Chats</h2>
                <button
                  onClick={() => setShowUserSearch(true)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                  title="New chat"
                >
                  <FiPlus className="text-gray-600 dark:text-gray-300 text-xl" />
                </button>
              </div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search or start new chat"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                  onClick={() => setShowUserSearch(true)}
                />
                <FiSearch className="absolute right-3 top-3 text-gray-400" />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loadingConversations ? (
                <div className="flex justify-center items-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                </div>
              ) : conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 px-4">
                  <FiMessageSquare className="text-4xl mb-2" />
                  <p className="text-center">No conversations yet</p>
                  <button
                    onClick={() => setShowUserSearch(true)}
                    className="mt-4 text-green-500 hover:text-green-600 flex items-center gap-1"
                  >
                    <FiUserPlus /> Start a new chat
                  </button>
                </div>
              ) : (
                conversations.map(conv => {
                  const participant = otherParticipant(conv);
                  const online = participant && isUserOnline(participant._id);
                  return (
                    <div
                      key={conv._id}
                      onClick={() => handleConversationClick(conv)}
                      className={`flex items-center p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors ${
                        activeConversation?._id === conv._id ? 'bg-gray-50 dark:bg-gray-700' : ''
                      }`}
                    >
                      <Avatar user={participant} online={online} />
                      <div className="flex-1 ml-3">
                        <div className="flex justify-between items-baseline">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {participant?.name || 'Unknown'}
                          </h3>
                          <span className="text-xs text-gray-500">
                            {conv.lastMessage && format(new Date(conv.lastMessage.createdAt), 'hh:mm a')}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-[180px]">
                            {conv.lastMessage?.text || 'No messages yet'}
                          </p>
                          {conv.unread > 0 && (
                            <span className="bg-green-500 text-white text-xs rounded-full px-2 py-0.5">
                              {conv.unread}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* CHAT AREA */}
        {(!isMobileView || showChat) && (
          <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900">
            {activeConversation ? (
              <>
                {/* Chat Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                  <div className="flex items-center">
                    {isMobileView && (
                      <button onClick={handleBack} className="mr-3 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                        <FiArrowLeft className="text-gray-600 dark:text-gray-300" />
                      </button>
                    )}
                    <Avatar user={otherParticipant(activeConversation)} online={isUserOnline(otherParticipant(activeConversation)?._id)} />
                    <div className="ml-3">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {otherParticipant(activeConversation)?.name}
                      </h3>
                      {typingUsers[activeConversation._id] ? (
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-green-500">typing</span>
                          <span className="typing-dots">...</span>
                        </div>
                      ) : isUserOnline(otherParticipant(activeConversation)?._id) ? (
                        <p className="text-xs text-gray-500">Online</p>
                      ) : (
                        <p className="text-xs text-gray-500">Offline</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full" title="Voice call">
                      <FiPhone className="text-gray-600 dark:text-gray-300" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full" title="Video call">
                      <FiVideo className="text-gray-600 dark:text-gray-300" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                      <FiMoreVertical className="text-gray-600 dark:text-gray-300" />
                    </button>
                  </div>
                </div>

                {/* Messages Container */}
                <div
                  ref={messagesContainerRef}
                  onScroll={handleScroll}
                  className="flex-1 overflow-y-auto p-4 space-y-4 bg-chat-pattern"
                >
                  {loadingMsgs ? (
                    <div className="flex justify-center items-center h-full">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                    </div>
                  ) : (
                    <>
                      {Object.entries(groupMessagesByDate(messages)).map(([date, dateMessages]) => (
                        <div key={date}>
                          <div className="flex justify-center my-4">
                            <span className="text-xs text-gray-500 bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded-full">
                              {date}
                            </span>
                          </div>
                          {dateMessages.map((msg, idx) => (
                            <div
                              key={msg._id || idx}
                              className={`flex ${msg.sender._id === user._id ? 'justify-end' : 'justify-start'} mb-2 group animate-fade-in`}
                              onContextMenu={(e) => handleContextMenu(e, msg)}
                            >
                              <div
                                className={`relative max-w-[70%] px-4 py-2 rounded-2xl shadow-sm ${
                                  msg.sender._id === user._id
                                    ? 'bg-green-500 text-white rounded-tr-none'
                                    : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-tl-none'
                                }`}
                              >
                                {/* Image Message */}
                                {msg.fileUrl && msg.fileType?.startsWith('image/') && (
                                  <div className="mb-2">
                                    <img
                                      src={msg.fileUrl}
                                      alt="Shared"
                                      className="max-w-full rounded-lg cursor-pointer transition-transform hover:scale-105"
                                      onClick={() => setImagePreviewUrl(msg.fileUrl)}
                                    />
                                  </div>
                                )}
                                {/* File Message */}
                                {msg.fileUrl && !msg.fileType?.startsWith('image/') && (
                                  <div className="flex items-center gap-2 mb-2">
                                    <FiFile className="text-lg" />
                                    <a
                                      href={msg.fileUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="underline text-sm"
                                    >
                                      {msg.fileUrl.split('/').pop()}
                                    </a>
                                  </div>
                                )}
                                {/* Text Content */}
                                {msg.content && <p className="text-sm break-words">{msg.content}</p>}
                                {/* Reactions */}
                                {msg.reactions?.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {msg.reactions.map((r, i) => (
                                      <span key={i} className="text-xs bg-black/10 dark:bg-white/10 rounded-full px-2 py-0.5">
                                        {r.emoji}
                                      </span>
                                    ))}
                                  </div>
                                )}
                                {/* Timestamp & Status */}
                                <div className="flex items-center justify-end gap-1 mt-1">
                                  <span className="text-xs opacity-70">
                                    {format(new Date(msg.createdAt), 'hh:mm a')}
                                  </span>
                                  {renderMessageStatus(msg)}
                                </div>
                                {/* Reaction Button (Hover) */}
                                <button
                                  onClick={() => {
                                    setSelectedMessageId(msg._id);
                                    setShowReactionPicker(true);
                                  }}
                                  className="absolute -bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-gray-700 rounded-full p-1 shadow-md"
                                >
                                  <FiSmile className="text-xs" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>

                {/* Scroll to Bottom Button */}
                {showScrollButton && (
                  <button
                    onClick={() => scrollToBottom()}
                    className="absolute bottom-24 right-6 bg-green-500 hover:bg-green-600 text-white rounded-full p-2 shadow-lg transition-all animate-bounce"
                  >
                    <FiArrowDown />
                  </button>
                )}

                {/* Reaction Picker Modal */}
                {showReactionPicker && selectedMessageId && (
                  <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
                    onClick={() => {
                      setShowReactionPicker(false);
                      setSelectedMessageId(null);
                    }}
                  >
                    <div className="bg-white dark:bg-gray-800 rounded-full p-2 flex gap-2 shadow-xl" onClick={e => e.stopPropagation()}>
                      {commonReactions.map(emoji => (
                        <button
                          key={emoji}
                          onClick={() => handleReaction(selectedMessageId, emoji)}
                          className="text-2xl hover:scale-125 transition-transform p-2"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Image Lightbox */}
                {imagePreviewUrl && (
                  <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
                    onClick={() => setImagePreviewUrl(null)}
                  >
                    <img src={imagePreviewUrl} alt="Preview" className="max-w-[90%] max-h-[90%] rounded-lg shadow-2xl" />
                    <button className="absolute top-4 right-4 text-white text-2xl" onClick={() => setImagePreviewUrl(null)}>
                      <FiX />
                    </button>
                  </div>
                )}

                {/* Context Menu */}
                {contextMenu.visible && (
                  <div
                    ref={contextMenuRef}
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                    className="fixed z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl py-1 min-w-[160px] border border-gray-200 dark:border-gray-700"
                  >
                    {contextMenu.message?.content && (
                      <button
                        onClick={() => {
                          copyToClipboard(contextMenu.message.content);
                          closeContextMenu();
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-sm"
                      >
                        <FiCopy /> Copy text
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setSelectedMessageId(contextMenu.message._id);
                        setShowReactionPicker(true);
                        closeContextMenu();
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-sm"
                    >
                      <FiSmile /> React
                    </button>
                  </div>
                )}

                {/* Input Area */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                  <div className="flex items-end gap-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                      title="Attach File"
                    >
                      <FiPaperclip className="text-gray-600 dark:text-gray-300" />
                    </button>
                    <button
                      onClick={() => cameraInputRef.current?.click()}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                      title="Upload Image"
                    >
                      <FiImage className="text-gray-600 dark:text-gray-300" />
                    </button>
                    <button
                      onClick={() => toast('Voice message coming soon', { icon: '🎙️' })}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                      title="Voice message"
                    >
                      <FiMic className="text-gray-600 dark:text-gray-300" />
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" onChange={e => handleFileUpload(e.target.files[0])} />
                    <input type="file" ref={cameraInputRef} className="hidden" accept="image/*" onChange={e => handleFileUpload(e.target.files[0])} />

                    <div className="flex-1 relative">
                      <textarea
                        ref={inputRef}
                        value={newMessage}
                        onChange={e => {
                          setNewMessage(e.target.value);
                          handleTyping();
                          adjustTextareaHeight();
                        }}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                          }
                        }}
                        placeholder="Type a message..."
                        rows={1}
                        className="w-full resize-none rounded-2xl border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 px-4 py-2 pr-12 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                        style={{ maxHeight: '120px' }}
                      />
                      <button
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className="absolute right-2 bottom-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                      >
                        <FiSmile />
                      </button>
                    </div>

                    <button
                      onClick={handleSend}
                      disabled={!newMessage.trim() || uploading}
                      className="bg-green-500 hover:bg-green-600 disabled:opacity-50 p-3 rounded-full text-white transition-all transform active:scale-95"
                    >
                      <FiSend />
                    </button>
                  </div>
                  {showEmojiPicker && (
                    <div className="absolute bottom-20 right-4 z-50">
                      <EmojiPicker onEmojiClick={emojiData => {
                        setNewMessage(prev => prev + emojiData.emoji);
                        setShowEmojiPicker(false);
                        adjustTextareaHeight();
                      }} />
                    </div>
                  )}
                  {uploading && (
                    <div className="mt-2 text-sm text-gray-500 flex items-center gap-2">
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-green-500"></div>
                      Uploading file...
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                <FiMessageSquare className="text-6xl mb-4 opacity-50" />
                <h3 className="text-xl font-semibold mb-2">FikrMassageApp Web</h3>
                <p className="text-center">Select a conversation or start a new chat</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Global User Search Modal */}
      {showUserSearch && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl">
            <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">New Chat</h3>
              <button onClick={() => setShowUserSearch(false)} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                <FiX className="text-gray-500" />
              </button>
            </div>
            <div className="p-4">
              <input
                type="text"
                autoFocus
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-4">
              {searching ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
                </div>
              ) : searchResults.length === 0 && searchQuery ? (
                <div className="text-center text-gray-500 py-8">No users found</div>
              ) : (
                searchResults.map(u => (
                  <div
                    key={u._id}
                    onClick={() => startConversation(u)}
                    className="flex items-center p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl cursor-pointer transition-colors"
                  >
                    <Avatar user={u} />
                    <div className="ml-3">
                      <p className="font-medium text-gray-900 dark:text-white">{u.name}</p>
                      <p className="text-sm text-gray-500">{u.email}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add this to your global CSS or Tailwind config if not already present */}
      <style jsx>{`
        .animate-fade-in {
          animation: fadeIn 0.2s ease-in-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .typing-dots::after {
          content: '...';
          animation: dots 1.5s steps(4, end) infinite;
        }
        @keyframes dots {
          0%, 20% { content: ''; }
          40% { content: '.'; }
          60% { content: '..'; }
          80%, 100% { content: '...'; }
        }
        .bg-chat-pattern {
          background-image: url('data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Cpath fill="%23E5E7EB" fill-opacity="0.2" d="M0 0h100v100H0z"/%3E%3C/svg%3E');
          background-repeat: repeat;
        }
        .dark .bg-chat-pattern {
          background-image: url('data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Cpath fill="%23374151" fill-opacity="0.1" d="M0 0h100v100H0z"/%3E%3C/svg%3E');
        }
      `}</style>
    </Layout>
  );
};

export default Messages;