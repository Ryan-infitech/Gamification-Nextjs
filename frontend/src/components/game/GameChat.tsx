import React, { useState, useRef, useEffect } from "react";
import { ChatMessage } from "@/types/phaser";

interface GameChatProps {
  messages: ChatMessage[];
  sendMessage: (
    content: string,
    type: "global" | "local" | "private",
    recipientId?: string
  ) => void;
  onClose: () => void;
  playerName: string;
}

const GameChat: React.FC<GameChatProps> = ({
  messages,
  sendMessage,
  onClose,
  playerName,
}) => {
  const [message, setMessage] = useState("");
  const [chatType, setChatType] = useState<"global" | "local" | "private">(
    "local"
  );
  const [recipient, setRecipient] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      sendMessage(
        message,
        chatType,
        chatType === "private" ? recipient : undefined
      );
      setMessage("");
    }
  };

  return (
    <div className="fixed bottom-16 left-4 w-80 h-64 bg-[var(--dark-surface)] bg-opacity-90 border border-[var(--neon-blue)] rounded p-2 z-40 pointer-events-auto">
      {/* Chat header */}
      <div className="flex justify-between items-center mb-2 border-b border-[var(--light-surface)] pb-1">
        <div className="font-mono text-sm text-[var(--neon-blue)]">
          NETWORK CHAT
        </div>
        <button className="text-gray-400 hover:text-white" onClick={onClose}>
          X
        </button>
      </div>

      {/* Chat messages */}
      <div className="h-40 overflow-y-auto mb-2 text-xs scrollbar-thin scrollbar-thumb-[var(--neon-blue)] scrollbar-track-[var(--dark-bg)]">
        {messages.length === 0 ? (
          <div className="text-gray-500 italic">No messages yet.</div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`mb-1 ${
                msg.type === "system"
                  ? "text-yellow-400"
                  : msg.playerId === "player"
                  ? "text-[var(--neon-blue)]"
                  : "text-[var(--neon-pink)]"
              }`}
            >
              <span className="font-bold">{msg.username}: </span>
              <span>{msg.content}</span>
            </div>
          ))
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Chat input */}
      <form onSubmit={handleSendMessage} className="flex items-center">
        <select
          className="bg-[var(--dark-bg)] border border-[var(--light-surface)] rounded p-1 text-xs mr-1"
          value={chatType}
          onChange={(e) => setChatType(e.target.value as any)}
        >
          <option value="local">Local</option>
          <option value="global">Global</option>
          <option value="private">Private</option>
        </select>

        {chatType === "private" && (
          <input
            type="text"
            placeholder="Recipient"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            className="bg-[var(--dark-bg)] border border-[var(--light-surface)] rounded p-1 text-xs mr-1 w-16"
          />
        )}

        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-[var(--dark-bg)] border border-[var(--light-surface)] rounded p-1 text-xs"
        />
        <button
          type="submit"
          className="ml-1 px-2 py-1 bg-[var(--neon-blue)] text-black rounded text-xs"
          disabled={!message.trim()}
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default GameChat;
