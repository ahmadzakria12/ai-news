"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Send, Bot, User, Loader2, Sparkles } from "lucide-react";
import { runAgent, AgentResponse } from "@/lib/api";
import { useToast } from "@/components/Toast";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatBotProps {
  agentType: string;
  agentName: string;
  agentDescription?: string;
}

export function ChatBot({ agentType, agentName, agentDescription }: ChatBotProps) {
  const { showToast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response: AgentResponse = await runAgent(
        agentType,
        userMessage.content,
        sessionId || undefined
      );

      if (response.session_id) {
        setSessionId(response.session_id);
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.result,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      const detail =
        error instanceof Error ? error.message : "Please try again.";
      showToast(detail, "error");
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Sorry, something went wrong: ${detail}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestions = [
    "Latest AI news",
    "Trending topics",
    "Breaking news",
    "Get insights"
  ];

  return (
    <div className="flex flex-col h-full glass-strong border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
      {/* Chat Header */}
      <div className="glass-strong border-b border-white/10 p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#6366f1]/5 via-[#8b5cf6]/5 to-[#ec4899]/5" />
        <div className="relative flex items-center gap-4">
          <motion.div
            className="w-14 h-14 rounded-xl gradient-primary flex items-center justify-center shadow-lg glow-primary"
            whileHover={{ scale: 1.05, rotate: 5 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Bot className="w-8 h-8 text-white" />
          </motion.div>
          <div className="flex-1">
            <h3 className="text-white font-bold text-xl mb-1">{agentName}</h3>
            {agentDescription && (
              <p className="text-white/60 text-sm flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[#6366f1]" />
                {agentDescription}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-white/60 font-medium">Active</span>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#0f0f1e]/50">
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center h-full text-center px-4"
          >
            <motion.div
              animate={{ 
                scale: [1, 1.05, 1],
                rotate: [0, 2, -2, 0]
              }}
              transition={{ 
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#6366f1]/10 to-[#8b5cf6]/10 border border-white/10 flex items-center justify-center mb-6"
            >
              <Bot className="w-12 h-12 text-[#6366f1]" />
            </motion.div>
            <h3 className="text-white text-2xl font-bold mb-3">Start a Conversation</h3>
            <p className="text-white/60 text-base mb-6 max-w-md leading-relaxed">
              Ask {agentName} anything about AI news, trends, or insights
            </p>
            <div className="flex flex-wrap gap-2 justify-center mt-4">
              {suggestions.map((suggestion, idx) => (
                <motion.button
                  key={idx}
                  onClick={() => setInput(suggestion)}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2.5 rounded-xl glass-premium border border-white/10 hover:border-[#6366f1]/30 text-white/80 hover:text-white text-sm font-medium transition-all"
                >
                  {suggestion}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        <AnimatePresence>
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ 
                duration: 0.3,
                delay: index === messages.length - 1 ? 0.1 : 0
              }}
              className={`flex gap-3 ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {message.role === "assistant" && (
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6366f1]/20 to-[#8b5cf6]/20 border border-white/10 flex items-center justify-center flex-shrink-0"
                >
                  <Bot className="w-5 h-5 text-[#6366f1]" />
                </motion.div>
              )}
              
              <motion.div
                whileHover={{ scale: 1.01 }}
                className={`max-w-[80%] rounded-2xl p-4 ${
                  message.role === "user"
                    ? "gradient-primary text-white shadow-lg"
                    : "glass-strong text-white/90 border border-white/10"
                }`}
              >
                <p className="whitespace-pre-wrap break-words leading-relaxed text-[15px]">
                  {message.content}
                </p>
                <p className="text-xs mt-2.5 opacity-60 flex items-center gap-1.5">
                  {message.timestamp.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </motion.div>
              
              {message.role === "user" && (
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ec4899]/20 to-[#8b5cf6]/20 border border-white/10 flex items-center justify-center flex-shrink-0"
                >
                  <User className="w-5 h-5 text-[#ec4899]" />
                </motion.div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3 justify-start"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6366f1]/20 to-[#8b5cf6]/20 border border-white/10 flex items-center justify-center">
              <Bot className="w-5 h-5 text-[#6366f1]" />
            </div>
            <div className="glass-strong border border-white/10 rounded-2xl p-4">
              <div className="flex gap-2">
                {[0, 0.2, 0.4].map((delay, i) => (
                  <motion.div
                    key={i}
                    className="w-2.5 h-2.5 rounded-full bg-[#6366f1]"
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-white/10 p-6 glass-strong">
        <div className="flex gap-3">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 bg-[#0f0f1e]/50 border border-white/10 rounded-xl px-5 py-3.5 text-white placeholder-white/40 focus:outline-none focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/20 transition-all text-sm"
            disabled={isLoading}
          />
          <motion.button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="btn-premium text-white px-6 py-3.5 rounded-xl transition-all flex items-center gap-2 shadow-lg glow-primary font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span className="hidden sm:inline">Send</span>
              </>
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
