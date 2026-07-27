'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  Activity,
  ArrowUpRight,
  FileText,
  LayoutDashboard,
  ListMusic,
  Loader2,
  LogIn,
  LogOut,
  Menu,
  MapPin,
  Newspaper,
  Radio,
  RadioTower,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { memo, useCallback, useMemo, useState } from 'react';
import { AdminAuthProvider, useAdminAuth } from '@/lib/admin-auth';
import { Button } from '@/components/ui/button';

const sidebarLinks = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, description: 'Resumen operativo' },
  { href: '/admin/contenido?category=Noticias', label: 'Noticias', icon: Newspaper, description: 'Noticias y editoriales', category: 'Noticias' },
  { href: '/admin/contenido?category=Exitos%2090%2C2000', label: 'Exitos', icon: FileText, description: 'Exitos 90 y 2000', category: 'Exitos 90,2000' },
  { href: '/admin/ranking', label: 'Ranking live', icon: ListMusic, description: 'Canciones y votos' },
  { href: '/admin/comunidad', label: 'Comunidad', icon: MapPin, description: 'Eventos y galeria' },
  { href: '/admin/usuarios', label: 'Usuarios', icon: Users, description: 'Roles y accesos' },
  { href: '/admin/transmision', label: 'Transmision', icon: Radio, description: 'Radio, TV y senales' },
];

function getPageMeta(pathname: string, category?: string | null) {
  if (pathname === '/admin/contenido' && category) {
    const contentLink = sidebarLinks.find((link) => link.category === category);
    if (contentLink) return contentLink;
  }

  const current = [...sidebarLinks]
    .sort((a, b) => b.href.length - a.href.length)
    .find((link) => pathname === link.href || (link.href !== '/admin' && !link.href.includes('?') && pathname.startsWith(`${link.href}/`)));

  if (current) return current;
  return sidebarLinks[0];
}

