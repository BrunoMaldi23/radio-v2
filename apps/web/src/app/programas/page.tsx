'use client';

import { useEffect, useState } from 'react';
import { Mic2 } from 'lucide-react';
import { ProgramCard } from '@/components/program-card';
import { PublicPageHero } from '@/components/public-page-hero';
import { api } from '@/lib/api';
import { mapProgram } from '@/lib/content-mappers';

export default function ProgramsPage() {
  const [publicPrograms, setPublicPrograms] = useState<ReturnType<typeof mapProgram>[]>([]);

  useEffect(() => {
    api.programsPublic().then((items) => setPublicPrograms(items.map(mapProgram))).catch(() => setPublicPrograms([]));
  }, []);

  return (
    <div className="mx-auto grid max-w-7xl gap-8">
      <PublicPageHero
        eyebrow="Voces de Labranza"
        icon={Mic2}
        title="Programas"
        description="Conoce la parrilla, horarios y conductores que acompanan cada jornada."
      />
      {publicPrograms.length ? (
        <div className="grid gap-4 md:grid-cols-3">
          {publicPrograms.map((program) => (
            <ProgramCard key={program.id ?? program.slug} program={program} />
          ))}
        </div>
      ) : (
        <div className="radio-panel rounded-lg p-6 text-sm font-semibold text-slate-600">
          Aun no hay programas cargados.
        </div>
      )}
    </div>
  );
}
