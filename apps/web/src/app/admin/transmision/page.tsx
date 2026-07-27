import {
  Activity,
  AlertTriangle,
  AudioWaveform,
  Cable,
  CheckCircle2,
  KeyRound,
  Link2,
  Lock,
  Radio,
  RefreshCw,
  Router,
  Save,
  Server,
  ShieldCheck,
  Tv,
  Video,
  Webhook
} from 'lucide-react';
import { StreamRuntimePanel } from '@/components/stream-runtime-panel';
import { Button } from '@/components/ui/button';

const mounts = [
  { name: '/radio', format: 'MP3 160 kbps desde relay OBS', listeners: 'segun Icecast', status: 'Monitoreado' },
  { name: '/tv', format: 'HLS 720p desde MediaMTX', listeners: 'segun MediaMTX', status: 'Monitoreado' }
];

const publicIcecast = process.env.NEXT_PUBLIC_ICECAST_URL || 'https://radio-labranza-fm.vercel.app/radio';
const publicHls = process.env.NEXT_PUBLIC_TV_HLS_URL || 'https://radio-labranza-fm.vercel.app/hls/tv/index.m3u8';
const publicIcecastUrl = new URL(publicIcecast, 'https://radiohit90y2000.netlify.app');
const publicIcecastBase = publicIcecast.startsWith('/')
  ? publicIcecast.replace(/\/radio$/, '')
  : publicIcecast.replace(/\/radio$/, '');

const relays = [
  { region: 'Audio publico', url: publicIcecast, latency: 'directo' },
  { region: 'TV HLS publico', url: publicHls, latency: '8-14s aprox.' },
  { region: 'Frontend', url: 'https://radio-labranza-fm.vercel.app', latency: 'Vercel' }
];

const ingestProfiles = [
  {
    title: 'OBS Studio / MediaMTX',
    icon: Video,
    rows: [
      ['Servicio', 'Personalizado'],
      ['Servidor', process.env.NEXT_PUBLIC_MEDIAMTX_RTMP_URL || 'rtmp://localhost:1935'],
      ['Clave de transmision', 'tv'],
      ['Salida HLS', publicHls],
      ['Video', '720p, 2500-3000 Kbps, keyframe 2s, sin B-frames'],
      ['Audio', 'AAC 160-192 Kbps, 48 kHz']
    ]
  },
  {
    title: 'Icecast Audio',
    icon: Radio,
    rows: [
      ['Host publico', publicIcecastUrl.hostname],
      ['Puerto interno', '8000'],
      ['Mount', '/radio'],
      ['Usuario', 'source'],
      ['Password', 'Configurada en servidor'],
      ['Player', publicIcecast]
    ]
  }
];

