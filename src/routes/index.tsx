import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/")({
  component: AppFlow,
  head: () => ({
    meta: [
      { title: "Тарифный комитет — заявка на индивидуальные тарифные условия" },
      {
        name: "description",
        content:
          "Прототип страницы заявки на индивидуальные тарифные условия для Тарифного комитета банка.",
      },
    ],
  }),
});

// ========================= MOCK CLIENTS =========================
type ClientData = {
  iinBin: string;
  category: "existing" | "new";
  fullName: string;
  activity: string;
  serviceStartDate: string;
  relation: string;
  staffCount: string;
  payroll: string;
  insurance: string;
  rko: string;
  doc: string;
  credits: string;
  dealing: string;
  acquiring: string;
  corpCards: string;
  deposits: string;
  walletProfit: string;
  groupProfit: string;
  crossProfit: string;
  profitability: string;
};

const MOCK_CLIENTS: Record<string, ClientData> = {
  "123456789012": {
    iinBin: "123456789012",
    category: "existing",
    fullName: "ТОО «КазТрансОйл-Сервис»",
    activity: "Транспортировка нефти и нефтепродуктов",
    serviceStartDate: "12.04.2018",
    relation: "Нет связанности",
    staffCount: "248",
    payroll: "92 400 000 ₸",
    insurance: "АО «СК Евразия»",
    rko: "1 240 000 ₸ / 8.4 млрд ₸",
    doc: "320 000 ₸ / 12 операций",
    credits: "4 200 000 ₸ / 1.8 млрд ₸",
    dealing: "180 000 ₸ / 320 млн ₸",
    acquiring: "—",
    corpCards: "92 000 ₸ / 18 карт",
    deposits: "1 850 000 ₸ / 4.2 млрд ₸",
    walletProfit: "1 850 000 ₸",
    groupProfit: "2 430 000 ₸",
    crossProfit: "710 000 ₸",
    profitability: "Положительная",
  },
  "987654321098": {
    iinBin: "987654321098",
    category: "existing",
    fullName: "ИП Алимханов А.Б.",
    activity: "Оптовая торговля строительными материалами",
    serviceStartDate: "03.09.2021",
    relation: "Нет связанности",
    staffCount: "42",
    payroll: "14 800 000 ₸",
    insurance: "АО «Halyk Insurance»",
    rko: "320 000 ₸ / 1.2 млрд ₸",
    doc: "—",
    credits: "180 000 ₸ / 80 млн ₸",
    dealing: "—",
    acquiring: "240 000 ₸ / 380 млн ₸",
    corpCards: "24 000 ₸ / 4 карт",
    deposits: "120 000 ₸ / 280 млн ₸",
    walletProfit: "884 000 ₸",
    groupProfit: "884 000 ₸",
    crossProfit: "210 000 ₸",
    profitability: "Положительная",
  },
};

const EMPTY_CLIENT: ClientData = {
  iinBin: "",
  category: "new",
  fullName: "",
  activity: "",
  serviceStartDate: "",
  relation: "Не выбрано",
  staffCount: "",
  payroll: "",
  insurance: "",
  rko: "",
  doc: "",
  credits: "",
  dealing: "",
  acquiring: "",
  corpCards: "",
  deposits: "",
  walletProfit: "—",
  groupProfit: "—",
  crossProfit: "—",
  profitability: "—",
};

// ========================= APP FLOW =========================
type Screen = "login" | "iin" | "form";

