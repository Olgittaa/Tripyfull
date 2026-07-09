/* Tripyfull Planner — trip screens. window.PlannerScreens */

const PS_DS = window.TripyfullDesignSystem_bc2c08;
const { Button, IconButton, Badge, Card, Input, Select, Checkbox } = PS_DS;
const PT = window.PlannerParts;
const DD = window.PlannerData;
const { Icon, CatIcon, PageHead, EmptyState, Skeleton, Money, ProgressBar } = PT;

/* =========================================================
   1. TRIPS LIST (Home)
   ========================================================= */
function TripsList({ onOpen, onNew, loading }) {
  if (loading) {
    return (
      <div style={{ padding: 40, maxWidth: 1040, margin: '0 auto' }}>
        <Skeleton h={40} w={280} style={{ marginBottom: 28 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
          {[0,1,2].map(i => <div key={i} style={{ background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            <Skeleton h={130} r="0" /><div style={{ padding: 18 }}><Skeleton h={20} w="70%" style={{ marginBottom: 10 }} /><Skeleton h={14} w="50%" /></div></div>)}
        </div>
      </div>
    );
  }
  return (
    <div style={{ padding: 40, maxWidth: 1040, margin: '0 auto' }}>
      <PageHead eyebrow="Tripyfull" title="Мои поездки" subtitle="Всё, что ты запланировал — в полном порядке."
        actions={<Button variant="primary" iconLeft={<Icon name="plus" size={18} />} onClick={onNew}>Новая поездка</Button>} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
        {DD.trips.map((t) => {
          const st = DD.TRIP_STATUS[t.status];
          const left = t.planned - t.paid;
          return (
            <Card key={t.id} padding="none" interactive elevation="sm" onClick={() => onOpen(t.id)} style={{ overflow: 'hidden', cursor: 'pointer' }}>
              <div style={{ height: 130, background: t.wash, position: 'relative' }}>
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(33,27,23,0.4), transparent 60%)' }} />
                <span style={{ position: 'absolute', top: 12, left: 12 }}><Badge tone={st.tone} variant="solid">{st.label}</Badge></span>
                <div style={{ position: 'absolute', left: 14, bottom: 12, color: '#fff' }}>
                  <div style={{ font: '700 22px/1.05 var(--font-display)', letterSpacing: '-0.02em' }}>{t.name}</div>
                  <div style={{ font: '400 13px/1.2 var(--font-sans)', opacity: 0.92, marginTop: 3 }}>{t.destination}</div>
                </div>
              </div>
              <div style={{ padding: '14px 16px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, font: '500 12px/1 var(--font-mono)', color: 'var(--text-muted)', marginBottom: 12 }}>
                  <Icon name="calendar" size={14} /> {DD.dateRange(t.start, t.end)}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                  <span style={{ font: 'var(--type-small)', color: 'var(--text-muted)' }}>Оплачено {DD.fmt(t.paid, t.currency)}</span>
                  <span style={{ font: '500 12px/1 var(--font-mono)', color: left > 0 ? 'var(--coral-600)' : 'var(--success-500)' }}>{left > 0 ? 'осталось ' + DD.fmt(left, t.currency) : 'всё оплачено'}</span>
                </div>
                <ProgressBar value={t.paid} max={t.planned} color={left > 0 ? 'var(--brand)' : 'var(--success-500)'} h={7} />
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* =========================================================
   3. TRIP DASHBOARD
   ========================================================= */
function Dashboard({ trip, onEdit, onOpenDay, onGo }) {
  const planned = trip.planned, paid = trip.paid, left = planned - paid;
  const upcoming = DD.bookings
    .flatMap(b => b.payments.filter(p => !p.paid).map(p => ({ ...p, title: b.title, cat: b.cat })))
    .sort((a, b) => a.date.localeCompare(b.date)).slice(0, 3);

  return (
    <div style={{ padding: 40, maxWidth: 1040, margin: '0 auto' }}>
      <PageHead eyebrow={DD.TRIP_STATUS[trip.status].label} title={trip.name}
        subtitle={trip.destination + ' · ' + DD.dateRange(trip.start, trip.end)}
        actions={<Button variant="secondary" iconLeft={<Icon name="edit" size={16} />} onClick={onEdit}>Редактировать</Button>} />

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* budget summary */}
        <Card elevation="sm">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <h3 style={{ font: 'var(--type-h3)', margin: 0 }}>Бюджет</h3>
            <Button size="sm" variant="ghost" iconRight={<Icon name="chevron" size={15} />} onClick={() => onGo('budget')}>Подробнее</Button>
          </div>
          <div style={{ display: 'flex', gap: 26, marginBottom: 18 }}>
            <SumStat label="Запланировано" value={planned} cur={trip.currency} />
            <SumStat label="Оплачено" value={paid} cur={trip.currency} color="var(--success-500)" />
            <SumStat label="Осталось" value={left} cur={trip.currency} color="var(--coral-600)" />
          </div>
          <ProgressBar value={paid} max={planned} />
          <div style={{ font: '500 12px/1 var(--font-mono)', color: 'var(--text-muted)', marginTop: 8 }}>{Math.round(paid/planned*100)}% оплачено</div>
        </Card>

        {/* upcoming payments */}
        <Card elevation="sm">
          <h3 style={{ font: 'var(--type-h3)', margin: '0 0 14px' }}>Ближайшие платежи</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {upcoming.map((p) => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                <span style={{ flex: 'none', width: 32, height: 32, borderRadius: 'var(--radius-md)', background: DD.CATEGORY[p.cat].soft, color: DD.CATEGORY[p.cat].color, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><CatIcon cat={p.cat} size={16} /></span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ font: '600 14px/1.2 var(--font-sans)', color: 'var(--text-strong)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.title}</div>
                  <div style={{ font: '500 11px/1 var(--font-mono)', color: 'var(--text-muted)', marginTop: 2 }}>{DD.dateShort(p.date)}</div>
                </div>
                <Money value={p.amount} cur={trip.currency} size={14} />
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* day feed */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h3 style={{ font: 'var(--type-h3)', margin: 0 }}>Дни поездки</h3>
        <Button size="sm" variant="ghost" iconRight={<Icon name="chevron" size={15} />} onClick={() => onGo('itinerary')}>Открыть маршрут</Button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        {DD.days.map((d) => {
          const cost = DD.dayCost(d.id);
          return (
            <Card key={d.id} padding="sm" interactive elevation="sm" onClick={() => onOpenDay(d.id)} style={{ cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ font: '700 15px/1 var(--font-display)', color: 'var(--text-strong)' }}>День {d.n}</span>
                <span style={{ font: '500 11px/1 var(--font-mono)', color: 'var(--text-subtle)' }}>{DD.dateShort(d.date)}</span>
              </div>
              <div style={{ font: '500 13px/1.2 var(--font-sans)', color: 'var(--accent)', margin: '8px 0 10px' }}>{d.city}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ font: 'var(--type-small)', color: 'var(--text-muted)' }}>{d.activities.length === 0 ? 'пусто' : d.activities.length + ' ' + (d.activities.length === 1 ? 'пункт' : 'пункта')}</span>
                {cost > 0 && <Money value={cost} cur={trip.currency} size={13} color="var(--text-muted)" />}
              </div>
            </Card>
          );
        })}
      </div>

      {/* bookings preview */}
      <Card elevation="sm">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h3 style={{ font: 'var(--type-h3)', margin: 0 }}>Брони · {DD.bookings.length}</h3>
          <Button size="sm" variant="ghost" iconRight={<Icon name="chevron" size={15} />} onClick={() => onGo('bookings')}>Все брони</Button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {DD.bookings.slice(0, 3).map((b) => (
            <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px dashed var(--border-subtle)' }}>
              <span style={{ flex: 'none', width: 34, height: 34, borderRadius: 'var(--radius-md)', background: DD.CATEGORY[b.cat].soft, color: DD.CATEGORY[b.cat].color, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><CatIcon cat={b.cat} size={17} /></span>
              <div style={{ flex: 1 }}>
                <div style={{ font: '600 14px/1.2 var(--font-sans)', color: 'var(--text-strong)' }}>{b.title}</div>
                <div style={{ font: '400 12px/1 var(--font-sans)', color: 'var(--text-muted)', marginTop: 2 }}>{b.provider}</div>
              </div>
              <Badge tone={DD.PAYMENT_STATUS[b.status].tone} variant="soft">{DD.PAYMENT_STATUS[b.status].label}</Badge>
              <Money value={b.price} cur={trip.currency} size={14} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
function SumStat({ label, value, cur, color }) {
  return (
    <div>
      <div style={{ font: '400 12px/1 var(--font-sans)', color: 'var(--text-muted)', marginBottom: 6 }}>{label}</div>
      <Money value={value} cur={cur} size={26} strong color={color} />
    </div>
  );
}

/* =========================================================
   4. DAY ITINERARY  +  5. ACTIVITY DRAWER
   ========================================================= */
function DayItinerary({ trip, dayId, setDayId, onAdd, onEditActivity }) {
  const idx = DD.days.findIndex(d => d.id === dayId);
  const day = DD.days[idx];
  const acts = day.activities.map(id => DD.activities[id]);
  const byCat = {};
  acts.forEach(a => { byCat[a.cat] = (byCat[a.cat] || 0) + a.cost; });
  const total = acts.reduce((s, a) => s + a.cost, 0);

  return (
    <div style={{ padding: 40, maxWidth: 880, margin: '0 auto' }}>
      {/* day header with prev/next */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <IconButton icon={<Icon name="left" size={18} />} label="Предыдущий день" variant="outline" onClick={() => idx > 0 && setDayId(DD.days[idx-1].id)} disabled={idx === 0} />
          <div>
            <div className="tf-eyebrow" style={{ marginBottom: 4 }}>День {day.n} · {DD.dateShort(day.date)}</div>
            <h1 style={{ font: '700 30px/1 var(--font-display)', letterSpacing: '-0.03em', color: 'var(--text-strong)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              {day.city} <Icon name="edit" size={16} />
            </h1>
          </div>
          <IconButton icon={<Icon name="right" size={18} />} label="Следующий день" variant="outline" onClick={() => idx < DD.days.length-1 && setDayId(DD.days[idx+1].id)} disabled={idx === DD.days.length-1} />
        </div>
        <Button variant="primary" iconLeft={<Icon name="plus" size={18} />} onClick={onAdd}>Активность</Button>
      </div>

      {/* day picker strip */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 24, paddingBottom: 4 }}>
        {DD.days.map((d) => {
          const on = d.id === dayId;
          return (
            <button key={d.id} onClick={() => setDayId(d.id)} style={{ flex: 'none', border: 'none', cursor: 'pointer',
              background: on ? 'var(--brand)' : 'var(--surface-card)', color: on ? '#fff' : 'var(--text-muted)',
              boxShadow: on ? 'var(--shadow-brand)' : 'var(--shadow-xs)', borderRadius: 'var(--radius-md)', padding: '9px 13px', textAlign: 'center', minWidth: 58 }}>
              <div style={{ font: '600 13px/1 var(--font-sans)' }}>Д{d.n}</div>
              <div style={{ font: '500 10px/1.4 var(--font-mono)', opacity: 0.8, marginTop: 3 }}>{DD.dateShort(d.date)}</div>
            </button>
          );
        })}
      </div>

      {acts.length === 0 ? (
        <EmptyState icon="route" title="В этом дне пока пусто" body="Добавь первую активность — мы поставим её на нужное время."
          action={<Button variant="primary" iconLeft={<Icon name="plus" size={18} />} onClick={onAdd}>Добавить активность</Button>} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {acts.map((a, i) => (
            <div key={a.id} style={{ display: 'flex', gap: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 6, minWidth: 46 }}>
                <span style={{ font: '500 12px/1 var(--font-mono)', color: 'var(--text-muted)' }}>{a.start}</span>
                {i < acts.length - 1 && <span style={{ width: 2, flex: 1, background: 'var(--border-subtle)', marginTop: 8, borderRadius: 2 }} />}
              </div>
              <Card padding="sm" interactive elevation="sm" onClick={() => onEditActivity(a.id)} style={{ flex: 1, cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ flex: 'none', width: 40, height: 40, borderRadius: 'var(--radius-md)', background: DD.CATEGORY[a.cat].soft, color: DD.CATEGORY[a.cat].color, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><CatIcon cat={a.cat} size={19} /></span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ font: '600 16px/1.2 var(--font-sans)', color: 'var(--text-strong)' }}>{a.title}</span>
                      <Badge tone="neutral" variant="soft">{DD.CATEGORY[a.cat].label}</Badge>
                    </div>
                    <div style={{ font: '400 13px/1.3 var(--font-sans)', color: 'var(--text-muted)', marginTop: 3, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon name="clock" size={13} />{a.start}–{a.end}</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon name="places" size={13} />{a.address}</span>
                    </div>
                  </div>
                  {a.cost > 0 && <Money value={a.cost} cur={trip.currency} size={15} />}
                </div>
              </Card>
            </div>
          ))}
        </div>
      )}

      {/* day total by category */}
      {acts.length > 0 && (
        <Card elevation="sm" style={{ marginTop: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
            {Object.keys(byCat).map((c) => (
              <div key={c} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{ width: 22, height: 22, borderRadius: 'var(--radius-sm)', background: DD.CATEGORY[c].soft, color: DD.CATEGORY[c].color, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><CatIcon cat={c} size={13} /></span>
                <span style={{ font: '500 13px/1 var(--font-sans)', color: 'var(--text-muted)' }}>{DD.CATEGORY[c].label}</span>
                <Money value={byCat[c]} cur={trip.currency} size={13} />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ font: '500 13px/1 var(--font-sans)', color: 'var(--text-muted)' }}>Итог дня</span>
            <Money value={total} cur={trip.currency} size={20} strong />
          </div>
        </Card>
      )}
    </div>
  );
}

/* Activity drawer body */
function ActivityForm({ activity }) {
  const a = activity || {};
  const catOpts = Object.keys(DD.CATEGORY).map(k => ({ value: k, label: DD.CATEGORY[k].label }));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Input label="Название" defaultValue={a.title} placeholder="Что планируем?" />
      <Select label="Тип" options={catOpts} defaultValue={a.cat || 'activity'} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Input label="Начало" defaultValue={a.start} placeholder="10:00" iconLeft={<Icon name="clock" size={15} />} />
        <Input label="Конец" defaultValue={a.end} placeholder="11:30" iconLeft={<Icon name="clock" size={15} />} />
      </div>
      <Input label="Адрес" defaultValue={a.address} placeholder="Место или адрес" iconLeft={<Icon name="places" size={15} />} />
      <Input label="Стоимость" type="number" defaultValue={a.cost} placeholder="0" helper="В валюте поездки" />
      <Input label="Заметки" defaultValue={a.note} placeholder="Любые детали" />
      <div>
        <label style={{ font: '500 14px/1.3 var(--font-sans)', color: 'var(--text-strong)', display: 'block', marginBottom: 6 }}>Ссылки</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 14px', border: '1.5px dashed var(--border-default)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)', font: 'var(--type-small)', cursor: 'pointer' }}>
          <Icon name="link" size={15} /> Добавить ссылку
        </div>
      </div>
    </div>
  );
}

window.PlannerScreens = { TripsList, Dashboard, DayItinerary, ActivityForm };
