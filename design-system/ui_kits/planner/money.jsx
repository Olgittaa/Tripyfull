/* Tripyfull Planner — money screens. window.PlannerMoney */

const PM_DS = window.TripyfullDesignSystem_bc2c08;
const { Button, IconButton, Badge, Card, Input, Select, Checkbox } = PM_DS;
const PMT = window.PlannerParts;
const MD = window.PlannerData;
const { Icon, CatIcon, PageHead, EmptyState, Money, ProgressBar } = PMT;

/* =========================================================
   6. BOOKINGS
   ========================================================= */
function Bookings({ trip, onAdd, onOpen }) {
  const groups = [
    { cat: 'transport', label: 'Транспорт' },
    { cat: 'stay', label: 'Проживание' },
    { cat: 'activity', label: 'Активности' },
  ];
  return (
    <div style={{ padding: 40, maxWidth: 920, margin: '0 auto' }}>
      <PageHead eyebrow={trip.name} title="Брони" subtitle="Предоплаченные брони и графики платежей."
        actions={<Button variant="primary" iconLeft={<Icon name="plus" size={18} />} onClick={onAdd}>Бронь</Button>} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        {groups.map((g) => {
          const items = MD.bookings.filter(b => b.cat === g.cat);
          if (!items.length) return null;
          return (
            <div key={g.cat}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 12 }}>
                <span style={{ width: 28, height: 28, borderRadius: 'var(--radius-md)', background: MD.CATEGORY[g.cat].soft, color: MD.CATEGORY[g.cat].color, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><CatIcon cat={g.cat} size={16} /></span>
                <h3 style={{ font: 'var(--type-h3)', margin: 0 }}>{g.label}</h3>
                <span style={{ font: '500 12px/1 var(--font-mono)', color: 'var(--text-subtle)' }}>· {items.length}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {items.map((b) => <BookingCard key={b.id} b={b} cur={trip.currency} onClick={() => onOpen(b.id)} />)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BookingCard({ b, cur, onClick }) {
  const ps = MD.PAYMENT_STATUS[b.status];
  const nextPay = b.payments.filter(p => !p.paid).sort((a, c) => a.date.localeCompare(c.date))[0];
  const meta = b.cat === 'transport'
    ? (b.from + ' → ' + b.to + ' · ' + b.date.replace(' ', ', '))
    : (b.checkIn ? ('Заезд ' + MD.dateShort(b.checkIn) + ' · ' + b.nights + ' ноч.') : (b.date ? b.date.replace(' ', ', ') : ''));
  return (
    <Card padding="sm" interactive elevation="sm" onClick={onClick} style={{ cursor: 'pointer' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <span style={{ flex: 'none', width: 42, height: 42, borderRadius: 'var(--radius-md)', background: MD.CATEGORY[b.cat].soft, color: MD.CATEGORY[b.cat].color, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><CatIcon cat={b.cat} size={20} /></span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ font: '600 16px/1.2 var(--font-sans)', color: 'var(--text-strong)' }}>{b.title}</span>
            <Badge tone={ps.tone} variant="soft" dot>{ps.label}</Badge>
          </div>
          <div style={{ font: '400 13px/1.3 var(--font-sans)', color: 'var(--text-muted)', marginTop: 3 }}>{b.provider} · {meta}</div>
          {nextPay && <div style={{ font: '500 12px/1 var(--font-mono)', color: 'var(--coral-600)', marginTop: 6 }}>Ближайший платёж {MD.fmt(nextPay.amount, cur)} · {MD.dateShort(nextPay.date)}</div>}
        </div>
        <div style={{ textAlign: 'right' }}>
          <Money value={b.price} cur={cur} size={17} />
          <div style={{ font: '400 11px/1 var(--font-sans)', color: 'var(--text-subtle)', marginTop: 4 }}>полная цена</div>
        </div>
      </div>
    </Card>
  );
}

/* =========================================================
   7. BOOKING + PAYMENTS DRAWER
   ========================================================= */
function BookingForm({ booking, cur }) {
  const b = booking || { payments: [] };
  const catOpts = ['transport', 'stay', 'activity', 'other'].map(k => ({ value: k, label: MD.CATEGORY[k].label }));
  const paySum = (b.payments || []).reduce((s, p) => s + p.amount, 0);
  const matches = paySum === b.price;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Input label="Название" defaultValue={b.title} placeholder="Что бронируем?" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Select label="Категория" options={catOpts} defaultValue={b.cat || 'transport'} />
        <Input label="Поставщик" defaultValue={b.provider} placeholder="Авиакомпания, отель…" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Input label="Номер подтверждения" defaultValue={b.conf} placeholder="ABC-123" />
        <Input label="Полная цена" type="number" defaultValue={b.price} placeholder="0" />
      </div>

      {/* payment schedule */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <label style={{ font: '600 15px/1 var(--font-display)', color: 'var(--text-strong)' }}>График платежей</label>
          <Badge tone={matches ? 'success' : 'warning'} variant="soft">{matches ? '✓ сходится' : 'не сходится'}</Badge>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(b.payments || []).map((p) => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
              <Checkbox defaultChecked={p.paid} />
              <div style={{ flex: 1 }}>
                <div style={{ font: '600 14px/1.2 var(--font-sans)', color: 'var(--text-strong)' }}>{MD.fmt(p.amount, cur)}</div>
                <div style={{ font: '500 11px/1 var(--font-mono)', color: 'var(--text-muted)', marginTop: 2 }}>{MD.dateShort(p.date)}</div>
              </div>
              <Badge tone={p.paid ? 'success' : 'neutral'} variant="soft">{p.paid ? 'оплачено' : 'ожидается'}</Badge>
            </div>
          ))}
          <button style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '11px', border: '1.5px dashed var(--border-default)', background: 'transparent', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)', cursor: 'pointer', font: '600 14px/1 var(--font-sans)' }}>
            <Icon name="plus" size={16} /> Добавить платёж
          </button>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, font: 'var(--type-small)', color: 'var(--text-muted)' }}>
          <span>Сумма платежей</span>
          <span style={{ font: '600 13px/1 var(--font-mono)', color: matches ? 'var(--success-500)' : 'var(--coral-600)' }}>{MD.fmt(paySum, cur)} / {MD.fmt(b.price || 0, cur)}</span>
        </div>
      </div>

      <Input label="Заметки" defaultValue={b.note} placeholder="Условия, отмена, детали" />
    </div>
  );
}

/* =========================================================
   8. BUDGET
   ========================================================= */
function Budget({ trip }) {
  const cur = trip.currency;
  const cats = MD.budgetByCategory;
  const planned = cats.reduce((s, c) => s + c.planned, 0);
  const actual = cats.reduce((s, c) => s + c.actual, 0);
  const left = trip.planned - trip.paid;

  return (
    <div style={{ padding: 40, maxWidth: 960, margin: '0 auto' }}>
      <PageHead eyebrow={trip.name} title="Бюджет" subtitle="Деньги целиком — план против факта." />

      {/* summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        <Card elevation="sm">
          <div style={{ font: '400 13px/1 var(--font-sans)', color: 'var(--text-muted)', marginBottom: 8 }}>Запланировано</div>
          <Money value={planned} cur={cur} size={30} strong />
          <div style={{ font: '500 12px/1 var(--font-mono)', color: 'var(--text-subtle)', marginTop: 8 }}>брони + оценки активностей</div>
        </Card>
        <Card elevation="sm">
          <div style={{ font: '400 13px/1 var(--font-sans)', color: 'var(--text-muted)', marginBottom: 8 }}>Потрачено</div>
          <Money value={actual} cur={cur} size={30} strong color="var(--success-500)" />
          <div style={{ marginTop: 12 }}><ProgressBar value={actual} max={planned} color="var(--success-500)" /></div>
        </Card>
        <Card elevation="sm">
          <div style={{ font: '400 13px/1 var(--font-sans)', color: 'var(--text-muted)', marginBottom: 8 }}>Осталось оплатить</div>
          <Money value={left} cur={cur} size={30} strong color="var(--coral-600)" />
          <div style={{ font: '500 12px/1 var(--font-mono)', color: 'var(--text-subtle)', marginTop: 8 }}>по графикам броней</div>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* by category */}
        <Card elevation="sm">
          <h3 style={{ font: 'var(--type-h3)', margin: '0 0 16px' }}>По категориям</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {cats.map((c) => (
              <div key={c.cat}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ width: 24, height: 24, borderRadius: 'var(--radius-sm)', background: MD.CATEGORY[c.cat].soft, color: MD.CATEGORY[c.cat].color, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><CatIcon cat={c.cat} size={13} /></span>
                  <span style={{ font: '500 14px/1 var(--font-sans)', color: 'var(--text-strong)', flex: 1 }}>{MD.CATEGORY[c.cat].label}</span>
                  <span style={{ font: '500 12px/1 var(--font-mono)', color: 'var(--text-muted)' }}>{MD.fmt(c.actual, cur)} / {MD.fmt(c.planned, cur)}</span>
                </div>
                <ProgressBar value={c.actual} max={c.planned} color={MD.CATEGORY[c.cat].color} h={7} />
              </div>
            ))}
          </div>
        </Card>

        {/* by day */}
        <Card elevation="sm">
          <h3 style={{ font: 'var(--type-h3)', margin: '0 0 16px' }}>По дням</h3>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', font: '500 11px/1 var(--font-mono)', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-subtle)', paddingBottom: 8, borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ flex: 1 }}>День</span><span style={{ width: 64, textAlign: 'right' }}>План</span><span style={{ width: 64, textAlign: 'right' }}>Факт</span><span style={{ width: 64, textAlign: 'right' }}>Δ</span>
            </div>
            {MD.days.filter(d => d.activities.length).map((d) => {
              const plan = MD.dayCost(d.id);
              const fact = Math.round(plan * (0.6 + (d.n % 3) * 0.18));
              const diff = fact - plan;
              return (
                <div key={d.id} style={{ display: 'flex', alignItems: 'center', padding: '9px 0', borderBottom: '1px dashed var(--border-subtle)', font: 'var(--type-small)' }}>
                  <span style={{ flex: 1, color: 'var(--text-strong)', fontWeight: 500 }}>Д{d.n} · {d.city}</span>
                  <span style={{ width: 64, textAlign: 'right', font: '500 12px/1 var(--font-mono)', color: 'var(--text-muted)' }}>{MD.fmt(plan, cur)}</span>
                  <span style={{ width: 64, textAlign: 'right', font: '500 12px/1 var(--font-mono)', color: 'var(--text-strong)' }}>{MD.fmt(fact, cur)}</span>
                  <span style={{ width: 64, textAlign: 'right', font: '500 12px/1 var(--font-mono)', color: diff > 0 ? 'var(--coral-600)' : 'var(--success-500)' }}>{diff > 0 ? '+' : ''}{MD.fmt(diff, cur)}</span>
                </div>
              );
            })}
          </div>
          <Button size="sm" variant="ghost" iconLeft={<Icon name="plus" size={15} />} style={{ marginTop: 12 }}>Добавить трату</Button>
        </Card>
      </div>
    </div>
  );
}

/* =========================================================
   NEW TRIP DIALOG body  +  PLACES / SETTINGS placeholders
   ========================================================= */
function NewTripForm() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 4 }}>
      <Input label="Название" placeholder="Напр. Лето в Японии" />
      <Input label="Направление" placeholder="Город или страна" iconLeft={<Icon name="places" size={15} />} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Input label="Дата начала" placeholder="ГГГГ-ММ-ДД" iconLeft={<Icon name="calendar" size={15} />} />
        <Input label="Дата конца" placeholder="ГГГГ-ММ-ДД" iconLeft={<Icon name="calendar" size={15} />} />
      </div>
      <Select label="Базовая валюта" options={[{value:'eur',label:'€ Евро'},{value:'usd',label:'$ Доллар США'},{value:'gbp',label:'£ Фунт'},{value:'jpy',label:'¥ Иена'}]} defaultValue="eur" />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 14px', background: 'var(--info-100)', borderRadius: 'var(--radius-md)', color: 'var(--info-500)', font: 'var(--type-small)' }}>
        <Icon name="alert" size={16} /> Дни создадутся автоматически из выбранных дат.
      </div>
    </div>
  );
}

function Placeholder({ trip, view }) {
  const map = {
    places: { icon: 'places', title: 'Места и карта', body: 'Справочник переиспользуемых мест и карта маршрута. Опциональный экран — пока не заполнен.' },
    settings: { icon: 'budget', title: 'Настройки', body: 'Валюта по умолчанию, профиль, импорт из Notion CSV и печать маршрута.' },
  };
  const m = map[view] || map.places;
  return (
    <div style={{ padding: 40, maxWidth: 720, margin: '0 auto' }}>
      <PageHead eyebrow={trip ? trip.name : 'Tripyfull'} title={m.title} />
      <EmptyState icon={m.icon} title={m.title + ' · скоро'} body={m.body} />
    </div>
  );
}

window.PlannerMoney = { Bookings, BookingForm, Budget, NewTripForm, Placeholder };
