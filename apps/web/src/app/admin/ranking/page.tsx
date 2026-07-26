'use client';

import { FormEvent, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { CheckCircle2, ImageIcon, ListMusic, Pencil, Plus, RadioTower, Save, Search, Trash2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ImageUpload } from '@/components/admin/image-upload';
import { useAdminAuth } from '@/lib/admin-auth';
import { api, type RankingTrack } from '@/lib/api';
import { confirmToast } from '@/lib/confirm-toast';

export default function AdminRankingPage() {
  const { token, adminData, saving, setSaving, refreshContent } = useAdminAuth();
  const [search, setSearch] = useState('');
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [artworkUrl, setArtworkUrl] = useState<string | undefined>();
  const [isActive, setIsActive] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editArtist, setEditArtist] = useState('');
  const [editArtworkUrl, setEditArtworkUrl] = useState<string | undefined>();

  const tracks = useMemo(
    () =>
      [...adminData.ranking]
        .sort((left, right) => Number(right.isActive) - Number(left.isActive) || right.votes - left.votes || left.title.localeCompare(right.title))
        .filter((track) => {
          const q = search.trim().toLowerCase();
          if (!q) return true;
          return `${track.title} ${track.artist}`.toLowerCase().includes(q);
        }),
    [adminData.ranking, search]
  );

  const activeCount = adminData.ranking.filter((track) => track.isActive).length;
  const totalVotes = adminData.ranking.reduce((sum, track) => sum + track.votes, 0);
  const leader = [...adminData.ranking].sort((left, right) => right.votes - left.votes)[0];
  const leaderVotesLabel = leader?.votes === 1 ? '1 voto' : `${leader?.votes ?? 0} votos`;

  function resetCreateForm() {
    setTitle('');
    setArtist('');
    setArtworkUrl(undefined);
    setIsActive(true);
  }

  async function runAction(action: () => Promise<unknown>, okMsg: string) {
    setSaving(true);
    try {
      await action();
      toast.success(okMsg);
      await refreshContent();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo completar la accion.');
    } finally {
      setSaving(false);
    }
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runAction(
      () =>
        api.createRankingTrack(token, {
          title: title.trim(),
          artist: artist.trim(),
          artworkUrl,
          isActive
        }),
      'Cancion agregada al ranking.'
    );
    resetCreateForm();
  }

  function startEdit(track: RankingTrack) {
    setEditingId(track.id);
    setEditTitle(track.title);
    setEditArtist(track.artist);
    setEditArtworkUrl(track.artworkUrl ?? undefined);
  }

  async function saveEdit(track: RankingTrack) {
    await runAction(
      () =>
        api.updateRankingTrack(token, track.id, {
          title: editTitle.trim(),
          artist: editArtist.trim(),
          artworkUrl: editArtworkUrl ?? null
        }),
      'Cancion actualizada.'
    );
    setEditingId(null);
  }

  return (
    <div className="grid gap-6">
      <section className="admin-section-hero relative overflow-hidden rounded-[1.35rem] p-4 text-white sm:p-6">
        <div className="absolute inset-0 signal-grid opacity-[0.10]" />
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-300 via-rose-300 to-teal-300" />
        <div className="relative grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px] xl:items-end">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-amber-300 to-amber-500 text-slate-950 shadow-lg shadow-black/20">
              <RadioTower className="h-7 w-7" />
            </span>
            <div>
              <p className="text-xs font-black uppercase text-amber-200">Ranking live</p>
              <h1 className="mt-2 text-3xl font-black sm:text-4xl">Canciones para votar en vivo</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                Administra el listado real que aparece en /ranking. Aqui se agregan canciones, se activan o se pausan, y los votos se ordenan automaticamente.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="admin-metric-dark rounded-lg px-4 py-3">
              <p className="text-2xl font-black text-amber-200">{adminData.ranking.length}</p>
              <p className="text-[10px] font-bold uppercase tracking-normal text-amber-200/70">Canciones</p>
            </div>
            <div className="admin-metric-dark rounded-lg px-4 py-3">
              <p className="text-2xl font-black text-emerald-200">{activeCount}</p>
              <p className="text-[10px] font-bold uppercase tracking-normal text-emerald-200/70">Activas</p>
            </div>
            <div className="admin-metric-dark rounded-lg px-4 py-3">
              <p className="text-2xl font-black text-rose-200">{totalVotes}</p>
              <p className="text-[10px] font-bold uppercase tracking-normal text-rose-200/70">Votos</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <form className="admin-shell-frame grid content-start gap-5 rounded-xl p-4 sm:p-5" onSubmit={handleCreate}>
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-amber-400 text-slate-950">
              <Plus className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-amber-700">Nueva cancion</p>
              <h2 className="text-lg font-black text-slate-950">Agregar al ranking</h2>
            </div>
          </div>

          <div className="grid gap-2">
            <label className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Tema</label>
            <input className="admin-input" onChange={(event) => setTitle(event.target.value)} placeholder="Ej: Cancion favorita" required value={title} />
          </div>
          <div className="grid gap-2">
            <label className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Artista</label>
            <input className="admin-input" onChange={(event) => setArtist(event.target.value)} placeholder="Ej: Artista local" required value={artist} />
          </div>
          <ImageUpload token={token} value={artworkUrl} onChange={setArtworkUrl} label="Caratula del tema" />
          <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-slate-900/10 bg-white/75 px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-amber-300 hover:bg-amber-50">
            <span>Visible para votos publicos</span>
            <input checked={isActive} className="h-4 w-4 accent-amber-500" onChange={(event) => setIsActive(event.target.checked)} type="checkbox" />
          </label>
          <Button className="admin-action-save h-12" disabled={saving} type="submit">
            <Save className="h-4 w-4" />
            {saving ? 'Guardando...' : 'Publicar en ranking'}
          </Button>
        </form>

        <section className="admin-shell-frame overflow-hidden rounded-xl">
          <div className="grid gap-5 border-b border-slate-900/10 bg-white/70 px-4 py-5 sm:px-5 sm:py-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-amber-700">Listado live</p>
              <h2 className="mt-1 text-2xl font-black leading-tight text-slate-950">Ranking operativo</h2>
              <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-500">
                {leader ? `Lider actual: ${leader.title} con ${leaderVotesLabel}.` : 'Aun no hay canciones cargadas.'}
              </p>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input className="admin-input pl-9" onChange={(event) => setSearch(event.target.value)} placeholder="Buscar tema o artista..." value={search} />
            </div>
          </div>

          {tracks.length === 0 ? (
            <div className="p-6 text-sm font-semibold text-slate-500">No hay canciones para mostrar.</div>
          ) : (
            <div className="divide-y divide-slate-900/10">
              {tracks.map((track, index) => {
                const isEditing = editingId === track.id;
                return (
                  <article className="grid gap-4 p-4 transition hover:bg-amber-50/45 lg:grid-cols-[64px_minmax(0,1fr)_auto] lg:items-center" key={track.id}>
                    <div className="flex items-center gap-3 lg:block">
                      <span className={`grid h-11 w-11 place-items-center rounded-xl text-sm font-black ${index === 0 ? 'bg-amber-400 text-slate-950' : 'bg-slate-950 text-amber-200'}`}>
                        {index + 1}
                      </span>
                      <span className={`mt-2 inline-flex rounded-full px-2 py-1 text-[10px] font-black uppercase lg:flex ${track.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-zinc-100 text-zinc-600'}`}>
                        {track.isActive ? 'Activo' : 'Pausado'}
                      </span>
                    </div>

                    <div className="min-w-0">
                      {isEditing ? (
                        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_220px]">
                          <input className="admin-input" onChange={(event) => setEditTitle(event.target.value)} value={editTitle} />
                          <input className="admin-input" onChange={(event) => setEditArtist(event.target.value)} value={editArtist} />
                          <div className="flex items-center gap-2 rounded-lg border border-slate-900/10 bg-white px-3">
                            <ImageIcon className="h-4 w-4 text-amber-600" />
                            <input className="min-w-0 flex-1 bg-transparent py-2 text-sm font-semibold outline-none" onChange={(event) => setEditArtworkUrl(event.target.value || undefined)} placeholder="URL imagen" value={editArtworkUrl ?? ''} />
                          </div>
                        </div>
                      ) : (
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-lg border border-slate-900/10 bg-white">
                            {track.artworkUrl ? <img alt="" className="h-full w-full object-cover" src={track.artworkUrl} /> : <ListMusic className="h-6 w-6 text-slate-400" />}
                          </span>
                          <div className="min-w-0">
                            <h3 className="truncate text-base font-black text-slate-950">{track.title}</h3>
                            <p className="truncate text-sm font-semibold text-slate-500">{track.artist}</p>
                            <p className="mt-1 text-xs font-black uppercase tracking-[0.12em] text-amber-700">{track.votes.toLocaleString('es-CL')} votos</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap justify-end gap-2">
                      {isEditing ? (
                        <>
                          <Button className="admin-action-save" disabled={saving} onClick={() => saveEdit(track)} type="button">
                            <Save className="h-3.5 w-3.5" />
                            Guardar
                          </Button>
                          <Button className="admin-action-cancel" disabled={saving} onClick={() => setEditingId(null)} type="button" variant="outline">
                            Cancelar
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button className={track.isActive ? 'admin-action-archive' : 'admin-action-publish'} disabled={saving} onClick={() => runAction(() => api.updateRankingTrack(token, track.id, { isActive: !track.isActive }), track.isActive ? 'Cancion pausada.' : 'Cancion activada.')} type="button" variant="outline">
                            {track.isActive ? <XCircle className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                            {track.isActive ? 'Pausar' : 'Activar'}
                          </Button>
                          <Button className="admin-action-edit" disabled={saving} onClick={() => startEdit(track)} type="button" variant="outline">
                            <Pencil className="h-3.5 w-3.5" />
                            Editar
                          </Button>
                          <Button
                            className="admin-action-delete"
                            disabled={saving}
                            onClick={() =>
                              confirmToast({
                                title: 'Eliminar cancion',
                                description: track.title,
                                confirmLabel: 'Eliminar',
                                onConfirm: () => runAction(() => api.deleteRankingTrack(token, track.id), 'Cancion eliminada.')
                              })
                            }
                            type="button"
                            variant="outline"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Eliminar
                          </Button>
                        </>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
