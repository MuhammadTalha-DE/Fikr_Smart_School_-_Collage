import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  FiSend, FiArrowLeft, FiMessageSquare, FiPlus, FiPaperclip, FiSmile,
  FiFile, FiImage, FiCheck, FiCheckCircle, FiMoreVertical, FiSearch,
  FiX, FiUserPlus, FiMic, FiPhone, FiVideo, FiCopy, FiTrash2,
  FiArrowDown, FiCamera, FiZap, FiMessageCircle
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import EmojiPicker from 'emoji-picker-react';
import { useSocket } from '../../hooks/useSocket';
import { format } from 'date-fns';

// ==================== 3D ANIMATION KEYFRAMES ====================
const GlobalStyles = () => (
  <style>{`
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(20px) rotateX(10deg); }
      to { opacity: 1; transform: translateY(0) rotateX(0deg); }
    }
    @keyframes fadeInScale {
      from { opacity: 0; transform: scale(0.8) rotateY(-15deg); }
      to { opacity: 1; transform: scale(1) rotateY(0deg); }
    }
    @keyframes slideInLeft {
      from { opacity: 0; transform: translateX(-50px) rotateY(20deg); }
      to { opacity: 1; transform: translateX(0) rotateY(0deg); }
    }
    @keyframes slideInRight {
      from { opacity: 0; transform: translateX(50px) rotateY(-20deg); }
      to { opacity: 1; transform: translateX(0) rotateY(0deg); }
    }
    @keyframes float3d {
      0%, 100% { transform: translateY(0px) rotateX(0deg); }
      50% { transform: translateY(-8px) rotateX(5deg); }
    }
    @keyframes pulseGlow {
      0%, 100% { box-shadow: 0 0 5px rgba(16, 185, 129, 0.4); }
      50% { box-shadow: 0 0 25px rgba(16, 185, 129, 0.8), 0 0 50px rgba(16, 185, 129, 0.3); }
    }
    @keyframes typingBounce {
      0%, 60%, 100% { transform: translateY(0) scale(1); }
      30% { transform: translateY(-8px) scale(1.2); }
    }
    @keyframes shimmer {
      0% { background-position: -200% center; }
      100% { background-position: 200% center; }
    }
    @keyframes messagePop {
      0% { transform: scale(0) rotateZ(-5deg); opacity: 0; }
      60% { transform: scale(1.05) rotateZ(2deg); }
      100% { transform: scale(1) rotateZ(0deg); opacity: 1; }
    }
    @keyframes reactionPop {
      0% { transform: scale(0) rotateZ(-180deg); }
      70% { transform: scale(1.3) rotateZ(10deg); }
      100% { transform: scale(1) rotateZ(0deg); }
    }
    @keyframes morphBlob {
      0%, 100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
      50% { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; }
    }
    @keyframes gradientShift {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }

    .animate-fade-in-up { animation: fadeInUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
    .animate-fade-in-scale { animation: fadeInScale 0.5s ease-out forwards; }
    .animate-slide-in-left { animation: slideInLeft 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
    .animate-slide-in-right { animation: slideInRight 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
    .animate-float-3d { animation: float3d 3s ease-in-out infinite; }
    .animate-pulse-glow { animation: pulseGlow 2s ease-in-out infinite; }
    .animate-message-pop { animation: messagePop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
    .animate-reaction-pop { animation: reactionPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
    .animate-shimmer {
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
      background-size: 200% 100%;
      animation: shimmer 2s infinite;
    }
    .animate-gradient-shift {
      background-size: 200% 200%;
      animation: gradientShift 4s ease infinite;
    }
    .animate-morph {
      animation: morphBlob 8s ease-in-out infinite;
    }

    .perspective-1000 { perspective: 1000px; }
    .preserve-3d { transform-style: preserve-3d; }
    .text-gradient {
      background: linear-gradient(135deg, #10b981, #3b82f6, #8b5cf6);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .bg-gradient-mesh {
      background: 
        radial-gradient(at 40% 20%, rgba(16, 185, 129, 0.15) 0px, transparent 50%),
        radial-gradient(at 80% 0%, rgba(59, 130, 246, 0.15) 0px, transparent 50%),
        radial-gradient(at 0% 50%, rgba(139, 92, 246, 0.1) 0px, transparent 50%),
        radial-gradient(at 80% 50%, rgba(236, 72, 153, 0.1) 0px, transparent 50%),
        radial-gradient(at 0% 100%, rgba(16, 185, 129, 0.1) 0px, transparent 50%);
    }
    .bg-gradient-mesh-dark {
      background: 
        radial-gradient(at 40% 20%, rgba(16, 185, 129, 0.08) 0px, transparent 50%),
        radial-gradient(at 80% 0%, rgba(59, 130, 246, 0.08) 0px, transparent 50%),
        radial-gradient(at 0% 50%, rgba(139, 92, 246, 0.05) 0px, transparent 50%);
    }

    .typing-dot {
      display: inline-block;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: currentColor;
      animation: typingBounce 1.4s ease-in-out infinite;
    }
    .typing-dot:nth-child(2) { animation-delay: 0.2s; }
    .typing-dot:nth-child(3) { animation-delay: 0.4s; }

    .scrollbar-thin::-webkit-scrollbar { width: 4px; }
    .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
    .scrollbar-thin::-webkit-scrollbar-thumb { background: rgba(156, 163, 175, 0.3); border-radius: 10px; }
    .scrollbar-thin::-webkit-scrollbar-thumb:hover { background: rgba(156, 163, 175, 0.5); }

    .message-bubble-sent {
      background: linear-gradient(135deg, #059669, #10b981, #34d399);
      background-size: 200% 200%;
      animation: gradientShift 3s ease infinite;
      box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3), 0 0 0 1px rgba(16, 185, 129, 0.1), inset 0 1px 0 rgba(255,255,255,0.2);
    }
    .message-bubble-received {
      background: linear-gradient(135deg, #f3f4f6, #ffffff);
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255,255,255,0.8);
    }
    .dark .message-bubble-received {
      background: linear-gradient(135deg, #1f2937, #111827);
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255,255,255,0.05), inset 0 1px 0 rgba(255,255,255,0.05);
    }

    .conversation-item {
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      transform-style: preserve-3d;
    }
    .conversation-item:hover {
      transform: translateX(4px) rotateY(-3deg) scale(1.01);
      box-shadow: -4px 4px 20px rgba(0,0,0,0.1);
    }
    .conversation-item.active {
      transform: translateX(0) rotateY(0deg);
      box-shadow: inset 3px 0 0 #10b981, 0 4px 20px rgba(16, 185, 129, 0.15);
    }

    .input-glow:focus-within {
      box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2), 0 4px 20px rgba(16, 185, 129, 0.1);
    }

    .status-pulse {
      position: relative;
    }
    .status-pulse::after {
      content: '';
      position: absolute;
      inset: -2px;
      border-radius: 50%;
      background: #10b981;
      opacity: 0;
      animation: pulseGlow 2s ease-out infinite;
      z-index: -1;
    }
  `}</style>
);

