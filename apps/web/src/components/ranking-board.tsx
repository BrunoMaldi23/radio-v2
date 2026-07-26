'use client';

import { useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import { Music2, ThumbsUp, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { API_URL, api, type RankingTrack } from '@/lib/api';

type RankingBoardProps = {
  initialTracks: RankingTrack[];
};

export function RankingBoard({ initialTracks }: RankingBoardProps) {
  const [tracks, setTracks] = useState(initialTracks);
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sortedTracks = useMemo(
    () => [...tracks].sort((left, right) => right.votes - left.votes || left.title.localeCompare(right.title)),
    [tracks]
  );

  useEffect(() => {
    api.ranking().then(setTracks).catch(() => undefined);

    const socket = io(API_URL, {
      transports: ['websocket', 'polling']
    });

    socket.on('ranking.updated', (payload: { ranking?: RankingTrack[] }) => {
      if (payload.ranking) {
        setTracks(payload.ranking);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  async function vote(trackId: number) {
    setLoadingId(trackId);
    setError(null);

    try {
      const updated = await api.vote(trackId);
      setTracks((current) => current.map((track) => (track.id === updated.id ? updated : track)));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo registrar el voto.');
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-900/10 bg-white/78 shadow-[0_22px_60px_rgba(15,23,42,0.1)] backdrop-blur">
      {error && <div className="border-b border-rose-200 bg-rose-50 px-5 py-3 text-sm font-semibold text-rose-700">{error}</div>}
      <div className="hidden grid-cols-[84px_1.5fr_1fr_120px_130px] gap-4 border-b border-slate-900/10 bg-slate-950 px-5 py-3 text-xs font-bold uppercase tracking-normal text-slate-300 md:grid">
        <span>Portada</span>
        <span>Tema</span>
        <span>Artista</span>
        <span>Votos</span>
        <span className="text-right">Accion</span>
      </div>
      <div className="divide-y divide-slate-900/10">
        {!sortedTracks.length && (
          <div className="p-6 text-sm font-semibold text-slate-600">
            Aun no hay canciones en el ranking.
          </div>
        )}
        {sortedTracks.map((song, index) => (
          <article
            className="grid gap-3 px-4 py-4 transition hover:bg-amber-50/60 md:grid-cols-[84px_1.5fr_1fr_120px_130px] md:items-center md:gap-4 md:px-5"
            key={song.id}
          >
            <div className="flex items-center gap-3">
              <span className="relative grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl border border-slate-900/10 bg-white shadow-sm">
                {song.artworkUrl ? (
                  <img alt="" className="h-full w-full object-cover" src={song.artworkUrl} />
                ) : (
                  <Music2 className="h-6 w-6 text-slate-400" />
                )}
                <span className={`absolute -bottom-1 -right-1 grid h-6 min-w-6 place-items-center rounded-full px-1.5 text-[11px] font-black shadow-md ${
                  index === 0 ? 'bg-amber-400 text-slate-950' : 'bg-slate-950 text-amber-200 ring-1 ring-slate-900/10'
                }`}>
                  {index + 1}
                </span>
              </span>
              {index === 0 && <Trophy className="h-5 w-5 text-amber-500 md:hidden" />}
            </div>
            <div>
              <h2 className="font-bold text-slate-950">{song.title}</h2>
              <p className="text-sm text-slate-500 md:hidden">{song.artist}</p>
            </div>
            <p className="hidden text-sm font-medium text-slate-700 md:block">{song.artist}</p>
            <div className="flex items-center gap-2">
              <span className="font-black text-slate-950">{song.votes.toLocaleString('es-CL')}</span>
              <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-700 ring-1 ring-teal-200">Live</span>
            </div>
            <Button className="w-full border-slate-900/10 bg-white text-slate-900 hover:bg-amber-100 md:justify-self-end" disabled={loadingId === song.id} onClick={() => vote(song.id)} variant="outline">
              <ThumbsUp className="h-4 w-4" />
              {loadingId === song.id ? 'Votando' : '+1 Voto'}
            </Button>
          </article>
        ))}
      </div>
    </div>
  );
}
