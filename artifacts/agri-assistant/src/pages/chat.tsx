import { useState, useRef, useEffect, useCallback } from "react";
import { useSettings } from "@/hooks/use-settings";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  MessageSquare, Send, Plus, Trash2, Loader2,
  Bot, User, Sprout, AlertCircle, Zap, Leaf,
  ChevronLeft, Menu, X
} from "lucide-react";

const BASE_URL = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

interface ChatMessage {
  _id: string;
  conversationId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

interface Conversation {
  _id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

const STARTERS = [
  "🌾 What rice varieties grow best in my region?",
  "🐛 How do I identify and treat bacterial blight?",
  "💧 Create an irrigation schedule for my crops",
  "🌡️ How does the current weather affect planting?",
  "🧪 When and how should I apply fertilizer?",
  "🔍 How do I control fall armyworm infestation?",
];

function MarkdownText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  const renderInline = (raw: string, i: number) => {
    if (raw.startsWith("**") && raw.endsWith("**"))
      return <strong key={i}>{raw.slice(2, -2)}</strong>;
    if (raw.startsWith("`") && raw.endsWith("`"))
      return <code key={i} className="bg-muted px-1 py-0.5 rounded text-xs font-mono">{raw.slice(1, -1)}</code>;
    return <span key={i}>{raw}</span>;
  };

  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];

  const flushList = () => {
    if (listItems.length) {
      elements.push(
        <ul key={`ul-${elements.length}`} className="space-y-1 my-1 pl-1">
          {listItems.map((item, i) => (
            <li key={i} className="flex gap-2 items-start">
              <span className="text-primary/50 mt-0.5 shrink-0">•</span>
              <span>{item.replace(/^[-•]\s*/, "").split(/(\*\*[^*]+\*\*|`[^`]+`)/).map(renderInline)}</span>
            </li>
          ))}
        </ul>
      );
      listItems = [];
    }
  };

  lines.forEach((line, i) => {
    if (!line.trim()) {
      flushList();
      if (elements.length > 0) elements.push(<div key={`sp-${i}`} className="h-1" />);
    } else if (line.match(/^#{1,3}\s/)) {
      flushList();
      const level = (line.match(/^(#{1,3})/) || [])[1]?.length ?? 1;
      const txt = line.replace(/^#{1,3}\s/, "");
      elements.push(
        <p key={i} className={level === 1 ? "font-bold text-base mt-2" : "font-semibold mt-1.5"}>
          {txt.split(/(\*\*[^*]+\*\*|`[^`]+`)/).map(renderInline)}
        </p>
      );
    } else if (line.match(/^\d+\.\s/)) {
      flushList();
      elements.push(
        <p key={i} className="flex gap-2 items-start">
          <span className="text-primary/70 font-semibold shrink-0 min-w-[1.2rem]">{line.match(/^\d+/)?.[0]}.</span>
          <span>{line.replace(/^\d+\.\s/, "").split(/(\*\*[^*]+\*\*|`[^`]+`)/).map(renderInline)}</span>
        </p>
      );
    } else if (line.match(/^[-•*]\s/)) {
      listItems.push(line);
    } else {
      flushList();
      elements.push(
        <p key={i}>{line.split(/(\*\*[^*]+\*\*|`[^`]+`)/).map(renderInline)}</p>
      );
    }
  });
  flushList();

  return <div className="text-sm leading-relaxed space-y-0.5">{elements}</div>;
}

export default function Chat() {
  const { settings } = useSettings();
  const [, navigate] = useLocation();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [aiReady, setAiReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  // Check AI status
  useEffect(() => {
    fetch(`${BASE_URL}/api/chat/status`)
      .then(r => r.json())
      .then(d => setAiReady(d.ready))
      .catch(() => {});
  }, []);

  // Load conversations
  useEffect(() => {
    fetch(`${BASE_URL}/api/chat/conversations`)
      .then(r => r.ok ? r.json() : [])
      .then(setConversations)
      .catch(() => {});
  }, []);

  // Load messages when active conversation changes
  useEffect(() => {
    if (!activeId) { setMessages([]); return; }
    fetch(`${BASE_URL}/api/chat/conversations/${activeId}/messages`)
      .then(r => r.ok ? r.json() : [])
      .then(setMessages)
      .catch(() => {});
  }, [activeId]);

  const createConversation = useCallback(async (): Promise<string | null> => {
    try {
      const res = await fetch(`${BASE_URL}/api/chat/conversations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New Chat" }),
      });
      if (!res.ok) return null;
      const conv: Conversation = await res.json();
      setConversations(prev => [conv, ...prev]);
      setActiveId(conv._id);
      setMessages([]);
      setSidebarOpen(false);
      return conv._id;
    } catch { return null; }
  }, []);

  const deleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await fetch(`${BASE_URL}/api/chat/conversations/${id}`, { method: "DELETE" }).catch(() => {});
    setConversations(prev => prev.filter(c => c._id !== id));
    if (activeId === id) { setActiveId(null); setMessages([]); }
  };

  const selectConversation = (id: string) => {
    setActiveId(id);
    setSidebarOpen(false);
    setError(null);
  };

  const sendMessage = useCallback(async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || streaming) return;
    setError(null);

    let convId = activeId;
    if (!convId) {
      convId = await createConversation();
      if (!convId) { setError("Failed to start conversation."); return; }
    }

    // Optimistic user message
    const tempId = `temp-${Date.now()}`;
    const userMsg: ChatMessage = {
      _id: tempId,
      conversationId: convId,
      role: "user",
      content: msg,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setStreaming(true);
    setStreamingContent("");
    setIsThinking(false);

    // Resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = "44px";
    }

    const context = {
      cityName: settings.cityName,
      provinceName: settings.provinceName,
      regionName: settings.regionName,
      regionCode: settings.regionCode,
      provinceCode: settings.provinceCode,
      cityCode: settings.cityCode,
      preferredCrops: settings.preferredCrops,
    };

    try {
      const abort = new AbortController();
      abortRef.current = abort;

      const res = await fetch(`${BASE_URL}/api/chat/conversations/${convId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: msg, context }),
        signal: abort.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setError(err.error ?? "AI unavailable. Please try again.");
        setMessages(prev => prev.filter(m => m._id !== tempId));
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) { setStreaming(false); return; }

      const decoder = new TextDecoder();
      let buf = "";
      let raw = "";
      let display = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const ev = JSON.parse(line.slice(6));
            if (ev.error) { setError(ev.error); break; }
            if (ev.done) break;
            if (ev.content) {
              raw += ev.content;
              // No need to parse <think> blocks for Gemini
              display = raw;
              setStreamingContent(display);
            }
          } catch {}
        }
      }

      display = raw;

      if (display) {
        const assistantMsg: ChatMessage = {
          _id: `${Date.now() + 1}`,
          conversationId: convId,
          role: "assistant",
          content: display,
          createdAt: new Date().toISOString(),
        };
        setMessages(prev => [...prev, assistantMsg]);
        setConversations(prev =>
          prev.map(c =>
            c._id === convId && c.title === "New Chat"
              ? { ...c, title: msg.slice(0, 50) + (msg.length > 50 ? "…" : "") }
              : c
          )
        );
      }
    } catch (err: any) {
      if (err?.name !== "AbortError") setError("Connection lost. Please try again.");
    } finally {
      setStreaming(false);
      setStreamingContent("");
      setIsThinking(false);
      abortRef.current = null;
    }
  }, [input, streaming, activeId, createConversation, settings]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const hasPsgc = !!(settings.regionCode && settings.provinceCode);
  const activeConv = conversations.find(c => c._id === activeId);

