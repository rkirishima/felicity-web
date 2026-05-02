'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_DOUG_SUPABASE_URL,
  process.env.NEXT_PUBLIC_DOUG_SUPABASE_ANON_KEY
);

const MEMORY_FILES = ['SOUL', 'IDENTITY', 'MEMORY', 'HEARTBEAT'];

// ── MESSAGE CONTENT ─────────────────────────────────────────────────────────

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(async () => {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {}
  }, [text]);
  return (
    <button onClick={handleCopy} className="absolute top-2 right-2 px-2 py-1 text-xs rounded bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white transition-colors">
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

const MD_COMPONENTS = {
  // Block code — pre is stripped, code handles it
  pre: ({ children }) => <>{children}</>,
  code({ className, children }) {
    const lang = className?.replace('language-', '') || '';
    const text = String(children).replace(/\n$/, '');
    const isBlock = className?.startsWith('language-') || text.includes('\n');
    if (!isBlock) {
      return <code className="bg-gray-700/70 text-gray-200 px-1.5 py-0.5 rounded text-[0.85em] font-mono">{children}</code>;
    }
    return (
      <div className="relative my-3 rounded-lg overflow-hidden bg-gray-950 border border-gray-700">
        {lang && <div className="px-3 py-1.5 text-xs text-gray-500 font-mono border-b border-gray-700 bg-gray-900">{lang}</div>}
        <pre className="text-xs font-mono text-gray-200 p-3 pr-14 overflow-x-auto leading-relaxed m-0"><code>{children}</code></pre>
        <CopyButton text={text} />
      </div>
    );
  },
  // Headings
  h1: ({ children }) => <h1 className="text-lg font-bold text-gray-100 mt-4 mb-2 border-b border-gray-700 pb-1">{children}</h1>,
  h2: ({ children }) => <h2 className="text-base font-bold text-gray-100 mt-4 mb-2">{children}</h2>,
  h3: ({ children }) => <h3 className="text-sm font-semibold text-gray-200 mt-3 mb-1">{children}</h3>,
  // Paragraphs
  p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
  // Lists
  ul: ({ children }) => <ul className="list-disc list-outside pl-5 mb-2 space-y-0.5">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal list-outside pl-5 mb-2 space-y-0.5">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  // Emphasis
  strong: ({ children }) => <strong className="font-semibold text-gray-100">{children}</strong>,
  em: ({ children }) => <em className="italic text-gray-300">{children}</em>,
  // Blockquote
  blockquote: ({ children }) => <blockquote className="border-l-2 border-gray-600 pl-3 my-2 text-gray-400 italic">{children}</blockquote>,
  // Links
  a: ({ href, children }) => <a href={href} target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300 underline underline-offset-2">{children}</a>,
  // HR
  hr: () => <hr className="border-gray-700 my-3" />,
  // Tables (remark-gfm)
  table: ({ children }) => <div className="overflow-x-auto my-3"><table className="text-xs border-collapse w-full">{children}</table></div>,
  thead: ({ children }) => <thead className="bg-gray-900">{children}</thead>,
  th: ({ children }) => <th className="border border-gray-700 px-3 py-1.5 text-left font-semibold text-gray-300">{children}</th>,
  td: ({ children }) => <td className="border border-gray-700 px-3 py-1.5 text-gray-300">{children}</td>,
};

function MessageContent({ content }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={MD_COMPONENTS}>
      {content}
    </ReactMarkdown>
  );
}

// ── PIN SCREEN ─────────────────────────────────────────────────────────────

function PinScreen({ onUnlock }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    if (pin === '4499') {
      localStorage.setItem('doug_pin', '4499');
      onUnlock();
    } else {
      setError(true);
      setPin('');
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4">
        <div className="text-gray-400 text-sm tracking-widest uppercase mb-2">Doug</div>
        <input
          type="password"
          inputMode="numeric"
          maxLength={4}
          value={pin}
          onChange={e => { setPin(e.target.value); setError(false); }}
          placeholder="PIN"
          autoFocus
          className="w-32 text-center text-2xl tracking-[0.5em] bg-gray-900 border border-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-gray-500"
        />
        {error && <p className="text-red-400 text-xs">Incorrect PIN</p>}
        <button
          type="submit"
          className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg text-sm transition-colors"
        >
          Enter
        </button>
      </form>
    </div>
  );
}

// ── MEMORY MODAL ────────────────────────────────────────────────────────────

