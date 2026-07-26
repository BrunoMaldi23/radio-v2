'use client';

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { MessageCircle, Send } from 'lucide-react';
import { API_URL, api, type ChatMessage as ApiChatMessage } from '@/lib/api';
import { cn } from '@/lib/utils';

type ChatMessage = {
  id: string | number;
  author: string;
  text: string;
  time: string;
  tone: 'amber' | 'teal' | 'rose' | 'slate';
};

type ChatStatus = 'connecting' | 'live' | 'syncing' | 'offline';

const starterMessages: ChatMessage[] = [
  {
    id: 'welcome',
    author: 'Radio Hit',
    text: 'Bienvenidos a la senal en vivo.',
    time: 'Ahora',
    tone: 'amber'
  },
  {
    id: 'ranking',
    author: 'Cabina',
    text: 'Pidan sus canciones y comenten el programa.',
    time: 'Ahora',
    tone: 'teal'
  }
];

const toneClasses = {
  amber: 'bg-rose-400 text-white',
  teal: 'bg-rose-400 text-white',
  rose: 'bg-rose-400 text-white',
  slate: 'bg-slate-700 text-white'
};

function getInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function messageTone(author: string): ChatMessage['tone'] {
  const tones: ChatMessage['tone'][] = ['amber', 'teal', 'rose', 'slate'];
  const index = author.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) % tones.length;
  return tones[index];
}

function mapApiMessage(message: ApiChatMessage): ChatMessage {
  return {
    id: message.id,
    author: message.author,
    text: message.message,
    time: new Intl.DateTimeFormat('es-CL', { hour: '2-digit', minute: '2-digit' }).format(new Date(message.createdAt)),
    tone: messageTone(message.author)
  };
}

function createOptimisticMessage(author: string, text: string): ChatMessage {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    author,
    text,
    time: new Intl.DateTimeFormat('es-CL', { hour: '2-digit', minute: '2-digit' }).format(new Date()),
    tone: messageTone(author)
  };
}

function mergeMessages(current: ChatMessage[], incoming: ChatMessage[]) {
  const messagesById = new Map<string | number, ChatMessage>();

  for (const message of [...current, ...incoming]) {
    messagesById.set(message.id, message);
  }

  return Array.from(messagesById.values()).slice(-100);
}

function getSocketTarget() {
  if (!API_URL || API_URL === '/api') {
    return undefined;
  }

  return API_URL.replace(/\/api\/?$/, '');
}

export function TvLiveChat() {
  const [author, setAuthor] = useState('Invitado');
  const [text, setText] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>(starterMessages);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<ChatStatus>('connecting');
  const listRef = useRef<HTMLDivElement>(null);
  const canSend = text.trim().length > 0 && author.trim().length > 0;

  const refreshMessages = useCallback(async (showSync = false) => {
    if (showSync) {
      setStatus('syncing');
    }

    try {
      const items = await api.chatMessages('tv');
      const mapped = items.map(mapApiMessage);
      setMessages((current) =>
        mapped.length
          ? mergeMessages(current.filter((message) => !String(message.id).startsWith('starter-') && message.id !== 'welcome' && message.id !== 'ranking'), mapped)
          : current
      );
      setError(null);
      setStatus('live');
    } catch {
      setStatus('offline');
      setError('Reconectando el chat en vivo.');
    }
  }, []);

  useEffect(() => {
    void refreshMessages(true);

    const socket = io(getSocketTarget(), {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 800,
      reconnectionDelayMax: 3000
    });

    socket.on('connect', () => {
      setStatus('live');
      void refreshMessages();
    });

    socket.on('disconnect', () => {
      setStatus('offline');
    });

    socket.on('chat.message', (message: ApiChatMessage) => {
      if (message.room !== 'tv') {
        return;
      }

      setMessages((current) => mergeMessages(current, [mapApiMessage(message)]));
      setError(null);
      setStatus('live');
    });

    const refreshTimer = window.setInterval(() => {
      void refreshMessages();
    }, 3500);

    return () => {
      window.clearInterval(refreshTimer);
      socket.disconnect();
    };
  }, [refreshMessages]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const visibleMessages = useMemo(() => messages.slice(-60), [messages]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSend) {
      return;
    }

    const cleanAuthor = author.trim();
    const cleanText = text.trim();
    const optimistic = createOptimisticMessage(cleanAuthor, cleanText);
    setMessages((current) => [...current, optimistic].slice(-100));
    setText('');
    setError(null);

    try {
      const saved = await api.sendChatMessage({ author: cleanAuthor, message: cleanText, room: 'tv' });
      setMessages((current) => current.map((item) => (item.id === optimistic.id ? mapApiMessage(saved) : item)));
      void refreshMessages();
    } catch {
      setMessages((current) => current.filter((item) => item.id !== optimistic.id));
      setError('No se pudo enviar el mensaje.');
      setText(cleanText);
    }
  }

  const statusLabel =
    status === 'live'
      ? 'Vivo'
      : status === 'syncing'
        ? 'Sync'
        : status === 'connecting'
          ? 'Conectando'
          : 'Reconectando';

  return (
    <aside className="tv-chat-panel grid overflow-hidden">
      <div className="tv-chat-head flex items-center justify-between gap-3 border-b px-3 py-2.5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-950 text-cyan-300">
            <MessageCircle className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-black leading-tight text-slate-950">Chat en vivo</h2>
            <p className="mt-0.5 text-[11px] font-black text-rose-500">Radio Labranza FM+</p>
          </div>
        </div>
        <span className={cn('tv-chat-status', status !== 'live' && 'is-syncing')}>
          {statusLabel}
        </span>
      </div>

      <div ref={listRef} className="admin-scroll min-h-0 overflow-y-auto px-3 py-2.5">
        <div className="grid gap-2.5">
          {visibleMessages.map((message) => (
            <article className="grid grid-cols-[2rem_minmax(0,1fr)] gap-2" key={message.id}>
              <span className={cn('grid h-7 w-7 place-items-center rounded-md text-[11px] font-black shadow-sm', toneClasses[message.tone])}>
                {getInitials(message.author)}
              </span>
              <div className="min-w-0">
                <div className="flex min-w-0 items-baseline gap-2">
                  <p className="truncate text-[12px] font-black text-slate-950">{message.author}</p>
                  <span className="shrink-0 text-[9px] font-black text-slate-400">{message.time}</span>
                </div>
                <p className="mt-0.5 break-words text-[11px] font-semibold leading-4 text-slate-600">{message.text}</p>
              </div>
            </article>
          ))}
        </div>
      </div>

      <form className="mt-auto grid gap-2 border-t bg-slate-50/80 p-2.5" onSubmit={handleSubmit}>
        {error && <p className="rounded-md bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">{error}</p>}
        <input
          aria-label="Nombre"
          className="tv-chat-input h-11 rounded-lg"
          maxLength={28}
          onChange={(event) => setAuthor(event.target.value)}
          placeholder="Nombre"
          value={author}
        />
        <div className="flex gap-2">
          <input
            aria-label="Mensaje"
            className="tv-chat-input h-11 min-w-0 rounded-lg"
            maxLength={180}
            onChange={(event) => setText(event.target.value)}
            placeholder="Escribe en el chat"
            value={text}
          />
          <button
            aria-label="Enviar mensaje"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-amber-400 text-slate-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!canSend}
            type="submit"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </aside>
  );
}
