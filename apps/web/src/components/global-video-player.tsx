'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { ExternalLink, Maximize2, Minimize2, PictureInPicture2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePlayerStore } from '@/store/player-store';

const hlsUrl = process.env.NEXT_PUBLIC_TV_HLS_URL || '';

export function GlobalVideoPlayer() {
  const pathname = usePathname();
  const { videoMode } = usePlayerStore();
  const playerRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const isTv = pathname === '/tv';
  const isAdmin = pathname.startsWith('/admin');

  useEffect(() => {
    const video = videoRef.current;

    if (!video || videoMode === 'AUDIO_ONLY' || !isTv || !hlsUrl) {
      return;
    }

    let cleanup: () => void = () => undefined;
    const controller = new AbortController();
    setIsVideoReady(false);

    async function attachHls() {
      if (!video) {
        return;
      }

      const manifest = await fetch(hlsUrl, { cache: 'no-store', signal: controller.signal }).catch(() => null);
      if (!manifest?.ok) {
        return;
      }

      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = hlsUrl;
        cleanup = () => {
          video.removeAttribute('src');
          video.load();
        };
        return;
      }

      const Hls = (await import('hls.js')).default;
      if (!Hls.isSupported()) {
        return;
      }

      const hls = new Hls({
        lowLatencyMode: false,
        liveSyncDuration: 6,
        liveMaxLatencyDuration: 18,
        maxLiveSyncPlaybackRate: 1.15,
        backBufferLength: 20,
        maxBufferLength: 12
      });
      hls.loadSource(hlsUrl);
      hls.attachMedia(video);
      cleanup = () => hls.destroy();
    }

    void attachHls();
    return () => {
      controller.abort();
      cleanup();
    };
  }, [isTv, videoMode]);

  useEffect(() => {
    function onFullscreenChange() {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }

    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  async function toggleFullscreen() {
    const player = playerRef.current;
    if (!player) {
      return;
    }

    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }

    await player.requestFullscreen();
  }

  async function openPictureInPicture() {
    const video = videoRef.current;
    if (
      !video ||
      !document.pictureInPictureEnabled ||
      video.disablePictureInPicture ||
      video.readyState < HTMLMediaElement.HAVE_METADATA
    ) {
      return;
    }

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        return;
      }

      await video.requestPictureInPicture();
    } catch {
      setIsVideoReady(false);
    }
  }

  if (videoMode === 'AUDIO_ONLY' || isAdmin || !isTv) {
    return null;
  }

  return (
    <section
      ref={playerRef}
      className={cn(
        'video-player-shell overflow-hidden border border-white/20 bg-slate-950 text-white transition-all duration-300',
        'flex w-full flex-col rounded-xl shadow-2xl shadow-slate-950/25 max-w-none'
      )}
    >
      <div className="relative aspect-video w-full min-h-[240px] bg-slate-950 sm:min-h-[440px]">
        <div className="absolute inset-0 signal-grid opacity-[0.16]" />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(9,15,28,0.98)_0%,rgba(15,23,42,0.92)_48%,rgba(19,78,74,0.82)_100%)]" />
        <video
          ref={videoRef}
          autoPlay
          className={cn('absolute inset-0 h-full w-full object-cover transition-opacity duration-300', isVideoReady ? 'opacity-100' : 'opacity-0')}
          controls={isTv}
          muted
          onCanPlay={() => setIsVideoReady(true)}
          onError={() => setIsVideoReady(false)}
          playsInline
        />
        <div className="pointer-events-none absolute right-3 top-3 z-10">
          <span className="tv-video-live-badge">Vivo</span>
        </div>
        <div className={cn('absolute inset-0 transition-opacity duration-300', isVideoReady && 'opacity-0')}>
          <div className="h-full w-full bg-[linear-gradient(135deg,#070d1d_0%,#071021_50%,#0d3938_100%)]" />
        </div>
        <div className="absolute bottom-3 right-3 flex items-center gap-2 sm:bottom-5 sm:right-5">
          <button
            aria-label="Abrir TV"
            className="tv-video-action"
            onClick={() => window.open('/tv', '_self')}
            type="button"
          >
            <ExternalLink className="h-4 w-4" />
          </button>
          <button
            aria-label="Picture in Picture"
            className="tv-video-action hidden disabled:cursor-not-allowed disabled:opacity-45 sm:grid"
            disabled={!isVideoReady}
            onClick={() => void openPictureInPicture()}
            type="button"
          >
            <PictureInPicture2 className="h-4 w-4" />
          </button>
          <button
            aria-label={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
            className="tv-video-action"
            onClick={() => void toggleFullscreen()}
            type="button"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </section>
  );
}
