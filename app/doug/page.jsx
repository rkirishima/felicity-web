'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// ── constants ────────────────────────────────────────────────────────────────

const MEMORY_FILES = ['SOUL', 'IDENTITY', 'MEMORY', 'HEARTBEAT'];

const PROJECTS = [
  { id: 'felicity-web',   name: 'felicity.cafe',      desc: 'Main website — EN/JA, shop, merch, news',         status: 'live',  url: 'https://felicity.cafe',              tech: 'Next.js 16 · Stripe · Supabase' },
  { id: 'felicity-staff', name: 'Felicity Staff',      desc: 'Staff PWA — clock-in, schedules, recipes, admin', status: 'live',  url: 'https://felicity-staff.vercel.app',  tech: 'Next.js · Supabase · TanStack' },
  { id: 'doug',           name: 'Doug AI',             desc: 'Claude-powered assistant — Telegram + web',       status: 'live',  url: '/doug',                              tech: 'Claude · Supabase · PM2' },
  { id: 'print-server',   name: 'Print Server',        desc: 'Food label printer on Raspberry Pi',              status: 'local', url: 'http://192.168.11.28',               tech: 'Python · Flask · Brother QL' },
  { id: 'miura-rally',    name: 'Miura Rally',         desc: 'Stamp rally PWA — Miura Peninsula tour',          status: 'build', url: 'https://tour.felicity.cafe',         tech: 'Vanilla JS · Supabase · Cloudflare' },
  { id: 'immunity-lab',   name: 'Immunity Lab',        desc: 'Clinic marketing site — 免疫ラボ',                status: 'build', url: null,                                 tech: 'Next.js · static' },
  { id: 'ys-body',        name: "Y's Body Factory",    desc: '張力フレックストレーニング® studio — Hayama',     status: 'plan',  url: null,                                 tech: 'Proposal stage' },
];

const STATUS_DOT = { open: 'bg-blue-500', done: 'bg-green-500', waiting: 'bg-yellow-500' };
const PROJECT_DOT = { live: 'bg-green-500', local: 'bg-yellow-500', build: 'bg-gray-600', plan: 'bg-gray-700' };

function relativeTime(ts) {
  if (!ts) return '';
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1)  return 'now';
  if (m < 60) return `${m}m`;
  if (h < 24) return `${h}h`;
  return `${d}d`;
}

// ── markdown renderer ─────────────────────────────────────────────────────────

const mdComponents = {
  code({ node, inline, className, children, ...props }) {
    if (inline) {
      return <code className="bg-gray-700 px-1 py-0.5 rounded text-xs font-mono text-gray-200" {...props}>{children}</code>;
    }
    return (
      <pre className="bg-gray-950 rounded-lg p-3 overflow-x-auto my-2 text-xs">
        <code className="font-mono text-gray-300" {...props}>{children}</code>
      </pre>
    );
  },
  a({ children, href, ...props }) {
    return <a href={href} target="_blank" rel="noreferrer" className="text-blue-400 underline underline-offset-2" {...props}>{children}</a>;
  },
  p({ children }) { return <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>; },
  ul({ children }) { return <ul className="list-disc list-inside mb-2 space-y-0.5">{children}</ul>; },
  ol({ children }) { return <ol className="list-decimal list-inside mb-2 space-y-0.5">{children}</ol>; },
  li({ children }) { return <li className="text-gray-200">{children}</li>; },
  h1({ children }) { return <h1 className="text-sm font-bold mb-2 mt-3 first:mt-0 text-white">{children}</h1>; },
  h2({ children }) { return <h2 className="text-sm font-bold mb-1.5 mt-2.5 first:mt-0 text-white">{children}</h2>; },
  h3({ children }) { return <h3 className="text-xs font-semibold mb-1 mt-2 first:mt-0 text-gray-100 uppercase tracking-wide">{children}</h3>; },
  strong({ children }) { return <strong className="font-semibold text-gray-100">{children}</strong>; },
  em({ children }) { return <em className="italic text-gray-300">{children}</em>; },
  blockquote({ children }) {
    return <blockquote className="border-l-2 border-gray-600 pl-3 text-gray-400 my-2 italic">{children}</blockquote>;
  },
  hr() { return <hr className="border-gray-700 my-3" />; },
  table({ children }) { return <div className="overflow-x-auto my-2"><table className="text-xs border-collapse w-full">{children}</table></div>; },
  th({ children }) { return <th className="border border-gray-700 px-2 py-1 text-left font-semibold text-gray-200 bg-gray-800">{children}</th>; },
  td({ children }) { return <td className="border border-gray-700 px-2 py-1 text-gray-300">{children}</td>; },
};

// ── pin screen ───────────────────────────────────────────────────────────────

