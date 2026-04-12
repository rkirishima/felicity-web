'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface CafeChatProps {
  locale: 'ja' | 'en';
}

export function CafeChat({ locale }: CafeChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const greeting =
    locale === 'ja'
      ? 'Felicityへようこそ！カフェについて何でもお気軽にどうぞ。ご予約も承ります。'
      : 'Welcome to Felicity! Ask me anything about our cafe, or make a reservation.';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMessage: Message = { role: 'user', content: text };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    // Add empty assistant message for streaming
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages }),
      });

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error('No reader');

      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6);
          if (data === '[DONE]') break;

          try {
            const parsed = JSON.parse(data);
            if (parsed.text) {
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last?.role === 'assistant') {
                  updated[updated.length - 1] = {
                    ...last,
                    content: last.content + parsed.text,
                  };
                }
                return updated;
              });
            }
          } catch {
            // skip malformed chunks
          }
        }
      }
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last?.role === 'assistant' && !last.content) {
          updated[updated.length - 1] = {
            ...last,
            content:
              locale === 'ja'
                ? '申し訳ありません。エラーが発生しました。もう一度お試しください。'
                : 'Sorry, something went wrong. Please try again.',
          };
        }
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[360px] sm:h-[400px] bg-[#F4EFE4] border border-[#DDD5C5] rounded-sm overflow-hidden">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {/* Greeting */}
        <div className="flex justify-start">
          <div className="max-w-[85%] px-3 py-2 rounded-sm bg-[#EDE5D8] text-[#2C2416]">
            <p className="text-[14px] leading-relaxed">{greeting}</p>
          </div>
        </div>

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] px-3 py-2 rounded-sm ${
                msg.role === 'user'
                  ? 'bg-[#7AAFC4] text-white'
                  : 'bg-[#EDE5D8] text-[#2C2416]'
              }`}
            >
              <p className="text-[14px] leading-relaxed whitespace-pre-wrap">
                {msg.content}
                {msg.role === 'assistant' && !msg.content && isLoading && (
                  <span className="inline-block w-1.5 h-4 bg-[#8C7B6B] animate-pulse ml-0.5 align-middle" />
                )}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-[#DDD5C5] px-3 py-3 bg-[#EDE5D8]">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              locale === 'ja'
                ? 'メッセージを入力...'
                : 'Type a message...'
            }
            rows={1}
            className="flex-1 resize-none bg-[#F4EFE4] border border-[#DDD5C5] rounded-sm px-3 py-2 text-[14px] text-[#2C2416] placeholder-[#C8B89A] focus:outline-none focus:border-[#7AAFC4] transition-colors"
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-sm bg-[#7AAFC4] text-white disabled:opacity-40 hover:bg-[#6a9fb4] transition-colors"
            aria-label={locale === 'ja' ? '送信' : 'Send'}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 2 11 13" />
              <path d="M22 2 15 22 11 13 2 9z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