function AppFlow() {
  const [screen, setScreen] = useState<Screen>("login");
  const [client, setClient] = useState<ClientData>(EMPTY_CLIENT);
  const [readOnly, setReadOnly] = useState(false);

  const handleLogin = () => setScreen("iin");

  const handleIinSubmit = (iin: string) => {
    const found = MOCK_CLIENTS[iin];
    if (found) {
      setClient(found);
      setReadOnly(true);
    } else {
      setClient({ ...EMPTY_CLIENT, iinBin: iin, category: "new" });
      setReadOnly(false);
    }
    setScreen("form");
  };

  const handleLogout = () => {
    setScreen("login");
    setClient(EMPTY_CLIENT);
    setReadOnly(false);
  };

  const handleBackToIin = () => {
    setScreen("iin");
    setClient(EMPTY_CLIENT);
    setReadOnly(false);
  };

  if (screen === "login") return <LoginScreen onLogin={handleLogin} />;
  if (screen === "iin")
    return <IinScreen onSubmit={handleIinSubmit} onLogout={handleLogout} />;
  return (
    <TariffRequestPage
      client={client}
      readOnly={readOnly}
      onBack={handleBackToIin}
      onLogout={handleLogout}
    />
  );
}

// ========================= SCREEN 1: LOGIN =========================
function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [login, setLogin] = useState("00062861");
  const [password, setPassword] = useState("demo");
  const [error, setError] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!login.trim() || !password.trim()) {
      setError("Введите логин и пароль");
      return;
    }
    onLogin();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-[440px] rounded-3xl border border-[var(--line)] bg-surface p-8 shadow-[0_20px_48px_rgba(15,23,42,0.08)]">
        <div className="mb-6 flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-brand-green" />
          <div>
            <div className="text-[20px] font-semibold leading-tight">
              Тарифный комитет
            </div>
            <div className="text-xs text-muted-foreground">
              Авторизация оператора
            </div>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="mb-2 block text-xs text-muted-foreground">
              Табельный номер
            </label>
            <input
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              className="w-full rounded-xl border border-[var(--line)] bg-white px-3.5 py-3 text-sm outline-none focus:border-brand-green"
              placeholder="00000000"
            />
          </div>
          <div>
            <label className="mb-2 block text-xs text-muted-foreground">
              Пароль
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-[var(--line)] bg-white px-3.5 py-3 text-sm outline-none focus:border-brand-green"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-[var(--danger)] bg-[oklch(0.97_0.04_27)] px-3 py-2 text-xs text-[var(--danger)]">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full rounded-2xl border-none bg-brand-green px-5 py-3.5 text-[15px] font-bold text-white transition-opacity hover:opacity-90"
          >
            Войти
          </button>

          <div className="rounded-xl border border-dashed border-[var(--line)] bg-surface-soft px-3 py-2.5 text-[11px] leading-relaxed text-muted-foreground">
            Демо-доступ: любые непустые логин и пароль.
          </div>
        </form>
      </div>
    </div>
  );
}

