'use client';

import { useEffect, useLayoutEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Toaster } from 'sonner';
import { GlobalAudioPlayer } from '@/components/global-audio-player';
import { GlobalVideoPlayer } from '@/components/global-video-player';
import { SiteFooter } from '@/components/site-footer';
import { SiteNavbar } from '@/components/site-navbar';
import { TvLiveChat } from '@/components/tv-live-chat';

export function RootLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith('/admin');
  const isTv = pathname === '/tv';

  useLayoutEffect(() => {
    if (!isTv) {
      return;
    }

    const root = document.documentElement;
    const body = document.body;
    const previousRootOverflow = root.style.overflow;
    const previousBodyOverflow = body.style.overflow;
    let frame = 0;

    const updateTvViewport = () => {
      const header = document.querySelector<HTMLElement>('.hit-header');
      const audioPlayer = document.querySelector<HTMLElement>('[data-global-audio-player]');
      const headerBottom = header?.getBoundingClientRect().bottom ?? 0;
      const audioTop = audioPlayer?.getBoundingClientRect().top ?? window.innerHeight;
      const availableHeight = Math.max(240, audioTop - headerBottom);

      root.style.setProperty('--tv-main-height', `${availableHeight}px`);
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    };
    const scheduleUpdate = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(updateTvViewport);
    };

    root.style.overflow = 'hidden';
    body.style.overflow = 'hidden';

    updateTvViewport();
    scheduleUpdate();

    const resizeObserver = new ResizeObserver(scheduleUpdate);
    const header = document.querySelector<HTMLElement>('.hit-header');
    const audioPlayer = document.querySelector<HTMLElement>('[data-global-audio-player]');
    if (header) resizeObserver.observe(header);
    if (audioPlayer) resizeObserver.observe(audioPlayer);

    const timers = [80, 180, 360, 720].map((delay) => window.setTimeout(scheduleUpdate, delay));
    window.addEventListener('resize', scheduleUpdate);
    window.visualViewport?.addEventListener('resize', scheduleUpdate);
    window.visualViewport?.addEventListener('scroll', scheduleUpdate);

    return () => {
      window.cancelAnimationFrame(frame);
      timers.forEach((timer) => window.clearTimeout(timer));
      resizeObserver.disconnect();
      window.removeEventListener('resize', scheduleUpdate);
      window.visualViewport?.removeEventListener('resize', scheduleUpdate);
      window.visualViewport?.removeEventListener('scroll', scheduleUpdate);
      root.style.removeProperty('--tv-main-height');
      root.style.overflow = previousRootOverflow;
      body.style.overflow = previousBodyOverflow;
    };
  }, [isTv]);

  return (
    <>
      {!isAdmin && <SiteNavbar />}
      <main className={
        isAdmin
          ? 'p-0'
          : `public-shell ${isTv ? 'tv-page-screen px-0' : 'min-h-screen px-4 pt-8 pb-28 sm:px-6 lg:px-8'}`
      }>
        {!isAdmin && (
          isTv ? (
            <div className="tv-page-shell mx-auto">
              <div className="tv-live-stage grid gap-3 md:items-stretch">
                <GlobalVideoPlayer />
                <TvLiveChat />
              </div>
            </div>
          ) : (
            <GlobalVideoPlayer />
          )
        )}
        {children}
      </main>
      {!isAdmin && !isTv && <SiteFooter />}
      {!isAdmin && <GlobalAudioPlayer />}
      <Toaster
        closeButton
        richColors={false}
        position="top-right"
        toastOptions={{
          className: 'app-toast',
          style: {
            background: 'rgba(255,255,255,0.88)',
            border: '1px solid rgba(15,23,42,0.10)',
            color: '#0f172a',
            fontSize: '13px',
            boxShadow: '0 18px 48px rgba(15,23,42,0.16)',
            backdropFilter: 'blur(18px)',
          },
        }}
      />
    </>
  );
}
