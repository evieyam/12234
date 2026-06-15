import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Newspaper, 
  Search, 
  RefreshCw, 
  Clock, 
  User, 
  BookMarked, 
  Bookmark, 
  BrainCircuit, 
  MessageSquare, 
  Send, 
  Sparkles, 
  AlertCircle, 
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Globe,
  Loader2,
  Calendar,
  X,
  Plus
} from "lucide-react";
import { Article, AISummary, DailyBrief, Message } from "./types";

export default function App() {
  // Feed Articles and metadata
  const [feedTitle, setFeedTitle] = useState("SCMP World Feed");
  const [articles, setArticles] = useState<Article[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [feedError, setFeedError] = useState<string | null>(null);

  // Filter and search states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [showBookmarkedOnly, setShowBookmarkedOnly] = useState(false);
  const [bookmarks, setBookmarks] = useState<string[]>([]);

  // Selected article & workspace state
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  
  // Cache of generated summaries to avoid redundant API hits
  const [summaryCache, setSummaryCache] = useState<Record<string, AISummary>>({});
  const [activeSummary, setActiveSummary] = useState<AISummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  // Daily Briefing state
  const [dailyBrief, setDailyBrief] = useState<DailyBrief | null>(null);
  const [loadingBrief, setLoadingBrief] = useState(false);
  const [briefError, setBriefError] = useState<string | null>(null);
  const [showBriefPanel, setShowBriefPanel] = useState(true); // default view in side panel- right panel

  // Conversation/Chat state
  const [chatMessages, setChatMessages] = useState<Record<string, Message[]>>({});
  const [currentChatText, setCurrentChatText] = useState("");
  const [loadingChat, setLoadingChat] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Refresh trigger (counter)
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Toast notifications for user actions
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load Bookmarks from Local Storage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("scmp_pulse_bookmarks");
      if (saved) {
        setBookmarks(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load bookmarks:", e);
    }
  }, []);

  // Sync Bookmarks to Local Storage
  const toggleBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    let updated: string[];
    if (bookmarks.includes(id)) {
      updated = bookmarks.filter((bId) => bId !== id);
      showToast("Removed bookmark");
    } else {
      updated = [...bookmarks, id];
      showToast("Added to Bookmarked reading list");
    }
    setBookmarks(updated);
    localStorage.setItem("scmp_pulse_bookmarks", JSON.stringify(updated));
  };

  // Toast Helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3000);
  };

  // Fetch Feed on refreshTrigger tick
  useEffect(() => {
    const fetchFeed = async () => {
      setLoadingFeed(true);
      setFeedError(null);
      try {
        const res = await fetch("/api/feed");
        if (!res.ok) {
          throw new Error(`Server returned status ${res.status}`);
        }
        const data = await res.json();
        setFeedTitle(data.title || "SCMP World Feed");
        setArticles(data.items || []);
        
        // If an article is currently selected, refresh its data source reference
        if (selectedArticle) {
          const matched = (data.items as Article[]).find((a) => a.id === selectedArticle.id);
          if (matched) setSelectedArticle(matched);
        }
      } catch (err: any) {
        console.error("Fetch feed err:", err);
        setFeedError(err.message || "Could not retrieve RSS feed. Please verify the URL is correct and server is running.");
      } finally {
        setLoadingFeed(false);
      }
    };

    fetchFeed();
  }, [refreshTrigger]);

  // Handle active summary generation when article changes
  useEffect(() => {
    if (!selectedArticle) {
       setActiveSummary(null);
       return;
    }

    const fetchSummary = async () => {
      const artId = selectedArticle.id;
      // First, check cache
      if (summaryCache[artId]) {
        setActiveSummary(summaryCache[artId]);
        return;
      }

      setLoadingSummary(true);
      setSummaryError(null);
      setActiveSummary(null);

      try {
        const res = await fetch("/api/summary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: selectedArticle.title,
            description: selectedArticle.description,
            link: selectedArticle.link
          }),
        });

        // 401 or similar key missing errors
        if (res.status === 401 || res.status === 403) {
          const errData = await res.json();
          throw new Error(errData.details || "API key missing. Enable server-side secrets in AI Studio UI.");
        }

        if (!res.ok) {
          throw new Error(`Failed to generate: server returned ${res.status}`);
        }

        const data: AISummary = await res.json();
        
        // Cache outcome
        setSummaryCache(prev => ({
          ...prev,
          [artId]: data
        }));
        setActiveSummary(data);
      } catch (err: any) {
        console.error("Summary error:", err);
        setSummaryError(err.message || "Failed to generate summary outline.");
      } finally {
        setLoadingSummary(false);
      }
    };

    fetchSummary();
  }, [selectedArticle]);

  // Auto-scroll chat history block
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, loadingChat]);

  // Request Macro Daily Briefing
  const generateDailyBriefing = async () => {
    if (articles.length === 0) return;
    setLoadingBrief(true);
    setBriefError(null);
    setShowBriefPanel(true);
    setSelectedArticle(null); // Clear selected article to focus on Macro Briefing

    try {
      const res = await fetch("/api/briefing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articles: articles }),
      });

      if (res.status === 401) {
        const errData = await res.json();
        throw new Error(errData.details || "No AI API key found. Add GEMINI_API_KEY to continue.");
      }

      if (!res.ok) {
        throw new Error(`Server returned error ${res.status}`);
      }

      const data: DailyBrief = await res.json();
      setDailyBrief(data);
      showToast("Fresh Geopolitical Briefing synthesized!");
    } catch (err: any) {
      console.error(err);
      setBriefError(err.message || "Could not synthesize daily pulse analytics.");
    } finally {
      setLoadingBrief(false);
    }
  };

  // Handle Q&A Chat submit
  const sendChatMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentChatText.trim()) return;
    if (!selectedArticle) return;

    const artId = selectedArticle.id;
    const currentHistory = chatMessages[artId] || [];

    const userMessage: Message = {
      id: Math.random().toString(),
      role: "user",
      content: currentChatText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    const updatedHistory = [...currentHistory, userMessage];
    setChatMessages(prev => ({
      ...prev,
      [artId]: updatedHistory
    }));
    
    const queryText = currentChatText;
    setCurrentChatText("");
    setLoadingChat(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedHistory,
          article: selectedArticle
        })
      });

      if (res.status === 401) {
        throw new Error("Missing GEMINI_API_KEY. Configure it to unlock AI Dialogue features.");
      }

      if (!res.ok) {
        throw new Error("Dialogue pipeline timed out.");
      }

      const data = await res.json();
      
      const assistantMessage: Message = {
        id: Math.random().toString(),
        role: "assistant",
        content: data.content,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };

      setChatMessages(prev => ({
        ...prev,
        [artId]: [...updatedHistory, assistantMessage]
      }));
    } catch (error: any) {
      console.error("Chat error:", error);
      const errorMessage: Message = {
        id: Math.random().toString(),
        role: "assistant",
        content: `Error: ${error.message || "An issue occurred communicating with the AI desk. Please try again."}`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };
      setChatMessages(prev => ({
        ...prev,
        [artId]: [...updatedHistory, errorMessage]
      }));
    } finally {
      setLoadingChat(false);
    }
  };

  // Category list compiler
  const compiledCategories = ["ALL", ...Array.from(new Set(articles.flatMap(item => item.categories || [])))].slice(0, 8);

  // Filtered stories logic
  const filteredArticles = articles.filter((art) => {
    const matchesSearch = 
      art.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      art.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.author.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = 
      selectedCategory === "ALL" || 
      art.categories.includes(selectedCategory);

    const matchesBookmark = !showBookmarkedOnly || bookmarks.includes(art.id);

    return matchesSearch && matchesCategory && matchesBookmark;
  });

  // Relative publish details formatting
  const formatPubDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

      if (diffMinutes < 60) {
        return `${diffMinutes}m ago`;
      } else if (diffHours < 24) {
        return `${diffHours}h ago`;
      } else {
        return date.toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
      }
    } catch (e) {
      return dateStr;
    }
  };

  // Smart helper to select article and trigger view shift
  const handleSelectArticle = (art: Article) => {
    setSelectedArticle(art);
    setShowBriefPanel(false);
  };

  return (
    <div id="scmp_pulse_app_root" className="min-h-screen flex flex-col bg-[#080b11] text-[#f1f5f9]">
      {/* Dynamic Toast System */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-[#e0a924] text-black px-4 py-2.5 rounded-lg shadow-xl font-medium flex items-center gap-2 border border-[#f5b324] text-sm"
          >
            <Sparkles className="h-4 w-4 shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modern High-End Header */}
      <header id="pulse_header" className="border-b border-[#1e293b] bg-[#0c101b] sticky top-0 z-30 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg backdrop-blur-md bg-opacity-95">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-[#d97706] to-[#e0a924] rounded-lg shadow-inner flex items-center justify-center">
            <Newspaper className="h-6 w-6 text-[#080b11]" />
          </div>
          <div>
            <h1 className="font-display font-extrabold text-xl tracking-tight text-white flex items-center gap-2">
              SCMP AI <span className="text-[#e2a826] font-extrabold">PULSE</span>
            </h1>
            <p className="text-xs text-[#94a3b8] font-mono tracking-wider uppercase flex items-center gap-1.5 mt-0.5">
              <span>SOUTH CHINA MORNING POST</span>
              <span className="inline-block w-1 h-1 rounded-full bg-[#e2a826]"></span>
              <span>INTELLIGENT FEED RADAR</span>
            </p>
          </div>
        </div>

        {/* Action controllers section */}
        <div className="flex items-center gap-3 self-end md:self-auto">
          {/* Daily macro Briefing action */}
          <button
            id="daily_brief_btn"
            onClick={generateDailyBriefing}
            disabled={loadingFeed || articles.length === 0}
            className="relative px-4 py-2 bg-[#1e293b] hover:bg-[#2e3e56] disabled:opacity-50 text-[#e2a826] hover:text-[#f3c051] text-xs font-semibold rounded-lg flex items-center gap-2 transition-all duration-200 shadow-md border border-[#334155]/60 group"
          >
            <Sparkles className="h-3.5 w-3.5 text-[#e0a924] group-hover:scale-110 transition-transform" />
            <span>Geo Briefing</span>
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#e2a826] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#e2a826]"></span>
            </span>
          </button>

          {/* Quick Refresh */}
          <button
            id="refresh_feed_btn"
            onClick={() => setRefreshTrigger(prev => prev + 1)}
            disabled={loadingFeed}
            className="p-2 bg-[#1e293b] hover:bg-[#2d3a4f] rounded-lg border border-[#334155]/65 text-[#94a3b8] hover:text-white transition-all disabled:opacity-40"
            title="Refresh Feed Source"
          >
            <RefreshCw className={`h-4 w-4 ${loadingFeed ? "animate-spin text-[#e2a826]" : ""}`} />
          </button>
        </div>
      </header>

      {/* Global Status Marquee or Stats bar */}
      <section id="status_feed_bar" className="bg-[#0b0e14] px-6 py-2 border-b border-[#1e293b] flex items-center justify-between text-xs font-mono text-[#64748b]">
        <div className="flex items-center gap-2 truncate">
          <Globe className="h-3.5 w-3.5 text-[#3b82f6] shrink-0" />
          <span className="text-[#3b82f6] font-semibold truncate animate-pulse">SCMP FEED SOURCE: </span>
          <span className="truncate max-w-[250px] sm:max-w-none text-[#94a3b8]">https://www.scmp.com/rss/2/feed/</span>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <span className="hidden sm:inline">Stories Count: <strong className="text-white">{articles.length}</strong></span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-[#e2a826]" />
            <span>As of: {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
          </span>
        </div>
      </section>

      {/* Error Block if Feed Fails */}
      {feedError && (
        <div className="m-6 p-4 bg-red-950/40 border border-red-800/80 rounded-xl text-red-200 text-sm flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold">Failed to synchronize Feed</h4>
            <p className="text-red-300">{feedError}</p>
            <button 
              onClick={() => setRefreshTrigger(prev => prev + 1)} 
              className="mt-2 text-xs text-white underline hover:no-underline font-medium"
            >
              Try Reconnecting
            </button>
          </div>
        </div>
      )}

      {/* Main Single Screen Layout Container */}
      <section id="main_workspace" className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* Left Side: Filter and Feed Listing Panel (40% wide on desktop) */}
        <div id="feed_listing_panel" className="lg:w-[42%] border-b lg:border-b-0 lg:border-r border-[#1e293b] flex flex-col bg-[#0a0d15] overflow-hidden min-h-[450px] lg:min-h-0">
          
          {/* Search, Filter bar inside Feed list panel */}
          <div id="filters_container" className="p-4 border-b border-[#1a2333]/90 bg-[#0d121c] space-y-3">
            {/* Search inputs */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#475569]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search SCMP titles, stories, authors..."
                className="w-full bg-[#111827] text-white pl-9 pr-8 py-2 text-xs rounded-lg border border-[#1e293b] focus:outline-none focus:border-[#e2a826] transition-all placeholder-[#475569]"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-2.5 text-[#64748b] hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Bookmark filter toggle & Categories scroll slider */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-widest text-[#475569] font-mono">Category Stream</span>
                <button
                  onClick={() => setShowBookmarkedOnly(!showBookmarkedOnly)}
                  className={`flex items-center gap-1 px-2.5 py-1 text-[10px] rounded-md transition-all font-semibold uppercase font-mono ${
                    showBookmarkedOnly 
                      ? "bg-[#e2a826]/12 text-[#e2a826] border border-[#e2a826]/30" 
                      : "bg-[#111827] text-[#64748b] border border-[#1e293b] hover:text-white"
                  }`}
                >
                  <BookMarked className="h-3 w-3" />
                  <span>Bookmarks ({bookmarks.length})</span>
                </button>
              </div>

              {/* Slider list of tags */}
              <div className="flex overflow-x-auto gap-1.5 py-1 no-scrollbar scroll-smooth">
                {compiledCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 text-[11px] rounded-full whitespace-nowrap font-medium transition-all ${
                      selectedCategory === cat
                        ? "bg-[#e2a826] text-black shadow-md font-semibold"
                        : "bg-[#111827] hover:bg-[#1f2937] text-[#94a3b8] hover:text-white border border-[#1e293b]"
                    }`}
                  >
                    {cat === "ALL" ? "All Stories" : cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Feed List Items list Scroller */}
          <div id="articles_list_container" className="flex-1 overflow-y-auto divide-y divide-[#1e293b]/50 p-3 space-y-2">
            {loadingFeed ? (
              <div className="h-48 flex flex-col items-center justify-center gap-3">
                <Loader2 className="h-8 w-8 text-[#e2a826] animate-spin" />
                <p className="text-xs text-[#94a3b8] font-mono">Synchronizing SCMP archives...</p>
              </div>
            ) : filteredArticles.length === 0 ? (
              <div className="py-12 px-6 text-center">
                <p className="text-[#64748b] text-sm font-medium">No SCMP articles meet these filters.</p>
                {searchQuery || selectedCategory !== "ALL" || showBookmarkedOnly ? (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory("ALL");
                      setShowBookmarkedOnly(false);
                    }}
                    className="mt-3 text-xs text-[#e2a826] underline hover:no-underline font-medium"
                  >
                    Reset all applied filters
                  </button>
                ) : null}
              </div>
            ) : (
              filteredArticles.map((art) => {
                const isActive = selectedArticle && selectedArticle.id === art.id;
                const isBookmarked = bookmarks.includes(art.id);

                return (
                  <div
                    key={art.id}
                    onClick={() => handleSelectArticle(art)}
                    className={`group p-3 rounded-xl transition-all duration-200 cursor-pointer flex gap-3 text-left relative overflow-hidden ${
                      isActive 
                        ? "bg-[#161c2a] border border-[#e2a826]/30 shadow-md" 
                        : "hover:bg-[#111622]/80 border border-transparent"
                    }`}
                  >
                    {/* Tiny golden status indicator marker for active story */}
                    {isActive && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#e2a826]" />
                    )}

                    {/* Image block thumbnail (if configured) */}
                    {art.imageUrl ? (
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden shrink-0 bg-[#161c2a] border border-[#1e293b] relative">
                        <img 
                          src={art.imageUrl} 
                          alt="Thumbnail" 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ) : (
                      // Placeholder if no image link
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg bg-[#0e1320] border border-[#1e293b] flex flex-col items-center justify-center shrink-0 relative text-[#475569]">
                        <Newspaper className="h-6 w-6 opacity-30" />
                        <span className="text-[9px] font-mono font-medium tracking-tighter opacity-40 mt-1 uppercase">SCMP</span>
                      </div>
                    )}

                    {/* Content text */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        {/* Tags line */}
                        <div className="flex items-center justify-between gap-1.5 mb-1.5">
                          <span className="text-[10px] font-mono text-[#64748b] flex items-center gap-1 truncate max-w-[150px]">
                            <User className="h-2.5 w-2.5 text-[#94a3b8] shrink-0" />
                            <span className="truncate">{art.author}</span>
                          </span>
                          
                          {/* Relative timeline tag */}
                          <span className="text-[10px] text-[#94a3b8] font-mono bg-[#111827] px-1.5 py-0.5 rounded border border-[#1e293b]">
                            {formatPubDate(art.pubDate)}
                          </span>
                        </div>

                        {/* Article head line */}
                        <h3 className="font-display font-bold text-sm text-[#f8fafc] group-hover:text-white line-clamp-2 leading-snug tracking-tight">
                          {art.title}
                        </h3>

                        {/* Article summary snippet */}
                        <p className="text-xs text-[#94a3b8] line-clamp-2 mt-1.5 leading-relaxed font-sans font-light">
                          {art.description}
                        </p>
                      </div>

                      {/* Footer inside card */}
                      <div className="flex items-center justify-between mt-2.5">
                        <div className="flex items-center gap-1.5 truncate">
                          {art.categories.slice(0, 2).map((c) => (
                            <span 
                              key={c} 
                              className="text-[9px] font-mono font-bold bg-[#111827] text-[#94a3b8] px-1.5 py-0.5 rounded border border-[#1e293b]/60 truncate"
                            >
                              {c.toUpperCase()}
                            </span>
                          ))}
                        </div>

                        {/* Inline bookmark utility */}
                        <button
                          onClick={(e) => toggleBookmark(art.id, e)}
                          className={`p-1 rounded hover:bg-[#111827] text-xs transition-colors shrink-0 ${
                            isBookmarked ? "text-[#e2a826]" : "text-[#475569] hover:text-[#94a3b8]"
                          }`}
                          title={isBookmarked ? "Remove Bookmark" : "Bookmark Story"}
                        >
                          <Bookmark className={`h-3.5 w-3.5 ${isBookmarked ? "fill-current" : ""}`} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Interactive AI Reading and summarizing workspace (60% wide) */}
        <div id="reading_and_chatbot_workspace" className="flex-1 flex flex-col bg-[#0b0f17] overflow-hidden">
          
          <AnimatePresence mode="wait">
            
            {/* SECTION A: Macro Geopolitical / Daily Briefing State */}
            {showBriefPanel && (
              <motion.div
                key="daily_macro_brief"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex-1 flex flex-col overflow-y-auto p-6"
              >
                {/* Brief Title and metadata banner */}
                <div className="max-w-2xl mx-auto w-full space-y-6">
                  
                  {/* Explanatory introduction */}
                  <div className="text-center py-6 space-y-2 border-b border-[#1e293b]">
                    <div className="inline-flex p-3 bg-gradient-to-br from-[#1e293b] to-[#1e293b]/40 rounded-full text-[#e0a924] mb-3 border border-[#334155]/60 shadow-md">
                      <BrainCircuit className="h-8 w-8 animate-pulse" />
                    </div>
                    <h2 className="font-display font-extrabold text-2xl text-white tracking-tight">
                      Synthesized Geopolitical Intel
                    </h2>
                    <p className="text-sm text-[#94a3b8] max-w-lg mx-auto">
                      Aggregate today's South China Morning Post coverage. Click the briefing button to construct a unified regional narrative summary using Gemini 3.5.
                    </p>

                    {!dailyBrief && !loadingBrief && (
                      <button
                        onClick={generateDailyBriefing}
                        className="mt-6 px-6 py-3 bg-[#e0a924] hover:bg-[#f5b324] text-black font-semibold rounded-xl text-xs uppercase tracking-wider transition-all duration-200 outline-none flex items-center gap-2 mx-auto shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20 hover:-translate-y-0.5"
                      >
                        <Sparkles className="w-4.5 h-4.5 shrink-0" />
                        <span>Compile Today's Pulse Briefing</span>
                      </button>
                    )}
                  </div>

                  {/* Loading Brief status */}
                  {loadingBrief && (
                    <div className="py-12 flex flex-col items-center justify-center space-y-4">
                      <div className="relative flex items-center justify-center">
                        <div className="animate-ping absolute inline-flex h-12 w-12 rounded-full bg-[#e2a826] opacity-20"></div>
                        <Loader2 className="h-10 w-10 text-[#e2a826] animate-spin relative" />
                      </div>
                      <div className="text-center max-w-sm space-y-1">
                        <p className="text-sm font-semibold text-white font-mono">Synthesizing World Feed Intel...</p>
                        <p className="text-xs text-[#64748b]">Gemini is assembling geopolitical insights, economic outlook notes, and macro themes.</p>
                      </div>
                    </div>
                  )}

                  {/* Brief Error alerts */}
                  {briefError && (
                    <div className="p-4 bg-red-950/40 border border-red-800/80 rounded-xl text-red-200 text-sm space-y-2">
                      <div className="flex items-center gap-2 font-bold">
                        <AlertCircle className="w-4 h-4 text-red-400" />
                        <span>Geopolitical Briefing Offline</span>
                      </div>
                      <p className="text-red-300 text-xs leading-relaxed">{briefError}</p>
                      <button
                        onClick={generateDailyBriefing}
                        className="px-3 py-1.5 bg-red-900/60 hover:bg-red-800 text-white rounded text-xs transition"
                      >
                        Retry Brief Compilation
                      </button>
                    </div>
                  )}

                  {/* Fully Loaded Brief representation */}
                  {dailyBrief && !loadingBrief && (
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-6"
                    >
                      {/* Macro Headline */}
                      <div className="p-5 bg-gradient-to-r from-[#172138] to-[#0e1627] rounded-xl border-l-4 border-[#e2a826] shadow-sm">
                        <span className="text-[10px] font-mono text-[#e2a826] font-bold uppercase tracking-wider block mb-1">Macro Headline Focal Point</span>
                        <h3 className="font-display font-extrabold text-lg sm:text-xl text-white tracking-tight leading-snug">
                          {dailyBrief.headline}
                        </h3>
                      </div>

                      {/* Narrative Paragraph */}
                      <div className="space-y-2">
                        <h4 className="text-xs uppercase tracking-widest text-[#64748b] font-mono font-bold flex items-center gap-1.5">
                          <Newspaper className="w-3.5 h-3.5 text-[#94a3b8]" />
                          <span>Global Editorial Core Narrative</span>
                        </h4>
                        <p className="text-sm text-[#94a3b8] leading-relaxed font-sans text-justify font-light">
                          {dailyBrief.narrativeBrief}
                        </p>
                      </div>

                      {/* Macro insights timeline */}
                      <div className="space-y-3 pt-2">
                        <h4 className="text-xs uppercase tracking-widest text-[#64748b] font-mono font-bold flex items-center gap-1.5">
                          <TrendingUp className="w-3.5 h-3.5 text-[#94a3b8]" />
                          <span>Key Strategic Focal Pillars</span>
                        </h4>
                        <div className="grid grid-cols-1 gap-2.5">
                          {dailyBrief.macroInsights?.map((insight, idx) => (
                            <div key={idx} className="flex gap-3 items-start p-3 bg-[#111726] rounded-lg border border-[#1e293b]/70">
                              <span className="flex-shrink-0 bg-[#e2a826]/12 text-[#e2a826] h-5 w-5 rounded-full flex items-center justify-center font-mono font-bold text-xs">
                                {idx + 1}
                              </span>
                              <p className="text-xs text-[#94a3b8] font-sans leading-relaxed">{insight}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Strategic Outlook */}
                      <div className="p-4 bg-[#0d1627] rounded-xl border border-[#e2a826]/10 space-y-1">
                        <h5 className="text-[11px] font-mono font-extrabold uppercase text-[#e2a826] flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Key Observer Outlook</span>
                        </h5>
                        <p className="text-xs text-[#94a3b8] font-mono leading-relaxed italic">
                          "{dailyBrief.outlook}"
                        </p>
                      </div>

                      {/* Quick reminder help */}
                      <div className="text-center pt-8 text-[11px] text-[#475569] border-t border-[#1e293b]">
                        <span>Select any article from the left stream coordinates to run specific point summaries.</span>
                      </div>
                    </motion.div>
                  )}

                </div>
              </motion.div>
            )}

            {/* SECTION B: Individual Article analysis pane */}
            {selectedArticle && !showBriefPanel && (
              <motion.div
                key={selectedArticle.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex-1 flex flex-col overflow-hidden"
              >
                {/* Article Header Metadata */}
                <div id="article_pane_header" className="p-5 border-b border-[#1e293b] bg-[#0c111a] flex flex-col sm:flex-row justify-between sm:items-start gap-4 shrink-0">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#94a3b8]">
                      {/* Back button option on mobile to show Daily Intel */}
                      <button 
                        onClick={() => setShowBriefPanel(true)}
                        className="text-[#e2a826] hover:underline font-semibold font-mono flex items-center gap-0.5 mr-2"
                      >
                        ← Back to Geo Intel
                      </button>
                      <span className="hidden sm:inline">|</span>
                      <span className="font-mono flex items-center gap-1 bg-[#111827] px-2 py-0.5 rounded border border-[#1e293b]">
                        <Calendar className="w-3 h-3 text-[#64748b]" />
                        <span>{new Date(selectedArticle.pubDate).toLocaleDateString([], { dateStyle: 'medium' })}</span>
                      </span>
                    </div>

                    <h2 id="article_heading" className="font-display font-extrabold text-[#f8fafc] text-base sm:text-lg leading-snug tracking-tight">
                      {selectedArticle.title}
                    </h2>
                    
                    <div className="flex items-center gap-2 text-xs text-[#94a3b8] font-mono">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3 text-[#e2a826]" />
                        <span>{selectedArticle.author}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-start sm:items-end gap-2 shrink-0">
                    <a
                      href={selectedArticle.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-[#111726] hover:bg-[#1f293d] border border-[#1e293b] text-[#94a3b8] hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
                    >
                      <span>Read Original</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>

                {/* Main Scroll Content Workspace splitter (AI Summary Top / User Chat Bottom) */}
                <div id="article_interactive_scroll" className="flex-1 overflow-y-auto p-5 space-y-6">
                  
                  {/* Original Story Fragment snippet */}
                  <div className="space-y-1.5">
                    <h4 className="text-[10px] uppercase font-mono tracking-widest text-[#475569] font-bold">Newswire Brief</h4>
                    <p className="text-sm text-[#94a3b8] italic border-l-2 border-[#475569] pl-3 leading-relaxed font-sans font-medium">
                      "{selectedArticle.description}"
                    </p>
                  </div>

                  {/* AI ANALYTICS HEADER */}
                  <div className="border-t border-[#1e293b] pt-5 space-y-4">
                    <div className="flex items-center justify-between pb-1">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4.5 w-4.5 text-[#e2a826]" />
                        <h4 className="font-display font-extrabold text-sm text-white tracking-tight uppercase">AI Desk Analytics Synthesis</h4>
                      </div>
                      
                      {/* Summary status flags */}
                      {loadingSummary ? (
                        <div className="flex items-center gap-1 text-[10px] text-[#e2a826] font-mono">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Generating report...</span>
                        </div>
                      ) : activeSummary ? (
                        <span className="text-[9px] uppercase font-mono bg-[#10b981]/12 text-[#10b981] border border-[#10b981]/30 px-2 py-0.5 rounded-full font-bold">Report Live</span>
                      ) : null}
                    </div>

                    {/* Summary Error Alert */}
                    {summaryError && (
                      <div className="p-4 bg-red-950/40 border border-red-800/80 rounded-xl text-red-200 text-xs space-y-1">
                        <div className="flex items-center gap-1.5 font-bold">
                          <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                          <span>Summary Processing Timed Out</span>
                        </div>
                        <p className="text-red-300 font-light leading-relaxed">{summaryError}</p>
                      </div>
                    )}

                    {/* Active AI Core Summary layout */}
                    {activeSummary && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-5 text-left"
                      >
                        {/* 3-Sentence narrative core */}
                        <div className="space-y-1 bg-[#111726]/80 p-3 rounded-lg border border-[#1e293b]">
                          <span className="text-[9px] font-mono text-[#64748b] bg-[#1a2337] px-1.5 py-0.5 rounded border border-[#232f48] w-max font-semibold uppercase tracking-wider block mb-1">Impact Abstract</span>
                          <p id="ai_story_summary" className="text-xs sm:text-sm text-[#94a3b8] leading-relaxed font-sans font-light">
                            {activeSummary.summary}
                          </p>
                        </div>

                        {/* Point Takeaways */}
                        <div className="space-y-2">
                          <span className="text-[10px] uppercase font-mono tracking-widest text-[#475569] font-bold block">Actionable Takeaways</span>
                          <div className="grid grid-cols-1 gap-2">
                            {activeSummary.takeaways?.map((takeaway, index) => (
                              <div key={index} className="flex gap-2.5 items-start">
                                <span className="flex-shrink-0 text-[#e2a826] mt-0.5">▪</span>
                                <p className="text-xs text-[#94a3b8] leading-relaxed font-sans">{takeaway}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Regional / Global context block */}
                        <div className="space-y-2 bg-gradient-to-r from-[#0d1424] to-[#070b13] p-4 rounded-xl border border-[#e2a826]/12 relative">
                          <span className="absolute top-3 right-3 text-xs opacity-10 font-bold text-[#e0a924]">GEOPOLITICS</span>
                          <h5 className="text-[11px] font-mono font-bold uppercase text-[#e2a826] tracking-wider">Geopolitical Regional Context</h5>
                          <p id="ai_geopolitical_context" className="text-xs text-[#94a3b8] leading-relaxed font-mono">
                            {activeSummary.regionalContext}
                          </p>
                        </div>

                        {/* Detected Entities */}
                        {activeSummary.entities && activeSummary.entities.length > 0 && (
                          <div className="space-y-1.5">
                            <span className="text-[10px] uppercase font-mono tracking-widest text-[#475569] font-bold block">Key Focal Entities</span>
                            <div className="flex flex-wrap gap-1.5">
                              {activeSummary.entities.map((ent) => (
                                <button
                                  key={ent}
                                  onClick={() => setSearchQuery(ent)}
                                  className="text-[10px] font-mono bg-[#111827] text-[#94a3b8] hover:text-white hover:bg-[#1a2436] px-2.5 py-1 rounded transition-colors border border-[#1e293b]"
                                >
                                  {ent}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                      </motion.div>
                    )}

                    {/* Loader Visual representation when synthesizing summary */}
                    {loadingSummary && (
                      <div className="py-8 flex flex-col items-center justify-center space-y-3">
                        <div className="relative flex items-center justify-center">
                          <div className="animate-ping absolute inline-flex h-10 w-10 bg-[#e2a826]/15 rounded-full"></div>
                          <Loader2 className="w-8 h-8 text-[#e2a826] animate-spin relative" />
                        </div>
                        <p className="text-xs font-mono text-[#94a3b8] animate-pulse">Consulting Asian intelligence databases...</p>
                      </div>
                    )}
                  </div>

                  {/* CHAT/CONVERSATION WORKSPACE COGNITIVE BLOCK */}
                  <div className="border-t border-[#1e293b] pt-5 space-y-4 text-left">
                    <div className="flex items-center gap-1.5 pb-1">
                      <MessageSquare className="h-4.5 w-4.5 text-[#3b82f6]" />
                      <h4 className="font-display font-extrabold text-sm text-white tracking-tight uppercase">Conversational News Desk</h4>
                    </div>

                    <p className="text-xs text-[#94a3b8] font-sans font-light leading-relaxed bg-[#0d1320] p-3 rounded-lg border border-[#1e293b]">
                      Query details, verify historical contexts, or ask clarification questions about this SCMP dispatch. The dialog history stays locked to this story coordinates.
                    </p>

                    {/* Chat Logs List */}
                    <div className="space-y-3 bg-[#0a0d15] p-3 rounded-xl border border-[#1e293b]/70 min-h-[140px] max-h-[300px] overflow-y-auto">
                      {(chatMessages[selectedArticle.id] || []).length === 0 ? (
                        <div className="h-[120px] flex flex-col items-center justify-center text-[#475569]">
                          <MessageSquare className="h-8 w-8 opacity-20 mb-2" />
                          <p className="text-xs font-mono">No dialogue history yet</p>
                          
                          {/* Quick Queries Suggestion buttons */}
                          <div className="flex flex-wrap gap-1.5 justify-center mt-3 max-w-sm">
                            {[
                              "What are the historical precedents here?",
                              "Who are the local key state stakeholders?",
                              "What are the economic consequences?"
                            ].map((suggestion) => (
                              <button
                                key={suggestion}
                                onClick={() => {
                                  setCurrentChatText(suggestion);
                                }}
                                className="text-[9px] bg-[#111827] hover:bg-[#1a2336] text-[#94a3b8] hover:text-white px-2 py-1 rounded border border-[#1e293b] transition"
                              >
                                "{suggestion}"
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {(chatMessages[selectedArticle.id] || []).map((msg) => {
                            const isUser = msg.role === "user";
                            return (
                              <div
                                key={msg.id}
                                className={`flex gap-2.5 max-w-[85%] ${isUser ? "ml-auto flex-row-reverse" : "mr-auto"}`}
                              >
                                {/* Mini Avatar label */}
                                <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-mono uppercase font-extrabold shrink-0 ${
                                  isUser ? "bg-[#3b82f6] text-white" : "bg-[#e2a826] text-black"
                                }`}>
                                  {isUser ? "U" : "AI"}
                                </div>

                                <div className="space-y-1">
                                  <div className={`p-3 rounded-xl text-xs sm:text-sm font-sans leading-relaxed ${
                                    isUser 
                                      ? "bg-[#3b82f6] text-white rounded-tr-none" 
                                      : "bg-[#1e2535] text-[#cbd5e1] rounded-tl-none border border-[#2b354b]"
                                  }`}>
                                    {msg.content}
                                  </div>
                                  <span className="text-[8px] font-mono text-[#64748b] block text-right">
                                    {msg.timestamp}
                                  </span>
                                </div>
                              </div>
                            );
                          })}

                          {/* Running conversation loader bubble */}
                          {loadingChat && (
                            <div className="flex gap-2.5 mr-auto">
                              <div className="h-6 w-6 rounded-full bg-[#e2a826] text-black flex items-center justify-center text-[10px] font-mono font-bold shrink-0">
                                AI
                              </div>
                              <div className="bg-[#1e2535] text-[#94a3b8] px-3.5 py-2.5 rounded-xl text-xs rounded-tl-none border border-[#2b354b] flex items-center gap-1.5">
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#e2a826]" />
                                <span>Drafting detailed dispatch response...</span>
                              </div>
                            </div>
                          )}

                          <div ref={chatEndRef} />
                        </div>
                      )}
                    </div>

                    {/* Chat Text Input Field console */}
                    <form onSubmit={sendChatMessage} className="flex gap-2">
                      <input
                        type="text"
                        value={currentChatText}
                        onChange={(e) => setCurrentChatText(e.target.value)}
                        placeholder="Ask the AI desk anything about this SCMP dispatch..."
                        className="flex-1 bg-[#111827] text-white border border-[#1e293b] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#3b82f6] transition-all"
                        disabled={loadingChat}
                      />
                      <button
                        type="submit"
                        disabled={loadingChat || !currentChatText.trim()}
                        className="p-2 bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-40 text-white rounded-lg transition-colors flex items-center justify-center"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </form>

                  </div>

                </div>
              </motion.div>
            )}

          </AnimatePresence>

        </div>

      </section>

      {/* Styled Footer Credit line */}
      <footer id="dashboard_footer" className="bg-[#06080d] border-t border-[#1e293b] px-6 py-3 flex flex-col sm:flex-row justify-between items-center gap-2 text-[10.5px] font-mono text-[#475569]">
        <span>SCMP AI Pulse Panel • Evie Yam Reader Desk</span>
        <span>Geopolitical data processed via Google Gemini 3.5</span>
      </footer>

    </div>
  );
}
