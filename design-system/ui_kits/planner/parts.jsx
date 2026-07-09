/* Tripyfull Planner — shell + shared parts. window.PlannerParts */

const PP_DS = window.TripyfullDesignSystem_bc2c08;
const { Button, IconButton, Badge, Avatar } = PP_DS;
const D = window.PlannerData;

/* ---------- icons (Lucide-style, 2px stroke) ---------- */
const Svg = ({ size = 20, sw = 2, fill = 'none', children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor"
       strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">{children}</svg>
);
const ICONS = {
  trips:   (p) => <Svg {...p}><path d="M9 20l-5.5 2.5v-15L9 5m0 15l6-3m-6 3v-15m6 12l5.5 2.5v-15L15 2m0 15V2m0 0L9 5"/></Svg>,
  overview:(p) => <Svg {...p}><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></Svg>,
  route:   (p) => <Svg {...p}><circle cx="6" cy="19" r="3"/><circle cx="18" cy="5" r="3"/><path d="M6 16V9a4 4 0 0 1 4-4h4M18 8v7a4 4 0 0 1-4 4h-4"/></Svg>,
  bookings:(p) => <Svg {...p}><path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3a2 2 0 0 0 0-4Z"/><path d="M13 5v14" strokeDasharray="2 2"/></Svg>,
  budget:  (p) => <Svg {...p}><circle cx="12" cy="12" r="9"/><path d="M14.5 9a2.5 2 0 0 0-2.5-1.5c-1.4 0-2.5.7-2.5 2s1.1 1.8 2.5 2 2.5.7 2.5 2-1.1 2-2.5 2A2.5 2 0 0 1 9.5 15M12 6v1.5M12 16.5V18"/></Svg>,
  places:  (p) => <Svg {...p}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></Svg>,
  plus:    (p) => <Svg {...p}><path d="M12 5v14M5 12h14"/></Svg>,
  back:    (p) => <Svg {...p}><path d="M15 6l-6 6 6 6"/></Svg>,
  chevron: (p) => <Svg {...p}><path d="M9 6l6 6-6 6"/></Svg>,
  left:    (p) => <Svg {...p}><path d="M15 6l-6 6 6 6"/></Svg>,
  right:   (p) => <Svg {...p}><path d="M9 6l6 6-6 6"/></Svg>,
  close:   (p) => <Svg {...p}><path d="M18 6 6 18M6 6l12 12"/></Svg>,
  edit:    (p) => <Svg {...p}><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></Svg>,
  clock:   (p) => <Svg {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></Svg>,
  trash:   (p) => <Svg {...p}><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></Svg>,
  food:    (p) => <Svg {...p}><path d="M4 3v7a2 2 0 0 0 4 0V3M6 11v10M18 3c-1.7 0-3 2-3 5s1.3 4 3 4m0 0v9"/></Svg>,
  plane:   (p) => <Svg {...p}><path d="M17.8 19.2 16 11l3.5-3.5a2.12 2.12 0 0 0-3-3L13 8 4.8 6.2a.5.5 0 0 0-.5.8l3.9 4.9-2.6 2.6H3.5a.5.5 0 0 0-.3.9L6 19l1.6 2.8a.5.5 0 0 0 .9-.3v-2.1l2.6-2.6 4.9 3.9a.5.5 0 0 0 .8-.5Z"/></Svg>,
  bed:     (p) => <Svg {...p}><path d="M2 18v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5M2 18v2M22 18v2M2 13V7M6 11V9a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></Svg>,
  compass: (p) => <Svg {...p}><circle cx="12" cy="12" r="9"/><polygon points="16.2 7.8 14 14 7.8 16.2 10 10"/></Svg>,
  tag:     (p) => <Svg {...p}><path d="M3 7v5l9 9 8-8-9-9H3Z"/><circle cx="7.5" cy="7.5" r="1.4" fill="currentColor" stroke="none"/></Svg>,
  link:    (p) => <Svg {...p}><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1.5 1.5M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1.5-1.5"/></Svg>,
  calendar:(p) => <Svg {...p}><rect x="3" y="4.5" width="18" height="17" rx="2.5"/><path d="M3 9h18M8 2.5v4M16 2.5v4"/></Svg>,
  share:   (p) => <Svg {...p}><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5 8.6 10.5"/></Svg>,
  alert:   (p) => <Svg {...p}><path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/></Svg>,
};
const Icon = ({ name, size, sw, fill }) => { const I = ICONS[name]; return I ? <I size={size} sw={sw} fill={fill} /> : null; };
const CatIcon = ({ cat, size = 16 }) => <Icon name={D.CATEGORY[cat] ? D.CATEGORY[cat].icon : 'tag'} size={size} />;

/* ---------- sidebar ---------- */
function Sidebar({ trip, view, onNav, onHome }) {
  const items = trip ? [
    { id: 'overview', label: 'Overview',    icon: 'overview' },
    { id: 'itinerary',label: 'Itinerary',  icon: 'route' },
    { id: 'bookings', label: 'Bookings',    icon: 'bookings' },
    { id: 'budget',   label: 'Budget',   icon: 'budget' },
    { id: 'places',   label: 'Places',    icon: 'places', opt: true },
  ] : [];

  return (
    <aside style={{ width: 248, flex: 'none', background: 'var(--surface-card)', borderRight: '1px solid var(--border-subtle)',
      display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '20px 20px 14px', cursor: 'pointer' }} onClick={onHome}>
        <img src="../../assets/logo-wordmark.svg" alt="Tripyfull" style={{ height: 28 }} />
      </div>

      <div style={{ padding: '6px 12px' }}>
        <button onClick={onHome} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
          border: 'none', background: trip ? 'transparent' : 'var(--brand-soft)', borderRadius: 'var(--radius-md)', cursor: 'pointer',
          color: trip ? 'var(--text-muted)' : 'var(--brand-pressed)', font: (trip ? '500' : '600') + ' 15px/1 var(--font-sans)' }}>
          <Icon name="trips" size={20} /> All trips
        </button>
      </div>

      {trip && (
        <React.Fragment>
          <div style={{ padding: '14px 20px 8px', marginTop: 6, borderTop: '1px solid var(--border-subtle)' }}>
            <div style={{ font: '500 11px/1 var(--font-mono)', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-subtle)', marginBottom: 4 }}>Trip</div>
            <div style={{ font: '700 17px/1.15 var(--font-display)', color: 'var(--text-strong)', letterSpacing: '-0.01em' }}>{trip.name}</div>
            <div style={{ font: '400 12px/1.3 var(--font-sans)', color: 'var(--text-muted)', marginTop: 3 }}>{trip.destination} · {D.dateRange(trip.start, trip.end)}</div>
          </div>
          <nav style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {items.map((it) => {
              const on = it.id === view;
              return (
                <button key={it.id} onClick={() => onNav(it.id)} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '10px 12px',
                  border: 'none', cursor: 'pointer', borderRadius: 'var(--radius-md)', textAlign: 'left',
                  background: on ? 'var(--brand)' : 'transparent', color: on ? '#fff' : 'var(--text-body)',
                  boxShadow: on ? 'var(--shadow-brand)' : 'none', font: (on ? '600' : '500') + ' 15px/1 var(--font-sans)' }}>
                  <Icon name={it.icon} size={19} sw={on ? 2.3 : 2} /> {it.label}
                  {it.opt && <span style={{ marginLeft: 'auto', font: '500 10px/1 var(--font-mono)', color: on ? 'rgba(255,255,255,0.7)' : 'var(--text-subtle)' }}>opt.</span>}
                </button>
              );
            })}
          </nav>
        </React.Fragment>
      )}

      <div style={{ marginTop: 'auto', padding: 16, display: 'flex', alignItems: 'center', gap: 10, borderTop: '1px solid var(--border-subtle)' }}>
        <Avatar name="Mara Ortiz" size="sm" />
        <div style={{ minWidth: 0, lineHeight: 1.25 }}>
          <div style={{ font: '600 13px/1.25 var(--font-sans)', color: 'var(--text-strong)', whiteSpace: 'nowrap' }}>Mara Ortiz</div>
          <div style={{ font: '400 11px/1.2 var(--font-sans)', color: 'var(--text-muted)' }}>Settings</div>
        </div>
      </div>
    </aside>
  );
}