  return (
    <div className="flex h-full -m-4 md:-m-6 lg:-m-8 overflow-hidden">

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:relative inset-y-0 left-0 z-30 md:z-auto
        flex flex-col w-72 md:w-64 bg-card border-r
        transition-transform duration-200 md:translate-x-0
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        {/* Header */}
        <div className="flex items-center justify-between gap-2 px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <span className="font-semibold text-sm">AI Chats</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="sm" variant="ghost"
              className="h-7 w-7 p-0"
              onClick={createConversation}
              title="New chat"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              size="sm" variant="ghost"
              className="h-7 w-7 p-0 md:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Status badge */}
        <div className="px-4 py-2 border-b">
          <div className={`flex items-center gap-1.5 text-xs rounded-lg px-2 py-1.5 w-fit ${
            aiReady
              ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400"
              : "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400"
          }`}>
            <Zap className="h-3 w-3" />
            <span>{aiReady ? "Gemini 2.5 Flash ready" : "Connecting to AI…"}</span>
          </div>
        </div>

        {/* Conversations list */}
        <ScrollArea className="flex-1 py-2">
          {conversations.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8 px-4">
              No chats yet. Start a new conversation!
            </p>
          ) : (
            <div className="px-2 space-y-0.5">
              {conversations.map(conv => (
                <button
                  key={conv._id}
                  onClick={() => selectConversation(conv._id)}
                  className={`w-full text-left flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-colors group ${
                    activeId === conv._id
                      ? "bg-primary/10 text-primary font-medium"
                      : "hover:bg-muted/70 text-muted-foreground"
                  }`}
                >
                  <MessageSquare className="h-3.5 w-3.5 shrink-0 opacity-60" />
                  <span className="flex-1 truncate text-xs leading-relaxed">{conv.title}</span>
                  <button
                    onClick={e => deleteConversation(conv._id, e)}
                    className="shrink-0 opacity-0 group-hover:opacity-50 hover:!opacity-100 p-0.5 rounded hover:text-destructive transition-opacity"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Farm context */}
        {hasPsgc && (
          <div className="p-3 border-t">
            <div className="flex items-start gap-2 p-2.5 bg-primary/5 border border-primary/10 rounded-xl">
              <Leaf className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
              <div className="text-[10px] text-muted-foreground leading-relaxed min-w-0">
                <div className="font-semibold text-primary/80 text-xs truncate">
                  {settings.cityName || settings.provinceName || "Your Farm"}
                </div>
                <div className="truncate">
                  {settings.preferredCrops.slice(0, 3).join(", ") || "No crops set"}
                </div>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b bg-card/50 shrink-0">
          <Button
            variant="ghost" size="sm"
            className="h-8 w-8 p-0 md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-sm truncate">
              {activeConv?.title ?? "Grownox"}
            </h1>
            <p className="text-xs text-muted-foreground">
              {hasPsgc
                ? `${settings.cityName || settings.provinceName} · Gemini`
                : "Gemini · Agriculture Specialist"}
            </p>
          </div>
          {!activeId && (
            <Button size="sm" variant="outline" onClick={createConversation} className="shrink-0 gap-1.5 h-8">
              <Plus className="h-3.5 w-3.5" /> New Chat
            </Button>
          )}
        </div>

        {/* PSGC warning */}
        {!hasPsgc && (
          <div className="mx-4 mt-3 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start gap-2.5 shrink-0">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-800 dark:text-amber-200">
              <span className="font-semibold">Location not set.</span>{" "}
              Your PSGC location personalizes AI farming advice.{" "}
              <button onClick={() => navigate("/settings")} className="underline font-medium hover:no-underline">
                Set location in Settings
              </button>
            </div>
          </div>
        )}

        {/* Messages */}
        <ScrollArea className="flex-1 px-4 py-4">
          {!activeId && messages.length === 0 ? (
            /* Welcome screen */
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6 max-w-lg mx-auto">
              <div className="text-center space-y-3">
                <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto border border-primary/10">
                  <Sprout className="h-10 w-10 text-primary" />
                </div>
                <h2 className="text-2xl font-bold">Grownox</h2>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                  Powered by <span className="font-semibold text-foreground">Gemini</span> — your expert AI farming advisor for Philippine agriculture.
                </p>
              </div>

              <div className="w-full space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center">
                  Quick questions
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {STARTERS.map(starter => (
                    <button
                      key={starter}
                      onClick={() => sendMessage(starter)}
                      className="text-left text-xs px-3.5 py-3 rounded-xl border hover:bg-muted/60 hover:border-primary/30 transition-all text-muted-foreground hover:text-foreground leading-relaxed"
                    >
                      {starter}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 max-w-3xl mx-auto pb-4">
              {messages.map(msg => (
                <div
                  key={msg._id}
                  className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div className={`max-w-[82%] rounded-2xl px-4 py-3 ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-sm"
                      : "bg-muted/60 border rounded-tl-sm"
                  }`}>
                    {msg.role === "assistant"
                      ? <MarkdownText text={msg.content} />
                      : <p className="text-sm leading-relaxed">{msg.content}</p>
                    }
                  </div>
                  {msg.role === "user" && (
                    <div className="h-7 w-7 rounded-lg bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                  )}
                </div>
              ))}

              {/* Streaming response */}
              {streaming && (
                <div className="flex gap-3 justify-start">
                  <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div className="max-w-[82%] space-y-2">
                    <div className="rounded-2xl rounded-tl-sm px-4 py-3 bg-muted/60 border">
                      {streamingContent ? (
                        <MarkdownText text={streamingContent} />
                      ) : (
                        <div className="flex items-center gap-1.5 py-0.5">
                          {[0, 150, 300].map(delay => (
                            <span
                              key={delay}
                              className="h-1.5 w-1.5 rounded-full bg-primary/50 animate-bounce"
                              style={{ animationDelay: `${delay}ms` }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3 max-w-md">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          )}
        </ScrollArea>

        {/* Input bar */}
        <div className="px-4 py-3 border-t bg-card/50 shrink-0">
          <div className="flex gap-2 max-w-3xl mx-auto">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={streaming}
              placeholder={aiReady ? "Ask about your crops, pests, fertilizers, or weather…" : "Connecting to AI…"}
              rows={1}
              className="flex-1 resize-none px-4 py-3 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50 min-h-[44px] max-h-[140px] leading-relaxed"
              onInput={e => {
                const el = e.currentTarget;
                el.style.height = "44px";
                el.style.height = Math.min(el.scrollHeight, 140) + "px";
              }}
            />
            <Button
              onClick={() => sendMessage()}
              disabled={!input.trim() || streaming}
              className="h-11 w-11 p-0 rounded-xl shrink-0"
            >
              {streaming
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Send className="h-4 w-4" />
              }
            </Button>
          </div>
          <p className="text-center text-[10px] text-muted-foreground/60 mt-1.5">
            AI advice is for guidance only — consult your local agronomist for critical decisions.
          </p>
        </div>
      </div>
    </div>
  );
}
