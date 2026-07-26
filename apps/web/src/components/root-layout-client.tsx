'use client';

import { useEffect } from 'react';
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

  useEffect(() => {
    if (!isTv) {
      return;
    }

    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [isTv]);

  return (
    <>
      {!isAdmin && <SiteNavbar />}
      <main className={`min-h-screen ${
        isAdmin
          ? 'p-0'
          : `public-shell pb-28 ${isTv ? 'px-0 pt-3' : 'px-4 pt-8 sm:px-6 lg:px-8'}`
      }`}>
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
      {!isAdmin && <SiteFooter />}
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
