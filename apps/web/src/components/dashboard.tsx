'use client';

import {
  Activity,
  AlertTriangle,
  BookOpen,
  Boxes,
  Building2,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  DoorOpen,
  LayoutDashboard,
  Library,
  LogIn,
  LogOut,
  Plus,
  RefreshCw,
  Save,
  Search,
  ShieldAlert,
  UserCog,
  UserRound,
  XCircle
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { BookingCalendar } from '@/components/booking-calendar';
import { Button } from '@/components/ui/button';
import { api, AuditLog, Booking, BookingStatus, Resource, ResourceType, Role, Space, User, UserPayload } from '@/lib/api';
import { confirmToast } from '@/lib/confirm-toast';

const roleLabels: Record<Role, string> = {
  ADMIN: 'Administrador',
  OPERATOR: 'Operador',
  EDITOR: 'Editor',
  STUDENT: 'Estudiante',
  TEACHER: 'Docente'
};

const statusLabels: Record<BookingStatus, string> = {
  PENDING: 'Pendiente',
  ACTIVE: 'Activa',
  COMPLETED: 'Completada',
  CANCELLED: 'Cancelada'
};

const resourceTypeLabels: Record<ResourceType, string> = {
  BOOK: 'Libro',
  HARDWARE: 'Hardware'
};

type Tab = 'inicio' | 'reservas' | 'salas' | 'recursos' | 'usuarios' | 'auditoria';
type BookingAction = 'activate' | 'cancel' | 'complete' | 'noShow';

const allStatuses: BookingStatus[] = ['PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED'];
const emptySpace = { name: '', capacity: 1, features: '', isActive: true };
const emptyResource = { title: '', type: 'BOOK' as ResourceType, uniqueCode: '', isActive: true };
const emptyUser = {
  name: '',
  email: '',
  password: '',
  role: 'STUDENT' as Role,
  isActive: true,
  isPenalized: false,
  penaltyEndDate: ''
};

function formatDateTimeLocal(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleString('es-CL') : 'Sin fecha';
}

function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}

