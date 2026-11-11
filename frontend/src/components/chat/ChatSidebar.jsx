import {
  FiPlus,
  FiMessageCircle,
  FiTrash2,
  FiChevronLeft
} from 'react-icons/fi';

import { motion } from 'framer-motion';

const ChatSidebar = ({
  conversations,
  activeId,
  onSelect,
  onDelete,
  onNew,
  isOpen,
  onToggle,
  loading
}) => (

  <motion.div

    initial={{
      width: 0,
      opacity: 0
    }}

    animate={{
      width: isOpen ? 260 : 0,
      opacity: isOpen ? 1 : 0
    }}

    transition={{
      duration: 0.25
    }}

    className="glass-sidebar flex flex-col h-full overflow-hidden shrink-0"
  >

    {/* ========================= */}
    {/* HEADER */}
    {/* ========================= */}

    <div className="p-4 flex items-center justify-between border-b border-white/10">

      {/* NEW CHAT BUTTON */}

      <button

        onClick={onNew}

        className="p-2 bg-indigo-500 hover:bg-indigo-600 rounded-lg text-white text-xs flex items-center gap-1 font-medium transition-all"
      >

        <FiPlus className="w-4 h-4" />

        New Chat

      </button>

      {/* TOGGLE BUTTON */}

      <button

        onClick={onToggle}

        className="p-1 text-white/60 hover:text-white transition"
      >

        <FiChevronLeft className="w-5 h-5" />

      </button>

    </div>

    {/* ========================= */}
    {/* CHAT LIST */}
    {/* ========================= */}

    <div className="flex-1 overflow-y-auto chat-scroll p-2 space-y-1">

      {/* ========================= */}
      {/* LOADING SKELETONS */}
      {/* ========================= */}

      {loading ? (

        <div className="space-y-2 p-1">

          {[1, 2, 3, 4].map((i) => (

            <div

              key={i}

              className="h-10 bg-white/10 rounded-lg animate-pulse"
            />

          ))}

        </div>

      ) : conversations.length > 0 ? (

        conversations.map((conv) => (

          <div

            key={conv.id}

            onClick={() =>
              onSelect(conv.id)
            }

            className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all group ${
              conv.id === activeId

                ? 'bg-white/10 text-white'

                : 'text-white/60 hover:bg-white/5 hover:text-white'
            }`}
          >

            {/* LEFT SIDE */}

            <div className="flex items-center gap-2 truncate">

              <FiMessageCircle className="w-4 h-4 shrink-0" />

              <span className="text-sm truncate">

                {conv.title}

              </span>

            </div>

            {/* DELETE BUTTON */}

            <button

              onClick={(e) => {

                e.stopPropagation();

                onDelete(conv.id);
              }}

              className="opacity-0 group-hover:opacity-100 p-1 text-white/40 hover:text-red-400 transition"
            >

              <FiTrash2 className="w-3.5 h-3.5" />

            </button>

          </div>

        ))

      ) : (

        /* ========================= */
        /* EMPTY STATE */
        /* ========================= */

        <div className="flex flex-col items-center justify-center h-full text-center text-white/40 px-4">

          <FiMessageCircle className="w-10 h-10 mb-3 opacity-40" />

          <p className="text-sm">

            No conversations yet

          </p>

          <p className="text-xs mt-1">

            Start a new AI chat

          </p>

        </div>

      )}

    </div>

  </motion.div>
);

export default ChatSidebar;