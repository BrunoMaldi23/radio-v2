'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2, Pause, Play, RotateCcw, Share2, Tv, Volume2, VolumeX, WifiOff } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { usePlayerStore } from '@/store/player-store';

const icecastUrl = process.env.NEXT_PUBLIC_ICECAST_URL || '';
type AudioStatus = 'idle' | 'connecting' | 'playing' | 'buffering' | 'error';

function liveStreamUrl() {
  if (!icecastUrl) return '';
  const joiner = icecastUrl.includes('?') ? '&' : '?';
  return `${icecastUrl}${joiner}t=${Date.now()}`;
}

export function GlobalAudioPlayer() {
  const pathname = usePathname();
  const router = useRouter();
  const audioRef = useRef<HTMLAudioElement>(null);
  const retryTimerRef = useRef<number | null>(null);
  const playRequestRef = useRef(0);
  const [audioStatus, setAudioStatus] = useState<AudioStatus>('idle');
  const [attempt, setAttempt] = useState(0);
  const { currentTrack, isPlaying, isLive, setPlaying, volume, setVolume, videoMode, setVideoMode } =
    usePlayerStore();

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    audio.volume = volume / 100;
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    if (!icecastUrl) {
      setAudioStatus('error');
      setPlaying(false);
      return;
    }

    if (isPlaying) {
      const requestId = playRequestRef.current + 1;
      playRequestRef.current = requestId;
      setAudioStatus((current) => (current === 'playing' ? 'playing' : 'connecting'));

      if (!audio.src || audio.error || audio.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) {
        audio.src = liveStreamUrl();
      }

      audio.load();
      void audio.play().catch(() => {
        if (playRequestRef.current !== requestId) return;
        setAudioStatus('error');
        setPlaying(false);
      });
      return;
    }

    playRequestRef.current += 1;
    audio.pause();
    setAudioStatus('idle');
  }, [isPlaying, setPlaying, attempt]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const clearRetry = () => {
      if (!retryTimerRef.current) return;
      window.clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    };

    const reconnectSoon = () => {
      if (!isPlaying || retryTimerRef.current) return;
      setAudioStatus('buffering');
      retryTimerRef.current = window.setTimeout(() => {
        retryTimerRef.current = null;
        if (!audioRef.current || !usePlayerStore.getState().isPlaying) return;
        audioRef.current.src = liveStreamUrl();
        setAttempt((value) => value + 1);
      }, 2600);
    };

    const onLoadStart = () => setAudioStatus((current) => (current === 'playing' ? 'playing' : 'connecting'));
    const onWaiting = () => setAudioStatus((current) => (current === 'playing' ? 'buffering' : 'connecting'));
    const onStalled = reconnectSoon;
    const onPlaying = () => {
      clearRetry();
      setAudioStatus('playing');
      if (!usePlayerStore.getState().isPlaying) setPlaying(true);
    };
    const onPause = () => {
      clearRetry();
      if (!usePlayerStore.getState().isPlaying) setAudioStatus('idle');
    };
    const onError = () => {
      setAudioStatus('error');
      reconnectSoon();
    };

    audio.addEventListener('loadstart', onLoadStart);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('stalled', onStalled);
    audio.addEventListener('suspend', onStalled);
    audio.addEventListener('playing', onPlaying);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('error', onError);

    return () => {
      clearRetry();
      audio.removeEventListener('loadstart', onLoadStart);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('stalled', onStalled);
      audio.removeEventListener('suspend', onStalled);
      audio.removeEventListener('playing', onPlaying);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('error', onError);
    };
  }, [isPlaying, setPlaying]);

  function reconnectLive() {
    const audio = audioRef.current;

    if (audio) {
      audio.src = liveStreamUrl();
      audio.load();
    }

    setAudioStatus('connecting');
    setAttempt((value) => value + 1);
    setPlaying(true);
    toast.message('Reconectando senal', {
      description: 'Actualizando la transmision sin recargar la pagina.'
    });
  }

  function toggleAudio() {
    const audio = audioRef.current;
    if (isPlaying && audioStatus !== 'error') {
      setPlaying(false);
      return;
    }

    if (audioStatus === 'error') {
      reconnectLive();
      return;
    }

    if (audio) audio.src = liveStreamUrl();
    setAttempt((value) => value + 1);
    setPlaying(true);
  }

  function handleVideoMode() {
    if (videoMode === 'AUDIO_ONLY') {
      setVideoMode('FULLSCREEN');
      if (pathname !== '/tv') {
        router.push('/tv');
        window.requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0, behavior: 'instant' }));
      } else {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      }
      return;
    }

    setVideoMode('AUDIO_ONLY');
  }

  function toggleMute() {
    setVolume(volume > 0 ? 0 : 72);
  }

  async function shareLive() {
    const shareUrl = typeof window !== 'undefined' ? window.location.origin : 'https://radio-labranza-fm.vercel.app';
    const title = 'Radio Hit 90 y 2000';

    try {
      if (navigator.share) {
        await navigator.share({ title, text: 'Escucha Radio Hit 90 y 2000 en vivo', url: shareUrl });
        toast.success('Enlace compartido');
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Enlace copiado', {
          description: 'Ya puedes enviarlo para escuchar la radio en vivo.'
        });
      }
    } catch {
      toast.error('No se pudo compartir', {
        description: 'Intentalo nuevamente desde el boton de compartir.'
      });
    }
  }

  const coverUrl = currentTrack.coverUrl || '/logo-home.jpeg';
  const isBusy = audioStatus === 'connecting' || audioStatus === 'buffering';
  const canReconnect = audioStatus === 'error' || audioStatus === 'buffering';
  const statusMeta =
    audioStatus === 'playing'
      ? { label: 'En vivo', detail: 'senal estable' }
      : audioStatus === 'connecting'
        ? { label: 'Conectando', detail: 'buscando senal' }
        : audioStatus === 'buffering'
          ? { label: 'Recuperando', detail: 'ajustando buffer' }
          : audioStatus === 'error'
            ? { label: 'Reconectar', detail: 'senal interrumpida' }
            : { label: 'Listo', detail: 'tocar para escuchar' };
  const statusLabel =
    audioStatus === 'playing'
      ? 'En vivo'
      : audioStatus === 'connecting'
        ? 'Conectando'
        : audioStatus === 'buffering'
          ? 'Recuperando senal'
          : audioStatus === 'error'
            ? 'Reintentar senal'
            : 'Tocar para escuchar';
  const PlayIcon = isBusy ? Loader2 : audioStatus === 'error' ? RotateCcw : isPlaying ? Pause : Play;

  return (
    <aside className="fixed inset-x-0 bottom-0 z-50 border-t border-amber-300/40 bg-slate-950 text-white shadow-2xl shadow-slate-950/50" data-global-audio-player>
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/80 to-transparent" />
      <audio crossOrigin="anonymous" preload="metadata" ref={audioRef} />
      <div className="mx-auto grid min-h-[68px] max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-3 py-2.5 sm:min-h-[74px] sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:px-5 lg:px-8">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-white/15 bg-white p-1.5 shadow-md shadow-black/30 ring-1 ring-amber-200/30 sm:h-12 sm:w-12">
            <img src={coverUrl} alt="" className="max-h-full max-w-full object-contain" />
          </span>
          <div className="min-w-0">
            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-amber-300">Senal en vivo</p>
            <p className="truncate text-sm font-black leading-tight text-white">{currentTrack.title}</p>
            <p className="truncate text-xs font-semibold text-slate-300">{statusLabel} · {currentTrack.artist}</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 sm:justify-center">
          <Button
            aria-label={isPlaying ? 'Pausar transmision' : 'Reproducir transmision'}
            className="h-11 w-11 shrink-0 rounded-full bg-amber-400 p-0 text-slate-950 shadow-lg shadow-amber-950/30 transition hover:scale-[1.03] hover:bg-amber-300 disabled:cursor-wait disabled:opacity-80"
            onClick={toggleAudio}
          >
            <span className="grid h-5 w-5 place-items-center">
              <PlayIcon className={`h-5 w-5 ${isBusy ? 'animate-spin' : ''}`} />
            </span>
          </Button>
          {isLive && (
            <span
              aria-live="polite"
              className={`hidden h-8 w-32 shrink-0 items-center justify-center gap-2 rounded-full border px-3 text-[11px] font-black uppercase tracking-normal sm:inline-flex ${audioStatus === 'playing' ? 'border-rose-300/40 bg-rose-500/20 text-rose-100' : audioStatus === 'error' ? 'border-amber-300/40 bg-amber-500/15 text-amber-100' : 'border-white/15 bg-white/10 text-slate-200'}`}
              title={statusMeta.detail}
            >
              {audioStatus === 'error' ? (
                <WifiOff className="h-3.5 w-3.5" />
              ) : (
                <span className={`h-2 w-2 rounded-full ${audioStatus === 'playing' ? 'bg-rose-400 live-dot' : 'bg-amber-300'}`} />
              )}
              {statusMeta.label}
            </span>
          )}
        </div>

        <div className="hidden min-w-0 items-center justify-start gap-2 sm:flex sm:justify-end">
          <Button
            aria-label={volume > 0 ? 'Silenciar radio' : 'Restaurar volumen'}
            className="h-9 w-9 shrink-0 border-white/10 bg-white/10 p-0 text-white hover:bg-white/20"
            onClick={toggleMute}
            title={volume > 0 ? 'Silenciar radio' : 'Restaurar volumen'}
            variant="outline"
          >
            {volume > 0 ? <Volume2 className="h-4 w-4 text-amber-200" /> : <VolumeX className="h-4 w-4 text-amber-200" />}
          </Button>
          <label className="hidden h-9 items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 transition hover:border-amber-300/35 hover:bg-white/15 md:flex" title="Volumen de la radio">
            <Volume2 className="h-4 w-4 text-amber-200" />
            <input
              aria-label="Volumen"
              className="h-1.5 w-24 accent-amber-400 lg:w-28"
              max={100}
              min={0}
              onChange={(event) => setVolume(Number(event.target.value))}
              type="range"
              value={volume}
            />
          </label>
          <Button
            aria-label="Reconectar senal"
            className={`h-9 w-9 shrink-0 border-amber-300/30 p-0 text-amber-100 hover:bg-amber-400/25 ${canReconnect ? 'bg-amber-400/20' : 'bg-white/10'}`}
            onClick={reconnectLive}
            title="Reconectar la senal en vivo"
            variant="outline"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            className="h-9 shrink-0 border-white/10 bg-white/10 px-3 text-sm font-bold text-white hover:bg-white/20"
            onClick={handleVideoMode}
            title={videoMode === 'AUDIO_ONLY' ? 'Abrir TV en vivo' : 'Mantener solo audio'}
            variant="outline"
          >
            <Tv className="h-4 w-4" />
            {videoMode === 'AUDIO_ONLY' ? 'Ver TV' : 'Solo audio'}
          </Button>
          <Button
            aria-label="Compartir radio en vivo"
            className="h-9 w-9 shrink-0 border-white/10 bg-white/10 p-0 text-white hover:bg-white/20"
            onClick={() => void shareLive()}
            title="Compartir radio en vivo"
            variant="outline"
          >
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
