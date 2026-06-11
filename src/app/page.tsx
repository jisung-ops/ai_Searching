"use client";

import React, { useState, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { AnimatePresence, motion } from "framer-motion";
import SearchBox from "@/components/search-box";
import ChatInterface from "@/components/chat-interface";
import HistorySidebar from "@/components/history-sidebar";
import { HelpCircle, Menu } from "lucide-react";

interface ChatSession {
  id: string;
  title: string;
  messages: any[];
  updatedAt: string;
  focusMode?: string;
}

export default function Home() {
  const [isSearched, setIsSearched] = useState(false);
  const [input, setInput] = useState("");
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [history, setHistory] = useState<ChatSession[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [focusMode, setFocusMode] = useState<string>("all");
  
  const {
    messages,
    status,
    sendMessage,
    setMessages,
  } = useChat();

  const isLoading = status === "submitted" || status === "streaming";

  // Load history from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("ai-search-history");
    if (stored) {
      try {
        setHistory(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to load search history:", e);
      }
    }
  }, []);

  // Auto-sync current session to localStorage
  useEffect(() => {
    if (!currentSessionId || messages.length === 0) return;

    setHistory((prev) => {
      const existingIdx = prev.findIndex((s) => s.id === currentSessionId);
      
      const firstUserMsg = messages.find((m) => m.role === "user");
      let title = "새 검색";
      if (firstUserMsg) {
        title = firstUserMsg.parts
          ?.filter((p: any) => p.type === "text")
          .map((p: any) => p.text)
          .join("") || "새 검색";
      }

      const updatedSession = {
        id: currentSessionId,
        title: title.slice(0, 40) || "새 검색",
        messages,
        updatedAt: new Date().toISOString(),
        focusMode,
      };

      let newHistory;
      if (existingIdx > -1) {
        newHistory = [...prev];
        newHistory[existingIdx] = updatedSession;
      } else {
        newHistory = [updatedSession, ...prev];
      }

      localStorage.setItem("ai-search-history", JSON.stringify(newHistory));
      return newHistory;
    });
  }, [messages, currentSessionId]);

  const handleSearchSubmit = (query: string) => {
    const newSessionId = Date.now().toString();
    setCurrentSessionId(newSessionId);
    setIsSearched(true);
    sendMessage({ text: query }, { body: { focusMode } });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const handleChatSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    if (!currentSessionId) {
      setCurrentSessionId(Date.now().toString());
    }

    sendMessage({ text: input.trim() }, { body: { focusMode } });
    setInput("");
  };

  const handleNewSearch = () => {
    setCurrentSessionId(null);
    setMessages([]);
    setIsSearched(false);
    setInput("");
    setIsSidebarOpen(false);
    setFocusMode("all");
  };

  const handleSelectSession = (id: string) => {
    const session = history.find((s) => s.id === id);
    if (session) {
      setCurrentSessionId(session.id);
      setMessages(session.messages);
      setIsSearched(true);
      setIsSidebarOpen(false);
      if (session.focusMode) {
        setFocusMode(session.focusMode);
      } else {
        setFocusMode("all");
      }
    }
  };

  const handleDeleteSession = (id: string) => {
    setHistory((prev) => {
      const newHistory = prev.filter((s) => s.id !== id);
      localStorage.setItem("ai-search-history", JSON.stringify(newHistory));
      return newHistory;
    });

    if (currentSessionId === id) {
      handleNewSearch();
    }
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground overflow-hidden">
      {/* Search History Sidebar */}
      <HistorySidebar
        history={history}
        currentSessionId={currentSessionId}
        onSelectSession={handleSelectSession}
        onDeleteSession={handleDeleteSession}
        onNewSearch={handleNewSearch}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      {/* Main Container */}
      <div className="relative flex-1 flex flex-col min-h-screen overflow-hidden selection:bg-blue-500/30">
        {/* Dynamic Background Premium Glow Blobs */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-500/10 blur-[150px] pointer-events-none" />

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col z-10 w-full">
          {/* Header Mobile Toggle Menu (Only visible on Mobile when not searched yet) */}
          {!isSearched && (
            <header className="flex items-center justify-between p-4 border-b border-border/40 bg-card/10 backdrop-blur-sm md:hidden w-full absolute top-0 left-0 right-0 z-20">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition"
                aria-label="메뉴 열기"
              >
                <Menu className="w-4 h-4" />
              </button>
              <span className="text-sm font-bold bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-300">
                AI Searching
              </span>
              <div className="w-7" /> {/* spacer for balance */}
            </header>
          )}

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
                <SearchBox
                  onSearch={handleSearchSubmit}
                  isLoading={isLoading}
                  focusMode={focusMode}
                  setFocusMode={setFocusMode}
                />
                
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
                  onReset={handleNewSearch}
                  onOpenSidebar={() => setIsSidebarOpen(true)}
                  focusMode={focusMode}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