export function Dashboard() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('inicio');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adminName, setAdminName] = useState('');
  const [needsBootstrap, setNeedsBootstrap] = useState(false);
  const [selectedSpaceId, setSelectedSpaceId] = useState('');
  const [selectedResourceIds, setSelectedResourceIds] = useState<number[]>([]);
  const [bookingSearch, setBookingSearch] = useState('');
  const [bookingStatus, setBookingStatus] = useState<'ALL' | BookingStatus>('ALL');
  const [bookingSpaceFilter, setBookingSpaceFilter] = useState('ALL');
  const [bookingResourceFilter, setBookingResourceFilter] = useState('ALL');
  const [editingBookingId, setEditingBookingId] = useState<number | null>(null);
  const [startTime, setStartTime] = useState(() => formatDateTimeLocal(new Date(Date.now() + 60 * 60 * 1000)));
  const [endTime, setEndTime] = useState(() => formatDateTimeLocal(new Date(Date.now() + 2 * 60 * 60 * 1000)));
  const [spaceForm, setSpaceForm] = useState(emptySpace);
  const [editingSpaceId, setEditingSpaceId] = useState<number | null>(null);
  const [resourceForm, setResourceForm] = useState(emptyResource);
  const [editingResourceId, setEditingResourceId] = useState<number | null>(null);
  const [userForm, setUserForm] = useState(emptyUser);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isAdmin = user?.role === 'ADMIN';
  const canManageCatalog = user?.role === 'ADMIN' || user?.role === 'OPERATOR';
  const activeSpaces = spaces.filter((space) => space.isActive);
  const inactiveSpaces = spaces.filter((space) => !space.isActive);
  const activeResources = resources.filter((resource) => resource.isActive);
  const inactiveResources = resources.filter((resource) => !resource.isActive);
  const penalizedUsers = users.filter((item) => item.isPenalized);
  const inactiveUsers = users.filter((item) => !item.isActive);
  const todaysBookings = bookings.filter((booking) => new Date(booking.startTime).toDateString() === new Date().toDateString());
  const pendingBookings = bookings.filter((booking) => booking.status === 'PENDING');
  const activeBookings = bookings.filter((booking) => booking.status === 'ACTIVE');

  const filteredBookings = bookings.filter((booking) => {
    const searchTarget = [
      booking.space?.name,
      booking.user.name,
      booking.user.email,
      booking.details.map((detail) => `${detail.resource.title} ${detail.resource.uniqueCode}`).join(' ')
    ].join(' ').toLowerCase();

    return (
      searchTarget.includes(bookingSearch.trim().toLowerCase()) &&
      (bookingStatus === 'ALL' || booking.status === bookingStatus) &&
      (bookingSpaceFilter === 'ALL' || String(booking.spaceId ?? '') === bookingSpaceFilter) &&
      (bookingResourceFilter === 'ALL' || booking.details.some((detail) => String(detail.resourceId) === bookingResourceFilter))
    );
  });

  const selectedStart = new Date(startTime);
  const selectedEnd = new Date(endTime);
  const blockingBookings = bookings.filter((booking) => {
    const start = new Date(booking.startTime);
    const end = new Date(booking.endTime);
    return (booking.status === 'PENDING' || booking.status === 'ACTIVE') && start < selectedEnd && end > selectedStart;
  });
  const availabilityBlockingBookings = editingBookingId ? blockingBookings.filter((booking) => booking.id !== editingBookingId) : blockingBookings;
  const selectedSpaceBusy = selectedSpaceId ? availabilityBlockingBookings.some((booking) => String(booking.spaceId ?? '') === selectedSpaceId) : false;
  const busySelectedResources = selectedResourceIds.filter((resourceId) =>
    availabilityBlockingBookings.some((booking) => booking.details.some((detail) => detail.resourceId === resourceId))
  );

  const navItems = [
    { id: 'inicio' as Tab, label: 'Inicio', icon: LayoutDashboard },
    { id: 'reservas' as Tab, label: 'Reservas', icon: CalendarClock },
    { id: 'salas' as Tab, label: 'Salas', icon: DoorOpen },
    { id: 'recursos' as Tab, label: 'Recursos', icon: Boxes },
    ...(isAdmin
      ? [
          { id: 'usuarios' as Tab, label: 'Usuarios', icon: UserCog },
          { id: 'auditoria' as Tab, label: 'Auditoria', icon: Activity }
        ]
      : [])
  ];

  const stats = useMemo(
    () => [
      { label: 'Reservas hoy', value: String(todaysBookings.length), icon: CalendarClock, detail: 'Agenda diaria', tone: 'blue' },
      { label: 'Pendientes', value: String(pendingBookings.length), icon: ShieldAlert, detail: 'Por revisar', tone: 'amber' },
      { label: 'Activas ahora', value: String(activeBookings.length), icon: CheckCircle2, detail: 'En curso', tone: 'blue' },
      { label: 'Recursos activos', value: String(activeResources.length), icon: Boxes, detail: 'Libros y hardware', tone: 'slate' }
    ],
    [activeBookings.length, activeResources.length, pendingBookings.length, todaysBookings.length]
  );

  useEffect(() => {
    // Try cookie-based session first (httpOnly cookie)
    api.me()
      .then((data) => {
        setToken(data.accessToken);
        setUser(data.user);
      })
      .catch(() => {
        // Fallback: try localStorage token (legacy)
        const savedToken = window.localStorage.getItem('accessToken');
        if (savedToken) {
          setToken(savedToken);
          return;
        }
        void api.hasUsers().then((response) => setNeedsBootstrap(!response.hasUsers)).catch(() => setNeedsBootstrap(false));
      });
  }, []);

  useEffect(() => {
    if (token) {
      void loadData(token);
    }
  }, [token]);

  async function loadData(activeToken = token) {
    if (!activeToken) return;
    setIsLoading(true);
    setMessage('');
    const bearerToken = activeToken === 'cookie-session' ? undefined : activeToken;
    try {
      const response = await api.me(bearerToken);
      setToken(response.accessToken);
      const currentUser = response.user;
      const [loadedSpaces, loadedResources, loadedBookings] = await Promise.all([
        api.spaces(bearerToken),
        api.resources(bearerToken),
        api.bookings(bearerToken)
      ]);
      const [loadedUsers, loadedAudit] = currentUser.role === 'ADMIN'
        ? await Promise.all([api.users(bearerToken), api.audit(bearerToken)])
        : [[], [] as AuditLog[]];

      setUser(currentUser);
      setSpaces(loadedSpaces);
      setResources(loadedResources);
      setBookings(loadedBookings);
      setUsers(loadedUsers);
      setAuditLogs(loadedAudit);
      setSelectedSpaceId((current) => current || String(loadedSpaces.find((space) => space.isActive)?.id ?? ''));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudieron cargar los datos.');
      logout();
    } finally {
      setIsLoading(false);
    }
  }

  function bearerToken() {
    return token === 'cookie-session' ? undefined : (token || undefined);
  }

  async function login(event: FormEvent) {
    event.preventDefault();
    setIsLoading(true);
    setMessage('');
    try {
      const response = await api.login(email, password);
      setToken(response.accessToken);
      setUser(response.user);
      setMessage(`Sesion iniciada como ${response.user.name}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo iniciar sesion.');
    } finally {
      setIsLoading(false);
    }
  }

  async function bootstrapAdmin(event: FormEvent) {
    event.preventDefault();
    setIsLoading(true);
    setMessage('');
    try {
      const response = await api.bootstrapAdmin({ name: adminName, email, password });
      setToken(response.accessToken);
      setUser(response.user);
      setNeedsBootstrap(false);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo crear el administrador inicial.');
    } finally {
      setIsLoading(false);
    }
  }

  function logout() {
    api.logout().catch(() => {});
    setToken(null);
    setUser(null);
    setUsers([]);
    setBookings([]);
    setSpaces([]);
    setResources([]);
    setAuditLogs([]);
  }

  function upsertBooking(booking: Booking) {
    setBookings((current) => [...current.filter((item) => item.id !== booking.id), booking].sort((a, b) => a.startTime.localeCompare(b.startTime)));
  }

  async function saveBooking(event: FormEvent) {
    event.preventDefault();
    if (!bearerToken()) return;
    if (!selectedSpaceId && selectedResourceIds.length === 0) {
      setMessage('Selecciona una sala o al menos un recurso.');
      return;
    }
    setIsLoading(true);
    setMessage('');
    try {
      const payload = {
        spaceId: selectedSpaceId ? Number(selectedSpaceId) : undefined,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        resourceIds: selectedResourceIds
      };
      const bt = bearerToken(); const booking = editingBookingId ? await api.updateBooking(bt, editingBookingId, payload) : await api.createBooking(bt, payload);
      upsertBooking(booking);
      setSelectedResourceIds([]);
      setEditingBookingId(null);
      setMessage(editingBookingId ? 'Reserva actualizada correctamente.' : 'Reserva creada correctamente.');
      await loadData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo guardar la reserva.');
    } finally {
      setIsLoading(false);
    }
  }

  function editBooking(booking: Booking) {
    setEditingBookingId(booking.id);
    setSelectedSpaceId(String(booking.spaceId ?? ''));
    setSelectedResourceIds(booking.details.map((detail) => detail.resourceId));
    setStartTime(formatDateTimeLocal(new Date(booking.startTime)));
    setEndTime(formatDateTimeLocal(new Date(booking.endTime)));
    setActiveTab('reservas');
    setMessage(`Editando reserva ${booking.id}.`);
  }

  function cancelBookingEdit() {
    setEditingBookingId(null);
    setSelectedResourceIds([]);
    setMessage('');
  }

  async function changeBooking(action: BookingAction, id: number) {
    const bt = bearerToken();
    if (!token) return;
    const confirmMessages: Record<BookingAction, string> = {
      activate: 'Confirma que deseas activar esta reserva.',
      cancel: 'Confirma que deseas cancelar esta reserva.',
      complete: 'Confirma que deseas completar esta reserva.',
      noShow: 'Confirma que el usuario no se presento. Esto aplicara penalizacion.'
    };
    confirmToast({
      title: 'Confirmar accion',
      description: confirmMessages[action],
      confirmLabel: 'Confirmar',
      onConfirm: async () => {
        setIsLoading(true);
        setMessage('');
        try {
          const result =
            action === 'activate'
              ? await api.activateBooking(bt, id)
              : action === 'cancel'
                ? await api.cancelBooking(bt, id)
                : action === 'complete'
                  ? await api.completeBooking(bt, id)
                  : await api.markNoShow(bt, id);
          upsertBooking(result);
          setMessage('Reserva actualizada.');
          await loadData();
        } catch (error) {
          setMessage(error instanceof Error ? error.message : 'No se pudo actualizar la reserva.');
        } finally {
          setIsLoading(false);
        }
      },
    });
  }

  async function saveSpace(event: FormEvent) {
    event.preventDefault();
    const bt2 = bearerToken();
    if (!bt2 || !canManageCatalog) return;
    setIsLoading(true);
    try {
      const saved = editingSpaceId ? await api.updateSpace(bt2, editingSpaceId, spaceForm) : await api.createSpace(bt2, spaceForm);
      setSpaces((current) => [...current.filter((space) => space.id !== saved.id), saved].sort((a, b) => a.name.localeCompare(b.name)));
      setSpaceForm(emptySpace);
      setEditingSpaceId(null);
      setMessage('Sala guardada.');
      await loadData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo guardar la sala.');
    } finally {
      setIsLoading(false);
    }
  }

  async function saveResource(event: FormEvent) {
    event.preventDefault();
    const bt3 = bearerToken();
    if (!bt3 || !canManageCatalog) return;
    setIsLoading(true);
    try {
      const saved = editingResourceId ? await api.updateResource(bt3, editingResourceId, resourceForm) : await api.createResource(bt3, resourceForm);
      setResources((current) => [...current.filter((resource) => resource.id !== saved.id), saved].sort((a, b) => a.title.localeCompare(b.title)));
      setResourceForm(emptyResource);
      setEditingResourceId(null);
      setMessage('Recurso guardado.');
      await loadData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo guardar el recurso.');
    } finally {
      setIsLoading(false);
    }
  }

  async function saveUser(event: FormEvent) {
    event.preventDefault();
    const bt4 = bearerToken();
    if (!bt4 || !isAdmin) return;
    setIsLoading(true);
    try {
      const payload: UserPayload = {
        name: userForm.name,
        email: userForm.email,
        role: userForm.role,
        isActive: userForm.isActive,
        isPenalized: userForm.isPenalized,
        penaltyEndDate: userForm.penaltyEndDate || null
      };
      const saved = editingUserId
        ? await api.updateUser(bt4, editingUserId, userForm.password ? { ...payload, password: userForm.password } : payload)
        : await api.createUser(bt4, { ...payload, password: userForm.password });
      setUsers((current) => [...current.filter((item) => item.id !== saved.id), saved].sort((a, b) => a.name.localeCompare(b.name)));
      setUserForm(emptyUser);
      setEditingUserId(null);
      setMessage('Usuario guardado.');
      await loadData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo guardar el usuario.');
    } finally {
      setIsLoading(false);
    }
  }

  async function clearPenalty(id: number) {
    const bt5 = bearerToken();
    if (!bt5 || !isAdmin) return;
    confirmToast({
      title: 'Quitar penalizacion',
      description: 'Confirma que deseas quitar la penalizacion de este usuario.',
      confirmLabel: 'Quitar',
      onConfirm: async () => {
        setIsLoading(true);
        try {
          const saved = await api.clearPenalty(bt5, id);
          setUsers((current) => current.map((item) => (item.id === saved.id ? saved : item)));
          setMessage('Penalizacion retirada.');
          await loadData();
        } catch (error) {
          setMessage(error instanceof Error ? error.message : 'No se pudo quitar la penalizacion.');
        } finally {
          setIsLoading(false);
        }
      },
    });
  }

  if (!user) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-6 py-10">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(14,165,233,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(14,165,233,0.08)_1px,transparent_1px)] bg-[size:34px_34px]" />
        <div className="absolute left-1/2 top-12 h-72 w-72 -translate-x-1/2 rounded-full bg-sky-200/50 blur-3xl" />
        <section className="relative z-10 w-full max-w-[480px]">
          <div className="mb-7 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-primary shadow-xl shadow-sky-200/70 ring-1 ring-sky-100">
              <Building2 size={30} />
            </div>
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">Acceso institucional</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">Sistema de solicitud de espacios</h1>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
              Reserva salas, biblioteca y recursos moviles desde una agenda institucional simple y ordenada.
            </p>
          </div>

          <div className="surface rounded-[2rem] p-8">
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-semibold">{needsBootstrap ? 'Crear administrador' : 'Iniciar sesion'}</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {needsBootstrap ? 'No hay usuarios registrados. Crea el primer administrador.' : 'Ingresa con tu correo y contrasena institucional.'}
              </p>
            </div>
            <form className="space-y-4" onSubmit={needsBootstrap ? bootstrapAdmin : login}>
              {needsBootstrap ? (
                <Field label="Nombre administrador">
                  <input className="input" value={adminName} onChange={(event) => setAdminName(event.target.value)} placeholder="Nombre completo" />
                </Field>
              ) : null}
              <Field label="Correo">
                <input className="input" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="correo@santotomas.cl" type="email" />
              </Field>
              <Field label="Contrasena">
                <input className="input" value={password} onChange={(event) => setPassword(event.target.value)} type="password" />
              </Field>
              <Button className="w-full" disabled={isLoading}>
                <LogIn size={18} />
                {needsBootstrap ? 'Crear administrador' : 'Entrar'}
              </Button>
            </form>
            {message ? <p className="mt-4 text-sm text-rose-700">{message}</p> : null}
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background lg:grid lg:grid-cols-[300px_1fr]">
      <aside className="st-shell border-r border-cyan-900/20 p-5 text-white lg:sticky lg:top-0 lg:min-h-screen">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-cyan-700 shadow-lg shadow-cyan-950/20 ring-1 ring-white/40">
            <Building2 size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100">Sistema</p>
            <p className="font-semibold">Operacion academica</p>
          </div>
        </div>
        <nav className="mt-9 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={classNames(
                'group flex h-12 w-full items-center gap-3 rounded-2xl px-4 text-left text-sm transition',
                activeTab === item.id ? 'bg-white text-cyan-800 shadow-xl shadow-cyan-950/20 ring-1 ring-white/60' : 'text-cyan-50/90 hover:bg-white/10 hover:text-white'
              )}
              onClick={() => setActiveTab(item.id)}
              type="button"
            >
              <item.icon size={18} />
              <span className="flex-1">{item.label}</span>
              {activeTab === item.id ? <ChevronRight size={16} /> : null}
            </button>
          ))}
        </nav>
        <div className="st-sidebar-card mt-8 rounded-2xl p-4 text-sm">
          <p className="font-medium">{user.name}</p>
          <p className="mt-1 text-cyan-100">{roleLabels[user.role]}</p>
        </div>
        <Button className="mt-4 w-full rounded-2xl border-white/30 bg-white text-cyan-800 hover:bg-cyan-50" variant="outline" onClick={logout}>
          <LogOut size={18} />
          Salir
        </Button>
      </aside>

      <section className="min-w-0 px-5 py-5 lg:px-8">
        <header className="surface mb-6 flex flex-col gap-4 rounded-3xl p-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="hidden h-14 w-1 rounded-full bg-primary md:block" />
            <div>
            <p className="text-sm font-medium text-primary">
              {new Date().toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            <h1 className="mt-1 text-3xl font-semibold">{navItems.find((item) => item.id === activeTab)?.label ?? 'Inicio'}</h1>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => void loadData()} disabled={isLoading}>
              <RefreshCw size={18} />
              Actualizar
            </Button>
          </div>
        </header>

        {activeTab === 'inicio' ? (
          <HomePanel
            stats={stats}
            bookings={bookings}
            penalizedUsers={penalizedUsers}
            auditLogs={auditLogs}
            canSeeAudit={isAdmin}
            inactiveSpaces={inactiveSpaces.length}
            inactiveResources={inactiveResources.length}
            inactiveUsers={inactiveUsers.length}
            onGoReservations={() => setActiveTab('reservas')}
          />
        ) : null}

        {activeTab === 'reservas' ? (
          <ReservationsPanel
            bookings={filteredBookings}
            spaces={spaces}
            activeSpaces={activeSpaces}
            resources={resources}
            activeResources={activeResources}
            selectedSpaceId={selectedSpaceId}
            selectedResourceIds={selectedResourceIds}
            startTime={startTime}
            endTime={endTime}
            search={bookingSearch}
            status={bookingStatus}
            spaceFilter={bookingSpaceFilter}
            resourceFilter={bookingResourceFilter}
            selectedSpaceBusy={selectedSpaceBusy}
            busySelectedResources={busySelectedResources}
            editingBookingId={editingBookingId}
            canManage={canManageCatalog}
            isLoading={isLoading}
            token={bearerToken() ?? null}
            onSearch={setBookingSearch}
            onStatus={setBookingStatus}
            onSpaceFilter={setBookingSpaceFilter}
            onResourceFilter={setBookingResourceFilter}
            onSelectedSpace={setSelectedSpaceId}
            onStart={setStartTime}
            onEnd={setEndTime}
            onToggleResource={(id) => setSelectedResourceIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])}
            onSubmit={saveBooking}
            onAction={changeBooking}
            onEditBooking={editBooking}
            onCancelEdit={cancelBookingEdit}
          />
        ) : null}

        {activeTab === 'salas' ? (
          <SpacesPanel
            spaces={spaces}
            canManage={canManageCatalog}
            form={spaceForm}
            isLoading={isLoading}
            onForm={setSpaceForm}
            onSubmit={saveSpace}
            onEdit={(space) => { setEditingSpaceId(space.id); setSpaceForm({ name: space.name, capacity: space.capacity, features: space.features, isActive: space.isActive }); }}
          />
        ) : null}

        {activeTab === 'recursos' ? (
          <ResourcesPanel
            resources={resources}
            canManage={canManageCatalog}
            form={resourceForm}
            isLoading={isLoading}
            onForm={setResourceForm}
            onSubmit={saveResource}
            onEdit={(resource) => { setEditingResourceId(resource.id); setResourceForm({ title: resource.title, type: resource.type, uniqueCode: resource.uniqueCode, isActive: resource.isActive }); }}
          />
        ) : null}

        {activeTab === 'usuarios' && isAdmin ? (
          <UsersPanel
            users={users}
            form={userForm}
            isLoading={isLoading}
            onForm={setUserForm}
            onSubmit={saveUser}
            onClearPenalty={clearPenalty}
            onEdit={(item) => { setEditingUserId(item.id); setUserForm({ name: item.name, email: item.email, password: '', role: item.role, isActive: item.isActive, isPenalized: item.isPenalized, penaltyEndDate: item.penaltyEndDate ?? '' }); }}
          />
        ) : null}

        {activeTab === 'auditoria' && isAdmin ? <AuditPanel logs={auditLogs} /> : null}

        {message ? <div className="mt-5 rounded-lg border border-border bg-white p-4 text-sm text-muted-foreground">{message}</div> : null}
      </section>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <div className="mt-2">{children}</div>
    </label>
  );
}

function HomePanel({
  stats,
  bookings,
  penalizedUsers,
  auditLogs,
  canSeeAudit,
  inactiveSpaces,
  inactiveResources,
  inactiveUsers,
  onGoReservations
}: {
  stats: Array<{ label: string; value: string; icon: LucideIcon; detail: string; tone: string }>;
  bookings: Booking[];
  penalizedUsers: User[];
  auditLogs: AuditLog[];
  canSeeAudit: boolean;
  inactiveSpaces: number;
  inactiveResources: number;
  inactiveUsers: number;
  onGoReservations: () => void;
}) {
  return (
    <div className="space-y-5">
        <section className="st-hero relative overflow-hidden rounded-3xl p-7 text-slate-900 shadow-xl shadow-sky-200/45">
        <div className="st-noise absolute inset-0 opacity-30" />
        <div className="relative z-10 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">Panel operativo</p>
            <h2 className="mt-2 max-w-2xl text-3xl font-semibold tracking-tight">Control diario de espacios, biblioteca y recursos moviles</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">Supervisa disponibilidad, solicitudes pendientes y riesgos administrativos desde una sola vista.</p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center text-sm">
            <div className="rounded-2xl border border-sky-200 bg-white/70 p-3 backdrop-blur"><p className="text-2xl font-semibold">{bookings.length}</p><p className="text-sky-700">Reservas</p></div>
            <div className="rounded-2xl border border-sky-200 bg-white/70 p-3 backdrop-blur"><p className="text-2xl font-semibold">{penalizedUsers.length}</p><p className="text-sky-700">Alertas</p></div>
            <div className="rounded-2xl border border-sky-200 bg-white/70 p-3 backdrop-blur"><p className="text-2xl font-semibold">{auditLogs.length}</p><p className="text-sky-700">Eventos</p></div>
          </div>
        </div>
      </section>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => <StatCard key={item.label} {...item} />)}
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="surface rounded-3xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Proximas reservas</h2>
              <p className="mt-1 text-sm text-muted-foreground">Agenda inmediata y estado operacional.</p>
            </div>
            <Button variant="outline" onClick={onGoReservations}>Ver agenda</Button>
          </div>
          <div className="mt-4 space-y-3">
            {bookings.slice(0, 6).map((booking) => (
              <div key={booking.id} className="grid gap-3 rounded-2xl border border-sky-100 bg-white/70 p-4 text-sm shadow-sm md:grid-cols-[1fr_auto] md:items-center">
                <div>
                  <p className="font-medium">{booking.space?.name ?? 'Recursos moviles'}</p>
                  <p className="text-muted-foreground">{new Date(booking.startTime).toLocaleString('es-CL')} - {booking.user.name}</p>
                </div>
                <StatusBadge status={booking.status} />
              </div>
            ))}
            {bookings.length === 0 ? <EmptyState title="Sin reservas" description="Cuando se creen reservas apareceran en este resumen." /> : null}
          </div>
        </section>
        <section className="surface rounded-3xl p-6">
          <h2 className="text-lg font-semibold">Atencion administrativa</h2>
          <div className="mt-4 space-y-3">
            <RiskRow label="Usuarios penalizados" value={penalizedUsers.length} tone={penalizedUsers.length > 0 ? 'warn' : 'ok'} />
            <RiskRow label="Salas inactivas" value={inactiveSpaces} tone={inactiveSpaces > 0 ? 'warn' : 'ok'} />
            <RiskRow label="Recursos inactivos" value={inactiveResources} tone={inactiveResources > 0 ? 'warn' : 'ok'} />
            {canSeeAudit ? <RiskRow label="Usuarios inactivos" value={inactiveUsers} tone={inactiveUsers > 0 ? 'warn' : 'ok'} /> : null}
          </div>
          {canSeeAudit ? (
            <div className="mt-5 border-t border-border pt-4">
              <h3 className="text-sm font-semibold">Ultima actividad</h3>
              <div className="mt-3 space-y-2">
                {auditLogs.slice(0, 4).map((log) => (
                  <p key={log.id} className="text-sm text-muted-foreground">{log.description}</p>
                ))}
                {auditLogs.length === 0 ? <p className="text-sm text-muted-foreground">Aun no hay eventos auditados.</p> : null}
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, detail, tone }: { label: string; value: string; icon: LucideIcon; detail: string; tone: string }) {
  const color = tone === 'amber' ? 'text-amber-700 bg-amber-50' : tone === 'blue' ? 'text-sky-700 bg-sky-50' : tone === 'slate' ? 'text-slate-700 bg-slate-50' : 'text-sky-800 bg-sky-50';
  const glow = tone === 'amber' ? 'before:from-amber-400/30' : tone === 'blue' ? 'before:from-sky-400/30' : tone === 'slate' ? 'before:from-slate-400/25' : 'before:from-sky-500/30';
  return (
    <div className={classNames('surface relative overflow-hidden rounded-3xl p-6', 'before:absolute before:inset-x-0 before:top-0 before:h-1 before:bg-gradient-to-r before:to-transparent', glow)}>
      <div className={classNames('flex h-12 w-12 items-center justify-center rounded-2xl shadow-sm', color)}>
        <Icon size={20} />
      </div>
      <p className="mt-6 text-4xl font-semibold tracking-tight">{value}</p>
      <p className="mt-1 text-sm font-medium">{label}</p>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}

function RiskRow({ label, value, tone }: { label: string; value: number; tone: 'ok' | 'warn' }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-border p-3 text-sm">
      <span>{label}</span>
      <span className={classNames('rounded-sm px-2 py-1 text-xs font-semibold', tone === 'warn' ? 'bg-amber-100 text-amber-800' : 'bg-sky-100 text-sky-800')}>
        {value}
      </span>
    </div>
  );
}

function ReservationsPanel(props: {
  bookings: Booking[];
  spaces: Space[];
  activeSpaces: Space[];
  resources: Resource[];
  activeResources: Resource[];
  selectedSpaceId: string;
  selectedResourceIds: number[];
  startTime: string;
  endTime: string;
  search: string;
  status: 'ALL' | BookingStatus;
  spaceFilter: string;
  resourceFilter: string;
  selectedSpaceBusy: boolean;
  busySelectedResources: number[];
  editingBookingId: number | null;
  canManage: boolean;
  isLoading: boolean;
  token?: string | null;
  onSearch: (value: string) => void;
  onStatus: (value: 'ALL' | BookingStatus) => void;
  onSpaceFilter: (value: string) => void;
  onResourceFilter: (value: string) => void;
  onSelectedSpace: (value: string) => void;
  onStart: (value: string) => void;
  onEnd: (value: string) => void;
  onToggleResource: (id: number) => void;
  onSubmit: (event: FormEvent) => void;
  onAction: (action: BookingAction, id: number) => void;
  onEditBooking: (booking: Booking) => void;
  onCancelEdit: () => void;
}) {
  const pending = props.bookings.filter((booking) => booking.status === 'PENDING').length;
  const active = props.bookings.filter((booking) => booking.status === 'ACTIVE').length;
  const completed = props.bookings.filter((booking) => booking.status === 'COMPLETED').length;

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-3xl border border-sky-200 bg-gradient-to-br from-sky-50 via-white to-cyan-50 p-6 shadow-xl shadow-sky-200/35">
        <div className="st-noise absolute inset-0 opacity-40" />
        <div className="relative z-10 grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">Agenda de reservas</p>
            <h2 className="mt-2 max-w-2xl text-3xl font-semibold tracking-tight">Disponibilidad de salas y recursos</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              Revisa ocupacion, filtra solicitudes y confirma nuevas reservas con validacion de disponibilidad.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center text-sm">
            <MiniMetric label="Pendientes" value={pending} />
            <MiniMetric label="Activas" value={active} />
            <MiniMetric label="Completadas" value={completed} />
          </div>
        </div>
      </section>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-5">
        <section className="surface rounded-3xl p-5 md:p-6">
          <BookingFilters {...props} />
          <div className="mt-5 overflow-hidden rounded-2xl border border-sky-100 bg-white/80 p-3 shadow-inner shadow-sky-100/60">
            <BookingCalendar bookings={props.bookings} token={props.token ?? undefined} />
          </div>
        </section>
        <BookingsTable bookings={props.bookings} canManage={props.canManage} isLoading={props.isLoading} onAction={props.onAction} onEdit={props.onEditBooking} />
      </div>
      <BookingForm {...props} />
      </div>
    </div>
  );
}

function BookingForm(props: Parameters<typeof ReservationsPanel>[0]) {
  const selectedResources = props.activeResources.filter((resource) => props.selectedResourceIds.includes(resource.id));
  const unavailable = props.selectedSpaceBusy || props.busySelectedResources.length > 0;

  return (
    <form className="surface rounded-3xl p-6 xl:sticky xl:top-5 xl:self-start" onSubmit={props.onSubmit}>
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-700"><Plus size={20} /></div>
        <div>
          <h2 className="text-lg font-semibold">{props.editingBookingId ? `Editar reserva #${props.editingBookingId}` : 'Nueva reserva'}</h2>
          <p className="text-sm text-muted-foreground">{props.editingBookingId ? 'Ajusta horario, sala o recursos.' : 'Completa horario, sala y recursos.'}</p>
        </div>
      </div>
      <div className="mt-5 space-y-4">
        <Field label="Sala">
          <select className="input" value={props.selectedSpaceId} onChange={(event) => props.onSelectedSpace(event.target.value)}>
            <option value="">Solo recursos moviles</option>
            {props.activeSpaces.map((space) => <option key={space.id} value={space.id}>{space.name} - {space.capacity} personas</option>)}
          </select>
        </Field>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
          <Field label="Inicio"><input type="datetime-local" className="input" value={props.startTime} onChange={(event) => props.onStart(event.target.value)} /></Field>
          <Field label="Termino"><input type="datetime-local" className="input" value={props.endTime} onChange={(event) => props.onEnd(event.target.value)} /></Field>
        </div>
        <fieldset>
          <div className="flex items-center justify-between">
            <legend className="text-sm font-medium">Recursos asociados</legend>
            <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700">{selectedResources.length} seleccionados</span>
          </div>
          <div className="mt-2 max-h-72 space-y-2 overflow-auto rounded-2xl border border-sky-100 bg-white/85 p-2">
            {props.activeResources.map((resource) => (
              <label key={resource.id} className="flex cursor-pointer items-start gap-3 rounded-xl p-3 transition hover:bg-sky-50">
                <input type="checkbox" className="mt-1 accent-sky-600" checked={props.selectedResourceIds.includes(resource.id)} onChange={() => props.onToggleResource(resource.id)} />
                <span className="text-sm">
                  <span className="block font-medium">{resource.title}</span>
                  <span className="text-muted-foreground">{resourceTypeLabels[resource.type]} - {resource.uniqueCode}</span>
                </span>
              </label>
            ))}
            {props.activeResources.length === 0 ? <p className="p-2 text-sm text-muted-foreground">No hay recursos activos.</p> : null}
          </div>
        </fieldset>
        <div className={classNames('rounded-2xl border p-4 text-sm', unavailable ? 'border-rose-200 bg-rose-50 text-rose-900' : 'border-sky-200 bg-sky-50 text-sky-950')}>
          <p className="font-semibold">Disponibilidad previa</p>
          <p className={props.selectedSpaceBusy ? 'mt-2 text-rose-700' : 'mt-2 text-sky-800'}>
            Sala: {props.selectedSpaceId ? (props.selectedSpaceBusy ? 'Ocupada en este horario' : 'Disponible') : 'No seleccionada'}
          </p>
          <p className={props.busySelectedResources.length > 0 ? 'mt-1 text-rose-700' : 'mt-1 text-sky-800'}>
            Recursos: {props.selectedResourceIds.length === 0 ? 'No seleccionados' : props.busySelectedResources.length > 0 ? 'Hay recursos ocupados' : 'Disponibles'}
          </p>
        </div>
        <Button className="h-12 w-full rounded-2xl" disabled={props.isLoading || unavailable}>
          <Plus size={18} />
          {props.editingBookingId ? 'Guardar cambios' : 'Crear reserva'}
        </Button>
        {props.editingBookingId ? (
          <Button className="w-full rounded-2xl" variant="outline" type="button" onClick={props.onCancelEdit}>
            Cancelar edicion
          </Button>
        ) : null}
      </div>
    </form>
  );
}

function BookingFilters(props: Parameters<typeof ReservationsPanel>[0]) {
  return (
    <div>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Agenda y filtros</h2>
          <p className="mt-1 text-sm text-muted-foreground">Explora reservas por usuario, sala, recurso o estado.</p>
        </div>
        <span className="self-start rounded-full bg-sky-50 px-4 py-2 text-sm font-medium text-sky-800 md:self-auto">{props.bookings.length} resultados</span>
      </div>
      <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(260px,1fr)_190px_220px_220px]">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-muted-foreground" size={16} />
          <input className="input pl-9" placeholder="Buscar usuario, sala o recurso" value={props.search} onChange={(event) => props.onSearch(event.target.value)} />
        </div>
        <select className="input" value={props.status} onChange={(event) => props.onStatus(event.target.value as 'ALL' | BookingStatus)}>
          <option value="ALL">Todos los estados</option>
          {allStatuses.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}
        </select>
        <select className="input" value={props.spaceFilter} onChange={(event) => props.onSpaceFilter(event.target.value)}>
          <option value="ALL">Todas las salas</option>
          {props.spaces.map((space) => <option key={space.id} value={space.id}>{space.name}</option>)}
        </select>
        <select className="input" value={props.resourceFilter} onChange={(event) => props.onResourceFilter(event.target.value)}>
          <option value="ALL">Todos los recursos</option>
          {props.resources.map((resource) => <option key={resource.id} value={resource.id}>{resource.title}</option>)}
        </select>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <FilterChip active={props.status === 'ALL'} label="Todos" onClick={() => props.onStatus('ALL')} />
        {allStatuses.map((status) => (
          <FilterChip key={status} active={props.status === status} label={statusLabels[status]} onClick={() => props.onStatus(status)} />
        ))}
      </div>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-sky-200 bg-white/75 px-5 py-4 shadow-sm shadow-sky-100/60 backdrop-blur">
      <p className="text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-xs font-medium text-sky-700">{label}</p>
    </div>
  );
}

