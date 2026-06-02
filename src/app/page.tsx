"use client";

import React, { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { AnimatePresence, motion } from "framer-motion";
import SearchBox from "@/components/search-box";
import ChatInterface from "@/components/chat-interface";
import { HelpCircle } from "lucide-react";

export default function Home() {
  const [isSearched, setIsSearched] = useState(false);
  const [input, setInput] = useState("");
  
  const {
    messages,
    status,
    sendMessage,
    setMessages,
  } = useChat();

  const isLoading = status === "submitted" || status === "streaming";

  const handleSearchSubmit = (query: string) => {
    setIsSearched(true);
    // Send the message programmatically to trigger the stream
    sendMessage({ text: query });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const handleChatSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    sendMessage({ text: input.trim() });
    setInput("");
  };

  const handleReset = () => {
    setIsSearched(false);
    setMessages([]);
    setInput("");
  };

  return (
    <div className="relative flex flex-col min-h-screen bg-background overflow-hidden selection:bg-blue-500/30">
      {/* Dynamic Background Premium Glow Blobs */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-500/10 blur-[150px] pointer-events-none" />

      {/* Main Container */}
      <main className="flex-1 flex flex-col z-10 w-full">
        <AnimatePresence mode="wait">
          {!isSearched ? (
            /* Centered Search View (Initial State) */
            <motion.div
              key="search-mode"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35, ease: "easeInOut" }}
              className="flex-1 flex flex-col items-center justify-center py-20"
            >
              <SearchBox onSearch={handleSearchSubmit} isLoading={isLoading} />
              
              {/* Footer Info inside Initial Search */}
              <div className="mt-16 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition cursor-pointer">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>AI Searching에 대해 알아보기</span>
              </div>
            </motion.div>
          ) : (
            /* Active Chat Interface Layout */
            <motion.div
              key="chat-mode"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="flex-1 flex flex-col"
            >
              <ChatInterface
                messages={messages}
                input={input}
                handleInputChange={handleInputChange}
                handleSubmit={handleChatSubmit}
                isLoading={isLoading}
                onReset={handleReset}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