/* ---------- topbar (page header) ---------- */
function PageHead({ title, subtitle, actions, eyebrow }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 18, flexWrap: 'wrap', marginBottom: 24 }}>
      <div>
        {eyebrow && <div className="tf-eyebrow" style={{ marginBottom: 8 }}>{eyebrow}</div>}
        <h1 style={{ font: '700 32px/1.04 var(--font-display)', letterSpacing: '-0.03em', color: 'var(--text-strong)', margin: 0 }}>{title}</h1>
        {subtitle && <p style={{ font: 'var(--type-body)', color: 'var(--text-muted)', margin: '8px 0 0' }}>{subtitle}</p>}
      </div>
      {actions && <div style={{ display: 'flex', gap: 10 }}>{actions}</div>}
    </div>
  );
}

/* ---------- right-side drawer ---------- */
function Drawer({ open, title, eyebrow, onClose, footer, children, width = 460 }) {
  return (
    <React.Fragment>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(33,27,23,0.34)', zIndex: 80,
        opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none', transition: 'opacity var(--dur-base) var(--ease-out)' }} />
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width, maxWidth: '94vw', zIndex: 81, background: 'var(--surface-page)',
        boxShadow: 'var(--shadow-xl)', display: 'flex', flexDirection: 'column',
        transform: open ? 'translateX(0)' : 'translateX(102%)', transition: 'transform var(--dur-slow) var(--ease-out)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '20px 22px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div>
            {eyebrow && <div className="tf-eyebrow" style={{ marginBottom: 6 }}>{eyebrow}</div>}
            <h2 style={{ font: '700 22px/1.1 var(--font-display)', letterSpacing: '-0.02em', color: 'var(--text-strong)', margin: 0 }}>{title}</h2>
          </div>
          <IconButton icon={<Icon name="close" size={18} />} label="Close" variant="ghost" onClick={onClose} />
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 22 }}>{children}</div>
        {footer && <div style={{ padding: '16px 22px', borderTop: '1px solid var(--border-subtle)', background: 'var(--surface-card)', display: 'flex', gap: 12 }}>{footer}</div>}
      </div>
    </React.Fragment>
  );
}

