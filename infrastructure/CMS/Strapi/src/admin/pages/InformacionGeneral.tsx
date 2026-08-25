import * as React from 'react';
import { Page, useFetchClient, useNotification, useRBAC } from '@strapi/strapi/admin';
import { Box, Button, Flex, Typography } from '@strapi/design-system';
import { Plus, Pencil, Trash, Check, Cross } from '@strapi/icons';

const PERMS = {
  read: 'admin::company-profile.read',
  create: 'admin::company-profile.create',
  update: 'admin::company-profile.update',
  delete: 'admin::company-profile.delete',
} as const;

/** Permisos efectivos que la UI usa para mostrar/ocultar acciones (UX; la barrera real es el servidor). */
export interface Can {
  create: boolean;
  update: boolean;
  delete: boolean;
}
import type {
  CompanyProfileView,
  EmailItem,
  FieldError,
  LocationItem,
  PhoneItem,
  SocialLinkItem,
} from './types';

const BASE = '/company-profile';

/** CSS de marca + layout responsive inyectado una vez. */
const STYLES = `
.cc-wrap{max-width:920px;margin:0 auto;padding:24px 16px 64px;}
.cc-card{background:var(--cc-surface,#fff);border:1px solid rgba(0,0,0,.08);border-radius:12px;padding:20px;margin-bottom:20px;box-shadow:0 1px 2px rgba(0,0,0,.04);}
.cc-card h2{margin:0 0 4px;font-size:1.05rem;font-weight:700;color:#32324d;}
.cc-hint{color:#666687;font-size:.82rem;margin:0 0 16px;}
.cc-row{display:flex;align-items:center;gap:12px;justify-content:space-between;padding:10px 12px;border:1px solid #eaeaef;border-radius:8px;margin-bottom:8px;background:#fafafa;}
.cc-row .cc-main{min-width:0;overflow-wrap:anywhere;}
.cc-actions{display:flex;gap:8px;flex-shrink:0;}
.cc-input{width:100%;box-sizing:border-box;padding:10px 12px;border:1px solid #dcdce4;border-radius:8px;font-size:.9rem;background:#fff;color:#32324d;}
.cc-input:focus{outline:none;border-color:#7C3AED;box-shadow:0 0 0 3px rgba(124,58,237,.18);}
.cc-input.cc-err{border-color:#d02b20;}
.cc-label{display:block;font-size:.8rem;font-weight:600;color:#32324d;margin:0 0 6px;}
.cc-fielderr{color:#d02b20;font-size:.78rem;margin:6px 0 0;}
.cc-field{margin-bottom:14px;}
.cc-formgrid{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
.cc-iconbtn{display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:8px;border:1px solid #dcdce4;background:#fff;cursor:pointer;}
.cc-iconbtn:hover{background:#f6f6f9;}
.cc-iconbtn.cc-danger:hover{background:#fcecea;border-color:#d02b20;}
.cc-map{width:100%;height:280px;border:1px solid #dcdce4;border-radius:8px;}
.cc-results{list-style:none;margin:6px 0 0;padding:0;border:1px solid #eaeaef;border-radius:8px;max-height:180px;overflow:auto;}
.cc-results li{padding:8px 12px;cursor:pointer;font-size:.85rem;border-bottom:1px solid #f0f0f4;}
.cc-results li:hover{background:#f5f3ff;}
@media (max-width:600px){
  .cc-row{flex-direction:column;align-items:stretch;}
  .cc-actions{justify-content:flex-end;}
  .cc-formgrid{grid-template-columns:1fr;}
}
`;

interface ApiError {
  message: string;
  errors: FieldError[];
}
function extractError(e: unknown): ApiError {
  const err = (e as { response?: { data?: { error?: { message?: string; details?: { errors?: FieldError[] } } } } })
    ?.response?.data?.error;
  return {
    message: err?.message ?? 'No se pudo completar la operación.',
    errors: Array.isArray(err?.details?.errors) ? err!.details!.errors! : [],
  };
}