function PinScreen({ onUnlock }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  function handleSubmit(e) {
    e.preventDefault();
    if (pin === '4499') { localStorage.setItem('doug_pin', '4499'); onUnlock(); }
    else { setError(true); setPin(''); }
  }
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4">
        <div className="text-gray-400 text-sm tracking-widest uppercase mb-2">Doug</div>
        <input type="password" inputMode="numeric" maxLength={4} value={pin}
          onChange={e => { setPin(e.target.value); setError(false); }} placeholder="PIN" autoFocus
          className="w-32 text-center text-2xl tracking-[0.5em] bg-gray-900 border border-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-gray-500" />
        {error && <p className="text-red-400 text-xs">Incorrect PIN</p>}
        <button type="submit" className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg text-sm transition-colors">Enter</button>
      </form>
    </div>
  );
}

// ── memory modal ─────────────────────────────────────────────────────────────

function MemoryModal({ file, onClose }) {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch(`/api/doug/memory?file=${file}`)
      .then(r => r.json())
      .then(d => setContent(d.error ? `Error: ${d.error}` : d.content))
      .catch(() => setContent('Failed to load'))
      .finally(() => setLoading(false));
  }, [file]);
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-700">
          <span className="text-gray-200 font-mono text-sm">{file}.md</span>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 text-lg leading-none">&times;</button>
        </div>
        <div className="overflow-auto p-5 flex-1">
          {loading ? <p className="text-gray-500 text-sm">Loading…</p>
            : <pre className="text-gray-300 text-xs font-mono whitespace-pre-wrap leading-relaxed">{content}</pre>}
        </div>
      </div>
    </div>
  );
}

// ── thread item ──────────────────────────────────────────────────────────────