// ==================== ENHANCED REACTIONS DATA ====================
const REACTION_CATEGORIES = {
  popular: ['👍', '❤️', '😂', '😮', '😢', '🙏', '🔥', '👏', '🎉', '💯'],
  love: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💕', '💞', '💓', '💗', '💖', '💘', '💝'],
  happy: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩'],
  sad: ['😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡'],
  angry: ['😤', '😠', '😡', '🤬', '👿', '💢', '💥', '🤯', '😳', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔'],
  celebration: ['🎉', '🎊', '🎁', '🎈', '🎀', '🏆', '🥇', '🥈', '🥉', '🏅', '⭐', '🌟', '✨', '💫', '🔥', '💥'],
  nature: ['🌸', '🌺', '🌻', '🌹', '🌷', '💐', '🌼', '🌿', '☘️', '🍀', '🌵', '🌴', '🌲', '🌳', '🍃', '🍂'],
  animals: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔'],
  food: ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🍍', '🥝', '🍅', '🥑'],
  activities: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏'],
  objects: ['💡', '🔦', '🕯️', '🪔', '🧯', '🛢️', '💸', '💵', '💴', '💶', '💷', '🪙', '💰', '💳', '💎', '⚖️'],
  symbols: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖'],
};

const QUICK_MESSAGES = [
  'Assalam o Alaikum',
  'Please check this when you are free.',
  'Can you send the details?',
  'I will update you shortly.',
  'Thank you.',
];

const VOICE_WAVE_HEIGHTS = [28, 58, 36, 74, 44, 64, 32, 82, 48, 68, 38, 76, 52, 60, 34, 70, 46, 56, 30, 62];

const resolveMediaUrl = (url = '') => {
  if (!url || /^(https?:|data:|blob:)/i.test(url)) return url;
  const apiBase = import.meta.env.VITE_API_URL || '';
  if (apiBase && url.startsWith('/uploads')) {
    return `${apiBase.replace(/\/api\/?$/, '').replace(/\/$/, '')}${url}`;
  }
  return url;
};

// ==================== VOICE RECORDING COMPONENT ====================
const VoiceRecorder = ({ onSendVoice, onCancel }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimeRef = useRef(0);
  const timerRef = useRef(null);
  const analyserRef = useRef(null);
  const animationRef = useRef(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : '';
      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      recordingTimeRef.current = 0;

      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const audioType = mediaRecorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: audioType });
        onSendVoice(audioBlob, recordingTimeRef.current, audioType);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        recordingTimeRef.current += 1;
        setRecordingTime(recordingTimeRef.current);
      }, 1000);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateLevel = () => {
        if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== 'recording') return;
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setAudioLevel(average / 255);
        animationRef.current = requestAnimationFrame(updateLevel);
      };
      updateLevel();
    } catch (err) {
      toast.error('Microphone access denied');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) clearInterval(timerRef.current);
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    setIsRecording(false);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isRecording) {
    return (
      <button
        onClick={startRecording}
        className="p-3 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-all duration-300 hover:scale-110 group"
        title="Record voice message"
      >
        <FiMic className="text-gray-500 dark:text-gray-400 group-hover:text-red-500 transition-colors" />
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3 bg-red-50 dark:bg-red-900/10 rounded-2xl px-4 py-2 animate-fade-in-up">
      <div className="relative">
        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
        <div className="absolute inset-0 w-3 h-3 bg-red-500 rounded-full animate-ping opacity-75" />
      </div>

      <div className="flex items-center gap-0.5 h-6">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="w-1 bg-red-500 rounded-full transition-all duration-75"
            style={{
              height: `${Math.max(4, Math.min(24, (audioLevel * 24) + Math.random() * 12))}px`,
              opacity: 0.6 + (audioLevel * 0.4),
              animationDelay: `${i * 0.05}s`,
            }}
          />
        ))}
      </div>

      <span className="text-red-600 dark:text-red-400 font-mono text-sm font-semibold min-w-[50px]">
        {formatTime(recordingTime)}
      </span>

      <button
        onClick={() => {
          if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
          }
          if (timerRef.current) clearInterval(timerRef.current);
          if (animationRef.current) cancelAnimationFrame(animationRef.current);
          setIsRecording(false);
          onCancel();
        }}
        className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full transition-colors"
      >
        <FiX className="text-red-500" />
      </button>

      <button
        onClick={stopRecording}
        className="p-2 bg-red-500 hover:bg-red-600 rounded-full transition-all hover:scale-110 shadow-lg shadow-red-500/30"
      >
        <FiSend className="text-white text-sm" />
      </button>
    </div>
  );
};