function firstError(errors: FieldError[]): string | undefined {
  return errors.length > 0 ? errors[0].message : undefined;
}

const IconBtn: React.FC<{ label: string; danger?: boolean; onClick: () => void; disabled?: boolean; children: React.ReactNode }> = ({
  label,
  danger,
  onClick,
  disabled,
  children,
}) => (
  <button type="button" aria-label={label} title={label} className={`cc-iconbtn${danger ? ' cc-danger' : ''}`} onClick={onClick} disabled={disabled}>
    {children}
  </button>
);

const InformacionGeneral = () => {
  const { get, post, put, del } = useFetchClient();
  const { toggleNotification } = useNotification();
  const { allowedActions, isLoading: rbacLoading } = useRBAC([
    { action: PERMS.read },
    { action: PERMS.create },
    { action: PERMS.update },
    { action: PERMS.delete },
  ]);
  const can: Can = {
    create: Boolean(allowedActions.canCreate),
    update: Boolean(allowedActions.canUpdate),
    delete: Boolean(allowedActions.canDelete),
  };

  const [view, setView] = React.useState<CompanyProfileView | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState(false);

  const refresh = React.useCallback(async () => {
    try {
      const { data } = await get(`${BASE}/informacion-general`);
      setView(data.data as CompanyProfileView);
      setLoadError(false);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [get]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  const notifyOk = (message: string) => toggleNotification({ type: 'success', message });
  const notifyErr = (message: string) => toggleNotification({ type: 'danger', message });

  // Envuelve una mutación: aplica la vista devuelta, notifica y propaga errores de campo.
  const mutate = async (fn: () => Promise<{ data: { data: CompanyProfileView } }>, okMsg: string): Promise<ApiError | null> => {
    try {
      const { data } = await fn();
      setView(data.data);
      notifyOk(okMsg);
      return null;
    } catch (e) {
      const parsed = extractError(e);
      notifyErr(parsed.message);
      return parsed;
    }
  };

  if (loading || rbacLoading) return <Page.Loading />;
  if (!allowedActions.canRead) {
    return (
      <Page.Main>
        <Box padding={10}>
          <Typography variant="beta">No tiene permiso para ver la Información General.</Typography>
        </Box>
      </Page.Main>
    );
  }
  if (loadError || !view) {
    return (
      <Page.Main>
        <Box padding={10}>
          <Typography variant="beta">No se pudo cargar la Información General.</Typography>
          <Box paddingTop={4}>
            <Button onClick={() => { setLoading(true); refresh(); }}>Reintentar</Button>
          </Box>
        </Box>
      </Page.Main>
    );
  }

  return (
    <Page.Main>
      <style>{STYLES}</style>
      <div className="cc-wrap">
        <Box paddingBottom={6}>
          <Typography variant="alpha" tag="h1">Información General</Typography>
          <Typography variant="epsilon" textColor="neutral600">
            Datos de contacto públicos de Cromática Creativa.
          </Typography>
        </Box>

        <RecipientBlock view={view} mutate={mutate} post={post} put={put} can={can} />

        {view.companyProfileId ? (
          <>
            <PhoneBlock view={view} mutate={mutate} post={post} put={put} del={del} notifyErr={notifyErr} can={can} />
            <EmailBlock view={view} mutate={mutate} post={post} put={put} del={del} notifyErr={notifyErr} can={can} />
            <SocialBlock view={view} mutate={mutate} post={post} put={put} del={del} notifyErr={notifyErr} can={can} />
            <LocationBlock view={view} mutate={mutate} post={post} put={put} del={del} notifyErr={notifyErr} get={get} can={can} />
          </>
        ) : (
          <Box className="cc-card">
            <Typography textColor="neutral600">
              Configure primero el correo receptor para habilitar el resto de la información.
            </Typography>
          </Box>
        )}
      </div>
    </Page.Main>
  );
};

/* ------------------------------ Bloque A: correo receptor ------------------------------ */
type Mutate = (fn: () => Promise<{ data: { data: CompanyProfileView } }>, okMsg: string) => Promise<ApiError | null>;

const RecipientBlock: React.FC<{ view: CompanyProfileView; mutate: Mutate; post: any; put: any; can: Can }> = ({ view, mutate, post, put, can }) => {
  const exists = Boolean(view.companyProfileId);
  const [editing, setEditing] = React.useState(!exists && can.create);
  const [value, setValue] = React.useState(view.recipientEmail ?? '');
  const [err, setErr] = React.useState<string | undefined>();
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => { setValue(view.recipientEmail ?? ''); setEditing(!exists && can.create); }, [view.recipientEmail, exists, can.create]);

  const save = async () => {
    setSaving(true);
    setErr(undefined);
    const res = await mutate(
      () => (exists ? put(`${BASE}/recipient-email`, { recipientEmail: value }) : post(`${BASE}/initialize`, { recipientEmail: value })),
      exists ? 'Correo receptor actualizado.' : 'Información inicializada.',
    );
    setSaving(false);
    if (res) setErr(firstError(res.errors) ?? res.message);
    else setEditing(false);
  };

  return (
    <Box className="cc-card">
      <Typography tag="h2" className="cc-card">Correo receptor de solicitudes</Typography>
      <p className="cc-hint">Este correo recibe las solicitudes enviadas desde el formulario de contacto. No puede eliminarse.</p>
      {editing ? (
        <div className="cc-field">
          <label className="cc-label" htmlFor="cc-recipient">Correo receptor</label>
          <input id="cc-recipient" type="email" className={`cc-input${err ? ' cc-err' : ''}`} value={value} onChange={(e) => setValue(e.target.value)} placeholder="destino@cromaticacreativa.com" disabled={saving} />
          {err && <p className="cc-fielderr">{err}</p>}
          <Box paddingTop={3}>
            <Flex gap={2}>
              <Button onClick={save} loading={saving} startIcon={<Check />}>{exists ? 'Guardar' : 'Inicializar'}</Button>
              {exists && <Button variant="tertiary" onClick={() => { setEditing(false); setValue(view.recipientEmail ?? ''); setErr(undefined); }} disabled={saving}>Cancelar</Button>}
            </Flex>
          </Box>
        </div>
      ) : exists ? (
        <div className="cc-row">
          <div className="cc-main"><Typography fontWeight="semiBold">{view.recipientEmail}</Typography></div>
          {can.update && <div className="cc-actions"><IconBtn label="Editar correo receptor" onClick={() => setEditing(true)}><Pencil /></IconBtn></div>}
        </div>
      ) : (
        <Typography textColor="neutral600">Sin configurar. Requiere permiso de creación para inicializar la Información General.</Typography>
      )}
    </Box>
  );
};

/* ------------------------------ Bloques de lista genéricos ------------------------------ */
interface ListBlockProps {
  view: CompanyProfileView;
  mutate: Mutate;
  post: any;
  put: any;
  del: any;
  notifyErr: (m: string) => void;
  can: Can;
}

function useRowEditor() {
  const [addingOpen, setAddingOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  return { addingOpen, setAddingOpen, editingId, setEditingId, busy, setBusy };
}

const PhoneBlock: React.FC<ListBlockProps> = ({ view, mutate, post, put, del, can }) => {
  const ed = useRowEditor();
  const [draft, setDraft] = React.useState('');
  const [err, setErr] = React.useState<string | undefined>();

  const submit = async (id?: string) => {
    ed.setBusy(true); setErr(undefined);
    const res = await mutate(() => (id ? put(`${BASE}/phones/${id}`, { number: draft }) : post(`${BASE}/phones`, { number: draft })), id ? 'Teléfono actualizado.' : 'Teléfono agregado.');
    ed.setBusy(false);
    if (res) { setErr(firstError(res.errors) ?? res.message); return; }
    setDraft(''); ed.setAddingOpen(false); ed.setEditingId(null);
  };
  const remove = async (item: PhoneItem) => {
    if (!window.confirm(`¿Eliminar el teléfono ${item.number}?`)) return;
    await mutate(() => del(`${BASE}/phones/${item.id}`), 'Teléfono eliminado.');
  };

  return (
    <Box className="cc-card">
      <Flex justifyContent="space-between" alignItems="center" paddingBottom={2}>
        <Typography tag="h2" fontWeight="bold">Teléfonos</Typography>
        {can.create && <Button size="S" startIcon={<Plus />} onClick={() => { setDraft(''); setErr(undefined); ed.setAddingOpen(true); ed.setEditingId(null); }}>Agregar teléfono</Button>}
      </Flex>
      {view.phones.length === 0 && !ed.addingOpen && <Typography textColor="neutral600">No hay teléfonos configurados.</Typography>}
      {view.phones.map((item) =>
        ed.editingId === item.id ? (
          <RowEditor key={item.id} label="Número" value={draft} onChange={setDraft} err={err} busy={ed.busy} placeholder="+58 412 1234567" onSave={() => submit(item.id)} onCancel={() => { ed.setEditingId(null); setErr(undefined); }} />
        ) : (
          <div className="cc-row" key={item.id}>
            <div className="cc-main"><Typography fontWeight="semiBold">{item.number}</Typography></div>
            <div className="cc-actions">
              {can.update && <IconBtn label="Editar" onClick={() => { setDraft(item.number); setErr(undefined); ed.setEditingId(item.id); ed.setAddingOpen(false); }}><Pencil /></IconBtn>}
              {can.delete && <IconBtn label="Eliminar" danger onClick={() => remove(item)}><Trash /></IconBtn>}
            </div>
          </div>
        ),
      )}
      {ed.addingOpen && <RowEditor label="Número" value={draft} onChange={setDraft} err={err} busy={ed.busy} placeholder="+58 412 1234567" onSave={() => submit()} onCancel={() => { ed.setAddingOpen(false); setErr(undefined); }} />}
      <p className="cc-hint">El número se normaliza en el servidor (formato internacional E.164); se muestra el valor canónico.</p>
    </Box>
  );
};

const EmailBlock: React.FC<ListBlockProps> = ({ view, mutate, post, put, del, can }) => {
  const ed = useRowEditor();
  const [draft, setDraft] = React.useState('');
  const [err, setErr] = React.useState<string | undefined>();
  const submit = async (id?: string) => {
    ed.setBusy(true); setErr(undefined);
    const res = await mutate(() => (id ? put(`${BASE}/emails/${id}`, { address: draft }) : post(`${BASE}/emails`, { address: draft })), id ? 'Correo actualizado.' : 'Correo agregado.');
    ed.setBusy(false);
    if (res) { setErr(firstError(res.errors) ?? res.message); return; }
    setDraft(''); ed.setAddingOpen(false); ed.setEditingId(null);
  };
  const remove = async (item: EmailItem) => {
    if (!window.confirm(`¿Eliminar el correo ${item.address}?`)) return;
    await mutate(() => del(`${BASE}/emails/${item.id}`), 'Correo eliminado.');
  };
  return (
    <Box className="cc-card">
      <Flex justifyContent="space-between" alignItems="center" paddingBottom={2}>
        <Typography tag="h2" fontWeight="bold">Correos públicos</Typography>
        {can.create && <Button size="S" startIcon={<Plus />} onClick={() => { setDraft(''); setErr(undefined); ed.setAddingOpen(true); ed.setEditingId(null); }}>Agregar correo</Button>}
      </Flex>
      {view.emails.length === 0 && !ed.addingOpen && <Typography textColor="neutral600">No hay correos públicos.</Typography>}
      {view.emails.map((item) =>
        ed.editingId === item.id ? (
          <RowEditor key={item.id} label="Correo" value={draft} onChange={setDraft} err={err} busy={ed.busy} placeholder="contacto@cromaticacreativa.com" onSave={() => submit(item.id)} onCancel={() => { ed.setEditingId(null); setErr(undefined); }} />
        ) : (
          <div className="cc-row" key={item.id}>
            <div className="cc-main"><Typography fontWeight="semiBold">{item.address}</Typography></div>
            <div className="cc-actions">
              {can.update && <IconBtn label="Editar" onClick={() => { setDraft(item.address); setErr(undefined); ed.setEditingId(item.id); ed.setAddingOpen(false); }}><Pencil /></IconBtn>}
              {can.delete && <IconBtn label="Eliminar" danger onClick={() => remove(item)}><Trash /></IconBtn>}
            </div>
          </div>
        ),
      )}
      {ed.addingOpen && <RowEditor label="Correo" value={draft} onChange={setDraft} err={err} busy={ed.busy} placeholder="contacto@cromaticacreativa.com" onSave={() => submit()} onCancel={() => { ed.setAddingOpen(false); setErr(undefined); }} />}
    </Box>
  );
};

const SocialBlock: React.FC<ListBlockProps> = ({ view, mutate, post, put, del, can }) => {
  const ed = useRowEditor();
  const [network, setNetwork] = React.useState('');
  const [url, setUrl] = React.useState('');
  const [err, setErr] = React.useState<string | undefined>();
  const open = (item?: SocialLinkItem) => { setNetwork(item?.network ?? ''); setUrl(item?.url ?? ''); setErr(undefined); if (item) { ed.setEditingId(item.id); ed.setAddingOpen(false); } else { ed.setAddingOpen(true); ed.setEditingId(null); } };
  const submit = async (id?: string) => {
    ed.setBusy(true); setErr(undefined);
    const res = await mutate(() => (id ? put(`${BASE}/social-links/${id}`, { network, url }) : post(`${BASE}/social-links`, { network, url })), id ? 'Red social actualizada.' : 'Red social agregada.');
    ed.setBusy(false);
    if (res) { setErr(firstError(res.errors) ?? res.message); return; }
    ed.setAddingOpen(false); ed.setEditingId(null);
  };
  const remove = async (item: SocialLinkItem) => {
    if (!window.confirm(`¿Eliminar la red ${item.network}?`)) return;
    await mutate(() => del(`${BASE}/social-links/${item.id}`), 'Red social eliminada.');
  };
  const Editor = (id?: string) => (
    <div className="cc-card" style={{ background: '#fbfbfe' }}>
      <div className="cc-formgrid">
        <div className="cc-field"><label className="cc-label">Red</label><input className="cc-input" value={network} onChange={(e) => setNetwork(e.target.value)} placeholder="Instagram, WhatsApp, ..." disabled={ed.busy} /></div>
        <div className="cc-field"><label className="cc-label">URL</label><input className="cc-input" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." disabled={ed.busy} /></div>
      </div>
      {err && <p className="cc-fielderr">{err}</p>}
      <Flex gap={2}><Button onClick={() => submit(id)} loading={ed.busy} startIcon={<Check />}>Guardar</Button><Button variant="tertiary" onClick={() => { ed.setAddingOpen(false); ed.setEditingId(null); setErr(undefined); }} disabled={ed.busy}>Cancelar</Button></Flex>
    </div>
  );
  return (
    <Box className="cc-card">
      <Flex justifyContent="space-between" alignItems="center" paddingBottom={2}>
        <Typography tag="h2" fontWeight="bold">Redes sociales</Typography>
        {can.create && <Button size="S" startIcon={<Plus />} onClick={() => open()}>Agregar red social</Button>}
      </Flex>
      {view.socialLinks.length === 0 && !ed.addingOpen && <Typography textColor="neutral600">No hay redes sociales.</Typography>}
      {view.socialLinks.map((item) =>
        ed.editingId === item.id ? <div key={item.id}>{Editor(item.id)}</div> : (
          <div className="cc-row" key={item.id}>
            <div className="cc-main"><Typography fontWeight="semiBold">{item.network}</Typography><br /><Typography variant="pi" textColor="neutral600">{item.url}</Typography></div>
            <div className="cc-actions">{can.update && <IconBtn label="Editar" onClick={() => open(item)}><Pencil /></IconBtn>}{can.delete && <IconBtn label="Eliminar" danger onClick={() => remove(item)}><Trash /></IconBtn>}</div>
          </div>
        ),
      )}
      {ed.addingOpen && Editor()}
    </Box>
  );
};

/* ------------------------------ Bloque E: ubicación + OSM ------------------------------ */
const LocationBlock: React.FC<ListBlockProps & { get: any }> = ({ view, mutate, post, put, del, get, can }) => {
  const exists = Boolean(view.location);
  const [editing, setEditing] = React.useState(false);
  const [address, setAddress] = React.useState(view.location?.address ?? '');
  const [lat, setLat] = React.useState<string>(view.location ? String(view.location.latitude) : '');
  const [lon, setLon] = React.useState<string>(view.location ? String(view.location.longitude) : '');
  const [err, setErr] = React.useState<string | undefined>();
  const [busy, setBusy] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState<Array<{ label: string; latitude: number; longitude: number }>>([]);
  const [searching, setSearching] = React.useState(false);
  const [searchMsg, setSearchMsg] = React.useState<string | undefined>();

  React.useEffect(() => {
    setAddress(view.location?.address ?? '');
    setLat(view.location ? String(view.location.latitude) : '');
    setLon(view.location ? String(view.location.longitude) : '');
  }, [view.location]);

  // Búsqueda SOLO al pulsar "Buscar" (no autocomplete; respeta la política de Nominatim).
  const doSearch = async () => {
    if (query.trim().length < 3) { setSearchMsg('Escriba al menos 3 caracteres.'); return; }
    setSearching(true); setSearchMsg(undefined);
    try {
      const { data } = await get(`${BASE}/geocode?q=${encodeURIComponent(query)}`);
      const list = (data.data ?? []) as Array<{ label: string; latitude: number; longitude: number }>;
      setResults(list);
      if (list.length === 0) setSearchMsg('Sin resultados. Ingrese la dirección y coordenadas manualmente.');
    } catch {
      setResults([]); setSearchMsg('No se pudo buscar. Ingrese la dirección y coordenadas manualmente.');
    } finally {
      setSearching(false);
    }
  };

  const latN = Number(lat);
  const lonN = Number(lon);
  const hasCoords = Number.isFinite(latN) && Number.isFinite(lonN) && lat !== '' && lon !== '';
  const mapSrc = hasCoords
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${lonN - 0.01},${latN - 0.01},${lonN + 0.01},${latN + 0.01}&layer=mapnik&marker=${latN},${lonN}`
    : null;

  const startEdit = () => { setEditing(true); setErr(undefined); setQuery(''); setResults([]); setSearchMsg(undefined); };
  const save = async () => {
    setBusy(true); setErr(undefined);
    const payload = { address, latitude: latN, longitude: lonN };
    const res = await mutate(() => (exists ? put(`${BASE}/location`, payload) : post(`${BASE}/location`, payload)), exists ? 'Ubicación actualizada.' : 'Ubicación agregada.');
    setBusy(false);
    if (res) { setErr(firstError(res.errors) ?? res.message); return; }
    setEditing(false);
  };
  const remove = async () => {
    if (!window.confirm('¿Eliminar la ubicación?')) return;
    await mutate(() => del(`${BASE}/location`), 'Ubicación eliminada.');
    setEditing(false);
  };

  return (
    <Box className="cc-card">
      <Flex justifyContent="space-between" alignItems="center" paddingBottom={2}>
        <Typography tag="h2" fontWeight="bold">Ubicación</Typography>
        {!editing && !exists && can.create && <Button size="S" startIcon={<Plus />} onClick={startEdit}>Agregar ubicación</Button>}
        {!editing && exists && (can.update || can.delete) && (
          <Flex gap={2}>
            {can.update && <IconBtn label="Editar" onClick={startEdit}><Pencil /></IconBtn>}
            {can.delete && <IconBtn label="Eliminar" danger onClick={remove}><Trash /></IconBtn>}
          </Flex>
        )}
      </Flex>

      {!editing && !exists && <Typography textColor="neutral600">No hay una ubicación configurada.</Typography>}

      {!editing && exists && (
        <>
          <div className="cc-row"><div className="cc-main"><Typography fontWeight="semiBold">{view.location!.address}</Typography><br /><Typography variant="pi" textColor="neutral600">Lat {view.location!.latitude} · Lon {view.location!.longitude}</Typography></div></div>
          {mapSrc && <iframe title="Mapa" className="cc-map" src={mapSrc} loading="lazy" />}
        </>
      )}

      {editing && (
        <>
          <div className="cc-field">
            <label className="cc-label">Buscar dirección (OpenStreetMap)</label>
            <Flex gap={2} alignItems="flex-end">
              <div style={{ flex: 1 }}>
                <input
                  className="cc-input"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); doSearch(); } }}
                  placeholder="Escriba una dirección y pulse Buscar…"
                  disabled={busy || searching}
                />
              </div>
              <Button variant="secondary" onClick={doSearch} loading={searching} disabled={busy}>Buscar</Button>
            </Flex>
            {searchMsg && <p className="cc-hint">{searchMsg}</p>}
            {results.length > 0 && (
              <ul className="cc-results">
                {results.map((r, i) => (
                  <li key={i} onClick={() => { setAddress(r.label); setLat(String(r.latitude)); setLon(String(r.longitude)); setResults([]); setQuery(''); setSearchMsg(undefined); }}>{r.label}</li>
                ))}
              </ul>
            )}
          </div>
          <div className="cc-field">
            <label className="cc-label">Dirección</label>
            <textarea className="cc-input" rows={2} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Dirección completa (mín. 10 caracteres)" disabled={busy} />
          </div>
          <div className="cc-formgrid">
            <div className="cc-field"><label className="cc-label">Latitud</label><input className="cc-input" value={lat} onChange={(e) => setLat(e.target.value)} placeholder="-90 a 90" disabled={busy} inputMode="decimal" /></div>
            <div className="cc-field"><label className="cc-label">Longitud</label><input className="cc-input" value={lon} onChange={(e) => setLon(e.target.value)} placeholder="-180 a 180" disabled={busy} inputMode="decimal" /></div>
          </div>
          {mapSrc && <iframe title="Vista previa del mapa" className="cc-map" src={mapSrc} loading="lazy" />}
          {err && <p className="cc-fielderr">{err}</p>}
          <Box paddingTop={3}>
            <Flex gap={2}>
              <Button onClick={save} loading={busy} startIcon={<Check />}>Guardar</Button>
              <Button variant="tertiary" onClick={() => { setEditing(false); setErr(undefined); }} disabled={busy} startIcon={<Cross />}>Cancelar</Button>
            </Flex>
          </Box>
          <p className="cc-hint">Puede buscar y elegir un resultado, o escribir dirección y coordenadas manualmente si el buscador falla. Solo se guardan dirección, latitud y longitud.</p>
        </>
      )}
    </Box>
  );
};

/* ------------------------------ Editor de fila simple ------------------------------ */
const RowEditor: React.FC<{ label: string; value: string; onChange: (v: string) => void; err?: string; busy: boolean; placeholder?: string; onSave: () => void; onCancel: () => void }> = ({
  label,
  value,
  onChange,
  err,
  busy,
  placeholder,
  onSave,
  onCancel,
}) => (
  <div className="cc-card" style={{ background: '#fbfbfe' }}>
    <div className="cc-field">
      <label className="cc-label">{label}</label>
      <input className={`cc-input${err ? ' cc-err' : ''}`} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} disabled={busy} autoFocus />
      {err && <p className="cc-fielderr">{err}</p>}
    </div>
    <Flex gap={2}>
      <Button onClick={onSave} loading={busy} startIcon={<Check />}>Guardar</Button>
      <Button variant="tertiary" onClick={onCancel} disabled={busy} startIcon={<Cross />}>Cancelar</Button>
    </Flex>
  </div>
);

export default InformacionGeneral;
