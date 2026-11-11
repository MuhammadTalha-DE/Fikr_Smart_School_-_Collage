import { motion } from 'framer-motion';
import { FiUser, FiCpu, FiThumbsUp, FiThumbsDown } from 'react-icons/fi';
import ReactMarkdown from 'react-markdown';

const ChatMessage = ({ message, conversationId, messageIndex, onFeedback }) => {
  const handleFeedback = (value) => {
    if (onFeedback) onFeedback(value);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
    >
      <div className="flex items-start gap-3 max-w-[85%]">
        {message.role === 'assistant' && (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center shrink-0 mt-1">
            <FiCpu className="text-white text-sm" />
          </div>
        )}

        <div
          className={`message-bubble px-4 py-3 rounded-2xl shadow-lg ${
            message.role === 'user'
              ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
              : 'bg-white/10 backdrop-blur-lg text-white'
          }`}
        >
          <div className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.role === 'assistant' ? (
              <ReactMarkdown>{message.content}</ReactMarkdown>
            ) : (
              message.content
            )}
          </div>
        </div>

        {message.role === 'user' && (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center shrink-0 mt-1">
            <FiUser className="text-white text-sm" />
          </div>
        )}
      </div>

      {/* Feedback buttons – only for persisted messages (with _id) */}
      // inside ChatMessage component, replace the button section with:
{message.role === 'assistant' && message._id && (
  <div className="flex gap-2 mt-1 ml-11">
    <button
      onClick={() => onFeedback(conversationId, message._id, 'up')}
      className={`p-1 rounded-full ${message.feedback === 'up' ? 'text-green-400' : 'text-white/30 hover:text-white'}`}
      title="Helpful"
    >
      <FiThumbsUp className="w-3.5 h-3.5" />
    </button>
    <button
      onClick={() => onFeedback(conversationId, message._id, 'down')}
      className={`p-1 rounded-full ${message.feedback === 'down' ? 'text-red-400' : 'text-white/30 hover:text-white'}`}
      title="Not helpful"
    >
      <FiThumbsDown className="w-3.5 h-3.5" />
    </button>
  </div>
)}
    </motion.div>
  );
};

export default ChatMessage;