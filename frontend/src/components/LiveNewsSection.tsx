"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import { Radio, RefreshCw, Clock } from "lucide-react";
import { getLiveNews, LiveNewsItem } from "@/lib/api";

const LIVE_FILTERS: { key: string; label: string }[] = [
  { key: "all", label: "All" },
  { key: "ai_tech", label: "AI/Tech" },
  { key: "crypto", label: "Crypto" },
  { key: "politics", label: "Politics" },
  { key: "health", label: "Health" },
  { key: "pakistan", label: "Pakistan" },
  { key: "sports", label: "Sports" },
  { key: "world", label: "World" },
];

type NewsItem = LiveNewsItem;

function NewsThumb({
  imageUrl,
  className,
}: {
  imageUrl?: string | null;
  className: string;
}) {
  const [failed, setFailed] = useState(false);
  if (!imageUrl || failed) {
    return (
      <div
        className={`${className} bg-gray-200 flex items-center justify-center text-gray-500 text-xs font-medium text-center px-1`}
        aria-hidden
      >
        No image
      </div>
    );
  }
  return (
    <div className={`${className} relative overflow-hidden bg-gray-200`}>
      <img
        src={imageUrl}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

export const LiveNewsSection = () => {
  const [parsedNews, setParsedNews] = useState<{
    breaking: NewsItem[];
    updates: NewsItem[];
    highlights: NewsItem[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [category, setCategory] = useState<string>("all");

  const parseNewsResponse = (response: string) => {
    try {
      const breaking: NewsItem[] = [];
      const updates: NewsItem[] = [];
      const highlights: NewsItem[] = [];

      // Parse Breaking News section
      const breakingMatch = response.match(/🔥\s*BREAKING NEWS[\s\S]*?(?=━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━|📊|💡|$)/i);
      if (breakingMatch) {
        const breakingText = breakingMatch[0];
        // Extract each breaking news item (starts with 🚨)
        const breakingItems = breakingText.split(/(?=🚨)/).filter(item => item.trim().startsWith('🚨'));
        
        breakingItems.forEach((item) => {
          const lines = item.split('\n').map(l => l.trim()).filter(l => l);
          
          let title = '';
          let summary = '';
          let source = 'AI News Desk';
          let url = '#';
          let time = 'Just now';
          
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            // Extract title (line after 🚨)
            if (line.startsWith('🚨')) {
              title = line.replace(/🚨\s*/, '').trim();
            }
            // Extract location (optional)
            else if (line.startsWith('📍')) {
              // Skip location
            }
            // Extract time
            else if (line.startsWith('⏰')) {
              time = line.replace(/⏰\s*Time:\s*/i, '').trim() || 'Just now';
            }
            // Extract source
            else if (line.startsWith('📰')) {
              source = line.replace(/📰\s*Source:\s*/i, '').trim() || 'AI News Desk';
            }
            // Extract URL
            else if (line.startsWith('🔗')) {
              url = line.replace(/🔗\s*Read more:\s*/i, '').trim() || '#';
            }
            // Extract summary (text between metadata and URL)
            else if (line && !line.includes('━━') && line.length > 10) {
              if (!summary) {
                summary = line;
              } else if (summary.length < 250) {
                summary += ' ' + line;
              }
            }
          }
          
          if (title && title.length > 5) {
            breaking.push({
              title: title.substring(0, 150),
              summary: summary || 'Breaking AI news update',
              source: source,
              url: url,
              time: time
            });
          }
        });
      }

      // Parse Latest Updates section
      const updatesMatch = response.match(/📊\s*LATEST UPDATES[\s\S]*?(?=━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━|💡|📈|$)/i);
      if (updatesMatch) {
        const updatesText = updatesMatch[0];
        // Extract each update item (starts with •)
        const updateItems = updatesText.split(/(?=•)/).filter(item => item.trim().startsWith('•'));
        
        updateItems.forEach((item) => {
          const lines = item.split('\n').map(l => l.trim()).filter(l => l);
          
          let title = '';
          let summary = '';
          let source = 'AI News Desk';
          let url = '#';
          let time = 'Just now';
          
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            // Extract title (line with •)
            if (line.startsWith('•')) {
              title = line.replace(/•\s*/, '').trim();
            }
            // Extract metadata (Location | Time | Source)
            else if (line.includes('|')) {
              const parts = line.split('|').map(p => p.trim());
              parts.forEach(part => {
                if (part.startsWith('📍')) {
                  // Skip location
                } else if (part.startsWith('⏰')) {
                  time = part.replace(/⏰\s*/i, '').trim() || 'Just now';
                } else if (part.startsWith('📰')) {
                  source = part.replace(/📰\s*/i, '').trim() || 'AI News Desk';
                }
              });
            }
            // Extract URL
            else if (line.startsWith('🔗')) {
              url = line.replace(/🔗\s*/i, '').trim() || '#';
            }
            // Extract summary
            else if (line && !line.includes('━━') && line.length > 10 && !line.match(/^[📍⏰📰🔗]/)) {
              if (!summary) {
                summary = line;
              } else if (summary.length < 200) {
                summary += ' ' + line;
              }
            }
          }
          
          if (title && title.length > 5) {
            updates.push({
              title: title.substring(0, 120),
              summary: summary || 'Latest AI news update',
              source: source,
              url: url,
              time: time
            });
          }
        });
      }

      // Parse Key Highlights section
      const highlightsMatch = response.match(/💡\s*KEY HIGHLIGHTS[\s\S]*?(?=━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━|📈|$)/i);
      if (highlightsMatch) {
        const highlightsText = highlightsMatch[0];
        // Extract each highlight item (starts with •)
        const highlightItems = highlightsText.split(/(?=•)/).filter(item => item.trim().startsWith('•'));
        
        highlightItems.forEach((item) => {
          // Format: • [Title] - [Summary] | 📰 [Source] | 🔗 [URL]
          const match = item.match(/•\s*([^-|]+?)\s*-\s*([^|]+?)\s*\|\s*📰\s*([^|]+?)\s*\|\s*🔗\s*(.+)/);
          
          if (match) {
            highlights.push({
              title: match[1].trim().substring(0, 100),
              summary: match[2].trim().substring(0, 150),
              source: match[3].trim() || 'AI News Desk',
              url: match[4].trim() || '#',
              time: 'Today'
            });
          } else {
            // Fallback parsing
            const lines = item.split('\n').map(l => l.trim()).filter(l => l);
            const firstLine = lines[0] || '';
            if (firstLine.startsWith('•')) {
              const cleanLine = firstLine.replace(/•\s*/, '').trim();
              if (cleanLine.length > 10) {
                highlights.push({
                  title: cleanLine.substring(0, 100),
                  summary: 'Latest AI development',
                  source: 'AI News Desk',
                  url: '#',
                  time: 'Today'
                });
              }
            }
          }
        });
      }

      // Fallback: If no items found, try to extract from raw text
      if (breaking.length === 0 && updates.length === 0 && highlights.length === 0) {
        // Look for any lines that look like headlines
        const allLines = response.split('\n').map(l => l.trim()).filter(l => {
          return l.length > 15 && 
                 l.length < 200 && 
                 !l.includes('━━') && 
                 !l.match(/^[📍⏰📰🔗🚨🔥📊💡📈]/) &&
                 !l.match(/^(Location|Time|Source|Read more|Last Updated|Coverage):/i) &&
                 !l.match(/^(BREAKING NEWS|LATEST UPDATES|KEY HIGHLIGHTS|TODAY'S AI NEWS SUMMARY)/i);
        });
        
        allLines.slice(0, 8).forEach((line) => {
          if (line.length > 15) {
            updates.push({
              title: line.substring(0, 100),
              summary: line.length > 100 ? line.substring(100, 250) : 'Latest AI development',
              source: 'AI News Desk',
              url: '#',
              time: 'Just now'
            });
          }
        });
      }

      return { breaking, updates, highlights };
    } catch (e) {
      console.error("Failed to parse news:", e);
      return { breaking: [], updates: [], highlights: [] };
    }
  };

  const fetchNews = useCallback(async () => {
    setLoading(true);
    try {
      const categories = category === "all" ? ["all"] : [category];
      const response = await getLiveNews(categories);

      if (response.items && response.items.length > 0) {
        const it = response.items;
        setParsedNews({
          breaking: it.slice(0, 3),
          updates: it.slice(3, 11),
          highlights: it.slice(11, 20),
        });
      } else if (response.result?.trim()) {
        setParsedNews(parseNewsResponse(response.result));
      } else {
        const hint =
          response.provider === "empty"
            ? "No headlines returned. Set NEWS_API_KEY in backend/.env for NewsAPI.org (title + image), or check your network."
            : "No headlines right now. Try Refresh or another category.";
        setParsedNews({
          breaking: [],
          updates: [
            {
              title: "No stories yet",
              summary: hint,
              source: "System",
              url: "#",
              time: "Now",
            },
          ],
          highlights: [],
        });
      }
      setLastUpdate(new Date());
    } catch (error: any) {
      console.error("Error fetching live news:", error);
      // Show user-friendly error message
      let errorMessage = error?.message || "Failed to fetch news. Please check if backend is running.";
      
      // Handle specific error cases
      if (errorMessage.includes("quota") || errorMessage.includes("429")) {
        errorMessage =
          "OpenAI API quota exceeded. Please add credits to your OpenAI account at https://platform.openai.com/account/billing";
      } else if (
        /Invalid OpenAI API key|invalid_api_key/i.test(errorMessage) &&
        /running agent|Error running agent/i.test(errorMessage)
      ) {
        errorMessage =
          "This error comes from an OLD backend that still used OpenAI for Live News. Stop every uvicorn/python on port 8000, then start the backend again from the backend folder. Open http://127.0.0.1:8000/health — you must see \"live_news\":\"rss\". Live News uses NewsAPI + RSS only and does not need OpenAI.";
      }
      
      // Show error in UI instead of alert
      setParsedNews({
        breaking: [],
        updates: [{
          title: "Error Loading News",
          summary: errorMessage,
          source: "System",
          url: "#",
          time: "Now"
        }],
        highlights: []
      });
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchNews();
    }, 60000); // Refresh every 60 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, fetchNews]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <section id="live-news" className="py-12 bg-gray-50 relative z-10">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-600 text-white text-xs font-bold mb-3">
                <Radio className="w-3 h-3 animate-pulse" />
                LIVE
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
                Live headlines
              </h2>
            </div>

            <div className="flex flex-col items-end gap-3">
              <div className="flex flex-wrap justify-end gap-2 max-w-xl">
                {LIVE_FILTERS.map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setCategory(f.key)}
                    className={`px-3 py-1 text-xs font-semibold border transition-colors ${
                      category === f.key
                        ? "bg-gray-900 text-white border-gray-900"
                        : "bg-white text-gray-800 border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                {autoRefresh ? (
                  <span className="inline-flex items-center gap-2 text-emerald-700">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600" />
                    </span>
                    Live auto-refresh on
                  </span>
                ) : (
                  <span className="text-gray-500">Live auto-refresh off</span>
                )}
                <span className="inline-flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {lastUpdate
                    ? `Last updated: ${formatTime(lastUpdate)}`
                    : "Not updated yet"}
                </span>
              </div>
              <button
                onClick={fetchNews}
                disabled={loading}
                className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium transition-all duration-300 flex items-center gap-2 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>
        </div>

        {/* News Content - BBC Style Layout */}
        <div>
          {loading && !parsedNews ? (
            <div className="bg-white rounded-lg p-8 min-h-[400px] flex items-center justify-center">
              <div className="text-center">
                <RefreshCw className="w-12 h-12 text-gray-400 animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Fetching latest headlines…</p>
              </div>
            </div>
          ) : parsedNews ? (
            <div className="bg-white rounded-lg overflow-hidden">
              {/* Main Featured Story - Top */}
              {parsedNews.breaking.length > 0 && (
                <div className="border-b border-gray-200">
                  <div className="bg-red-600 text-white px-4 py-2 text-sm font-semibold">
                    FEATURED HEADLINES
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
                    {parsedNews.breaking.slice(0, 1).map((item, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="md:col-span-2"
                      >
                        <div className="relative w-full h-64 md:h-80 mb-4 rounded overflow-hidden bg-gray-200">
                          <NewsThumb
                            imageUrl={item.image_url}
                            className="w-full h-full"
                          />
                        </div>
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 leading-tight">
                          <a href={item.url} target="_blank" rel="noopener noreferrer" className="hover:text-red-600 transition-colors">
                            {item.title}
                          </a>
                        </h2>
                        <p className="text-gray-700 text-base leading-relaxed mb-3">
                          {item.summary}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span>{item.source}</span>
                          <span>•</span>
                          <span>{item.time}</span>
                        </div>
                      </motion.div>
                    ))}
                    
                    {/* Side Stories */}
                    <div className="space-y-4">
                      {parsedNews.breaking.slice(1, 3).map((item, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="border-b border-gray-200 pb-4 last:border-0"
                        >
                          <div className="flex gap-3">
                            <div className="relative w-24 h-24 flex-shrink-0 rounded overflow-hidden bg-gray-200">
                              <NewsThumb
                                imageUrl={item.image_url}
                                className="w-full h-full"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-bold text-gray-900 mb-1 line-clamp-2 leading-snug">
                                <a href={item.url} target="_blank" rel="noopener noreferrer" className="hover:text-red-600 transition-colors">
                                  {item.title}
                                </a>
                              </h3>
                              <p className="text-xs text-gray-600 line-clamp-2">
                                {item.summary}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Latest News Grid */}
              {parsedNews.updates.length > 0 && (
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-gray-900">
                    Latest stories
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {parsedNews.updates.map((item, i) => (
                      <motion.article
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="group"
                      >
                        <div className="relative w-full h-48 mb-3 rounded overflow-hidden bg-gray-200">
                          <NewsThumb
                            imageUrl={item.image_url}
                            className="w-full h-full"
                          />
                        </div>
                        <h3 className="text-base font-bold text-gray-900 mb-2 line-clamp-2 leading-tight group-hover:text-red-600 transition-colors">
                          <a href={item.url} target="_blank" rel="noopener noreferrer">
                            {item.title}
                          </a>
                        </h3>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-3 leading-relaxed">
                          {item.summary}
                        </p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{item.source}</span>
                          <span>{item.time}</span>
                        </div>
                      </motion.article>
                    ))}
                  </div>
                </div>
              )}

              {/* More Stories - Horizontal Layout */}
              {parsedNews.highlights.length > 0 && (
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-gray-900">
                    More Stories
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {parsedNews.highlights.map((item, i) => (
                      <motion.article
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex gap-4 group"
                      >
                        <div className="relative w-32 h-32 flex-shrink-0 rounded overflow-hidden bg-gray-200">
                          <NewsThumb
                            imageUrl={item.image_url}
                            className="w-full h-full"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-bold text-gray-900 mb-2 line-clamp-2 leading-snug group-hover:text-red-600 transition-colors">
                            <a href={item.url} target="_blank" rel="noopener noreferrer">
                              {item.title}
                            </a>
                          </h3>
                          <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed mb-2">
                            {item.summary}
                          </p>
                          <div className="text-xs text-gray-500">
                            {item.source} • {item.time}
                          </div>
                        </div>
                      </motion.article>
                    ))}
                  </div>
                </div>
              )}

              {parsedNews.breaking.length === 0 && parsedNews.updates.length === 0 && parsedNews.highlights.length === 0 && (
                <div className="p-8 text-center text-gray-600">
                  <p>No headlines available for this category. Try another filter or refresh.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg p-8 min-h-[400px] flex items-center justify-center">
              <div className="text-center text-gray-600">
                <p>No headlines available. Click refresh to try again.</p>
              </div>
            </div>
          )}
        </div>

        {/* Auto-refresh Toggle */}
        <div className="mt-6 flex items-center justify-center gap-2">
          <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="w-4 h-4 rounded bg-white/5 border-white/10 text-cyan-500 focus:ring-cyan-500"
            />
            <span>Auto-refresh every 60 seconds</span>
          </label>
        </div>
      </div>
    </section>
  );
};