// ==================== ENHANCED AVATAR COMPONENT ====================
const Avatar = ({ user: u, size = 'w-10 h-10', online = false, showStatus = true, animate = false }) => {
  const sizeClasses = {
    'w-8 h-8': 'text-sm',
    'w-10 h-10': 'text-base',
    'w-12 h-12': 'text-lg',
    'w-16 h-16': 'text-2xl',
  };

  return (
    <div className={`relative ${animate ? 'animate-float-3d' : ''}`}>
      <div className={`${size} rounded-full overflow-hidden ${online ? 'ring-2 ring-green-400 ring-offset-2 dark:ring-offset-gray-800' : ''} transition-all duration-300 hover:ring-4 hover:ring-green-300/50`}>
        {u?.avatar ? (
          <img 
            src={u.avatar} 
            alt={u.name} 
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br from-emerald-400 via-teal-500 to-blue-600 flex items-center justify-center text-white font-bold ${sizeClasses[size] || 'text-base'} animate-gradient-shift`}>
            {u?.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
        )}
      </div>
      {showStatus && online && (
        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5">
          <div className="w-full h-full bg-green-500 rounded-full border-2 border-white dark:border-gray-800 status-pulse" />
        </div>
      )}
      {showStatus && !online && u?.lastSeen && (
        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-gray-400 rounded-full border-2 border-white dark:border-gray-800" />
      )}
    </div>
  );
};

// ==================== MESSAGE BUBBLE COMPONENT ====================
const MessageBubble = ({ msg, user, index, onReaction, onContextMenu, onImageClick }) => {
  const isSent = msg.sender._id === user._id;
  const [showReactions, setShowReactions] = useState(false);

  return (
    <div
      className={`flex ${isSent ? 'justify-end' : 'justify-start'} mb-3 perspective-1000`}
      style={{ animationDelay: `${index * 0.05}s` }}
      onContextMenu={(e) => onContextMenu(e, msg)}
    >
      <div className={`relative max-w-[82%] sm:max-w-[72%] lg:max-w-[620px] group ${isSent ? 'animate-slide-in-right' : 'animate-slide-in-left ml-10 sm:ml-12'}`}>
        {!isSent && (
          <div className="absolute -left-10 bottom-0">
            <Avatar user={msg.sender} size="w-8 h-8" online={false} showStatus={false} />
          </div>
        )}

        <div
          className={`
            relative px-4 py-2.5 rounded-2xl overflow-hidden min-w-[96px]
            ${isSent 
              ? 'message-bubble-sent rounded-tr-sm text-white' 
              : 'message-bubble-received rounded-tl-sm text-slate-900 dark:text-slate-100'
            }
            transition-all duration-300 hover:shadow-xl
          `}
        >
          <div className="absolute inset-0 animate-shimmer opacity-0 group-hover:opacity-100 pointer-events-none" />

          {msg.fileUrl && msg.fileType?.startsWith('image/') && (
            <div className="mb-2 -mx-1 -mt-1">
              <div className="relative overflow-hidden rounded-xl">
                <img
                  src={resolveMediaUrl(msg.fileUrl)}
                  alt="Shared"
                  className="max-w-full rounded-xl cursor-pointer transition-all duration-500 hover:scale-105 hover:brightness-110"
                  onClick={() => onImageClick(resolveMediaUrl(msg.fileUrl))}
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          )}

          {msg.fileUrl && !msg.fileType?.startsWith('image/') && (
            <div className="flex items-center gap-3 mb-2 p-3 bg-black/10 dark:bg-white/10 rounded-xl backdrop-blur-sm">
              <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                <FiFile className="text-lg" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{msg.fileUrl.split('/').pop()}</p>
                <p className="text-xs opacity-70">Document</p>
              </div>
              <a href={resolveMediaUrl(msg.fileUrl)} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-white/20 rounded-full transition-colors">
                <FiArrowDown className="text-sm" />
              </a>
            </div>
          )}

          {msg.voiceUrl && (
            <div className={`mb-2 rounded-xl border p-3 ${isSent ? 'border-white/20 bg-white/15 text-white' : 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-600 dark:bg-slate-700/70 dark:text-slate-100'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${isSent ? 'bg-white/20' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-300'}`}>
                  <FiMic className="text-base" />
                </div>
                <div className="flex items-center gap-0.5 h-8 flex-1 min-w-[96px]" aria-hidden="true">
                  {VOICE_WAVE_HEIGHTS.map((height, i) => (
                    <div
                      key={i}
                      className={`w-1 rounded-full ${isSent ? 'bg-white/80' : 'bg-emerald-500/75 dark:bg-emerald-300/80'}`}
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>
                <span className={`text-xs font-medium shrink-0 ${isSent ? 'text-white/85' : 'text-slate-500 dark:text-slate-300'}`}>
                  {msg.voiceDuration || '0:00'}
                </span>
              </div>
              <audio
                controls
                src={resolveMediaUrl(msg.voiceUrl)}
                className="mt-2 h-8 w-full min-w-[180px] max-w-full"
              >
                <a href={resolveMediaUrl(msg.voiceUrl)}>Open voice message</a>
              </audio>
            </div>
          )}

          {!msg.content && !msg.fileUrl && !msg.voiceUrl && (
            <p className={`text-sm italic ${isSent ? 'text-white/80' : 'text-slate-500 dark:text-slate-300'}`}>
              Message unavailable
            </p>
          )}

          {msg.content && (
            <p className={`text-sm leading-relaxed whitespace-pre-wrap break-words ${isSent ? 'text-white' : 'text-slate-900 dark:text-slate-50'}`}>
              {msg.content}
            </p>
          )}

          {msg.reactions?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {msg.reactions.map((r, i) => (
                <span 
                  key={i} 
                  className="text-xs bg-black/10 dark:bg-white/10 backdrop-blur-sm rounded-full px-2.5 py-1 flex items-center gap-1 animate-reaction-pop hover:scale-110 transition-transform cursor-pointer"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <span>{r.emoji}</span>
                  {r.count > 1 && <span className="opacity-70">{r.count}</span>}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center justify-end gap-1.5 mt-1.5">
            <span className={`text-[10px] opacity-70 ${isSent ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>
              {format(new Date(msg.createdAt), 'hh:mm a')}
            </span>
            {isSent && (
              <span className="flex items-center">
                {msg.readAt ? (
                  <FiCheckCircle className="text-blue-300 text-xs" title="Read" />
                ) : msg.deliveredAt ? (
                  <div className="flex -space-x-1">
                    <FiCheck className="text-white/70 text-xs" />
                    <FiCheck className="text-white/70 text-xs -ml-1" />
                  </div>
                ) : (
                  <FiCheck className="text-white/40 text-xs" />
                )}
              </span>
            )}
          </div>
        </div>

        <button
          onClick={() => setShowReactions(!showReactions)}
          className={`absolute -bottom-2 ${isSent ? 'left-2' : 'right-2'} opacity-0 group-hover:opacity-100 transition-all duration-300 bg-white dark:bg-gray-700 rounded-full p-1.5 shadow-lg hover:scale-110 hover:shadow-xl border border-gray-100 dark:border-gray-600`}
        >
          <FiSmile className="text-xs text-gray-500 dark:text-gray-400" />
        </button>

        {showReactions && (
          <div className={`absolute ${isSent ? 'left-0' : 'right-0'} bottom-full mb-2 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-2 flex gap-1 z-20 border border-gray-100 dark:border-gray-700 animate-fade-in-scale`}>
            {REACTION_CATEGORIES.popular.slice(0, 6).map(emoji => (
              <button
                key={emoji}
                onClick={() => { onReaction(msg._id, emoji); setShowReactions(false); }}
                className="text-xl hover:scale-125 transition-transform p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {emoji}
              </button>
            ))}
            <button
              onClick={() => { onReaction(msg._id, 'more'); setShowReactions(false); }}
              className="text-xs px-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg flex items-center"
            >
              <FiSmile />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ==================== DATE SEPARATOR ====================
const DateSeparator = ({ date }) => (
  <div className="flex items-center justify-center my-6">
    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent" />
    <span className="mx-4 px-4 py-1.5 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full text-xs font-medium text-gray-500 dark:text-gray-400 shadow-sm border border-gray-100 dark:border-gray-700">
      {date}
    </span>
    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent" />
  </div>
);

// ==================== TYPING INDICATOR ====================
const TypingIndicator = ({ name }) => (
  <div className="flex items-start gap-2 mb-3 animate-fade-in-up">
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center text-white text-xs font-bold">
      {name?.charAt(0)?.toUpperCase() || '?'}
    </div>
    <div className="bg-white dark:bg-gray-800 rounded-2xl rounded-tl-sm px-4 py-3 shadow-md border border-gray-100 dark:border-gray-700">
      <div className="flex items-center gap-1 h-5">
        <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">{name} is typing</span>
        <span className="typing-dot text-green-500" />
        <span className="typing-dot text-green-500" />
        <span className="typing-dot text-green-500" />
      </div>
    </div>
  </div>
);

// ==================== MAIN COMPONENT ====================
const Messages = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { socket, isConnected } = useSocket();

  // ==================== STATE (UNCHANGED LOGIC) ====================
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(true);

  const [newMessage, setNewMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState(null);
  const [reactionCategory, setReactionCategory] = useState('popular');

  const [showUserSearch, setShowUserSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);
  const [showChat, setShowChat] = useState(false);

  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, message: null });
  const [showScrollButton, setShowScrollButton] = useState(false);

  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [showQuickMessages, setShowQuickMessages] = useState(false);

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);
  const contextMenuRef = useRef(null);

  // ==================== HELPERS (UNCHANGED) ====================
  const otherParticipant = (conversation) => {
    if (!conversation?.participants) return null;
    return conversation.participants.find(p => p._id !== user._id);
  };

  const isUserOnline = (userId) => onlineUsers.includes(userId);

  const scrollToBottom = (behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // FIXED: Auto-resize textarea with proper whitespace handling
  const adjustTextareaHeight = () => {
    const textarea = inputRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.min(textarea.scrollHeight, 120);
      textarea.style.height = `${newHeight}px`;
      // Critical fix: ensure whitespace is preserved properly
      textarea.style.whiteSpace = 'pre-wrap';
      textarea.style.overflowWrap = 'break-word';
      textarea.style.overflow = newHeight >= 120 ? 'auto' : 'hidden';
      textarea.style.wordBreak = 'break-word';
    }
  };

  // ==================== API & SOCKET (UNCHANGED LOGIC) ====================
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

  const sendTextMessage = async (text) => {
    const trimmedText = text.trim();
    if (!trimmedText || !activeConversation) return;
    try {
      const payload = { conversationId: activeConversation._id, content: trimmedText };
      const { data } = await api.post(`/messages/conversations/${activeConversation._id}`, payload);
      setMessages(prev => [...prev, data]);
      setNewMessage('');
      setShowQuickMessages(false);
      adjustTextareaHeight();
      updateLastMessage(data);
      scrollToBottom();
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  const handleSend = async () => {
    await sendTextMessage(newMessage);
  };

  const handleQuickMessage = async (message) => {
    await sendTextMessage(message);
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
    } catch (error) {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleVoiceUpload = async (audioBlob, duration, audioType = 'audio/webm') => {
    if (!audioBlob || !activeConversation) return;
    if (!audioBlob.size) {
      toast.error('Voice message was empty. Please record again.');
      return;
    }
    const formData = new FormData();
    const extension = audioType.includes('ogg') ? 'ogg' : audioType.includes('mp4') ? 'm4a' : 'webm';
    formData.append('file', audioBlob, `voice-message.${extension}`);
    setUploading(true);
    try {
      const { data: uploadData } = await api.post('/messages/upload', formData);
      const safeDuration = Math.max(Number(duration) || 0, 1);
      const payload = {
        conversationId: activeConversation._id,
        voiceUrl: uploadData.url,
        voiceDuration: `${Math.floor(safeDuration / 60)}:${(safeDuration % 60).toString().padStart(2, '0')}`,
        content: '',
      };
      const { data: msg } = await api.post(`/messages/conversations/${activeConversation._id}`, payload);
      setMessages(prev => [...prev, msg]);
      updateLastMessage(msg);
      scrollToBottom();
    } catch (error) {
      toast.error('Voice upload failed');
    } finally {
      setUploading(false);
      setShowVoiceRecorder(false);
    }
  };

  const updateLastMessage = (message) => {
    setConversations(prev =>
      prev.map(c =>
        c._id === message.conversationId
          ? {
              ...c,
              lastMessage: {
                text: message.voiceUrl
                  ? '🎙️ Voice'
                  : message.fileUrl
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
    if (emoji === 'more') {
      setSelectedMessageId(messageId);
      setShowReactionPicker(true);
      return;
    }
    try {
      await api.post(`/messages/${messageId}/reaction`, { emoji });
      setShowReactionPicker(false);
      setSelectedMessageId(null);
    } catch (error) {
      toast.error('Failed to add reaction');
    }
  };

  // ==================== GLOBAL USER SEARCH (UNCHANGED) ====================
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

  // ==================== TYPING INDICATOR (UNCHANGED) ====================
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

  // ==================== SOCKET HANDLERS (UNCHANGED LOGIC) ====================
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
                  text: message.voiceUrl
                    ? '🎙️ Voice'
                    : message.fileUrl
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
          msg.conversationId === conversationId && msg.sender._id === user._id && readBy !== user._id && !msg.readAt
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

  // ==================== UI HELPERS (UNCHANGED) ====================
  const groupMessagesByDate = (msgs) => {
    const groups = {};
    msgs.forEach(msg => {
      const date = format(new Date(msg.createdAt), 'MMMM d, yyyy');
      if (!groups[date]) groups[date] = [];
      groups[date].push(msg);
    });
    return groups;
  };

  const handleConversationClick = async (conversation) => {
    setActiveConversation(conversation);
    await fetchMessages(conversation._id);
    if (isMobileView) setShowChat(true);
  };

  const handleBack = () => {
    setShowQuickMessages(false);
    setShowChat(false);
    setActiveConversation(null);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const handleContextMenu = (e, msg) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: Math.min(e.clientX, window.innerWidth - 200),
      y: Math.min(e.clientY, window.innerHeight - 150),
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

  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 300;
      setShowScrollButton(!isNearBottom);
    }
  };

  // ==================== EFFECTS (UNCHANGED) ====================
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
      <GlobalStyles />
      <div className="flex h-[calc(100dvh-4rem)] min-h-0 w-full max-w-full bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 overflow-hidden">
        {/* SIDEBAR */}
        {(!isMobileView || !showChat) && (
          <div className={`${isMobileView ? 'w-full' : 'w-[min(380px,36vw)] min-w-[320px] max-w-[420px]'} min-h-0 flex flex-col bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-r border-gray-200/50 dark:border-gray-700/50 shadow-2xl shadow-black/5 z-10`}>
            {/* Sidebar Header */}
            <div className="p-5 border-b border-gray-200/50 dark:border-gray-700/50">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-blue-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 animate-float-3d">
                    <FiMessageSquare className="text-white text-lg" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Messages</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowUserSearch(true)}
                  className="p-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-500/30 transition-all duration-300 hover:scale-105 hover:shadow-xl active:scale-95"
                  title="New chat"
                >
                  <FiPlus className="text-lg" />
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative flex items-center bg-gray-100/80 dark:bg-gray-800/80 rounded-2xl overflow-hidden border border-transparent focus-within:border-emerald-500/50 focus-within:bg-white dark:focus-within:bg-gray-800 transition-all duration-300">
                  <FiSearch className="ml-4 text-gray-400 text-lg" />
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3 py-3 bg-transparent text-gray-900 dark:text-gray-100 focus:outline-none text-sm"
                    onClick={() => setShowUserSearch(true)}
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="mr-2 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
                      <FiX className="text-gray-400 text-sm" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto scrollbar-thin px-3 py-2 space-y-1">
              {loadingConversations ? (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full border-4 border-emerald-100 dark:border-emerald-900 border-t-emerald-500 animate-spin" />
                    <div className="absolute inset-0 w-12 h-12 rounded-full border-4 border-transparent border-t-blue-500 animate-spin" style={{ animationDuration: '1.5s' }} />
                  </div>
                  <p className="text-sm text-gray-500 animate-pulse">Loading conversations...</p>
                </div>
              ) : conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 px-8">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center mb-4 animate-float-3d">
                    <FiMessageSquare className="text-3xl text-gray-400" />
                  </div>
                  <p className="text-center font-medium mb-1">No conversations yet</p>
                  <p className="text-center text-sm text-gray-400 mb-6">Start chatting with your friends</p>
                  <button
                    onClick={() => setShowUserSearch(true)}
                    className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl shadow-lg shadow-emerald-500/25 transition-all duration-300 hover:scale-105 flex items-center gap-2 text-sm font-medium"
                  >
                    <FiUserPlus /> Start a new chat
                  </button>
                </div>
              ) : (
                conversations.map((conv, idx) => {
                  const participant = otherParticipant(conv);
                  const online = participant && isUserOnline(participant._id);
                  const isActive = activeConversation?._id === conv._id;

                  return (
                    <div
                      key={conv._id}
                      onClick={() => handleConversationClick(conv)}
                      className={`
                        conversation-item
                        flex items-center p-3 rounded-2xl cursor-pointer
                        ${isActive ? 'active bg-emerald-50/80 dark:bg-emerald-900/20' : 'hover:bg-gray-50/80 dark:hover:bg-gray-800/50'}
                        ${idx === 0 ? 'animate-fade-in-up' : ''}
                      `}
                      style={{ animationDelay: `${idx * 0.05}s` }}
                    >
                      <div className="relative">
                        <Avatar user={participant} online={online} size="w-12 h-12" animate={isActive} />
                        {conv.unread > 0 && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-red-500 to-pink-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg shadow-red-500/30 animate-pulse">
                            {conv.unread}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 ml-3 min-w-0">
                        <div className="flex justify-between items-baseline mb-0.5">
                          <h3 className="font-semibold text-gray-900 dark:text-white truncate text-sm">
                            {participant?.name || 'Unknown'}
                          </h3>
                          <span className="text-[11px] text-gray-400 font-medium shrink-0 ml-2">
                            {conv.lastMessage && format(new Date(conv.lastMessage.createdAt), 'hh:mm a')}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className={`text-xs truncate max-w-[160px] ${conv.unread > 0 ? 'text-gray-900 dark:text-gray-200 font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
                            {conv.lastMessage?.text || 'No messages yet'}
                          </p>
                          {conv.unread > 0 && (
                            <span className="ml-2 w-2 h-2 bg-emerald-500 rounded-full shrink-0 animate-pulse" />
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
          <div className="flex-1 min-w-0 min-h-0 flex flex-col relative bg-gradient-mesh dark:bg-gradient-mesh-dark">
            {activeConversation ? (
              <>
                {/* Chat Header */}
                <div className="flex items-center justify-between gap-3 px-3 sm:px-5 py-3 bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 z-20">
                  <div className="flex items-center gap-3 min-w-0">
                    {isMobileView && (
                      <button onClick={handleBack} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all hover:scale-105">
                        <FiArrowLeft className="text-gray-600 dark:text-gray-300" />
                      </button>
                    )}
                    <div className="relative">
                      <Avatar user={otherParticipant(activeConversation)} online={isUserOnline(otherParticipant(activeConversation)?._id)} size="w-10 h-10" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-gray-900 dark:text-white text-sm truncate">
                        {otherParticipant(activeConversation)?.name}
                      </h3>
                      <div className="flex items-center gap-1.5">
                        {typingUsers[activeConversation._id] ? (
                          <div className="flex items-center gap-1">
                            <span className="text-[11px] text-emerald-500 font-medium">typing</span>
                            <div className="flex gap-0.5">
                              <span className="typing-dot text-emerald-500" />
                              <span className="typing-dot text-emerald-500" />
                              <span className="typing-dot text-emerald-500" />
                            </div>
                          </div>
                        ) : isUserOnline(otherParticipant(activeConversation)?._id) ? (
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                            <span className="text-[11px] text-emerald-500 font-medium">Online</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-gray-400">Offline</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="relative flex gap-1 shrink-0">
                    <button
                      onClick={() => setShowQuickMessages(prev => !prev)}
                      className="p-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-all hover:scale-105 hover:shadow-md"
                      title="Quick messages"
                    >
                      <FiMessageCircle />
                    </button>
                    {showQuickMessages && (
                      <div className="absolute right-0 top-full mt-2 w-64 max-w-[80vw] rounded-2xl border border-gray-100 dark:border-gray-700 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl shadow-2xl p-2 z-40 animate-fade-in-scale">
                        {QUICK_MESSAGES.map((message) => (
                          <button
                            key={message}
                            onClick={() => handleQuickMessage(message)}
                            className="w-full text-left px-3 py-2.5 rounded-xl text-sm text-gray-700 dark:text-gray-100 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors"
                          >
                            {message}
                          </button>
                        ))}
                      </div>
                    )}
                    <button className="hidden sm:flex p-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all hover:scale-105 hover:shadow-md" title="Voice call">
                      <FiPhone className="text-gray-600 dark:text-gray-300" />
                    </button>
                    <button className="hidden sm:flex p-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all hover:scale-105 hover:shadow-md" title="Video call">
                      <FiVideo className="text-gray-600 dark:text-gray-300" />
                    </button>
                    <button className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all hover:scale-105 hover:shadow-md">
                      <FiMoreVertical className="text-gray-600 dark:text-gray-300" />
                    </button>
                  </div>
                </div>

                {/* Messages Container */}
                <div ref={messagesContainerRef} onScroll={handleScroll} className="flex-1 min-h-0 overflow-y-auto px-3 sm:px-4 py-4 space-y-1 scrollbar-thin">
                  {loadingMsgs ? (
                    <div className="flex flex-col items-center justify-center h-full gap-4">
                      <div className="relative w-16 h-16">
                        <div className="absolute inset-0 rounded-full border-4 border-emerald-100 dark:border-emerald-900/30 border-t-emerald-500 animate-spin" />
                        <div className="absolute inset-2 rounded-full border-4 border-blue-100 dark:border-blue-900/30 border-t-blue-500 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.2s' }} />
                        <div className="absolute inset-4 rounded-full border-4 border-purple-100 dark:border-purple-900/30 border-t-purple-500 animate-spin" style={{ animationDuration: '0.8s' }} />
                      </div>
                      <p className="text-sm text-gray-500 animate-pulse">Loading messages...</p>
                    </div>
                  ) : (
                    <>
                      {Object.entries(groupMessagesByDate(messages)).map(([date, dateMessages]) => (
                        <div key={date}>
                          <DateSeparator date={date} />
                          {dateMessages.map((msg, idx) => (
                            <MessageBubble
                              key={msg._id || idx}
                              msg={msg}
                              user={user}
                              index={idx}
                              onReaction={handleReaction}
                              onContextMenu={handleContextMenu}
                              onImageClick={setImagePreviewUrl}
                            />
                          ))}
                        </div>
                      ))}
                      {typingUsers[activeConversation._id] && (
                        <TypingIndicator name={otherParticipant(activeConversation)?.name} />
                      )}
                      <div ref={messagesEndRef} className="h-1" />
                    </>
                  )}
                </div>

                {/* Scroll to Bottom Button */}
                {showScrollButton && (
                  <button
                    onClick={() => scrollToBottom()}
                    className="absolute bottom-24 right-6 z-30 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full p-3 shadow-xl shadow-emerald-500/30 transition-all duration-300 hover:scale-110 animate-bounce backdrop-blur-sm"
                  >
                    <FiArrowDown className="text-lg" />
                  </button>
                )}

                {/* Full Reaction Picker Modal */}
                {showReactionPicker && selectedMessageId && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => { setShowReactionPicker(false); setSelectedMessageId(null); }}>
                    <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-fade-in-scale border border-gray-100 dark:border-gray-700" onClick={e => e.stopPropagation()}>
                      <div className="flex gap-1 p-3 border-b dark:border-gray-700 overflow-x-auto scrollbar-thin">
                        {Object.keys(REACTION_CATEGORIES).map(cat => (
                          <button
                            key={cat}
                            onClick={() => setReactionCategory(cat)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition-all duration-300 shrink-0 ${reactionCategory === cat ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                      <div className="p-4 grid grid-cols-8 gap-2 max-h-[300px] overflow-y-auto scrollbar-thin">
                        {REACTION_CATEGORIES[reactionCategory]?.map((emoji, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleReaction(selectedMessageId, emoji)}
                            className="text-2xl p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-125"
                            style={{ animationDelay: `${idx * 0.02}s` }}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Image Lightbox */}
                {imagePreviewUrl && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl" onClick={() => setImagePreviewUrl(null)}>
                    <div className="relative animate-fade-in-scale">
                      <img src={imagePreviewUrl} alt="Preview" className="max-w-[90vw] max-h-[90vh] rounded-2xl shadow-2xl" />
                    </div>
                    <button className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full text-white transition-all hover:scale-110" onClick={() => setImagePreviewUrl(null)}>
                      <FiX className="text-xl" />
                    </button>
                  </div>
                )}

                {/* Context Menu */}
                {contextMenu.visible && (
                  <div ref={contextMenuRef} style={{ top: contextMenu.y, left: contextMenu.x }} className="fixed z-50 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-2xl py-2 min-w-[180px] border border-gray-100 dark:border-gray-700 animate-fade-in-scale overflow-hidden">
                    {contextMenu.message?.content && (
                      <button onClick={() => { copyToClipboard(contextMenu.message.content); closeContextMenu(); }} className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 text-sm transition-colors">
                        <FiCopy className="text-gray-400" /> <span className="text-gray-700 dark:text-gray-200">Copy text</span>
                      </button>
                    )}
                    <button onClick={() => { setSelectedMessageId(contextMenu.message._id); setShowReactionPicker(true); closeContextMenu(); }} className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 text-sm transition-colors">
                      <FiSmile className="text-gray-400" /> <span className="text-gray-700 dark:text-gray-200">Add reaction</span>
                    </button>
                    <div className="h-px bg-gray-100 dark:bg-gray-700 my-1" />
                    <button onClick={() => { toast('Reply feature coming soon', { icon: '💬' }); closeContextMenu(); }} className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 text-sm transition-colors">
                      <FiArrowLeft className="text-gray-400" /> <span className="text-gray-700 dark:text-gray-200">Reply</span>
                    </button>
                    <button onClick={() => { toast('Forward feature coming soon', { icon: '📤' }); closeContextMenu(); }} className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 text-sm transition-colors">
                      <FiSend className="text-gray-400" /> <span className="text-gray-700 dark:text-gray-200">Forward</span>
                    </button>
                    <div className="h-px bg-gray-100 dark:bg-gray-700 my-1" />
                    <button onClick={() => { toast('Delete feature coming soon', { icon: '🗑️' }); closeContextMenu(); }} className="w-full text-left px-4 py-2.5 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 text-sm transition-colors">
                      <FiTrash2 className="text-red-400" /> <span className="text-red-500">Delete</span>
                    </button>
                  </div>
                )}

                {/* Input Area */}
                <div className="px-3 sm:px-4 py-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-t border-gray-200/50 dark:border-gray-700/50">
                  {showVoiceRecorder ? (
                    <VoiceRecorder onSendVoice={handleVoiceUpload} onCancel={() => setShowVoiceRecorder(false)} />
                  ) : (
                    <div className="flex flex-wrap sm:flex-nowrap items-end gap-2">
                      <div className="order-2 sm:order-none flex w-full sm:w-auto justify-center sm:justify-start gap-1 shrink-0">
                        <button onClick={() => fileInputRef.current?.click()} className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-200 hover:scale-110 group" title="Attach File">
                          <FiPaperclip className="text-gray-500 dark:text-gray-400 group-hover:text-emerald-500 transition-colors" />
                        </button>
                        <button onClick={() => cameraInputRef.current?.click()} className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-200 hover:scale-110 group" title="Upload Image">
                          <FiImage className="text-gray-500 dark:text-gray-400 group-hover:text-blue-500 transition-colors" />
                        </button>
                        <button onClick={() => setShowVoiceRecorder(true)} className="p-2.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-200 hover:scale-110 group" title="Voice message">
                          <FiMic className="text-gray-500 dark:text-gray-400 group-hover:text-red-500 transition-colors" />
                        </button>
                      </div>

                      <input type="file" ref={fileInputRef} className="hidden" onChange={e => handleFileUpload(e.target.files[0])} />
                      <input type="file" ref={cameraInputRef} className="hidden" accept="image/*" onChange={e => handleFileUpload(e.target.files[0])} />

                      {/* Text Input - FIXED WHITESPACE */}
                      <div className="order-1 sm:order-none flex-1 min-w-[180px] relative input-glow rounded-2xl transition-all duration-300">
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
                          className="w-full resize-none rounded-2xl border border-gray-200 dark:border-gray-600 bg-gray-50/80 dark:bg-gray-700/80 px-4 py-3 pr-12 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-emerald-500/50 focus:bg-white dark:focus:bg-gray-700 transition-all duration-300 text-sm leading-relaxed"
                          style={{ 
                            maxHeight: '120px',
                            minHeight: '44px',
                            whiteSpace: 'pre-wrap',
                            overflowWrap: 'break-word',
                            wordBreak: 'break-word',
                          }}
                        />
                        <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="absolute right-3 bottom-3 p-1 text-gray-400 hover:text-emerald-500 transition-all hover:scale-110">
                          <FiSmile className="text-lg" />
                        </button>
                      </div>

                      <button
                        onClick={handleSend}
                        disabled={!newMessage.trim() || uploading}
                        className={`order-1 sm:order-none p-3 rounded-xl transition-all duration-300 transform shrink-0 ${newMessage.trim() && !uploading ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:scale-105 active:scale-95' : 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'}`}
                      >
                        <FiSend className={`text-lg ${newMessage.trim() ? 'rotate-0' : '-rotate-45'} transition-transform duration-300`} />
                      </button>
                    </div>
                  )}

                  {/* Emoji Picker */}
                  {showEmojiPicker && (
                    <div className="absolute bottom-20 right-4 z-50 animate-fade-in-up">
                      <div className="shadow-2xl rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
                        <EmojiPicker onEmojiClick={emojiData => { setNewMessage(prev => prev + emojiData.emoji); setShowEmojiPicker(false); adjustTextareaHeight(); inputRef.current?.focus(); }} theme="auto" />
                      </div>
                    </div>
                  )}

                  {/* Upload Progress */}
                  {uploading && (
                    <div className="mt-2 flex items-center gap-3 px-2">
                      <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full animate-shimmer" style={{ width: '60%' }} />
                      </div>
                      <span className="text-xs text-gray-500">Uploading...</span>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* Empty State */
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400 px-8">
                <div className="relative mb-8">
                  <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-emerald-400/20 via-teal-500/20 to-blue-500/20 animate-morph flex items-center justify-center">
                    <FiMessageSquare className="text-5xl text-emerald-500/50" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl flex items-center justify-center shadow-lg animate-float-3d">
                    <FiZap className="text-white text-lg" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2 text-gradient">
                  FikrMassageApp
                </h3>
                <p className="text-center text-gray-500 dark:text-gray-400 max-w-md mb-8">
                  Select a conversation from the sidebar or start a new chat to begin messaging
                </p>
                <button
                  onClick={() => setShowUserSearch(true)}
                  className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-2xl shadow-xl shadow-emerald-500/25 transition-all duration-300 hover:scale-105 hover:shadow-2xl flex items-center gap-3 font-medium"
                >
                  <FiPlus className="text-lg" />
                  Start New Conversation
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Global User Search Modal */}
      {showUserSearch && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-3xl w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl border border-gray-100 dark:border-gray-700 animate-fade-in-scale" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center shadow-lg">
                  <FiUserPlus className="text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">New Chat</h3>
                  <p className="text-xs text-gray-500">Find someone to message</p>
                </div>
              </div>
              <button onClick={() => setShowUserSearch(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all hover:scale-105">
                <FiX className="text-gray-500" />
              </button>
            </div>

            {/* Search Input */}
            <div className="p-5">
              <div className="relative">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 border border-gray-200 dark:border-gray-600 rounded-2xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-transparent transition-all text-sm"
                />
              </div>
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto px-5 pb-5 scrollbar-thin">
              {searching ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <div className="w-10 h-10 rounded-full border-4 border-emerald-100 dark:border-emerald-900 border-t-emerald-500 animate-spin" />
                  <p className="text-sm text-gray-500 animate-pulse">Searching users...</p>
                </div>
              ) : searchResults.length === 0 && searchQuery ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <FiSearch className="text-4xl mb-3 opacity-50" />
                  <p className="text-sm">No users found</p>
                </div>
              ) : searchResults.length === 0 && !searchQuery ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <FiMessageSquare className="text-4xl mb-3 opacity-50" />
                  <p className="text-sm text-center">Type a name or email to find users</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {searchResults.map((u, idx) => (
                    <div
                      key={u._id}
                      onClick={() => startConversation(u)}
                      className="flex items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-2xl cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-md group"
                      style={{ animationDelay: `${idx * 0.05}s` }}
                    >
                      <Avatar user={u} size="w-12 h-12" />
                      <div className="ml-3 flex-1">
                        <p className="font-semibold text-gray-900 dark:text-white text-sm">{u.name}</p>
                        <p className="text-xs text-gray-500">{u.email}</p>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                        <FiSend className="text-emerald-500 text-sm" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Messages;