function MemoryModal({ file, onClose }) {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`/api/doug/memory?file=${file}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) setError(data.error);
        else setContent(data.content);
      })
      .catch(() => setError('Failed to load'))
      .finally(() => setLoading(false));
  }, [file]);

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-700">
          <span className="text-gray-200 font-mono text-sm">{file}.md</span>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 text-lg leading-none">&times;</button>
        </div>
        <div className="overflow-auto p-5 flex-1">
          {loading && <p className="text-gray-500 text-sm">Loading…</p>}
          {error && <p className="text-red-400 text-sm">{error}</p>}
          {content && (
            <pre className="text-gray-300 text-xs font-mono whitespace-pre-wrap leading-relaxed">{content}</pre>
          )}
        </div>
      </div>
    </div>
  );
}

// ── MAIN UI ─────────────────────────────────────────────────────────────────

export default function DougPage() {
  const [unlocked, setUnlocked] = useState(false);

  // threads
  const [threads, setThreads] = useState([]);
  const [selectedThread, setSelectedThread] = useState(null);
  const [threadsLoading, setThreadsLoading] = useState(true);

  // messages
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

  // input
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [model, setModel] = useState('haiku');

  // memory modal
  const [memoryFile, setMemoryFile] = useState(null);

  // monthly cost
  const [monthlyCost, setMonthlyCost] = useState(null);

  const messagesEndRef = useRef(null);
  const realtimeRef = useRef(null);

  // ── auth check ──
  useEffect(() => {
    if (localStorage.getItem('doug_pin') === '4499') setUnlocked(true);
  }, []);

  // ── load threads ──
  useEffect(() => {
    if (!unlocked) return;
    loadThreads();
    loadMonthlyCost();
  }, [unlocked]);

  async function loadThreads() {
    setThreadsLoading(true);
    const { data } = await supabase
      .from('doug_threads')
      .select('*')
      .order('updated_at', { ascending: false });
    setThreads(data || []);
    setThreadsLoading(false);
  }

  async function loadMonthlyCost() {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();
    const { data } = await supabase
      .from('doug_threads')
      .select('cost_usd')
      .gte('updated_at', start)
      .lt('updated_at', end);
    if (data) {
      const sum = data.reduce((acc, r) => acc + (r.cost_usd || 0), 0);
      setMonthlyCost(sum);
    }
  }

  // ── select thread ──
  useEffect(() => {
    if (!selectedThread) return;

    // unsubscribe previous
    if (realtimeRef.current) {
      supabase.removeChannel(realtimeRef.current);
    }

    loadMessages(selectedThread.id);

    // realtime subscription
    const channel = supabase
      .channel(`doug_messages_${selectedThread.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'doug_messages',
          filter: `thread_id=eq.${selectedThread.id}`,
        },
        payload => {
          setMessages(prev => [...prev, payload.new]);
        }
      )
      .subscribe();

    realtimeRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedThread?.id]);

  // ── scroll to bottom on new messages ──
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function loadMessages(threadId) {
    setMessagesLoading(true);
    const { data } = await supabase
      .from('doug_messages')
      .select('*')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true });
    setMessages(data || []);
    setMessagesLoading(false);
  }

  async function createThread() {
    const title = `Thread ${new Date().toLocaleString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`;
    const { data, error } = await supabase
      .from('doug_threads')
      .insert({ title, model, cost_usd: 0 })
      .select()
      .single();
    if (!error && data) {
      setThreads(prev => [data, ...prev]);
      setSelectedThread(data);
      setMessages([]);
    }
  }

  async function sendMessage() {
    if (!draft.trim() || !selectedThread || sending) return;
    const text = draft.trim();
    setDraft('');
    setSending(true);

    // optimistically add user message to UI
    const optimistic = { id: `opt-${Date.now()}`, role: 'user', content: text, created_at: new Date().toISOString() };
    setMessages(prev => [...prev, optimistic]);

    try {
      // insert user message to Supabase
      await supabase.from('doug_messages').insert({
        thread_id: selectedThread.id,
        role: 'user',
        content: text,
      });

      // call API
      const res = await fetch('/api/doug/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threadId: selectedThread.id, message: text, model }),
      });
      const data = await res.json();
      if (data.error) {
        setMessages(prev => [
          ...prev,
          { id: `err-${Date.now()}`, role: 'error', content: data.error, created_at: new Date().toISOString() },
        ]);
      }
      // assistant reply arrives via realtime subscription
      // refresh thread list to update updated_at + cost
      loadThreads();
      loadMonthlyCost();
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { id: `err-${Date.now()}`, role: 'error', content: err.message, created_at: new Date().toISOString() },
      ]);
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  // ── thread stats ──
  const threadMessageCount = messages.length;
  const threadModel = selectedThread?.model ?? '—';
  const threadCost = selectedThread?.cost_usd != null ? `$${Number(selectedThread.cost_usd).toFixed(4)}` : '—';

  if (!unlocked) {
    return <PinScreen onUnlock={() => setUnlocked(true)} />;
  }

  return (
    <div className="flex h-screen bg-gray-950 text-gray-200 overflow-hidden">

      {/* ── LEFT COLUMN ── */}
      <aside className="w-56 flex flex-col border-r border-gray-800 bg-gray-900">
        <div className="p-3 border-b border-gray-800">
          <button
            onClick={createThread}
            className="w-full py-2 px-3 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg text-sm transition-colors text-left"
          >
            + New Thread
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          {threadsLoading && (
            <p className="text-gray-600 text-xs px-4 py-2">Loading…</p>
          )}
          {!threadsLoading && threads.length === 0 && (
            <p className="text-gray-600 text-xs px-4 py-2">No threads yet</p>
          )}
          {threads.map(thread => (
            <button
              key={thread.id}
              onClick={() => setSelectedThread(thread)}
              className={`w-full text-left px-4 py-2 text-xs truncate transition-colors ${
                selectedThread?.id === thread.id
                  ? 'bg-gray-800 text-gray-100'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
              }`}
            >
              {thread.title || `Thread ${thread.id.slice(0, 6)}`}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-800">
          <p className="text-gray-600 text-xs">This month</p>
          <p className="text-gray-300 text-sm font-mono">
            {monthlyCost != null ? `$${monthlyCost.toFixed(4)}` : '—'}
          </p>
        </div>
      </aside>

      {/* ── CENTER COLUMN ── */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* model selector */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-800 bg-gray-900">
          <span className="text-gray-500 text-xs mr-1">Model</span>
          {['haiku', 'sonnet'].map(m => (
            <button
              key={m}
              onClick={() => setModel(m)}
              className={`px-3 py-1 rounded-full text-xs transition-colors ${
                model === m
                  ? 'bg-gray-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>

        {/* messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {!selectedThread && (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-600 text-sm">Select or create a thread</p>
            </div>
          )}
          {selectedThread && messagesLoading && (
            <p className="text-gray-600 text-sm text-center">Loading messages…</p>
          )}
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${
                  msg.role === 'user'
                    ? 'bg-gray-700 text-gray-100 rounded-br-sm whitespace-pre-wrap'
                    : msg.role === 'error'
                    ? 'bg-red-900/50 text-red-300 rounded-bl-sm whitespace-pre-wrap'
                    : 'bg-gray-800 text-gray-200 rounded-bl-sm'
                }`}
              >
                <MessageContent content={msg.content} />
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* input */}
        <div className="px-4 py-3 border-t border-gray-800 bg-gray-900">
          <div className="flex gap-2 items-end">
            <textarea
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={!selectedThread || sending}
              placeholder={selectedThread ? 'Message Doug… (Enter to send)' : 'Select a thread first'}
              rows={1}
              className="flex-1 bg-gray-800 text-gray-200 placeholder-gray-600 rounded-xl px-4 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-gray-600 disabled:opacity-40"
              style={{ minHeight: '2.5rem', maxHeight: '8rem' }}
              onInput={e => {
                e.target.style.height = 'auto';
                e.target.style.height = `${Math.min(e.target.scrollHeight, 128)}px`;
              }}
            />
            <button
              onClick={sendMessage}
              disabled={!selectedThread || !draft.trim() || sending}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-30 text-gray-200 rounded-xl text-sm transition-colors whitespace-nowrap"
            >
              {sending ? '…' : 'Send'}
            </button>
          </div>
        </div>
      </main>

      {/* ── RIGHT COLUMN ── */}
      <aside className="w-48 flex flex-col border-l border-gray-800 bg-gray-900">
        <div className="p-3 border-b border-gray-800">
          <p className="text-gray-500 text-xs uppercase tracking-wider">Memory</p>
        </div>
        <div className="p-2 space-y-1">
          {MEMORY_FILES.map(f => (
            <button
              key={f}
              onClick={() => setMemoryFile(f)}
              className="w-full text-left px-3 py-2 text-xs text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded-lg transition-colors font-mono"
            >
              {f}
            </button>
          ))}
        </div>

        {selectedThread && (
          <>
            <div className="mt-auto p-3 border-t border-gray-800">
              <p className="text-gray-500 text-xs uppercase tracking-wider mb-2">Thread</p>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Messages</span>
                  <span className="text-gray-300">{threadMessageCount}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Model</span>
                  <span className="text-gray-300 font-mono truncate max-w-[6rem]">{threadModel}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Cost</span>
                  <span className="text-gray-300 font-mono">{threadCost}</span>
                </div>
              </div>
            </div>
          </>
        )}
      </aside>

      {/* ── MEMORY MODAL ── */}
      {memoryFile && (
        <MemoryModal file={memoryFile} onClose={() => setMemoryFile(null)} />
      )}
    </div>
  );
}
