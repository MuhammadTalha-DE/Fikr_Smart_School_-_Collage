import { useState, useRef, useEffect } from 'react';
import { FiSend, FiMic, FiMicOff, FiImage, FiSmile, FiPaperclip } from 'react-icons/fi';
import { motion } from 'framer-motion';
import EmojiPicker from 'emoji-picker-react';
import { useVoiceInput } from '../../hooks/useVoiceInput';
import DropZone from './DropZone';

const ChatInput = ({ onSend, onSendImage, loading }) => {
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showDropZone, setShowDropZone] = useState(false);
  const textareaRef = useRef(null);   // ← ADD THIS

  // ── Voice input hook ───────────────────────
  const { start, stop, supported } = useVoiceInput((transcript) => {
    setText(transcript);
  });

  // ── Auto‑resize the textarea ───────────────
  const handleChange = (e) => {
    setText(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  };

  // ── Keyboard send ──────────────────────────
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── Send text message ──────────────────────
  const handleSend = () => {
    if (text.trim() && !loading) {
      onSend(text);
      setText('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  // ── Voice toggle ───────────────────────────
  const toggleVoice = () => {
    if (isListening) {
      stop();
    } else {
      start();
    }
    setIsListening(!isListening);
  };

  // ── Image file handler ─────────────────────
  const handleImageSelected = (file) => {
    if (file && onSendImage) {
      const caption = prompt('Add a caption (optional):');
      onSendImage(file, caption || '');
      setShowDropZone(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Drop zone for images */}
      {showDropZone && (
        <DropZone onFile={handleImageSelected} disabled={loading} />
      )}

      <div className="flex items-end gap-2">
        {/* Image upload button */}
        <button
          onClick={() => setShowDropZone(!showDropZone)}
          className={`p-2 rounded-full transition ${
            showDropZone ? 'bg-indigo-500 text-white' : 'text-white/60 hover:text-white'
          }`}
          title="Upload image"
        >
          <FiImage className="w-5 h-5" />
        </button>

        {/* Emoji button */}
        <div className="relative">
          <button
            onClick={() => setShowEmoji(!showEmoji)}
            className={`p-2 rounded-full transition ${
              showEmoji ? 'bg-indigo-500 text-white' : 'text-white/60 hover:text-white'
            }`}
            title="Add emoji"
          >
            <FiSmile className="w-5 h-5" />
          </button>
          {showEmoji && (
            <div className="absolute bottom-12 left-0 z-50">
              <EmojiPicker
                onEmojiClick={(emoji) => {
                  setText(prev => prev + emoji.emoji);
                  setShowEmoji(false);
                }}
              />
            </div>
          )}
        </div>

        {/* Textarea */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything..."
            disabled={loading}
            className="w-full bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none overflow-hidden"
            style={{
              WebkitTextFillColor: 'white',
              caretColor: 'white',
              backgroundColor: 'rgba(255,255,255,0.05)',
              minHeight: '44px',
              maxHeight: '120px',
            }}
          />
        </div>

        {/* Voice button */}
        {supported && (
          <button
            onClick={toggleVoice}
            className={`p-2 rounded-full transition ${
              isListening ? 'bg-red-500 text-white animate-pulse' : 'text-white/60 hover:text-white'
            }`}
            title={isListening ? 'Stop listening' : 'Voice input'}
          >
            {isListening ? <FiMicOff className="w-5 h-5" /> : <FiMic className="w-5 h-5" />}
          </button>
        )}

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={!text.trim() || loading}
          className="p-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full disabled:opacity-50 transition-all shadow-lg"
          title="Send message"
        >
          <FiSend className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default ChatInput;