function FilterChip({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      className={classNames(
        'h-9 rounded-full border px-4 text-sm font-medium transition',
        active ? 'border-sky-500 bg-sky-100 text-sky-900 shadow-sm shadow-sky-200/70' : 'border-sky-100 bg-white/70 text-muted-foreground hover:border-sky-300 hover:text-sky-800'
      )}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

function SpacesPanel({ spaces, canManage, form, isLoading, onForm, onSubmit, onEdit }: { spaces: Space[]; canManage: boolean; form: typeof emptySpace; isLoading: boolean; onForm: (value: typeof emptySpace) => void; onSubmit: (event: FormEvent) => void; onEdit: (space: Space) => void }) {
  return (
    <CatalogPanel
      title="Inventario de salas"
      description="Mantiene salas, laboratorios y auditorios disponibles para reserva."
      canManage={canManage}
      form={
        <form className="grid gap-3 xl:grid-cols-[1fr_120px_1fr_auto_auto]" onSubmit={onSubmit}>
          <input className="input" placeholder="Nombre de sala" value={form.name} onChange={(event) => onForm({ ...form, name: event.target.value })} />
          <input className="input" type="number" min={1} value={form.capacity} onChange={(event) => onForm({ ...form, capacity: Number(event.target.value) })} />
          <input className="input" placeholder="Caracteristicas" value={form.features} onChange={(event) => onForm({ ...form, features: event.target.value })} />
          <label className="flex h-10 items-center gap-2 text-sm"><input type="checkbox" checked={form.isActive} onChange={(event) => onForm({ ...form, isActive: event.target.checked })} /> Activa</label>
          <Button disabled={isLoading}><Save size={18} />Guardar</Button>
        </form>
      }
    >
      <DataTable headers={['Nombre', 'Capacidad', 'Caracteristicas', 'Estado', 'Accion']}>
        {spaces.map((space) => (
          <tr key={space.id} className="border-b border-border last:border-0">
            <td className="py-3 pr-3 font-medium">{space.name}</td>
            <td className="py-3 pr-3">{space.capacity}</td>
            <td className="py-3 pr-3 text-muted-foreground">{space.features}</td>
            <td className="py-3 pr-3"><BinaryBadge enabled={space.isActive} enabledText="Activa" disabledText="Inactiva" /></td>
            <td className="py-3">{canManage ? <Button variant="outline" type="button" onClick={() => onEdit(space)}>Editar</Button> : null}</td>
          </tr>
        ))}
      </DataTable>
    </CatalogPanel>
  );
}

function ResourcesPanel({ resources, canManage, form, isLoading, onForm, onSubmit, onEdit }: { resources: Resource[]; canManage: boolean; form: typeof emptyResource; isLoading: boolean; onForm: (value: typeof emptyResource) => void; onSubmit: (event: FormEvent) => void; onEdit: (resource: Resource) => void }) {
  return (
    <CatalogPanel
      title="Catalogo de recursos"
      description="Administra libros, proyectores y hardware movil."
      canManage={canManage}
      form={
        <form className="grid gap-3 xl:grid-cols-[1fr_150px_170px_auto_auto]" onSubmit={onSubmit}>
          <input className="input" placeholder="Titulo" value={form.title} onChange={(event) => onForm({ ...form, title: event.target.value })} />
          <select className="input" value={form.type} onChange={(event) => onForm({ ...form, type: event.target.value as ResourceType })}>
            <option value="BOOK">Libro</option>
            <option value="HARDWARE">Hardware</option>
          </select>
          <input className="input" placeholder="Codigo unico" value={form.uniqueCode} onChange={(event) => onForm({ ...form, uniqueCode: event.target.value })} />
          <label className="flex h-10 items-center gap-2 text-sm"><input type="checkbox" checked={form.isActive} onChange={(event) => onForm({ ...form, isActive: event.target.checked })} /> Activo</label>
          <Button disabled={isLoading}><Save size={18} />Guardar</Button>
        </form>
      }
    >
      <DataTable headers={['Titulo', 'Tipo', 'Codigo', 'Estado', 'Accion']}>
        {resources.map((resource) => (
          <tr key={resource.id} className="border-b border-border last:border-0">
            <td className="py-3 pr-3 font-medium">{resource.title}</td>
            <td className="py-3 pr-3">{resourceTypeLabels[resource.type]}</td>
            <td className="py-3 pr-3 text-muted-foreground">{resource.uniqueCode}</td>
            <td className="py-3 pr-3"><BinaryBadge enabled={resource.isActive} enabledText="Activo" disabledText="Inactivo" /></td>
            <td className="py-3">{canManage ? <Button variant="outline" type="button" onClick={() => onEdit(resource)}>Editar</Button> : null}</td>
          </tr>
        ))}
      </DataTable>
    </CatalogPanel>
  );
}

function UsersPanel({ users, form, isLoading, onForm, onSubmit, onEdit, onClearPenalty }: { users: User[]; form: typeof emptyUser; isLoading: boolean; onForm: (value: typeof emptyUser) => void; onSubmit: (event: FormEvent) => void; onEdit: (user: User) => void; onClearPenalty: (id: number) => void }) {
  return (
    <CatalogPanel
      title="Usuarios y permisos"
      description="Controla acceso, roles, estado de cuenta y penalizaciones."
      canManage
      form={
        <form className="grid gap-3 2xl:grid-cols-[1fr_1fr_150px_150px_auto_auto_auto]" onSubmit={onSubmit}>
          <input className="input" placeholder="Nombre" value={form.name} onChange={(event) => onForm({ ...form, name: event.target.value })} />
          <input className="input" placeholder="Correo" type="email" value={form.email} onChange={(event) => onForm({ ...form, email: event.target.value })} />
          <input className="input" placeholder="Clave" type="password" value={form.password} onChange={(event) => onForm({ ...form, password: event.target.value })} />
          <select className="input" value={form.role} onChange={(event) => onForm({ ...form, role: event.target.value as Role })}>
            {Object.entries(roleLabels).map(([role, label]) => <option key={role} value={role}>{label}</option>)}
          </select>
          <label className="flex h-10 items-center gap-2 text-sm"><input type="checkbox" checked={form.isActive} onChange={(event) => onForm({ ...form, isActive: event.target.checked })} /> Activo</label>
          <label className="flex h-10 items-center gap-2 text-sm"><input type="checkbox" checked={form.isPenalized} onChange={(event) => onForm({ ...form, isPenalized: event.target.checked })} /> Penalizado</label>
          <Button disabled={isLoading}><Save size={18} />Guardar</Button>
        </form>
      }
    >
      <DataTable headers={['Nombre', 'Correo', 'Rol', 'Estado', 'Penalizacion', 'Acciones']}>
        {users.map((item) => (
          <tr key={item.id} className="border-b border-border last:border-0">
            <td className="py-3 pr-3 font-medium">{item.name}</td>
            <td className="py-3 pr-3 text-muted-foreground">{item.email}</td>
            <td className="py-3 pr-3">{roleLabels[item.role]}</td>
            <td className="py-3 pr-3"><BinaryBadge enabled={item.isActive} enabledText="Activo" disabledText="Inactivo" /></td>
            <td className="py-3 pr-3">{item.isPenalized ? <span className="text-amber-700">Hasta {formatDate(item.penaltyEndDate)}</span> : 'Sin penalizacion'}</td>
            <td className="py-3">
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" type="button" onClick={() => onEdit(item)}>Editar</Button>
                {item.isPenalized ? <Button variant="outline" type="button" onClick={() => onClearPenalty(item.id)}>Quitar penalizacion</Button> : null}
              </div>
            </td>
          </tr>
        ))}
      </DataTable>
    </CatalogPanel>
  );
}

function AuditPanel({ logs }: { logs: AuditLog[] }) {
  return (
    <section className="surface rounded-lg p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-100 text-slate-700"><Activity size={20} /></div>
        <div>
          <h2 className="text-base font-semibold">Auditoria reciente</h2>
          <p className="text-sm text-muted-foreground">Ultimas acciones administrativas registradas.</p>
        </div>
      </div>
      <DataTable headers={['Fecha', 'Usuario', 'Accion', 'Entidad', 'Detalle']}>
        {logs.map((log) => (
          <tr key={log.id} className="border-b border-border last:border-0">
            <td className="py-3 pr-3">{new Date(log.createdAt).toLocaleString('es-CL')}</td>
            <td className="py-3 pr-3">{log.actor?.name ?? 'Sistema'}</td>
            <td className="py-3 pr-3">{log.action}</td>
            <td className="py-3 pr-3">{log.entityType}</td>
            <td className="py-3">{log.description}</td>
          </tr>
        ))}
      </DataTable>
      {logs.length === 0 ? <EmptyState title="Sin eventos" description="Las acciones administrativas apareceran aqui." /> : null}
    </section>
  );
}

function DataTable({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-sky-100">
      <div className="overflow-x-auto">
      <table className="w-full min-w-[820px] border-collapse bg-white/70 text-sm">
        <thead>
          <tr className="border-b border-sky-100 bg-sky-50/90 text-left text-sky-950">
            {headers.map((header) => <th key={header} className="px-4 py-3 font-semibold">{header}</th>)}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
      </div>
    </div>
  );
}

function CatalogPanel({ title, description, canManage, form, children }: { title: string; description: string; canManage: boolean; form: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-5">
      <section className="surface rounded-3xl p-6">
        <div className="mb-4">
          <h2 className="text-base font-semibold">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        {canManage ? form : <p className="text-sm text-muted-foreground">Tu rol permite consultar esta informacion, pero no modificarla.</p>}
      </section>
      <section className="surface rounded-3xl p-6">{children}</section>
    </div>
  );
}

function StatusBadge({ status }: { status: BookingStatus }) {
  const styles: Record<BookingStatus, string> = {
    PENDING: 'bg-amber-100 text-amber-800 border-amber-200',
    ACTIVE: 'bg-sky-100 text-sky-800 border-sky-200',
    COMPLETED: 'bg-slate-100 text-slate-700 border-slate-200',
    CANCELLED: 'bg-rose-100 text-rose-800 border-rose-200'
  };
  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${styles[status]}`}>{statusLabels[status]}</span>;
}

function BinaryBadge({ enabled, enabledText, disabledText }: { enabled: boolean; enabledText: string; disabledText: string }) {
  return (
    <span className={classNames('inline-flex rounded-full border px-3 py-1 text-xs font-medium', enabled ? 'border-sky-200 bg-sky-100 text-sky-800' : 'border-slate-200 bg-slate-100 text-slate-700')}>
      {enabled ? enabledText : disabledText}
    </span>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-md border border-dashed border-border p-6 text-center">
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function BookingsTable({
  bookings,
  canManage,
  isLoading,
  onAction,
  onEdit
}: {
  bookings: Booking[];
  canManage: boolean;
  isLoading: boolean;
  onAction: (action: BookingAction, id: number) => void;
  onEdit: (booking: Booking) => void;
}) {
  return (
    <section className="surface rounded-3xl p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Reservas registradas</h2>
          <p className="mt-1 text-sm text-muted-foreground">Lista operativa con sala, recursos, usuario y estado.</p>
        </div>
        <span className="self-start rounded-full bg-white px-4 py-2 text-sm font-medium text-muted-foreground ring-1 ring-sky-100 md:self-auto">{bookings.length} registros</span>
      </div>
      <DataTable headers={['Inicio', 'Fin', 'Sala', 'Recursos', 'Usuario', 'Estado', 'Acciones']}>
        {bookings.map((booking) => (
          <tr key={booking.id} className="border-b border-sky-100/80 last:border-0">
            <td className="px-4 py-4">{new Date(booking.startTime).toLocaleString('es-CL')}</td>
            <td className="px-4 py-4">{new Date(booking.endTime).toLocaleString('es-CL')}</td>
            <td className="px-4 py-4 font-medium">{booking.space?.name ?? 'Sin sala'}</td>
            <td className="px-4 py-4 text-muted-foreground">{booking.details.map((detail) => detail.resource.title).join(', ') || 'Sin recursos'}</td>
            <td className="px-4 py-4">{booking.user.name}</td>
            <td className="px-4 py-4"><StatusBadge status={booking.status} /></td>
            <td className="px-4 py-4">
              <div className="flex flex-wrap gap-2">
                {canManage && booking.status !== 'CANCELLED' && booking.status !== 'COMPLETED' ? (
                  <Button variant="outline" type="button" disabled={isLoading} onClick={() => onEdit(booking)}>
                    Editar
                  </Button>
                ) : null}
                {canManage && booking.status === 'PENDING' ? <Button variant="outline" type="button" disabled={isLoading} onClick={() => onAction('activate', booking.id)}><CheckCircle2 size={16} /> Activar</Button> : null}
                {booking.status !== 'CANCELLED' && booking.status !== 'COMPLETED' ? <Button variant="outline" type="button" disabled={isLoading} onClick={() => onAction('cancel', booking.id)}><XCircle size={16} /> Cancelar</Button> : null}
                {canManage && booking.status !== 'COMPLETED' && booking.status !== 'CANCELLED' ? <Button variant="outline" type="button" disabled={isLoading} onClick={() => onAction('complete', booking.id)}>Completar</Button> : null}
                {canManage && booking.status !== 'COMPLETED' && booking.status !== 'CANCELLED' ? <Button variant="outline" type="button" disabled={isLoading} onClick={() => onAction('noShow', booking.id)}><UserRound size={16} /> Ausente</Button> : null}
              </div>
            </td>
          </tr>
        ))}
      </DataTable>
      {bookings.length === 0 ? <EmptyState title="Sin resultados" description="Ajusta filtros o crea una nueva reserva." /> : null}
    </section>
  );
}