// ========================= SCREEN 2: IIN =========================
function IinScreen({
  onSubmit,
  onLogout,
}: {
  onSubmit: (iin: string) => void;
  onLogout: () => void;
}) {
  const [iin, setIin] = useState("");
  const [error, setError] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = iin.trim();
    if (trimmed.length !== 12 || !/^\d+$/.test(trimmed)) {
      setError("ИИН/БИН должен содержать 12 цифр");
      return;
    }
    setError("");
    onSubmit(trimmed);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-[520px] rounded-3xl border border-[var(--line)] bg-surface p-8 shadow-[0_20px_48px_rgba(15,23,42,0.08)]">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-brand-green" />
            <div>
              <div className="text-[20px] font-semibold leading-tight">
                Поиск клиента
              </div>
              <div className="text-xs text-muted-foreground">
                Введите ИИН / БИН клиента
              </div>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="rounded-xl border border-[var(--line)] bg-white px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-surface-soft"
          >
            Выйти
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="mb-2 block text-xs text-muted-foreground">
              ИИН / БИН
            </label>
            <input
              value={iin}
              onChange={(e) => setIin(e.target.value.replace(/\D/g, "").slice(0, 12))}
              className="w-full rounded-xl border border-[var(--line)] bg-white px-3.5 py-3 text-base tracking-wider outline-none focus:border-brand-green"
              placeholder="123456789012"
              inputMode="numeric"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-[var(--danger)] bg-[oklch(0.97_0.04_27)] px-3 py-2 text-xs text-[var(--danger)]">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full rounded-2xl border-none bg-brand-green px-5 py-3.5 text-[15px] font-bold text-white transition-opacity hover:opacity-90"
          >
            Найти клиента
          </button>

          <div className="rounded-2xl border border-dashed border-[var(--line)] bg-surface-soft p-3.5 text-xs leading-relaxed text-muted-foreground">
            <div className="mb-2 font-semibold text-foreground">
              Тестовые ИИН/БИН (есть в базе):
            </div>
            <button
              type="button"
              onClick={() => setIin("123456789012")}
              className="mr-2 mb-1 rounded-lg border border-[var(--line)] bg-white px-2.5 py-1 font-mono text-[12px] text-foreground transition-colors hover:bg-surface-soft"
            >
              123456789012
            </button>
            <button
              type="button"
              onClick={() => setIin("987654321098")}
              className="mr-2 mb-1 rounded-lg border border-[var(--line)] bg-white px-2.5 py-1 font-mono text-[12px] text-foreground transition-colors hover:bg-surface-soft"
            >
              987654321098
            </button>
            <div className="mt-2">
              Любой другой 12-значный ИИН откроет пустую форму для ручного
              ввода.
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// ========================= UI HELPERS =========================
function MetaCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-surface-soft px-4 py-3.5">
      <div className="mb-1 text-xs text-muted-foreground">{label}</div>
      <div className="text-base font-semibold text-foreground">{value}</div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-4 flex items-center gap-2.5 text-2xl font-semibold text-foreground">
      <span className="block h-7 w-2 rounded-md bg-accent-yellow" />
      {children}
    </h2>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-[var(--line)] bg-white px-3.5 py-3 text-sm text-foreground outline-none focus:border-brand-green disabled:bg-surface-soft disabled:text-foreground disabled:cursor-not-allowed";

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={inputCls} />;
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={inputCls} />;
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`${inputCls} min-h-[110px] resize-y`}
    />
  );
}

function InfoBox({ k, v, tone }: { k: string; v: string; tone?: "pos" | "neg" }) {
  const toneCls =
    tone === "pos"
      ? "text-positive"
      : tone === "neg"
        ? "text-[var(--danger)]"
        : "text-foreground";
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-surface-soft p-3.5">
      <div className="mb-1 text-xs text-muted-foreground">{k}</div>
      <div className={`text-lg font-bold ${toneCls}`}>{v}</div>
    </div>
  );
}

type Row = {
  checked: boolean;
  no: string;
  name: string;
  base: string;
  cost: string;
  income: string;
  fix: string;
  pct: string;
  min: string;
  max: string;
  forecast: string;
};

const rows: Row[] = [
  {
    checked: true,
    no: "4.1",
    name: "Прием наличных денег в тенге, с учетом НДС",
    base: "0,3% от суммы, мин. 300 ₸",
    cost: "0,08%",
    income: "410 000 ₸",
    fix: "—",
    pct: "0,24%",
    min: "240 ₸",
    max: "—",
    forecast: "328 000 ₸",
  },
  {
    checked: false,
    no: "4.2",
    name: "Прием наличной иностранной валюты, кроме RUB",
    base: "0,35% от суммы, мин. 900 ₸",
    cost: "0,11%",
    income: "190 000 ₸",
    fix: "—",
    pct: "0,28%",
    min: "720 ₸",
    max: "—",
    forecast: "160 000 ₸",
  },
  {
    checked: true,
    no: "4.2.1",
    name: "Прием наличных денег в российских рублях",
    base: "0,35% от суммы, мин. 900 ₸",
    cost: "0,12%",
    income: "70 000 ₸",
    fix: "—",
    pct: "0,30%",
    min: "900 ₸",
    max: "—",
    forecast: "62 000 ₸",
  },
  {
    checked: true,
    no: "4.3",
    name: "Прием и пересчет проинкассированной выручки",
    base: "0,25%, мин. 900 ₸",
    cost: "0,09%",
    income: "255 000 ₸",
    fix: "—",
    pct: "0,20%",
    min: "720 ₸",
    max: "—",
    forecast: "212 000 ₸",
  },
];

function CalcRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "pos" | "neg";
}) {
  const toneCls =
    tone === "pos"
      ? "text-positive"
      : tone === "neg"
        ? "text-[var(--danger)]"
        : "text-foreground";
  return (
    <div className="flex justify-between gap-2.5 border-b border-dashed border-[var(--line)] py-2.5 text-sm last:border-b-0">
      <span className="text-muted-foreground">{label}</span>
      <strong className={`text-[15px] font-semibold ${toneCls}`}>{value}</strong>
    </div>
  );
}

// ========================= SCREEN 3: FORM =========================
function TariffRequestPage({
  client,
  readOnly,
  onBack,
  onLogout,
}: {
  client: ClientData;
  readOnly: boolean;
  onBack: () => void;
  onLogout: () => void;
}) {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-[1440px] p-6">
        {/* Topbar */}
        <header className="flex flex-col items-start justify-between gap-6 rounded-3xl border border-[var(--line)] bg-surface px-7 py-6 shadow-[0_8px_24px_rgba(15,23,42,0.05)] lg:flex-row">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-full bg-[oklch(0.88_0.04_25)]" />
            <div>
              <h1 className="m-0 text-[28px] font-semibold leading-tight">
                Тарифный комитет
              </h1>
              <div className="text-sm text-muted-foreground">
                Прототип страницы заявки на индивидуальные тарифные условия
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-3">
            <div className="flex gap-2">
              <button
                onClick={onBack}
                className="rounded-xl border border-[var(--line)] bg-white px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-surface-soft"
              >
                ← Изменить ИИН
              </button>
              <button
                onClick={onLogout}
                className="rounded-xl border border-[var(--line)] bg-white px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-surface-soft"
              >
                Выйти
              </button>
            </div>
            <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:w-auto lg:min-w-[620px] lg:grid-cols-3">
              <MetaCard label="ФИО" value="Карманова Альбина Руслановна" />
              <MetaCard label="Номер заявки" value="100347604082" />
              <MetaCard label="Дата заявки" value="10.03.2026" />
              <MetaCard label="Табельный номер" value="00062861" />
              <MetaCard label="Статус" value="Черновик" />
              <MetaCard label="Этап" value="Заполнение инициатором" />
            </div>
          </div>
        </header>

        {readOnly && (
          <div className="mt-4 flex items-center gap-2.5 rounded-2xl border border-[var(--total-border)] bg-[var(--total-bg)] px-4 py-3 text-sm text-foreground">
            <span className="text-lg">✓</span>
            Клиент найден в базе. Данные подтянуты автоматически из карточки
            клиента и недоступны для редактирования.
          </div>
        )}
        {!readOnly && client.iinBin && (
          <div className="mt-4 flex items-center gap-2.5 rounded-2xl border border-[oklch(0.85_0.08_85)] bg-[oklch(0.99_0.03_85)] px-4 py-3 text-sm text-foreground">
            <span className="text-lg">⚠</span>
            Клиент не найден в базе. Заполните данные нового клиента вручную.
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 items-start gap-6 xl:grid-cols-[1fr_360px]">
          <main>
            {/* Block 1 */}
            <section className="mb-5 rounded-3xl border border-[var(--line)] bg-surface p-6 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
              <SectionTitle>Блок 1. Информация о клиенте</SectionTitle>
              <p className="-mt-1.5 mb-4 text-[13px] text-muted-foreground">
                Для действующего клиента данные подтягиваются автоматически из
                карточки клиента. Для нового клиента доступны для ручного ввода.
              </p>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="ИИН / БИН">
                  <Input
                    placeholder="Введите ИИН/БИН"
                    defaultValue={client.iinBin}
                    disabled={readOnly}
                  />
                </Field>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                <Field label="Полное наименование клиента">
                  <Input
                    placeholder="ТОО / ИП / наименование клиента"
                    defaultValue={client.fullName}
                    disabled={readOnly}
                  />
                </Field>
                <Field label="Вид деятельности">
                  <Input
                    placeholder="Например: торговля, услуги, ВЭД"
                    defaultValue={client.activity}
                    disabled={readOnly}
                  />
                </Field>
                <Field label="Дата начала обслуживания в Банке">
                  <Input
                    placeholder="ДД.ММ.ГГГГ"
                    defaultValue={client.serviceStartDate}
                    disabled={readOnly}
                  />
                </Field>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                <Field label="Связанность с банком">
                  <Select defaultValue={client.relation} disabled={readOnly}>
                    <option>Не выбрано</option>
                    <option>Есть связанность</option>
                    <option>Нет связанности</option>
                  </Select>
                </Field>
                <Field label="Количество персонала">
                  <Input
                    placeholder="0"
                    defaultValue={client.staffCount}
                    disabled={readOnly}
                  />
                </Field>
                <Field label="Ежемесячный фонд заработной платы">
                  <Input
                    placeholder="0 ₸"
                    defaultValue={client.payroll}
                    disabled={readOnly}
                  />
                </Field>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Field label="Обслуживающая страховая компания">
                  <Input
                    placeholder="Выбрать из справочника"
                    defaultValue={client.insurance}
                    disabled={readOnly}
                  />
                </Field>
                <Field label="РКО">
                  <Input
                    placeholder="Доход / объем"
                    defaultValue={client.rko}
                    disabled={readOnly}
                  />
                </Field>
                <Field label="Документарные операции">
                  <Input
                    placeholder="Доход / объем"
                    defaultValue={client.doc}
                    disabled={readOnly}
                  />
                </Field>
                <Field label="Кредиты">
                  <Input
                    placeholder="Доход / объем"
                    defaultValue={client.credits}
                    disabled={readOnly}
                  />
                </Field>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Field label="Дилинг">
                  <Input
                    placeholder="Доход / объем"
                    defaultValue={client.dealing}
                    disabled={readOnly}
                  />
                </Field>
                <Field label="Эквайринг">
                  <Input
                    placeholder="Доход / объем"
                    defaultValue={client.acquiring}
                    disabled={readOnly}
                  />
                </Field>
                <Field label="Корпоративные карты">
                  <Input
                    placeholder="Доход / объем"
                    defaultValue={client.corpCards}
                    disabled={readOnly}
                  />
                </Field>
                <Field label="Депозиты / остатки на ТС">
                  <Input
                    placeholder="Доход / остаток"
                    defaultValue={client.deposits}
                    disabled={readOnly}
                  />
                </Field>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <InfoBox k="Доходность клиента по кошельку" v={client.walletProfit} />
                <InfoBox k="Доходность по группе" v={client.groupProfit} />
                <InfoBox k="Доходы по кросс-продуктам" v={client.crossProfit} />
                <InfoBox
                  k="Рентабельность клиента"
                  v={client.profitability}
                  tone={client.profitability === "Положительная" ? "pos" : undefined}
                />
              </div>
            </section>

            {/* Block 2 */}
            <section className="mb-5 rounded-3xl border border-[var(--line)] bg-surface p-6 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
              <SectionTitle>Блок 2. Запрашиваемые условия</SectionTitle>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Категория тарифа">
                  <Select>
                    <option>Тариф категории A</option>
                    <option>Тариф категории B</option>
                    <option>Тариф категории C</option>
                    <option>Тариф категории D</option>
                    <option>Тариф категории E</option>
                    <option>Тариф категории F</option>
                  </Select>
                </Field>
                <Field label="Срок действия тарифа">
                  <Select defaultValue="12">
                    <option value="3">3 месяца</option>
                    <option value="6">6 месяцев</option>
                    <option value="12">12 месяцев</option>
                  </Select>
                </Field>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                <Field label="Размер скидки, %">
                  <Input defaultValue="20" />
                </Field>
                <Field label="Горизонт прогноза">
                  <Input defaultValue="12 месяцев" />
                </Field>
                <Field label="Примечание">
                  <Input placeholder="Краткий комментарий к расчету" />
                </Field>
              </div>

              <div className="mt-5 overflow-auto">
                <table className="w-full overflow-hidden rounded-2xl border border-[var(--line)] text-sm">
                  <thead>
                    <tr className="bg-[var(--table-head)] text-white">
                      <th className="w-[72px] border-r border-white/15 p-3 text-left">Выбр.</th>
                      <th className="w-[70px] border-r border-white/15 p-3 text-left">№</th>
                      <th className="border-r border-white/15 p-3 text-left">Наименование операции</th>
                      <th className="w-[150px] border-r border-white/15 p-3 text-left">Базовый тариф</th>
                      <th className="w-[120px] border-r border-white/15 p-3 text-left">Себестоимость</th>
                      <th className="w-[130px] border-r border-white/15 p-3 text-left">Текущий доход</th>
                      <th colSpan={4} className="border-r border-white/15 p-3 text-left">
                        Запрашиваемый тариф
                      </th>
                      <th className="w-[170px] p-3 text-left">Прогноз доходности</th>
                    </tr>
                    <tr className="bg-[var(--table-sub)] text-[13px] font-normal text-white">
                      <th className="border-r border-white/15 p-2.5"></th>
                      <th className="border-r border-white/15 p-2.5"></th>
                      <th className="border-r border-white/15 p-2.5"></th>
                      <th className="border-r border-white/15 p-2.5"></th>
                      <th className="border-r border-white/15 p-2.5"></th>
                      <th className="border-r border-white/15 p-2.5"></th>
                      <th className="w-[120px] border-r border-white/15 p-2.5 text-left">Фикс.</th>
                      <th className="w-[80px] border-r border-white/15 p-2.5 text-left">%</th>
                      <th className="w-[90px] border-r border-white/15 p-2.5 text-left">min</th>
                      <th className="w-[90px] border-r border-white/15 p-2.5 text-left">max</th>
                      <th className="p-2.5"></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-[var(--section-row)] font-bold">
                      <td className="border-t border-r border-[var(--line)] p-2.5"></td>
                      <td className="border-t border-r border-[var(--line)] p-2.5"></td>
                      <td colSpan={9} className="border-t border-[var(--line)] p-2.5">
                        Раздел 1. Счета клиента: открытие, ведение и закрытие
                      </td>
                    </tr>
                    {rows.map((r) => (
                      <tr key={r.no} className="bg-white">
                        <td className="w-10 border-t border-r border-[var(--line)] p-2.5 text-center text-lg text-positive">
                          {r.checked ? "✓" : ""}
                        </td>
                        <td className="border-t border-r border-[var(--line)] p-2.5">{r.no}</td>
                        <td className="border-t border-r border-[var(--line)] p-2.5">{r.name}</td>
                        <td className="border-t border-r border-[var(--line)] p-2.5">{r.base}</td>
                        <td className="border-t border-r border-[var(--line)] p-2.5">{r.cost}</td>
                        <td className="border-t border-r border-[var(--line)] p-2.5">{r.income}</td>
                        <td className="border-t border-r border-[var(--line)] p-2.5">{r.fix}</td>
                        <td className="border-t border-r border-[var(--line)] p-2.5">{r.pct}</td>
                        <td className="border-t border-r border-[var(--line)] p-2.5">{r.min}</td>
                        <td className="border-t border-r border-[var(--line)] p-2.5">{r.max}</td>
                        <td className="border-t border-[var(--line)] p-2.5">{r.forecast}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Столбцы «Базовый тариф» и «Себестоимость» формируются
                автоматически по выбранной категории тарифа и недоступны для
                редактирования. Неотмеченные операции не уходят далее по
                маршруту согласования.
              </p>

              <div className="mt-3 rounded-2xl border border-dashed border-[var(--line)] bg-[oklch(0.99_0.01_250)] p-4">
                <strong className="text-foreground">Прикрепить документ</strong>
                <div className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  При необходимости вложите оборотно-сальдовую ведомость,
                  выписку по счету или иные финансовые документы, подтверждающие
                  расходы клиента.
                </div>
              </div>
            </section>

            {/* Block 3 */}
            <section className="mb-5 rounded-3xl border border-[var(--line)] bg-surface p-6 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
              <SectionTitle>Блок 3. Обоснование</SectionTitle>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Краткое обоснование">
                  <Textarea placeholder="Опишите цель, экономический эффект, значимость клиента и причину запрашиваемого отклонения от базовых тарифов" />
                </Field>
                <div>
                  <Field label="Проект решения ТК">
                    <Textarea placeholder="Текст проекта решения" />
                  </Field>
                  <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Field label="Дата мониторинга">
                      <Input placeholder="Не более 12 месяцев" />
                    </Field>
                    <Field label="Визирующий">
                      <Select>
                        <option>Выбрать согласующего</option>
                      </Select>
                    </Field>
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-[oklch(0.85_0.08_85)] bg-[oklch(0.99_0.03_85)] p-3.5 text-sm leading-relaxed text-foreground">
                <strong>Маршрут согласования:</strong> руководитель инициатора →
                секретарь Комитета → члены Тарифного комитета. На этапе
                голосования доступны действия: «За», «Против», «Запросить доп.
                информацию». При запросе доп. информации создается подзадача
                инициатору с контролем срока исполнения.
              </div>

              <div className="mt-4 flex flex-wrap gap-3.5">
                <button className="cursor-pointer rounded-2xl border-none bg-brand-green px-5 py-3.5 text-[15px] font-bold text-white transition-opacity hover:opacity-90">
                  Отправить на согласование
                </button>
                <button className="cursor-pointer rounded-2xl border border-[var(--line)] bg-white px-5 py-3.5 text-[15px] font-bold text-foreground transition-colors hover:bg-surface-soft">
                  Сохранить
                </button>
                <button className="cursor-pointer rounded-2xl border border-dashed border-[var(--line)] bg-surface-soft px-5 py-3.5 text-[15px] font-bold text-foreground transition-colors hover:bg-white">
                  Предварительный просмотр
                </button>
              </div>
            </section>
          </main>

          {/* Smart card */}
          <aside className="rounded-3xl border border-[var(--line)] bg-surface p-5 shadow-[0_12px_28px_rgba(15,23,42,0.07)] xl:sticky xl:top-5">
            <h3 className="mb-3 text-[22px] font-semibold">Умный блок расчета</h3>
            <div className="text-xs text-muted-foreground">
              Сводный калькулятор по выбранным операциям и сроку действия
              тарифа.
            </div>

            <div className="my-4 rounded-2xl border border-[var(--total-border)] bg-[var(--total-bg)] p-4">
              <div className="text-xs text-muted-foreground">
                Прогноз доходности с учетом скидки
              </div>
              <div className="mt-1 text-3xl font-extrabold text-brand-green-dark">
                762 000 ₸
              </div>
            </div>

            <CalcRow label="Себестоимость на весь срок" value="186 000 ₸" />
            <CalcRow label="Стандартный тариф / текущий доход" value="925 000 ₸" />
            <CalcRow label="Запрашиваемый тариф" value="762 000 ₸" />
            <CalcRow label="Недополученный доход" value="163 000 ₸" />
            <CalcRow label="Прогноз рентабельности" value="+576 000 ₸" tone="pos" />
            <CalcRow label="Статус рентабельности" value="Положительная" tone="pos" />

            <div className="mt-4 rounded-2xl border border-dashed border-[var(--line)] bg-[oklch(0.99_0.01_250)] p-4">
              <strong className="text-foreground">Контрольные проверки</strong>
              <div className="mt-1 text-xs leading-relaxed text-muted-foreground">
                • выбрана только 1 категория тарифа
                <br />
                • срок мониторинга не превышает 12 месяцев
                <br />
                • заполнено обоснование
                <br />• приложен документ при отклонении выше порога
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