export default function StreamAdminPage() {
  return (
    <section className="grid gap-6">
        <div className="admin-section-hero relative overflow-hidden rounded-xl p-4 text-white sm:p-6">
          <div className="relative flex flex-col justify-between gap-5 md:flex-row md:items-start">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-200">Admin de transmision</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-white">Icecast, HLS y relays</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-300">
                Configuracion central para senales de audio/video, mount points, credenciales, metadata y monitoreo.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" className="border-white/15 bg-white/10 text-white hover:bg-white/15">
                <a href={publicHls} rel="noreferrer" target="_blank">
                <RefreshCw className="h-4 w-4" />
                Probar senal
                </a>
              </Button>
              <Button asChild className="bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 hover:from-amber-300 hover:to-amber-200">
                <a href="/admin">
                <Save className="h-4 w-4" />
                Gestionar contenido
                </a>
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Estado Icecast', value: 'Monitoreado', icon: CheckCircle2, tone: 'text-emerald-700 bg-emerald-50 ring-emerald-200' },
            { label: 'TV HLS', value: 'MediaMTX', icon: Activity, tone: 'text-rose-700 bg-rose-50 ring-rose-200' },
            { label: 'Audio master', value: '160k', icon: AudioWaveform, tone: 'text-zinc-800 bg-zinc-100' },
            { label: 'Fallback', value: 'OBS requerido', icon: ShieldCheck, tone: 'text-amber-700 bg-amber-50' }
          ].map((item) => {
            const Icon = item.icon;
            return (
              <article className="admin-shell-frame rounded-lg p-5 transition hover:-translate-y-0.5 hover:border-amber-300" key={item.label}>
                <span className={`grid h-11 w-11 place-items-center rounded-xl ring-1 ${item.tone}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <p className="mt-4 text-sm font-semibold text-zinc-500">{item.label}</p>
                <p className="text-2xl font-black text-zinc-950">{item.value}</p>
              </article>
            );
          })}
        </div>

        <StreamRuntimePanel />

        <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
          <form className="admin-shell-frame rounded-lg">
            <div className="border-b border-zinc-200 p-5">
              <h2 className="flex items-center gap-2 text-xl font-black text-zinc-950">
                <Server className="h-5 w-5 text-amber-700" />
                Servidor Icecast
              </h2>
            </div>
            <div className="grid gap-5 p-5">
              <div className="grid gap-4 lg:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-zinc-700">Host publico</span>
                  <input className="admin-input" defaultValue={publicIcecastUrl.hostname} />
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-zinc-700">Puerto</span>
                  <input className="admin-input" defaultValue="443 publico / 8000 interno" />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-zinc-700">Usuario source</span>
                  <input className="admin-input" defaultValue="source" />
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-zinc-700">Password source</span>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3.5 h-4 w-4 text-zinc-400" />
                    <input className="admin-input pl-9" defaultValue="************" readOnly type="password" />
                  </div>
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-zinc-700">Password admin</span>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-3.5 h-4 w-4 text-zinc-400" />
                    <input className="admin-input pl-9" defaultValue="************" readOnly type="password" />
                  </div>
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-zinc-700">Encoder</span>
                  <select className="admin-input bg-white">
                    <option>OBS / FFmpeg</option>
                    <option>Liquidsoap</option>
                    <option>Butt</option>
                    <option>Mixxx</option>
                    <option>AzuraCast</option>
                  </select>
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-zinc-700">Codec principal</span>
                  <select className="admin-input bg-white">
                    <option>MP3 160kbps</option>
                    <option>AAC 192kbps</option>
                    <option>Opus 96kbps</option>
                  </select>
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-zinc-700">Fallback playlist</span>
                  <select className="admin-input bg-white">
                    <option>Auto DJ Labranza</option>
                    <option>Emergency loop</option>
                    <option>Silencio / tone</option>
                  </select>
                </label>
              </div>
            </div>
          </form>

          <section className="admin-shell-frame rounded-lg">
            <div className="border-b border-zinc-200 p-5">
              <h2 className="flex items-center gap-2 text-xl font-black text-zinc-950">
                <Router className="h-5 w-5 text-amber-700" />
                Mount points
              </h2>
            </div>
            <div className="divide-y divide-zinc-100">
              {mounts.map((mount) => (
                <article className="grid gap-2 p-5" key={mount.name}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-black text-zinc-950">{mount.name}</p>
                    <span className="rounded-md bg-amber-50 px-2 py-1 text-xs font-black text-amber-700">
                      {mount.status}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-500">{mount.format}</p>
                  <p className="text-sm font-semibold text-zinc-700">{mount.listeners}</p>
                </article>
              ))}
            </div>
          </section>
        </div>

        <section className="admin-shell-frame rounded-lg">
          <div className="border-b border-zinc-200 p-5">
            <h2 className="flex items-center gap-2 text-xl font-black text-zinc-950">
              <Tv className="h-5 w-5 text-amber-700" />
              Perfiles de prueba OBS, Icecast y MediaMTX
            </h2>
          </div>
          <div className="grid gap-4 p-5 lg:grid-cols-2">
            {ingestProfiles.map((profile) => {
              const Icon = profile.icon;
              return (
                <article className="rounded-lg border border-zinc-200 bg-zinc-50 p-4" key={profile.title}>
                  <div className="mb-4 flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-md bg-zinc-950 text-white">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="text-lg font-black text-zinc-950">{profile.title}</h3>
                  </div>
                  <div className="grid gap-2">
                    {profile.rows.map(([label, value]) => (
                      <div className="grid gap-1 rounded-md bg-white p-3 sm:grid-cols-[160px_1fr]" key={label}>
                        <span className="text-xs font-black uppercase tracking-normal text-zinc-500">{label}</span>
                        <code className="break-all text-sm font-semibold text-zinc-900">{value}</code>
                      </div>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-2">
          <section className="admin-shell-frame rounded-lg">
            <div className="border-b border-zinc-200 p-5">
              <h2 className="flex items-center gap-2 text-xl font-black text-zinc-950">
                <Cable className="h-5 w-5 text-amber-700" />
                Relays y CDN
              </h2>
            </div>
            <div className="divide-y divide-zinc-100">
              {relays.map((relay) => (
                <article className="grid gap-1 p-5" key={relay.region}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-black text-zinc-950">{relay.region}</p>
                    <span className="text-sm font-bold text-zinc-500">{relay.latency}</span>
                  </div>
                  <p className="break-all text-sm text-zinc-500">{relay.url}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="admin-shell-frame rounded-lg p-5">
            <h2 className="flex items-center gap-2 text-xl font-black text-zinc-950">
              <Webhook className="h-5 w-5 text-amber-700" />
              Metadata y automatizaciones
            </h2>
            <div className="mt-5 grid gap-4">
              <label className="flex items-center justify-between gap-4 rounded-md bg-zinc-50 p-4">
                <span>
                  <span className="block text-sm font-bold text-zinc-800">Actualizar tema en vivo</span>
                  <span className="block text-xs text-zinc-500">Envia artista/titulo al player y redes.</span>
                </span>
                <input defaultChecked type="checkbox" />
              </label>
              <label className="flex items-center justify-between gap-4 rounded-md bg-zinc-50 p-4">
                <span>
                  <span className="block text-sm font-bold text-zinc-800">Notificar caida de senal</span>
                  <span className="block text-xs text-zinc-500">Webhook para Discord/Slack/WhatsApp API.</span>
                </span>
                <input defaultChecked type="checkbox" />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-zinc-700">Webhook de estado</span>
                <div className="relative">
                  <Link2 className="absolute left-3 top-3.5 h-4 w-4 text-zinc-400" />
                  <input className="admin-input pl-9" defaultValue={`${publicIcecastBase}/streaming/runtime-status`} />
                </div>
              </label>
            </div>
          </section>
        </div>

        <section className="rounded-lg border border-amber-200 bg-amber-50 p-5">
          <h2 className="flex items-center gap-2 text-lg font-black text-amber-900">
            <AlertTriangle className="h-5 w-5" />
            Pendiente de backend
          </h2>
          <p className="mt-2 text-sm leading-6 text-amber-900">
            Produccion ya opera en Oracle y Vercel. Cuando exista dominio propio, solo se cambian DNS, certificados y variables publicas.
            Para menor delay se puede volver a HLS low-latency, pero la opcion actual prioriza estabilidad en celulares.
          </p>
        </section>
      </section>
  );
}


