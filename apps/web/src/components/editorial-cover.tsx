import { Newspaper, Sparkles } from 'lucide-react';

type EditorialCoverProps = {
  category: string;
  title: string;
  featured?: boolean;
};

const categoryStyles: Record<string, { accent: string; glow: string; icon: typeof Newspaper; label: string }> = {
  Noticias: {
    accent: 'from-amber-300 via-orange-400 to-teal-300',
    glow: 'bg-amber-400/24',
    icon: Newspaper,
    label: 'Actualidad local',
  },
  'Exitos 90,2000': {
    accent: 'from-fuchsia-300 via-amber-300 to-sky-300',
    glow: 'bg-fuchsia-400/22',
    icon: Sparkles,
    label: 'Musica y memoria',
  },
};

function initials(value: string) {
  const words = value
    .replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ ]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  return words.map((word) => word[0]).join('').toUpperCase() || 'RL';
}

export function EditorialCover({ category, title, featured = false }: EditorialCoverProps) {
  const style = categoryStyles[category] ?? categoryStyles.Noticias;
  const Icon = style.icon;

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#050816] text-white">
      <div className={`absolute -left-16 -top-20 h-52 w-52 rounded-full blur-3xl ${style.glow}`} />
      <div className="absolute -right-16 top-8 h-52 w-52 rounded-full bg-teal-400/14 blur-3xl" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.055)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.045)_1px,transparent_1px)] bg-[size:30px_30px]" />
      <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${style.accent}`} />
      <div className="absolute -right-10 -top-8 h-36 w-36 rounded-full border-[18px] border-amber-300/16" />
      <div className="absolute right-7 top-8 h-20 w-20 rounded-full border-[10px] border-white/8" />
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/50 to-transparent" />

      <div className="relative z-10 flex h-full flex-col justify-between p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-amber-100 ring-1 ring-white/12">
            <Icon className="h-3 w-3" />
            {category}
          </span>
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-white text-sm font-black text-slate-950 shadow-lg shadow-black/20">
            {initials(title)}
          </span>
        </div>

        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-200/90">{style.label}</p>
          <h2 className={`${featured ? 'mt-2 text-2xl sm:text-3xl' : 'mt-1.5 text-lg'} line-clamp-3 font-black leading-none tracking-normal`}>
            {title}
          </h2>
          <div className="mt-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-white/55">
            <span className={`h-1.5 w-10 rounded-full bg-gradient-to-r ${style.accent}`} />
            Radio Labranza FM 102.3
          </div>
        </div>
      </div>
    </div>
  );
}