function ThreadItem({ thread, isSelected, onSelect, onDelete }) {
  const proj = PROJECTS.find(p => p.id === thread.project_id);
  return (
    <div onClick={onSelect}
      className={`group px-3 py-2.5 cursor-pointer border-b border-gray-800/60 hover:bg-gray-800/60 transition-colors ${isSelected ? 'bg-gray-800' : ''}`}>
      <div className="flex items-center gap-1.5">
        {thread.pinned && <span className="text-yellow-400 text-xs flex-shrink-0">★</span>}
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUS_DOT[thread.status] || 'bg-gray-600'}`} />
        <span className="text-xs text-gray-200 truncate flex-1 font-medium">{thread.title}</span>
        <span className="text-xs text-gray-600 flex-shrink-0 ml-1">{relativeTime(thread.updated_at)}</span>
        <button onClick={e => onDelete(e, thread.id)}
          className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 text-sm leading-none flex-shrink-0 ml-0.5">×</button>
      </div>
      {thread.last_message_preview && (
        <p className="text-xs text-gray-500 truncate mt-0.5 pl-3">{thread.last_message_preview}</p>
      )}
      {proj && (
        <div className="mt-1 pl-3">
          <span className="text-xs px-1.5 py-0.5 rounded-sm bg-gray-800 text-gray-600 border border-gray-700/50">{proj.name}</span>
        </div>
      )}
    </div>
  );
}

// ── search results ────────────────────────────────────────────────────────────

function SearchResults({ results, onSelectThread, query }) {
  if (!query) return null;
  const { threads, messages } = results;
  if (!threads.length && !messages.length) {
    return <p className="text-gray-600 text-xs px-4 py-3">No results for "{query}"</p>;
  }
  return (
    <div>
      {threads.length > 0 && (
        <>
          <p className="text-gray-600 text-xs px-3 py-1.5 uppercase tracking-wider">Threads</p>
          {threads.map(t => (
            <div key={t.id} onClick={() => onSelectThread(t)}
              className="px-3 py-2 cursor-pointer hover:bg-gray-800 border-b border-gray-800/60">
              <p className="text-xs text-gray-200 truncate font-medium">{t.title}</p>
            </div>
          ))}
        </>
      )}
      {messages.length > 0 && (
        <>
          <p className="text-gray-600 text-xs px-3 py-1.5 uppercase tracking-wider mt-1">Messages</p>
          {messages.map(m => (
            <div key={m.id} onClick={() => onSelectThread(m.thread)}
              className="px-3 py-2 cursor-pointer hover:bg-gray-800 border-b border-gray-800/60">
              <p className="text-xs text-gray-400 truncate mb-0.5">{m.thread?.title}</p>
              <p className="text-xs text-gray-500 truncate">{m.content.slice(0, 100)}</p>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

// ── main ─────────────────────────────────────────────────────────────────────

export default function DougPage() {
  const [unlocked, setUnlocked] = useState(false);

  // data
  const [threads, setThreads] = useState([]);
  const [selectedThread, setSelectedThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [threadsLoading, setThreadsLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [monthlyCost, setMonthlyCost] = useState(null);

  // input
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [model, setModel] = useState('haiku');
  const [selectedImage, setSelectedImage] = useState(null); // { file, previewUrl }
  const fileInputRef = useRef(null);

  // voice
  const [isRecording, setIsRecording] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [voiceLang, setVoiceLang] = useState('ja-JP');
  const recognitionRef = useRef(null);

  // mobile navigation: 'threads' | 'chat' | 'info'
  const [mobileView, setMobileView] = useState('threads');

  // right panel
  const [rightTab, setRightTab] = useState('memory');
  const [memoryFile, setMemoryFile] = useState(null);

  // reservations panel
  const [reservations, setReservations] = useState([]);
  const [reservationDate, setReservationDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [reservationsLoading, setReservationsLoading] = useState(false);

  // filter / search
  const [projectFilter, setProjectFilter] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ threads: [], messages: [] });
  const [searching, setSearching] = useState(false);

  const messagesEndRef = useRef(null);
  const searchTimer = useRef(null);
  const isInitialLoad = useRef(false);
  const prevMsgCount = useRef(0);
  const scrollRAF = useRef(null);

  // ── auth ──
  useEffect(() => {
    if (localStorage.getItem('doug_pin') === '4499') setUnlocked(true);
  }, []);

  useEffect(() => {
    if (unlocked) loadThreads();
  }, [unlocked]);

  useEffect(() => {
    if (selectedThread) loadMessages(selectedThread.id);
  }, [selectedThread?.id]);

  // ── reservations ──
  const loadReservations = useCallback(async (date) => {
    setReservationsLoading(true);
    try {
      const res = await fetch(`/api/doug/reservations?date=${date}`);
      const data = await res.json();
      setReservations(data.reservations || []);
    } catch { setReservations([]); }
    finally { setReservationsLoading(false); }
  }, []);

  useEffect(() => {
    if (rightTab === 'reservations') loadReservations(reservationDate);
  }, [rightTab, reservationDate]);

  const updateReservationStatus = async (id, status) => {
    await fetch('/api/doug/reservations', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    loadReservations(reservationDate);
  };

  const shiftDate = (days) => {
    const d = new Date(reservationDate);
    d.setDate(d.getDate() + days);
    setReservationDate(d.toISOString().split('T')[0]);
  };

  // ── scroll: instant on load, smooth on new message, instant on streaming ──
  useEffect(() => {
    if (!messagesEndRef.current || messages.length === 0) return;

    if (scrollRAF.current) cancelAnimationFrame(scrollRAF.current);
    scrollRAF.current = requestAnimationFrame(() => {
      if (!messagesEndRef.current) return;
      if (isInitialLoad.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'instant' });
        isInitialLoad.current = false;
      } else if (messages.length > prevMsgCount.current) {
        // New message added (user or start of assistant reply)
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      } else {
        // Content update during streaming — follow without jank
        messagesEndRef.current.scrollIntoView({ behavior: 'instant' });
      }
      prevMsgCount.current = messages.length;
    });
  }, [messages]);

  // ── search debounce ──
  useEffect(() => {
    clearTimeout(searchTimer.current);
    if (!searchQuery || searchQuery.length < 2) {
      setSearchResults({ threads: [], messages: [] });
      return;
    }
    setSearching(true);
    searchTimer.current = setTimeout(async () => {
      const res = await fetch(`/api/doug/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setSearchResults(data);
      setSearching(false);
    }, 400);
  }, [searchQuery]);

  // ── data loaders ──
  async function loadThreads() {
    setThreadsLoading(true);
    const res = await fetch('/api/doug/threads');
    const data = await res.json();
    const list = Array.isArray(data) ? data : [];
    setThreads(list);
    setThreadsLoading(false);
    const month = new Date().toISOString().slice(0, 7);
    setMonthlyCost(list.filter(t => t.updated_at?.startsWith(month)).reduce((s, t) => s + (t.cost_usd || 0), 0));
  }

  async function loadMessages(threadId) {
    setMessagesLoading(true);
    isInitialLoad.current = true;
    const res = await fetch(`/api/doug/messages?threadId=${threadId}`);
    const data = await res.json();
    setMessages(Array.isArray(data) ? data : []);
    setMessagesLoading(false);
  }

  // ── thread actions ──
  async function createThread(projectId = null) {
    const title = `Thread ${new Date().toLocaleString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`;
    const res = await fetch('/api/doug/threads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, model, project_id: projectId }),
    });
    const data = await res.json();
    if (!data.error) {
      setThreads(prev => [data, ...prev]);
      selectThread(data);
    }
  }

  function selectThread(thread) {
    if (isRecording) stopRecording();
    setSelectedThread(thread);
    setMessages([]);
    prevMsgCount.current = 0;
    setSearchQuery('');
    setMobileView('chat');
  }

  async function deleteThread(e, threadId) {
    e.stopPropagation();
    if (!confirm('Delete this thread?')) return;
    await fetch(`/api/doug/threads?id=${threadId}`, { method: 'DELETE' });
    if (selectedThread?.id === threadId) { setSelectedThread(null); setMessages([]); }
    setThreads(prev => prev.filter(t => t.id !== threadId));
  }

  async function updateThread(updates) {
    const res = await fetch(`/api/doug/threads?id=${selectedThread.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!data.error) {
      setSelectedThread(data);
      setThreads(prev => prev.map(t => t.id === data.id ? data : t));
    }
  }

  // ── image helpers ────────────────────────────────────────────────────────

  // Resize to max 1920px and re-encode as JPEG to stay under Vercel's 4.5MB limit
  async function resizeImage(file) {
    return new Promise(resolve => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const MAX = 1920;
        const scale = Math.min(1, MAX / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width  = Math.round(img.width  * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        canvas.toBlob(blob => resolve(new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' })), 'image/jpeg', 0.85);
      };
      img.src = url;
    });
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const previewUrl = URL.createObjectURL(file);
    setSelectedImage({ file, previewUrl });
  }

  function clearImage() {
    if (selectedImage?.previewUrl) URL.revokeObjectURL(selectedImage.previewUrl);
    setSelectedImage(null);
  }

  // ── voice input ──────────────────────────────────────────────────────────

  function startRecording() {
    const SR = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!SR) {
      alert('Voice input not supported in this browser. Use Safari on iPhone or Chrome on desktop.');
      return;
    }

    const recognition = new SR();
    recognition.lang = voiceLang;
    recognition.interimResults = true;
    recognition.continuous = true;

    let committed = draft;

    recognition.onstart = () => setIsRecording(true);

    recognition.onresult = (event) => {
      let finalPart = '';
      let interimPart = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) finalPart += event.results[i][0].transcript;
        else interimPart += event.results[i][0].transcript;
      }
      if (finalPart) {
        // Japanese doesn't need a space separator; English does
        const sep = committed && voiceLang === 'en-US' && !committed.endsWith(' ') ? ' ' : '';
        committed += sep + finalPart;
        setDraft(committed);
      }
      setInterimText(interimPart);
    };

    recognition.onend = () => { setIsRecording(false); setInterimText(''); };
    recognition.onerror = (e) => {
      if (e.error !== 'no-speech') console.error('Speech recognition error:', e.error);
      setIsRecording(false);
      setInterimText('');
    };

    recognitionRef.current = recognition;
    recognition.start();
  }

  function stopRecording() {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
  }

  function toggleRecording() {
    if (isRecording) stopRecording();
    else startRecording();
  }

  function toggleVoiceLang() {
    if (isRecording) stopRecording();
    setVoiceLang(l => l === 'ja-JP' ? 'en-US' : 'ja-JP');
  }

  // ── send message (streaming) ──────────────────────────────────────────────
  async function sendMessage() {
    if (!draft.trim() && !selectedImage) return;
    if (!selectedThread || sending) return;

    if (isRecording) stopRecording();

    const text = draft.trim();
    setDraft('');
    setSending(true);

    // Upload image first if attached
    let imageUrl = null;
    let imagePreview = null;
    if (selectedImage) {
      imagePreview = selectedImage.previewUrl;
      clearImage();
      try {
        const resized = await resizeImage(selectedImage.file);
        const form = new FormData();
        form.append('file', resized);
        form.append('threadId', selectedThread.id);
        const up = await fetch('/api/doug/upload', { method: 'POST', body: form });
        const upData = await up.json();
        if (upData.error) throw new Error(upData.error);
        imageUrl = upData.url;
      } catch (err) {
        setMessages(prev => [...prev, { id: `err-${Date.now()}`, role: 'error', content: `Upload failed: ${err.message}`, created_at: new Date().toISOString() }]);
        setSending(false);
        return;
      }
    }

    const streamingId = `streaming-${Date.now()}`;

    setMessages(prev => [
      ...prev,
      { id: `opt-${Date.now()}`, role: 'user', content: text, image_url: imageUrl, created_at: new Date().toISOString() },
      { id: streamingId, role: 'assistant', content: '', created_at: new Date().toISOString(), streaming: true },
    ]);

    try {
      const res = await fetch('/api/doug/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threadId: selectedThread.id, message: text, model, imageUrl }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6).trim();
          if (raw === '[DONE]') break;
          try {
            const parsed = JSON.parse(raw);
            if (parsed.error) throw new Error(parsed.error);
            if (parsed.text) {
              setMessages(prev => prev.map(m =>
                m.id === streamingId ? { ...m, content: m.content + parsed.text } : m
              ));
            }
          } catch (e) {
            if (e.message !== 'Unexpected end of JSON input') throw e;
          }
        }
      }

      // Remove streaming flag, then reload from DB (message is now saved)
      setMessages(prev => prev.map(m => m.id === streamingId ? { ...m, streaming: false } : m));
      await loadMessages(selectedThread.id);

      // Refresh thread list (title may have been auto-updated)
      loadThreads().then(() => {
        setThreads(prev => {
          const fresh = prev.find(t => t.id === selectedThread.id);
          if (fresh) setSelectedThread(fresh);
          return prev;
        });
      });

    } catch (err) {
      setMessages(prev => prev.map(m =>
        m.id === streamingId
          ? { id: `err-${Date.now()}`, role: 'error', content: err.message, created_at: new Date().toISOString() }
          : m
      ));
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  // ── project click (from Projects tab) ──
  function handleProjectClick(project) {
    setProjectFilter(project.id);
    setMobileView('threads');
  }

  // ── filtered thread list ──
  const displayThreads = projectFilter
    ? threads.filter(t => t.project_id === projectFilter)
    : threads;

  // ── derived ──
  const threadCost = selectedThread?.cost_usd != null ? `$${Number(selectedThread.cost_usd).toFixed(4)}` : '—';
  const threadModel = selectedThread?.model_used ?? '—';

  if (!unlocked) return <PinScreen onUnlock={() => setUnlocked(true)} />;

  // ── shared sub-sections ──────────────────────────────────────────────────

  const threadListContent = (
    <>
      {/* search */}
      <div className="p-2 border-b border-gray-800 flex-shrink-0">
        <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search…"
          className="w-full bg-gray-800 text-gray-200 placeholder-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-600" />
      </div>
      {/* project filter pills */}
      <div className="flex gap-1.5 px-2 py-2 overflow-x-auto border-b border-gray-800 flex-shrink-0" style={{ scrollbarWidth: 'none' }}>
        <button onClick={() => setProjectFilter(null)}
          className={`flex-shrink-0 px-3 py-1 rounded-full text-xs transition-colors ${!projectFilter ? 'bg-gray-600 text-white' : 'bg-gray-800 text-gray-400'}`}>
          All
        </button>
        {PROJECTS.map(p => (
          <button key={p.id} onClick={() => setProjectFilter(projectFilter === p.id ? null : p.id)}
            className={`flex-shrink-0 px-3 py-1 rounded-full text-xs transition-colors ${projectFilter === p.id ? 'bg-gray-600 text-white' : 'bg-gray-800 text-gray-400'}`}>
            {p.name}
          </button>
        ))}
      </div>
      {/* new thread */}
      <div className="p-2 border-b border-gray-800 flex-shrink-0">
        <button onClick={() => createThread(projectFilter)}
          className="w-full py-2 px-3 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg text-sm transition-colors text-left">
          + New Thread{projectFilter ? ` in ${PROJECTS.find(p => p.id === projectFilter)?.name}` : ''}
        </button>
      </div>
      {/* list */}
      <div className="flex-1 overflow-y-auto">
        {searchQuery ? (
          searching
            ? <p className="text-gray-600 text-sm px-4 py-4">Searching…</p>
            : <SearchResults results={searchResults} query={searchQuery} onSelectThread={t => selectThread(t)} />
        ) : threadsLoading ? (
          <p className="text-gray-600 text-sm px-4 py-4">Loading…</p>
        ) : displayThreads.length === 0 ? (
          <p className="text-gray-600 text-sm px-4 py-4">No threads{projectFilter ? ' for this project' : ''}</p>
        ) : (
          displayThreads.map(thread => (
            <ThreadItem key={thread.id} thread={thread}
              isSelected={selectedThread?.id === thread.id}
              onSelect={() => selectThread(thread)}
              onDelete={deleteThread} />
          ))
        )}
      </div>
      {/* cost footer */}
      <div className="p-3 border-t border-gray-800 flex justify-between items-center flex-shrink-0">
        <p className="text-gray-600 text-xs">This month</p>
        <p className="text-gray-300 text-xs font-mono">{monthlyCost != null ? `$${monthlyCost.toFixed(4)}` : '—'}</p>
      </div>
    </>
  );

  const infoPanelContent = (
    <>
      <div className="flex border-b border-gray-800 flex-shrink-0">
        {['memory', 'projects', 'reservations'].map(tab => (
          <button key={tab} onClick={() => setRightTab(tab)}
            className={`flex-1 py-3 text-xs transition-colors ${rightTab === tab ? 'text-gray-200 border-b border-gray-400' : 'text-gray-600 hover:text-gray-400'}`}>
            {tab === 'reservations' ? '予約' : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>
      {rightTab === 'memory' && (
        <>
          <div className="p-2 space-y-1 flex-1 overflow-y-auto">
            {MEMORY_FILES.map(f => (
              <button key={f} onClick={() => setMemoryFile(f)}
                className="w-full text-left px-3 py-2.5 text-sm text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded-lg transition-colors font-mono">
                {f}
              </button>
            ))}
          </div>
          {selectedThread && (
            <div className="p-3 border-t border-gray-800 flex-shrink-0">
              <p className="text-gray-500 text-xs uppercase tracking-wider mb-2">Thread</p>
              <div className="space-y-1.5">
                {[['Messages', messages.length], ['Model', threadModel], ['Cost', threadCost]].map(([k, v]) => (
                  <div key={k} className="flex justify-between text-xs">
                    <span className="text-gray-600">{k}</span>
                    <span className="text-gray-300 font-mono truncate max-w-[8rem]">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
      {rightTab === 'projects' && (
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {PROJECTS.map(p => (
            <div key={p.id} onClick={() => handleProjectClick(p)}
              className="px-3 py-2.5 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${PROJECT_DOT[p.status]}`} />
                {p.url ? (
                  <a href={p.url} target={p.url.startsWith('http') ? '_blank' : '_self'} rel="noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="text-sm text-gray-200 hover:text-white font-medium truncate">
                    {p.name}
                  </a>
                ) : (
                  <span className="text-sm text-gray-200 font-medium truncate">{p.name}</span>
                )}
              </div>
              <p className="text-xs text-gray-500 leading-snug mb-1">{p.desc}</p>
              <p className="text-xs text-gray-700 font-mono truncate">{p.tech}</p>
            </div>
          ))}
        </div>
      )}
      {rightTab === 'reservations' && (
        <div className="flex-1 overflow-y-auto">
          {/* Date nav */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800">
            <button onClick={() => shiftDate(-1)} className="text-gray-500 hover:text-gray-300 text-sm px-2">←</button>
            <span className="text-xs text-gray-300 font-mono">{reservationDate}</span>
            <button onClick={() => shiftDate(1)} className="text-gray-500 hover:text-gray-300 text-sm px-2">→</button>
          </div>
          {reservationsLoading ? (
            <p className="text-gray-600 text-xs text-center pt-4">Loading…</p>
          ) : reservations.length === 0 ? (
            <p className="text-gray-600 text-xs text-center pt-4">No reservations</p>
          ) : (
            <div className="p-2 space-y-1.5">
              {reservations.map(r => (
                <div key={r.id} className="px-3 py-2.5 rounded-lg bg-gray-800/50 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-200 font-medium">{r.time} — {r.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono uppercase ${
                      r.status === 'confirmed' ? 'bg-green-900/50 text-green-400' :
                      r.status === 'cancelled' ? 'bg-red-900/50 text-red-400' :
                      r.status === 'completed' ? 'bg-gray-700 text-gray-400' :
                      'bg-yellow-900/50 text-yellow-400'
                    }`}>{r.status}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {r.party_size}名{r.floor_preference ? ` · ${r.floor_preference}` : ''} · {r.contact}
                  </div>
                  {r.notes && <p className="text-xs text-gray-600 italic">{r.notes}</p>}
                  {r.status === 'pending' && (
                    <div className="flex gap-2 pt-1">
                      <button onClick={() => updateReservationStatus(r.id, 'confirmed')}
                        className="text-[10px] px-2 py-1 rounded bg-green-900/30 text-green-400 hover:bg-green-900/50 transition-colors">
                        Confirm
                      </button>
                      <button onClick={() => updateReservationStatus(r.id, 'cancelled')}
                        className="text-[10px] px-2 py-1 rounded bg-red-900/30 text-red-400 hover:bg-red-900/50 transition-colors">
                        Cancel
                      </button>
                    </div>
                  )}
                  {r.status === 'confirmed' && (
                    <div className="flex gap-2 pt-1">
                      <button onClick={() => updateReservationStatus(r.id, 'completed')}
                        className="text-[10px] px-2 py-1 rounded bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors">
                        Complete
                      </button>
                      <button onClick={() => updateReservationStatus(r.id, 'cancelled')}
                        className="text-[10px] px-2 py-1 rounded bg-red-900/30 text-red-400 hover:bg-red-900/50 transition-colors">
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );

  const chatContent = (
    <>
      {/* messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {!selectedThread ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-600 text-sm">Select or create a thread</p>
          </div>
        ) : messagesLoading ? (
          <p className="text-gray-600 text-sm text-center pt-8">Loading…</p>
        ) : messages.length === 0 ? (
          <p className="text-gray-600 text-sm text-center pt-8">Start the conversation</p>
        ) : (
          messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[78%] rounded-2xl text-sm leading-relaxed overflow-hidden ${
                msg.role === 'user'  ? 'bg-gray-700 text-gray-100 rounded-br-sm' :
                msg.role === 'error' ? 'bg-red-900/50 text-red-300 rounded-bl-sm px-4 py-2.5 whitespace-pre-wrap' :
                                      'bg-gray-800 text-gray-200 rounded-bl-sm'
              }`}>
                {msg.image_url && (
                  <a href={msg.image_url} target="_blank" rel="noreferrer">
                    <img src={msg.image_url} alt="Attached" className="w-full max-h-72 object-cover block" />
                  </a>
                )}
                {(msg.content || msg.streaming) && (
                  <div className="px-4 py-2.5">
                    {msg.role === 'assistant' ? (
                      <>
                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                          {msg.content}
                        </ReactMarkdown>
                        {msg.streaming && <span className="inline-block w-0.5 h-3.5 bg-gray-400 ml-0.5 align-middle animate-pulse" />}
                      </>
                    ) : (
                      <span className="whitespace-pre-wrap">{msg.content}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* model / status bar */}
      <div className="flex items-center gap-2 px-4 py-1.5 border-t border-gray-800 bg-gray-900 flex-shrink-0">
        <span className="text-gray-600 text-xs">Model</span>
        {['haiku', 'sonnet'].map(m => (
          <button key={m} onClick={() => setModel(m)}
            className={`px-2.5 py-0.5 rounded-full text-xs transition-colors ${model === m ? 'bg-gray-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
            {m.charAt(0).toUpperCase() + m.slice(1)}
          </button>
        ))}
        {selectedThread && (
          <>
            <div className="flex-1" />
            <select value={selectedThread.status || 'open'} onChange={e => updateThread({ status: e.target.value })}
              className="text-xs bg-gray-800 text-gray-400 border border-gray-700 rounded px-2 py-0.5 focus:outline-none">
              <option value="open">Open</option>
              <option value="done">Done</option>
              <option value="waiting">Waiting</option>
            </select>
            <button onClick={() => updateThread({ pinned: !selectedThread.pinned })}
              className={`text-sm px-1 ${selectedThread.pinned ? 'text-yellow-400' : 'text-gray-600 hover:text-gray-400'}`}>★</button>
          </>
        )}
      </div>

      {/* input */}
      <div className="px-4 pt-2 pb-3 border-t border-gray-800 bg-gray-900 flex-shrink-0"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
        {selectedImage && (
          <div className="mb-2 relative inline-block">
            <img src={selectedImage.previewUrl} alt="Preview" className="h-20 w-20 object-cover rounded-xl" />
            <button onClick={clearImage}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-600 hover:bg-gray-500 text-white rounded-full text-xs leading-none flex items-center justify-center">×</button>
          </div>
        )}
        {isRecording && (
          <div className="mb-1.5 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
            <span className="text-xs text-gray-400 italic truncate">{interimText || 'Listening…'}</span>
          </div>
        )}
        <div className="flex gap-2 items-end">
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          {/* attach */}
          <button onClick={() => fileInputRef.current?.click()} disabled={!selectedThread || sending}
            className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-gray-800 hover:bg-gray-700 disabled:opacity-30 text-gray-400 hover:text-gray-200 rounded-xl transition-colors" title="Attach image">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
            </svg>
          </button>
          {/* mic */}
          <div className="flex-shrink-0 flex flex-col items-center gap-0.5">
            <button onClick={toggleRecording} disabled={!selectedThread || sending}
              className={`w-10 h-10 flex items-center justify-center rounded-xl transition-colors disabled:opacity-30 ${
                isRecording ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-gray-200'
              }`}>
              {isRecording ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><rect x="6" y="6" width="12" height="12" rx="1"/></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
                </svg>
              )}
            </button>
            <button onClick={toggleVoiceLang} className="text-[9px] text-gray-600 hover:text-gray-400 transition-colors leading-none tracking-wide">
              {voiceLang === 'ja-JP' ? 'JA' : 'EN'}
            </button>
          </div>
          <textarea value={draft} onChange={e => { if (!isRecording) setDraft(e.target.value); }} onKeyDown={handleKeyDown}
            disabled={!selectedThread || sending}
            placeholder={!selectedThread ? 'Select a thread first' : selectedImage ? 'Add a message… (optional)' : isRecording ? '' : 'Message Doug…'}
            rows={1}
            className="flex-1 bg-gray-800 text-gray-200 placeholder-gray-600 rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-gray-600 disabled:opacity-40"
            style={{ minHeight: '2.75rem', maxHeight: '8rem' }}
            onInput={e => { e.target.style.height = 'auto'; e.target.style.height = `${Math.min(e.target.scrollHeight, 128)}px`; }} />
          <button onClick={sendMessage} disabled={!selectedThread || (!draft.trim() && !selectedImage) || sending}
            className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-gray-700 hover:bg-gray-600 disabled:opacity-30 text-gray-200 rounded-xl text-sm transition-colors">
            {sending ? '…' : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 -rotate-90">
                <line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>
              </svg>
            )}
          </button>
        </div>
      </div>
    </>
  );

  // ── layout ───────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen bg-gray-950 text-gray-200 overflow-hidden">

      {/* ── MOBILE: thread list view ─────────────────────────────────────── */}
      <div className={`flex flex-col w-full bg-gray-900 md:hidden ${mobileView === 'threads' ? 'flex' : 'hidden'}`}>
        {/* header */}
        <div className="flex items-center justify-between px-4 bg-gray-900 border-b border-gray-800 flex-shrink-0"
          style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))', paddingBottom: '0.75rem' }}>
          <span className="text-base font-semibold text-gray-100">Doug</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setMobileView('info')} className="text-gray-400 hover:text-gray-200 p-1">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </button>
            <button onClick={() => createThread(projectFilter)}
              className="w-8 h-8 flex items-center justify-center bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg text-lg leading-none">+</button>
          </div>
        </div>
        {threadListContent}
      </div>

      {/* ── MOBILE: chat view ────────────────────────────────────────────── */}
      <div className={`flex-col w-full bg-gray-950 md:hidden ${mobileView === 'chat' ? 'flex' : 'hidden'}`}>
        {/* header */}
        <div className="flex items-center gap-3 px-4 bg-gray-900 border-b border-gray-800 flex-shrink-0"
          style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))', paddingBottom: '0.75rem' }}>
          <button onClick={() => setMobileView('threads')} className="text-gray-400 hover:text-gray-200 p-1 -ml-1">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <span className="text-sm font-medium text-gray-200 flex-1 truncate">{selectedThread?.title || 'Doug'}</span>
          <button onClick={() => setMobileView('info')} className="text-gray-400 hover:text-gray-200 p-1">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
            </svg>
          </button>
        </div>
        {chatContent}
      </div>

      {/* ── MOBILE: info view ────────────────────────────────────────────── */}
      <div className={`flex-col w-full bg-gray-900 md:hidden ${mobileView === 'info' ? 'flex' : 'hidden'}`}>
        {/* header */}
        <div className="flex items-center gap-3 px-4 bg-gray-900 border-b border-gray-800 flex-shrink-0"
          style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))', paddingBottom: '0.75rem' }}>
          <button onClick={() => setMobileView(selectedThread ? 'chat' : 'threads')} className="text-gray-400 hover:text-gray-200 p-1 -ml-1">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <span className="text-sm font-medium text-gray-200">Memory &amp; Projects</span>
        </div>
        {infoPanelContent}
      </div>

      {/* ── DESKTOP: three-column layout ─────────────────────────────────── */}
      {/* Left: thread list */}
      <aside className="hidden md:flex md:flex-col md:w-64 md:flex-shrink-0 bg-gray-900 border-r border-gray-800">
        {threadListContent}
      </aside>

      {/* Center: chat */}
      <main className="hidden md:flex md:flex-col md:flex-1 md:min-w-0">
        {/* desktop thread header */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-800 bg-gray-900 flex-shrink-0">
          {selectedThread ? (
            <>
              <span className="text-sm font-medium text-gray-200 flex-1 truncate">{selectedThread.title}</span>
              <select value={selectedThread.status || 'open'} onChange={e => updateThread({ status: e.target.value })}
                className="text-xs bg-gray-800 text-gray-400 border border-gray-700 rounded px-2 py-1 focus:outline-none">
                <option value="open">Open</option>
                <option value="done">Done</option>
                <option value="waiting">Waiting</option>
              </select>
              <button onClick={() => updateThread({ pinned: !selectedThread.pinned })}
                className={`text-sm px-1 ${selectedThread.pinned ? 'text-yellow-400' : 'text-gray-600 hover:text-gray-400'}`}>★</button>
              <div className="w-px h-4 bg-gray-700 mx-1" />
            </>
          ) : <span className="flex-1" />}
          <span className="text-gray-500 text-xs">Model</span>
          {['haiku', 'sonnet'].map(m => (
            <button key={m} onClick={() => setModel(m)}
              className={`px-3 py-1 rounded-full text-xs transition-colors ${model === m ? 'bg-gray-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>
        {chatContent}
      </main>

      {/* Right: info panel */}
      <aside className="hidden md:flex md:flex-col md:w-56 md:flex-shrink-0 bg-gray-900 border-l border-gray-800">
        {infoPanelContent}
      </aside>

      {memoryFile && <MemoryModal file={memoryFile} onClose={() => setMemoryFile(null)} />}
    </div>
  );
}