/* ---------- centered dialog ---------- */
function Dialog({ open, title, eyebrow, onClose, footer, children, width = 520 }) {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(33,27,23,0.4)', zIndex: 90,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width, maxWidth: '100%', maxHeight: '90vh', overflow: 'hidden', background: 'var(--surface-page)',
        borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-xl)', display: 'flex', flexDirection: 'column',
        animation: 'tfpop var(--dur-base) var(--ease-soft)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '22px 24px 16px' }}>
          <div>
            {eyebrow && <div className="tf-eyebrow" style={{ marginBottom: 6 }}>{eyebrow}</div>}
            <h2 style={{ font: '700 24px/1.1 var(--font-display)', letterSpacing: '-0.02em', color: 'var(--text-strong)', margin: 0 }}>{title}</h2>
          </div>
          <IconButton icon={<Icon name="close" size={18} />} label="Close" variant="ghost" onClick={onClose} />
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 8px' }}>{children}</div>
        {footer && <div style={{ padding: '16px 24px 22px', display: 'flex', gap: 12, justifyContent: 'flex-end' }}>{footer}</div>}
      </div>
    </div>
  );
}

/* ---------- empty state ---------- */
function EmptyState({ icon = 'compass', title, body, action }) {
  return (
    <div style={{ textAlign: 'center', padding: '56px 24px', border: '1.5px dashed var(--border-default)', borderRadius: 'var(--radius-lg)', background: 'var(--surface-card)' }}>
      <div style={{ width: 56, height: 56, borderRadius: 'var(--radius-pill)', background: 'var(--brand-soft)', color: 'var(--brand)',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}><Icon name={icon} size={26} /></div>
      <h3 style={{ font: '700 20px/1.2 var(--font-display)', color: 'var(--text-strong)', margin: '0 0 6px' }}>{title}</h3>
      <p style={{ font: 'var(--type-body)', color: 'var(--text-muted)', margin: '0 auto 20px', maxWidth: 360 }}>{body}</p>
      {action}
    </div>
  );
}

/* ---------- skeleton (loading) ---------- */
function Skeleton({ h = 16, w = '100%', r = 'var(--radius-sm)', style }) {
  return <div style={{ height: h, width: w, borderRadius: r, background: 'linear-gradient(90deg,var(--ink-100),var(--ink-200),var(--ink-100))',
    backgroundSize: '200% 100%', animation: 'tfshimmer 1.3s linear infinite', ...style }} />;
}

/* ---------- money helpers ---------- */
function Money({ value, cur = '€', strong, size = 16, color }) {
  return <span style={{ font: (strong ? '700' : '600') + ' ' + size + 'px/1 var(--font-display)', color: color || 'var(--text-strong)' }}>{D.fmt(value, cur)}</span>;
}
function ProgressBar({ value, max, color = 'var(--brand)', h = 8 }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div style={{ height: h, borderRadius: 'var(--radius-pill)', background: 'var(--surface-sunken)', overflow: 'hidden' }}>
      <div style={{ width: pct + '%', height: '100%', background: color, borderRadius: 'var(--radius-pill)', transition: 'width var(--dur-slow) var(--ease-out)' }} />
    </div>
  );
}

window.PlannerParts = { Icon, CatIcon, ICONS, Sidebar, PageHead, Drawer, Dialog, EmptyState, Skeleton, Money, ProgressBar };