const NavItem = memo(function NavItem({
  href,
  label,
  icon: Icon,
  isActive,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`group relative flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition-all duration-200 ${
        isActive
          ? 'bg-gradient-to-r from-amber-400/20 via-amber-400/12 to-amber-500/10 text-white shadow-sm shadow-black/20 ring-1 ring-amber-300/25'
          : 'text-slate-300 hover:bg-white/[0.07] hover:text-white'
      }`}
    >
      {isActive && (
        <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-amber-400 to-amber-500 shadow-sm shadow-amber-500/50" />
      )}
      <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg transition-all duration-200 ${
        isActive
          ? 'bg-amber-300/18 text-amber-200 shadow-sm shadow-black/20'
          : 'bg-white/[0.07] text-slate-400 group-hover:bg-white/[0.12] group-hover:text-amber-300'
      }`}>
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0">
        <span className="block truncate">{label}</span>
      </span>
    </Link>
  );
});

const UserMenu = memo(function UserMenu() {
  const { logout } = useAdminAuth();

  return (
    <button
      onClick={logout}
      className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-rose-400/20 bg-rose-500/12 px-3 text-sm font-bold text-rose-100 shadow-lg shadow-black/20 transition-all hover:border-rose-300/40 hover:bg-rose-500/20 active:scale-[0.97]"
      type="button"
    >
      <LogOut className="h-4 w-4" />
      Cerrar sesion
    </button>
  );
});

const AdminSidebar = memo(function AdminSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAdminAuth();

  return (
    <aside className="flex h-full flex-col overflow-hidden bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px),radial-gradient(ellipse_at_16%_0%,rgba(245,158,11,0.20),transparent_50%),radial-gradient(ellipse_at_92%_80%,rgba(20,184,166,0.10),transparent_50%),linear-gradient(180deg,#020617_0%,#0f172a_50%,#020617_100%)] bg-[size:32px_32px,32px_32px,auto,auto,auto]">
      <div className="border-b border-white/[0.07] px-5 py-4">
        <span className="grid h-16 w-full max-w-[164px] shrink-0 place-items-center overflow-hidden rounded-lg bg-black px-3 shadow-lg shadow-black/30 ring-1 ring-cyan-300/20">
          <Image
            alt="Radio Hit 90 y 2000"
            className="h-14 w-auto object-contain"
            height={80}
            src="/logo-home.jpeg"
            style={{ height: '3.5rem', width: 'auto' }}
            width={120}
          />
        </span>
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto px-3 pt-5">
        <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-[0.18em] text-amber-300/60">Navegacion</p>
        <nav className="space-y-0.5">
          {sidebarLinks.map((link) => {
            if (link.href === '/admin/usuarios') {
              if (user?.role !== 'ADMIN') return null;
            }
            const isContentCategory = link.category && pathname === '/admin/contenido';
            const isActive = isContentCategory
              ? searchParams.get('category') === link.category
              : pathname === link.href || (link.href !== '/admin' && !link.href.includes('?') && pathname.startsWith(`${link.href}/`));
            return (
              <NavItem
                key={link.href}
                href={link.href}
                label={link.label}
                icon={link.icon}
                isActive={isActive}
                onNavigate={onNavigate}
              />
            );
          })}
        </nav>
      </div>

      <div className="border-t border-white/[0.06] px-3 py-3">
        <div className="mb-3 flex items-center gap-3 rounded-lg bg-white/[0.05] px-3 py-2.5 ring-1 ring-white/[0.08]">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-amber-400 to-amber-500 text-[13px] font-black text-slate-950 shadow-sm">
            {user?.name?.slice(0, 1).toUpperCase() ?? 'A'}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-200">{user?.name ?? 'Usuario'}</p>
            <p className="truncate text-xs font-medium text-slate-500">{user?.email ?? ''}</p>
          </div>
        </div>
        <UserMenu />
      </div>
    </aside>
  );
});

function AdminTopbar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { adminData, loading, refreshContent, user } = useAdminAuth();
  const page = useMemo(() => getPageMeta(pathname, searchParams.get('category')), [pathname, searchParams]);
  const Icon = page.icon;
  const publishedArticles = adminData.articles.filter((article) => article.status === 'PUBLISHED').length;
  const communityItems = adminData.articles.filter((article) => article.category === 'Eventos' || article.category === 'Galeria').length;

  return (
    <header className="sticky top-0 z-20 hidden border-b border-slate-900/10 bg-gradient-to-r from-amber-50 via-white to-amber-50/80 px-8 shadow-sm shadow-slate-950/5 backdrop-blur-xl lg:block">
      <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between gap-8">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#020617] text-amber-200 shadow-sm ring-1 ring-slate-900/10">
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">
              <Link className="transition hover:text-amber-700" href="/admin">Admin</Link>
              <span className="h-1 w-1 rounded-full bg-slate-300" />
              <span className="truncate text-slate-500">{page.label}</span>
            </div>
            <div className="mt-1 flex min-w-0 items-baseline gap-3">
              <h1 className="truncate text-lg font-black tracking-tight text-[#0f172a]">{page.label}</h1>
              <p className="truncate text-sm font-medium text-slate-500">{page.description}</p>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2.5">
          <div className="hidden items-center gap-2 rounded-lg border border-slate-900/10 bg-white/78 px-3 py-2 shadow-sm ring-1 ring-slate-900/5 xl:flex">
            <span className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
              <Activity className="h-3.5 w-3.5 text-emerald-600" />
              <span className="text-[#0f172a]">{publishedArticles}</span> publicados
            </span>
            <span className="h-4 w-px bg-slate-200" />
            <span className="text-xs font-bold text-slate-600">
              <span className="text-[#0f172a]">{communityItems}</span> comunidad
            </span>
          </div>

          <Button
            variant="outline"
            className="h-10 border-slate-900/10 bg-white/78 px-3 text-slate-700 shadow-sm hover:border-amber-300 hover:bg-amber-50 hover:text-amber-800"
            disabled={loading}
            onClick={() => refreshContent()}
            type="button"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            <span className="hidden xl:inline">Sincronizar</span>
          </Button>
          <Button asChild variant="outline" className="h-10 border-slate-900/10 bg-[#020617] px-3 text-amber-200 shadow-sm hover:bg-[#0f172a]">
            <Link href="/" target="_blank">
              <ArrowUpRight className="h-4 w-4" />
              Sitio
            </Link>
          </Button>
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br from-amber-400 to-amber-500 text-sm font-black text-slate-950 shadow-sm ring-1 ring-amber-300/50" title={user?.email ?? 'Usuario'}>
            {user?.name?.slice(0, 1).toUpperCase() ?? 'A'}
          </span>
        </div>
      </div>
    </header>
  );
}

function LoginForm({ onLogin }: { onLogin: (email: string, password: string) => Promise<void> }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await onLogin(email, password);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Error al iniciar sesion');
    } finally {
      setBusy(false);
    }
  }, [email, password, onLogin]);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[#020617] via-[#0f172a] to-[#020617] px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_20%,rgba(20,184,166,0.16),transparent_50%),radial-gradient(ellipse_at_80%_80%,rgba(245,158,11,0.12),transparent_50%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:48px_48px]" />

      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.04] shadow-2xl shadow-black/60 backdrop-blur-2xl lg:min-h-[600px] lg:grid-cols-[1fr_1fr]">
        <section className="relative hidden overflow-hidden bg-gradient-to-br from-[#020617] via-[#0f172a] to-[#020617] p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_10%,rgba(20,184,166,0.16),transparent_50%),radial-gradient(ellipse_at_90%_90%,rgba(245,158,11,0.12),transparent_50%)]" />
          <div className="relative z-10">
            <span className="inline-grid h-40 w-52 place-items-center overflow-hidden rounded-2xl bg-black px-5 shadow-2xl shadow-black/40 ring-1 ring-cyan-300/20">
              <Image alt="Radio Hit 90 y 2000" className="h-auto w-40 object-contain" height={160} priority src="/logo-home.jpeg" style={{ height: 'auto', width: '10rem' }} width={230} />
            </span>
            <p className="mt-8 inline-flex items-center gap-2 rounded-full bg-amber-400/10 px-4 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-amber-300 ring-1 ring-amber-400/20">
              <Sparkles className="h-3.5 w-3.5" />
              Panel privado
            </p>
            <h1 className="mt-5 max-w-md text-4xl font-black leading-[1.1] tracking-tight">Centro de control</h1>
            <p className="mt-3 max-w-sm text-sm leading-6 text-slate-400">
              Gestiona contenidos, programas, ranking, comunidad y transmision desde una cabina digital preparada para operar en vivo.
            </p>
          </div>
          <div className="relative z-10 grid gap-2.5">
            {[
              { label: 'Senal', value: 'Radio y TV', icon: RadioTower },
              { label: 'Contenido', value: 'CMS activo', icon: FileText },
              { label: 'Seguridad', value: 'Acceso privado', icon: ShieldCheck },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.04] p-3.5 transition hover:bg-white/[0.08]" key={item.label}>
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 shadow-sm">
                    <Icon className="h-4.5 w-4.5" />
                  </span>
                  <span>
                    <span className="block text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">{item.label}</span>
                    <span className="block text-sm font-bold text-white">{item.value}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-sm">
            <div className="mb-8 text-center">
              <span className="mx-auto grid h-32 w-40 place-items-center overflow-hidden rounded-2xl bg-black px-5 shadow-2xl shadow-black/40 ring-1 ring-cyan-300/20 lg:hidden">
                <Image alt="Radio Hit 90 y 2000" className="h-auto w-32 object-contain" height={120} priority src="/logo-home.jpeg" style={{ height: 'auto', width: '8rem' }} width={180} />
              </span>
              <p className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-amber-300/10 px-3.5 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-amber-200 ring-1 ring-amber-300/20 lg:mt-0">
                <Sparkles className="h-3 w-3" />
                Acceso autorizado
              </p>
              <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">Iniciar sesion</h1>
              <p className="mt-2 text-sm leading-6 text-slate-500">Entra al panel para administrar la radio en tiempo real.</p>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-6 shadow-2xl shadow-black/40 backdrop-blur">
              {error && (
                <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-200 shadow-sm">
                  {error}
                </div>
              )}
              <div className="grid gap-1.5">
                <label className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Correo electronico</label>
                <input
                  className="h-12 w-full rounded-lg border border-white/[0.08] bg-white/[0.06] px-4 text-sm font-semibold text-white outline-none transition placeholder:text-slate-600 hover:border-white/[0.15] focus:border-amber-300/50 focus:bg-white/[0.10] focus:shadow-lg focus:shadow-amber-950/20 focus:ring-4 focus:ring-amber-300/10"
                  type="email"
                  placeholder="tu@correo.cl"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-1.5">
                <label className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Contrasena</label>
                <input
                  className="h-12 w-full rounded-lg border border-white/[0.08] bg-white/[0.06] px-4 text-sm font-semibold text-white outline-none transition placeholder:text-slate-600 hover:border-white/[0.15] focus:border-amber-300/50 focus:bg-white/[0.10] focus:shadow-lg focus:shadow-amber-950/20 focus:ring-4 focus:ring-amber-300/10"
                  type="password"
                  placeholder="********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" disabled={busy} className="mt-1 h-12 w-full rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 text-sm font-black text-slate-950 shadow-lg shadow-amber-950/30 transition-all hover:from-amber-300 hover:to-amber-400 hover:shadow-xl hover:shadow-amber-950/40 active:scale-[0.98]">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                {busy ? 'Ingresando...' : 'Entrar al panel'}
              </Button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}

function AdminShellInner({ children }: { children: React.ReactNode }) {
  const { token, loading, login } = useAdminAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400/20 to-amber-600/20 ring-1 ring-amber-400/20">
            <Loader2 className="h-7 w-7 animate-spin text-amber-400" />
          </div>
          <p className="mt-5 text-sm font-semibold text-slate-400">Cargando panel...</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return <LoginForm onLogin={login} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 lg:flex">
      <div className="hidden lg:fixed lg:left-0 lg:top-0 lg:z-30 lg:block lg:h-full lg:w-64 lg:shrink-0 lg:shadow-2xl lg:shadow-black/30">
        <AdminSidebar />
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Cerrar menu"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
            type="button"
          />
          <div className="relative h-full w-[min(18rem,86vw)] shadow-2xl shadow-black/50">
            <button
              aria-label="Cerrar menu"
              className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-xl border border-white/[0.08] bg-slate-950/80 text-white shadow-lg backdrop-blur transition hover:border-amber-400/40 hover:text-amber-300"
              onClick={() => setSidebarOpen(false)}
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
            <AdminSidebar onNavigate={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      <div className="admin-bg min-h-screen w-full lg:ml-64">
        <AdminTopbar />
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-white/[0.06] bg-[#020617]/95 px-4 text-white shadow-lg shadow-slate-950/30 backdrop-blur-xl lg:hidden">
          <Link href="/admin" className="grid h-12 w-36 place-items-center overflow-hidden rounded-lg bg-black px-3 shadow-md shadow-black/30 ring-1 ring-cyan-300/20">
            <Image
              alt="Radio Hit 90 y 2000"
              className="h-10 w-auto object-contain"
              height={48}
              src="/logo-home.jpeg"
              style={{ height: '2.5rem', width: 'auto' }}
              width={112}
            />
          </Link>
          <button
            aria-label="Abrir menu"
            className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 shadow-lg shadow-black/30 transition-all hover:from-amber-300 hover:to-amber-400 active:scale-95"
            onClick={() => setSidebarOpen(true)}
            type="button"
          >
            <Menu className="h-5 w-5" />
          </button>
        </header>
        <main className="p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthProvider>
      <AdminShellInner>{children}</AdminShellInner>
    </AdminAuthProvider>
  );
}
