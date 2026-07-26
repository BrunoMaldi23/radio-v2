'use client';

import { useEffect, useState } from 'react';
import { RadioTower } from 'lucide-react';
import { PublicPageHero } from '@/components/public-page-hero';
import { RankingBoard } from '@/components/ranking-board';
import { api, type RankingTrack } from '@/lib/api';

export default function RankingPage() {
  const [tracks, setTracks] = useState<RankingTrack[]>([]);

  useEffect(() => {
    api.ranking().then(setTracks).catch(() => setTracks([]));
  }, []);

  return (
    <div className="mx-auto grid max-w-7xl gap-6">
      <PublicPageHero
        eyebrow="Ranking en tiempo real"
        icon={RadioTower}
        title="Top canciones de la audiencia"
        description="Vota, mira el movimiento del ranking y siente como cambia la programacion en vivo."
        action={<div className="rounded-full border border-rose-300/30 bg-rose-400/20 px-4 py-2 text-sm font-bold text-rose-100">Votos en vivo</div>}
      />

      <RankingBoard initialTracks={tracks} />
    </div>
  );
}
