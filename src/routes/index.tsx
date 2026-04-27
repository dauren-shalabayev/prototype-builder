import { createFileRoute } from "@tanstack/react-router";
import { forwardRef, useEffect, useId, useMemo, useRef, useState } from "react";

import { downloadTariffCommitteePdf } from "@/lib/tariffCommitteePdf";

import standardTariffsCsv from "../data/standard-tariffs.csv?raw";

export const Route = createFileRoute("/")({
  component: AppFlow,
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
/** Демо-учётка прототипа (без бэкенда) */
const DEMO_OPERATOR_LOGIN = "00011111";
const DEMO_OPERATOR_PASSWORD = "pass";

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
  if (screen === "iin") return <IinScreen onSubmit={handleIinSubmit} onLogout={handleLogout} />;
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
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedLogin = login.trim();
    if (!trimmedLogin || !password) {
      setError("Введите логин и пароль");
      return;
    }
    if (trimmedLogin !== DEMO_OPERATOR_LOGIN || password !== DEMO_OPERATOR_PASSWORD) {
      setError("Неверный табельный номер или пароль");
      return;
    }
    onLogin();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-[440px] rounded-3xl border border-[var(--line)] bg-white p-8 shadow-[0_20px_48px_rgba(15,23,42,0.08)]">
        <div className="mb-6 flex items-center gap-3">
          <div className="h-12 w-12 shrink-0 rounded-2xl bg-brand-green" />
          <div className="min-w-0 -translate-x-1">
            <div className="text-[20px] font-semibold leading-tight">Тарифный комитет</div>
            <div className="text-xs text-muted-foreground">Авторизация оператора</div>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="mb-2 block text-xs text-muted-foreground">Табельный номер</label>
            <input
              value={login}
              onChange={(e) => {
                setLogin(e.target.value);
                setError("");
              }}
              className="w-full rounded-xl border border-[var(--line)] bg-white px-3.5 py-3 text-sm outline-none focus:border-brand-green"
              placeholder="00000000"
            />
          </div>
          <div>
            <label className="mb-2 block text-xs text-muted-foreground">Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
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
      <div className="w-full max-w-[520px] rounded-3xl border border-[var(--line)] bg-white p-8 shadow-[0_20px_48px_rgba(15,23,42,0.08)]">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <BlockHeadingAccent size="screen" />
            <div className="h-12 w-12 shrink-0 rounded-2xl bg-brand-green" />
            <div className="min-w-0">
              <div className="text-[20px] font-semibold leading-tight">Поиск клиента</div>
              <div className="text-xs text-muted-foreground">Введите ИИН / БИН клиента</div>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="shrink-0 self-start rounded-xl border border-[var(--line)] bg-white px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-surface-soft"
          >
            Выйти
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="mb-2 block text-xs text-muted-foreground">ИИН / БИН</label>
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

          <div className="rounded-2xl border border-dashed border-[var(--line)] bg-white p-3.5 text-xs leading-relaxed text-muted-foreground">
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
              Любой другой 12-значный ИИН откроет пустую форму для ручного ввода.
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// ========================= UI HELPERS =========================
/** Цветная вертикальная плашка рядом с заголовком блока. */
function BlockHeadingAccent({ size = "section" }: { size?: "section" | "screen" }) {
  if (size === "screen") {
    return (
      <span
        className="h-10 w-2 shrink-0 rounded-md bg-accent-yellow sm:h-11 sm:w-2"
        aria-hidden
      />
    );
  }
  return (
    <span
      className="h-8 w-1.5 shrink-0 rounded-md bg-accent-yellow sm:h-9 sm:w-2"
      aria-hidden
    />
  );
}

function MetaCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-muted px-4 py-3.5">
      <div className="mb-1 text-xs text-muted-foreground">{label}</div>
      <div className="text-base font-semibold text-foreground">{value}</div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-4 flex items-center gap-3 text-2xl font-semibold leading-tight text-foreground">
      <BlockHeadingAccent size="section" />
      <span className="min-w-0 flex-1">{children}</span>
    </h2>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
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

const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea(props, ref) {
    return <textarea ref={ref} {...props} className={`${inputCls} min-h-[110px] resize-y`} />;
  },
);
Textarea.displayName = "Textarea";

function InfoBox({ k, v, tone }: { k: string; v: string; tone?: "pos" | "neg" }) {
  const toneCls =
    tone === "pos" ? "text-positive" : tone === "neg" ? "text-[var(--danger)]" : "text-foreground";
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-white p-3.5">
      <div className="mb-1 text-xs text-muted-foreground">{k}</div>
      <div className={`text-lg font-bold ${toneCls}`}>{v}</div>
    </div>
  );
}

// ----- Справочник базовых тарифов (кассовые операции, раздел 4) -----
type TariffCategory = "A" | "B" | "C" | "D" | "E" | "F";

type TariffCell = {
  /** Процент от суммы */
  pct: number;
  /** Минимум в тенге; null — только процент (напр. 4.2.2) */
  minTenge: number | null;
};

type ParsedTariffRow = {
  rowKey: string;
  code: string;
  name: string;
  isSection: boolean;
  byCat: Record<TariffCategory, string>;
  costPct: number;
  incomeTenge: number;
  costTenge: number;
};

function parseRuNum(s: string): number {
  const t = s.replace(/\s/g, "").replace(",", ".");
  const n = Number(t);
  return Number.isFinite(n) ? n : 0;
}

/** Пытается выделить % и мин. сумму из ячейки CSV для расчёта скидки */
function parseTariffTextToCell(raw: string): TariffCell | null {
  const t = raw.replace(/\r/g, "").replace(/\n/g, " ").replace(/\s+/g, " ").trim();
  if (!t) return null;
  if (!t.includes("%")) {
    const m = t.match(/^([\d\s]+)\s*тенге/i);
    if (m) return { pct: 0, minTenge: Math.round(parseRuNum(m[1])) };
    return null;
  }
  const pctM = t.match(/(\d+[,\d]*)\s*%/);
  if (!pctM) return null;
  const pct = parseRuNum(pctM[1]);
  let minTenge: number | null = null;
  const minM = t.match(/мин\.?\s*([\d\s]+)\s*тенге/i);
  if (minM) minTenge = Math.round(parseRuNum(minM[1]));
  return { pct, minTenge };
}

function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let i = 0;
  let inQuotes = false;
  while (i < text.length) {
    const c = text[i]!;
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += c;
      i++;
      continue;
    }
    if (c === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (c === ",") {
      row.push(field);
      field = "";
      i++;
      continue;
    }
    if (c === "\r") {
      i++;
      continue;
    }
    if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      i++;
      continue;
    }
    field += c;
    i++;
  }
  row.push(field);
  if (row.length > 1 || row[0] !== "") rows.push(row);
  return rows;
}

function demoMoneyForRow(code: string, name: string, idx: number) {
  let h = idx * 7919 + name.length * 31;
  for (const ch of code) h = (h * 31 + ch.charCodeAt(0)) | 0;
  const incomeTenge = 50_000 + (Math.abs(h) % 500_000);
  const costPct = 0.05 + (Math.abs(h) % 150) / 1000;
  const costTenge = Math.round(incomeTenge * costPct);
  return { incomeTenge, costTenge, costPct };
}

function parseStandardTariffsCsv(raw: string): ParsedTariffRow[] {
  const matrix = parseCsvRows(raw);
  if (matrix.length < 2) return [];
  const out: ParsedTariffRow[] = [];
  let idx = 0;
  for (const colsRaw of matrix.slice(1)) {
    const cols = [...colsRaw];
    while (cols.length < 8) cols.push("");
    const code = (cols[0] ?? "").trim();
    const name = (cols[1] ?? "").trim();
    if (!code && !name) continue;
    const isSection = !code && /^Раздел\s/i.test(name);
    const byCat: Record<TariffCategory, string> = {
      D: (cols[2] ?? "").trim(),
      C: (cols[3] ?? "").trim(),
      B: (cols[4] ?? "").trim(),
      A: (cols[5] ?? "").trim(),
      E: (cols[6] ?? "").trim(),
      F: (cols[7] ?? "").trim(),
    };
    const { incomeTenge, costTenge, costPct } = demoMoneyForRow(code, name, idx);
    out.push({
      rowKey: `r${idx}`,
      code,
      name,
      isSection,
      byCat,
      incomeTenge,
      costTenge,
      costPct,
    });
    idx++;
  }
  return out;
}

const STANDARD_TARIFF_ROWS = parseStandardTariffsCsv(standardTariffsCsv);

const TARIFF_SELECTABLE_ROW_KEYS = STANDARD_TARIFF_ROWS.filter((r) => !r.isSection).map(
  (r) => r.rowKey,
);

/** Базовые тарифы по категориям (справочник ТК; подстановка если ячейку CSV не разобрать) */
const TARIFF_CATALOG: Record<TariffCategory, Record<string, TariffCell>> = {
  A: {
    "4.1": { pct: 0.3, minTenge: 300 },
    "4.2": { pct: 0.35, minTenge: 900 },
    "4.2.1": { pct: 0.35, minTenge: 900 },
    "4.2.2": { pct: 2.5, minTenge: null },
    "4.3": { pct: 0.25, minTenge: 900 },
    "4.3.1": { pct: 15, minTenge: 750 },
  },
  B: {
    "4.1": { pct: 0.25, minTenge: 250 },
    "4.2": { pct: 0.3, minTenge: 850 },
    "4.2.1": { pct: 0.3, minTenge: 850 },
    "4.2.2": { pct: 2.5, minTenge: null },
    "4.3": { pct: 0.2, minTenge: 850 },
    "4.3.1": { pct: 15, minTenge: 750 },
  },
  C: {
    "4.1": { pct: 0.2, minTenge: 200 },
    "4.2": { pct: 0.25, minTenge: 800 },
    "4.2.1": { pct: 0.25, minTenge: 800 },
    "4.2.2": { pct: 2.5, minTenge: null },
    "4.3": { pct: 0.15, minTenge: 800 },
    "4.3.1": { pct: 15, minTenge: 750 },
  },
  D: {
    "4.1": { pct: 0.15, minTenge: 150 },
    "4.2": { pct: 0.2, minTenge: 750 },
    "4.2.1": { pct: 0.2, minTenge: 750 },
    "4.2.2": { pct: 2.5, minTenge: null },
    "4.3": { pct: 0.1, minTenge: 750 },
    "4.3.1": { pct: 15, minTenge: 750 },
  },
  E: {
    "4.1": { pct: 0.1, minTenge: 100 },
    "4.2": { pct: 0.15, minTenge: 700 },
    "4.2.1": { pct: 0.15, minTenge: 700 },
    "4.2.2": { pct: 2.5, minTenge: null },
    "4.3": { pct: 0.05, minTenge: 700 },
    "4.3.1": { pct: 15, minTenge: 750 },
  },
  F: {
    "4.1": { pct: 0.05, minTenge: 50 },
    "4.2": { pct: 0.1, minTenge: 650 },
    "4.2.1": { pct: 0.1, minTenge: 650 },
    "4.2.2": { pct: 2.5, minTenge: null },
    "4.3": { pct: 0, minTenge: 650 },
    "4.3.1": { pct: 15, minTenge: 750 },
  },
};

function formatMoneyRu(n: number): string {
  return `${Math.round(n).toLocaleString("ru-RU")} ₸`;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}

function newAttachmentId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/** Процент для отображения с запятой */
function formatPctRu(n: number): string {
  const rounded = Math.round(n * 10000) / 10000;
  const s = rounded.toFixed(4).replace(/\.?0+$/, "");
  return s.replace(".", ",");
}

function formatBaseTariff(cell: TariffCell): string {
  const p = formatPctRu(cell.pct);
  if (cell.minTenge != null) {
    return `${p}% от суммы, мин. ${cell.minTenge.toLocaleString("ru-RU")} ₸`;
  }
  return `${p}% от суммы`;
}

function applyDiscountToTariff(
  cell: TariffCell,
  discountPct: number,
): { pct: number; minTenge: number | null } {
  const k = (100 - discountPct) / 100;
  const pct = Math.round(cell.pct * k * 100) / 100;
  const minTenge = cell.minTenge != null ? Math.round(cell.minTenge * k) : null;
  return { pct, minTenge };
}

type Block2RowComputed = {
  row: ParsedTariffRow;
  sel: boolean;
  baseStr: string;
  costStr: string;
  incomeStr: string;
  discountCol: string;
  fixStr: string;
  pctStr: string;
  minStr: string;
  maxStr: string;
  forecastStr: string;
  forecastNum: number;
};

/** Пустое или нечисловое поле при расчёте трактуем как минимум 1% */
function parseDiscountPercentInput(raw: string): number {
  const t = raw.trim();
  if (t === "") return 1;
  const n = Math.round(Number(t));
  if (!Number.isFinite(n)) return 20;
  return Math.min(100, Math.max(1, n));
}

function computeBlock2TariffState(
  tariffCategory: TariffCategory,
  validityMonths: 3 | 6 | 12,
  discountInput: string,
  selected: Record<string, boolean>,
): {
  rowsOut: Block2RowComputed[];
  sumIncome: number;
  sumCost: number;
  sumForecast: number;
  lost: number;
  profit: number;
  clampedDiscount: number;
  periodFactor: number;
} {
  const periodFactor = validityMonths / 12;
  const cells = TARIFF_CATALOG[tariffCategory];
  const clampedDiscount = parseDiscountPercentInput(discountInput);

  const rowsOut: Block2RowComputed[] = STANDARD_TARIFF_ROWS.map((row) => {
    if (row.isSection) {
      return {
        row,
        sel: false,
        baseStr: "",
        costStr: "",
        incomeStr: "",
        discountCol: "",
        fixStr: "",
        pctStr: "",
        minStr: "",
        maxStr: "",
        forecastStr: "—",
        forecastNum: 0,
      };
    }

    const rawBase = (row.byCat[tariffCategory] ?? "").trim();
    const catalogCell = row.code && cells[row.code] ? cells[row.code] : undefined;
    const cellForMath = parseTariffTextToCell(rawBase) ?? catalogCell ?? null;

    const baseStr = rawBase || (cellForMath ? formatBaseTariff(cellForMath) : "—");

    const costStr = `${formatPctRu(row.costPct)}%`;
    const incomeStr = formatMoneyRu(row.incomeTenge);
    const sel = selected[row.rowKey] ?? false;

    let discountCol = "—";
    let fixStr = "—";
    let pctStr = "—";
    let minStr = "—";
    let maxStr = "—";
    let forecastStr = "—";
    let forecastNum = 0;

    if (sel) {
      discountCol = `${clampedDiscount}%`;
      if (cellForMath) {
        const d = applyDiscountToTariff(cellForMath, clampedDiscount);
        fixStr = "—";
        pctStr = `${formatPctRu(d.pct)}%`;
        minStr = d.minTenge != null ? formatMoneyRu(d.minTenge) : "—";
        maxStr = "—";
      } else {
        fixStr = "—";
        pctStr = "—";
        minStr = "—";
        maxStr = "—";
      }
      forecastNum = Math.round((row.incomeTenge * (100 - clampedDiscount)) / 100);
      forecastStr = formatMoneyRu(forecastNum);
    }

    return {
      row,
      sel,
      baseStr,
      costStr,
      incomeStr,
      discountCol,
      fixStr,
      pctStr,
      minStr,
      maxStr,
      forecastStr,
      forecastNum,
    };
  });

  let sumIncome = 0;
  let sumCost = 0;
  let sumForecast = 0;
  for (const r of rowsOut) {
    if (!r.sel || r.row.isSection) continue;
    sumIncome += r.row.incomeTenge * periodFactor;
    sumCost += r.row.costTenge * periodFactor;
    sumForecast += r.forecastNum * periodFactor;
  }
  const lost = sumIncome - sumForecast;
  const profit = sumForecast - sumCost;

  return {
    rowsOut,
    sumIncome,
    sumCost,
    sumForecast,
    lost,
    profit,
    clampedDiscount,
    periodFactor,
  };
}

function CalcRow({ label, value, tone }: { label: string; value: string; tone?: "pos" | "neg" }) {
  const toneCls =
    tone === "pos" ? "text-positive" : tone === "neg" ? "text-[var(--danger)]" : "text-foreground";
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
  const [tariffCategory, setTariffCategory] = useState<TariffCategory>("A");
  const [validityMonths, setValidityMonths] = useState<3 | 6 | 12>(12);
  const [discountInput, setDiscountInput] = useState("20");
  const [selected, setSelected] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(TARIFF_SELECTABLE_ROW_KEYS.map((k) => [k, false])),
  );
  const [noteTariff, setNoteTariff] = useState("");
  const [briefJustification, setBriefJustification] = useState("");
  const [projectDecision, setProjectDecision] = useState("");
  const projectDecisionRef = useRef<HTMLTextAreaElement>(null);
  const [monitoringDate, setMonitoringDate] = useState("");
  const [approver, setApprover] = useState("");
  const attachmentInputId = useId();
  const [attachments, setAttachments] = useState<{ id: string; file: File; previewUrl?: string }[]>(
    [],
  );
  const attachmentsRef = useRef(attachments);
  attachmentsRef.current = attachments;

  useEffect(() => {
    return () => {
      for (const a of attachmentsRef.current) {
        if (a.previewUrl) URL.revokeObjectURL(a.previewUrl);
      }
    };
  }, []);

  const selectAllRef = useRef<HTMLInputElement>(null);
  const allSelected = useMemo(
    () => TARIFF_SELECTABLE_ROW_KEYS.every((k) => selected[k]),
    [selected],
  );
  const someSelected = useMemo(
    () => TARIFF_SELECTABLE_ROW_KEYS.some((k) => selected[k]),
    [selected],
  );

  useEffect(() => {
    const el = selectAllRef.current;
    if (!el) return;
    el.indeterminate = someSelected && !allSelected;
  }, [someSelected, allSelected]);

  const b2 = useMemo(
    () => computeBlock2TariffState(tariffCategory, validityMonths, discountInput, selected),
    [tariffCategory, validityMonths, discountInput, selected],
  );

  const profitTone: "pos" | "neg" | undefined =
    b2.profit > 0 ? "pos" : b2.profit < 0 ? "neg" : undefined;
  const profitStatus =
    b2.profit > 0 ? "Положительная" : b2.profit < 0 ? "Отрицательная" : "Нулевая";

  const handleDownloadProjectPdf = () => {
    void (async () => {
      try {
        const decisionFromField =
          projectDecisionRef.current?.value ?? projectDecision;
        await downloadTariffCommitteePdf({
          clientFullName: client.fullName,
          iinBin: client.iinBin,
          briefJustification,
          projectDecision: decisionFromField,
          monitoringDate,
          approver,
        });
      } catch (err) {
        console.error(err);
        window.alert(
          "Не удалось сформировать PDF. Откройте консоль браузера (F12) для подробностей.",
        );
      }
    })();
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto min-w-0 max-w-[1440px] px-6 pb-6 pt-3">
        <div className="mb-3 flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={onBack}
            className="rounded-xl border border-[var(--line)] bg-white px-3 py-1.5 text-xs text-foreground shadow-sm transition-colors hover:bg-surface-soft"
          >
            ← Изменить ИИН
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="rounded-xl border border-[var(--line)] bg-white px-3 py-1.5 text-xs text-muted-foreground shadow-sm transition-colors hover:bg-surface-soft"
          >
            Выйти
          </button>
        </div>

        {/* Topbar */}
        <header className="flex flex-col items-start justify-between gap-6 rounded-3xl border border-[var(--line)] bg-white px-7 py-6 shadow-[0_8px_24px_rgba(15,23,42,0.05)] lg:flex-row">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 shrink-0 rounded-full bg-[oklch(0.88_0.04_25)]" />
            <div className="min-w-0">
              <h1 className="m-0 text-[30px] font-semibold leading-tight tracking-tight sm:text-[33px]">
                Тарифный комитет
              </h1>
              <div className="text-sm text-muted-foreground">
                Прототип страницы заявки на индивидуальные тарифные условия
              </div>
            </div>
          </div>
          <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:w-auto lg:min-w-[620px] lg:grid-cols-3">
            <MetaCard label="ФИО" value="Тестов Тест Тестович" />
            <MetaCard label="Номер заявки" value="100347604082" />
            <MetaCard label="Дата заявки" value="10.03.2026" />
            <MetaCard label="Табельный номер" value="00011111" />
            <MetaCard label="Статус" value="Черновик" />
            <MetaCard label="Этап" value="Заполнение инициатором" />
          </div>
        </header>

        {readOnly && (
          <div className="mt-4 flex items-center gap-2.5 rounded-2xl border border-[var(--total-border)] bg-[var(--total-bg)] px-4 py-3 text-sm text-foreground">
            <span className="text-lg">✓</span>
            Клиент найден в базе. Данные подтянуты автоматически из карточки клиента и недоступны
            для редактирования.
          </div>
        )}
        {!readOnly && client.iinBin && (
          <div className="mt-4 flex items-center gap-2.5 rounded-2xl border border-[oklch(0.85_0.08_85)] bg-[oklch(0.99_0.03_85)] px-4 py-3 text-sm text-foreground">
            <span className="text-lg">⚠</span>
            Клиент не найден в базе. Заполните данные нового клиента вручную.
          </div>
        )}

        <div className="mt-6 grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_min(340px,32vw)] lg:items-start">
            {/* Block 1 */}
            <section className="min-w-0 rounded-3xl border border-[var(--line)] bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.04)] lg:col-start-1 lg:row-start-1">
              <SectionTitle>Блок 1. Информация о клиенте</SectionTitle>
              <p className="-mt-1.5 mb-4 text-[13px] text-muted-foreground">
                Для действующего клиента данные подтягиваются автоматически из карточки клиента. Для
                нового клиента доступны для ручного ввода.
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
                  <Input placeholder="0" defaultValue={client.staffCount} disabled={readOnly} />
                </Field>
                <Field label="Ежемесячный фонд заработной платы">
                  <Input placeholder="0 ₸" defaultValue={client.payroll} disabled={readOnly} />
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
            <section className="min-w-0 rounded-3xl border border-[var(--line)] bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.04)] lg:col-start-1 lg:row-start-2">
              <SectionTitle>Блок 2. Запрашиваемые условия</SectionTitle>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Выберите категорию тарифа (одна категория)">
                  <Select
                    value={tariffCategory}
                    onChange={(e) => setTariffCategory(e.target.value as TariffCategory)}
                  >
                    <option value="A">Тариф категории A</option>
                    <option value="B">Тариф категории B</option>
                    <option value="C">Тариф категории C</option>
                    <option value="D">Тариф категории D</option>
                    <option value="E">Тариф категории E</option>
                    <option value="F">Тариф категории F</option>
                  </Select>
                </Field>
                <Field label="Выберите срок действия тарифа">
                  <Select
                    value={String(validityMonths)}
                    onChange={(e) => setValidityMonths(Number(e.target.value) as 3 | 6 | 12)}
                  >
                    <option value="3">3 месяца</option>
                    <option value="6">6 месяцев</option>
                    <option value="12">12 месяцев</option>
                  </Select>
                </Field>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Размер скидки, % (от 1 до 100)">
                  <Input
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder="1–100"
                    value={discountInput}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, "");
                      if (v.length <= 3) setDiscountInput(v);
                    }}
                    onBlur={() => {
                      const t = discountInput.trim();
                      if (t === "") {
                        setDiscountInput("20");
                        return;
                      }
                      const n = Math.round(Number(t));
                      if (!Number.isFinite(n) || n < 1) setDiscountInput("20");
                      else setDiscountInput(String(Math.min(100, n)));
                    }}
                  />
                </Field>
                <Field label="Примечание к расчету">
                  <Input
                    placeholder="Краткий комментарий"
                    value={noteTariff}
                    onChange={(e) => setNoteTariff(e.target.value)}
                  />
                </Field>
              </div>

              <div className="mt-[18px] min-w-0">
                <table className="w-full table-fixed border-separate border-spacing-0 overflow-hidden rounded-2xl border border-[var(--line)] text-sm leading-normal [&_thead_th]:border-r [&_thead_th]:border-white/15 [&_thead_th:last-child]:border-r-0">
                  <colgroup>
                    <col style={{ width: "5%" }} />
                    <col style={{ width: "5%" }} />
                    <col style={{ width: "21%" }} />
                    <col style={{ width: "10%" }} />
                    <col style={{ width: "9%" }} />
                    <col style={{ width: "9%" }} />
                    <col style={{ width: "6%" }} />
                    <col style={{ width: "6%" }} />
                    <col style={{ width: "5%" }} />
                    <col style={{ width: "5%" }} />
                    <col style={{ width: "5%" }} />
                    <col style={{ width: "14%" }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th className="min-w-0 bg-[var(--table-head)] px-1.5 py-2 text-left align-middle text-sm font-bold leading-tight text-white whitespace-normal break-words hyphens-auto">
                        Выбр.
                      </th>
                      <th className="min-w-0 bg-[var(--table-head)] px-1.5 py-2 text-left align-middle text-sm font-bold leading-tight text-white whitespace-normal break-words hyphens-auto">
                        №
                      </th>
                      <th className="min-w-0 bg-[var(--table-head)] px-1.5 py-2 text-left align-middle text-sm font-bold leading-tight text-white whitespace-normal break-words hyphens-auto">
                        Наименование операции
                      </th>
                      <th className="min-w-0 bg-[var(--table-head)] px-1.5 py-2 text-left align-middle text-sm font-bold leading-tight text-white whitespace-normal break-words hyphens-auto">
                        Базовый тариф
                      </th>
                      <th className="min-w-0 bg-[var(--table-head)] px-1.5 py-2 text-left align-middle text-sm font-bold leading-tight text-white whitespace-normal break-words hyphens-auto">
                        Себестоимость
                      </th>
                      <th className="min-w-0 bg-[var(--table-head)] px-1.5 py-2 text-left align-middle text-sm font-bold leading-tight text-white whitespace-normal break-words hyphens-auto">
                        Текущий доход
                      </th>
                      <th className="min-w-0 bg-[var(--table-head)] px-1.5 py-2 text-left align-middle text-sm font-bold leading-tight text-white whitespace-normal break-words hyphens-auto">
                        Скидка (%)
                      </th>
                      <th
                        colSpan={4}
                        className="min-w-0 bg-[var(--table-head)] px-1.5 py-2 text-left align-middle text-sm font-bold leading-tight text-white whitespace-normal break-words hyphens-auto"
                      >
                        Запрашиваемый тариф
                      </th>
                      <th className="min-w-0 bg-[var(--table-head)] px-1.5 py-2 text-left align-middle text-sm font-bold leading-tight text-white whitespace-normal break-words hyphens-auto">
                        Прогноз доходности
                      </th>
                    </tr>
                    <tr className="text-sm font-bold leading-tight text-white">
                      <th className="min-w-0 bg-[var(--table-sub)] px-1.5 py-2 text-center align-middle whitespace-normal break-words">
                        <input
                          ref={selectAllRef}
                          type="checkbox"
                          checked={allSelected}
                          onChange={() =>
                            setSelected((s) => {
                              const on = TARIFF_SELECTABLE_ROW_KEYS.every((k) => s[k]);
                              return Object.fromEntries(
                                TARIFF_SELECTABLE_ROW_KEYS.map((k) => [k, !on]),
                              );
                            })
                          }
                          className="h-4 w-4 accent-white"
                          aria-label="Выделить все операции или снять выделение"
                          title="Выделить все / снять все"
                        />
                      </th>
                      <th className="min-w-0 bg-[var(--table-sub)] px-1.5 py-2" />
                      <th className="min-w-0 bg-[var(--table-sub)] px-1.5 py-2" />
                      <th className="min-w-0 bg-[var(--table-sub)] px-1.5 py-2" />
                      <th className="min-w-0 bg-[var(--table-sub)] px-1.5 py-2" />
                      <th className="min-w-0 bg-[var(--table-sub)] px-1.5 py-2" />
                      <th className="min-w-0 bg-[var(--table-sub)] px-1.5 py-2" />
                      <th className="min-w-0 bg-[var(--table-sub)] px-1.5 py-2 text-left whitespace-normal break-words leading-tight">
                        Фикс.
                      </th>
                      <th className="min-w-0 bg-[var(--table-sub)] px-1.5 py-2 text-left whitespace-normal break-words leading-tight">
                        %
                      </th>
                      <th className="min-w-0 bg-[var(--table-sub)] px-1.5 py-2 text-left whitespace-normal break-words leading-tight">
                        min
                      </th>
                      <th className="min-w-0 bg-[var(--table-sub)] px-1.5 py-2 text-left whitespace-normal break-words leading-tight">
                        max
                      </th>
                      <th className="min-w-0 bg-[var(--table-sub)] px-1.5 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {b2.rowsOut.map((r) =>
                      r.row.isSection ? (
                        <tr key={r.row.rowKey} className="font-bold">
                          <td className="border-t border-r border-[var(--line)] bg-[var(--section-row)] px-2.5 py-2.5" />
                          <td className="border-t border-r border-[var(--line)] bg-[var(--section-row)] px-2.5 py-2.5" />
                          <td
                            colSpan={10}
                            className="border-t border-[var(--line)] bg-[var(--section-row)] px-2.5 py-2.5 text-sm font-bold leading-snug break-words last:border-r-0"
                          >
                            {r.row.name}
                          </td>
                        </tr>
                      ) : (
                        <tr key={r.row.rowKey} className="bg-white">
                          <td className="border-t border-r border-[var(--line)] bg-white px-2.5 py-2.5 text-center align-top">
                            <input
                              type="checkbox"
                              checked={r.sel}
                              onChange={() =>
                                setSelected((s) => ({
                                  ...s,
                                  [r.row.rowKey]: !s[r.row.rowKey],
                                }))
                              }
                              className="h-4 w-4 accent-brand-green"
                              aria-label={`Выбрать операцию ${r.row.code || r.row.name.slice(0, 40)}`}
                            />
                          </td>
                          <td className="border-t border-r border-[var(--line)] bg-white px-2.5 py-2.5 align-top font-mono text-sm leading-snug break-all text-foreground last:border-r-0">
                            {r.row.code || "—"}
                          </td>
                          <td className="border-t border-r border-[var(--line)] bg-white px-2.5 py-2.5 align-top text-sm leading-snug break-words text-foreground last:border-r-0">
                            {r.row.name}
                          </td>
                          <td className="border-t border-r border-[var(--line)] bg-white px-2.5 py-2.5 align-top text-sm leading-snug break-words text-muted-foreground last:border-r-0">
                            {r.baseStr}
                          </td>
                          <td className="border-t border-r border-[var(--line)] bg-white px-2.5 py-2.5 align-top text-sm leading-snug break-words last:border-r-0">
                            {r.costStr}
                          </td>
                          <td className="border-t border-r border-[var(--line)] bg-white px-2.5 py-2.5 align-top text-sm leading-snug break-words last:border-r-0">
                            {r.incomeStr}
                          </td>
                          <td className="border-t border-r border-[var(--line)] bg-white px-2.5 py-2.5 align-top text-sm leading-snug break-words last:border-r-0">
                            {r.discountCol}
                          </td>
                          <td className="border-t border-r border-[var(--line)] bg-white px-2.5 py-2.5 align-top text-sm last:border-r-0">
                            <span className="block break-all leading-snug">{r.fixStr}</span>
                          </td>
                          <td className="border-t border-r border-[var(--line)] bg-white px-2.5 py-2.5 align-top text-sm last:border-r-0">
                            <span className="block break-all leading-snug">{r.pctStr}</span>
                          </td>
                          <td className="border-t border-r border-[var(--line)] bg-white px-2.5 py-2.5 align-top text-sm last:border-r-0">
                            <span className="block break-all leading-snug">{r.minStr}</span>
                          </td>
                          <td className="border-t border-r border-[var(--line)] bg-white px-2.5 py-2.5 align-top text-sm last:border-r-0">
                            <span className="block break-all leading-snug">{r.maxStr}</span>
                          </td>
                          <td className="border-t border-r border-[var(--line)] bg-white px-2.5 py-2.5 align-top text-sm font-medium leading-snug break-words last:border-r-0">
                            {r.forecastStr}
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-white text-sm font-semibold leading-snug">
                      <td
                        colSpan={4}
                        className="border-t-2 border-t-[var(--line)] border-r border-[var(--line)] bg-white px-2.5 py-2.5 break-words last:border-r-0"
                      >
                        Итого {validityMonths} мес., коэф.{" "}
                        {b2.periodFactor.toLocaleString("ru-RU", {
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="border-t-2 border-t-[var(--line)] border-r border-[var(--line)] bg-white px-2.5 py-2.5 break-words last:border-r-0">
                        Себестоимость
                        <div className="mt-0.5 font-normal text-muted-foreground">
                          {formatMoneyRu(b2.sumCost)}
                        </div>
                      </td>
                      <td className="border-t-2 border-t-[var(--line)] border-r border-[var(--line)] bg-white px-2.5 py-2.5 break-words last:border-r-0">
                        Стандартный тариф
                        <div className="mt-0.5 font-normal text-muted-foreground">
                          {formatMoneyRu(b2.sumIncome)}
                        </div>
                      </td>
                      <td
                        colSpan={5}
                        className="border-t-2 border-t-[var(--line)] border-r border-[var(--line)] bg-white px-2.5 py-2.5 break-words last:border-r-0"
                      >
                        Запрашиваемый тариф (прогноз)
                        <div className="mt-0.5 font-normal text-muted-foreground">
                          {formatMoneyRu(b2.sumForecast)}
                        </div>
                        <div className="mt-1 text-foreground">
                          Недополученный доход: {formatMoneyRu(b2.lost)}
                        </div>
                        <div className="mt-0.5">
                          Рентабельность:{" "}
                          <span
                            className={b2.profit >= 0 ? "text-positive" : "text-[var(--danger)]"}
                          >
                            {b2.profit > 0 ? "+" : ""}
                            {formatMoneyRu(b2.profit)}
                          </span>
                        </div>
                      </td>
                      <td className="border-t-2 border-t-[var(--line)] border-r border-[var(--line)] bg-white px-2.5 py-2.5 align-top break-words last:border-r-0">
                        <div className="font-normal text-muted-foreground">Σ прогноз</div>
                        <div className="font-bold text-foreground">
                          {formatMoneyRu(b2.sumForecast)}
                        </div>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Таблица строится по всем строкам файла «Стандартные тарифы» (импорт CSV). «Базовый
                тариф» — ячейка выбранной категории (D–F) из файла; при необходимости для расчёта
                скидки подставляется числовой справочник по коду операции. «Себестоимость» и
                «Текущий доход» в прототипе демонстрационные. «Запрашиваемый тариф» и «Скидка (%)»
                считаются там, где из текста тарифа удаётся извлечь проценты и минимумы; иначе в
                колонках %/min показывается «—». Неотмеченные операции после отправки заявки не
                отображаются следующим участникам маршрута.
              </p>

              <div className="relative mt-3 rounded-2xl border border-dashed border-[var(--line)] bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <strong className="text-foreground">Прикрепить документ</strong>
                  <label
                    htmlFor={attachmentInputId}
                    className="inline-flex cursor-pointer select-none rounded-xl border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-surface-soft"
                  >
                    Обзор…
                  </label>
                </div>
                <input
                  id={attachmentInputId}
                  type="file"
                  multiple
                  aria-label="Выбор файлов для вложения"
                  className="fixed left-0 top-0 -z-10 h-px w-px overflow-hidden opacity-0"
                  onChange={(e) => {
                    const list = e.target.files;
                    if (!list?.length) return;
                    setAttachments((prev) => [
                      ...prev,
                      ...Array.from(list).map((file) => {
                        const id = newAttachmentId();
                        const previewUrl = file.type.startsWith("image/")
                          ? URL.createObjectURL(file)
                          : undefined;
                        return { id, file, previewUrl };
                      }),
                    ]);
                    e.target.value = "";
                  }}
                />
                <div className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  При необходимости вложите оборотно-сальдовую ведомость, выписку по счету или иные
                  финансовые документы, подтверждающие расходы клиента. Кнопка «Обзор…» открывает
                  выбор файлов; ниже показывается краткий обзор вложений.
                </div>
                {attachments.length > 0 ? (
                  <ul className="mt-3 space-y-2">
                    {attachments.map(({ id, file, previewUrl }) => {
                      const extPart = file.name.includes(".")
                        ? file.name.split(".").pop()?.toUpperCase()
                        : "";
                      const ext = extPart || "FILE";
                      return (
                        <li
                          key={id}
                          className="flex items-start gap-3 rounded-xl border border-[var(--line)] bg-white p-3 text-sm shadow-sm"
                        >
                          {previewUrl ? (
                            <img
                              src={previewUrl}
                              alt=""
                              className="h-14 w-14 shrink-0 rounded-lg border border-[var(--line)] object-cover"
                            />
                          ) : (
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-dashed border-[var(--line)] bg-surface-soft text-[10px] font-bold text-muted-foreground">
                              {ext}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="truncate font-medium text-foreground">{file.name}</div>
                            <div className="mt-0.5 text-xs text-muted-foreground">
                              {formatFileSize(file.size)}
                              {file.type ? ` · ${file.type}` : ""}
                              {file.lastModified
                                ? ` · изменён ${new Date(file.lastModified).toLocaleString("ru-RU", { dateStyle: "short", timeStyle: "short" })}`
                                : ""}
                            </div>
                          </div>
                          <button
                            type="button"
                            className="shrink-0 rounded-lg border border-[var(--line)] bg-surface-soft px-2.5 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-white"
                            onClick={() =>
                              setAttachments((prev) => {
                                const hit = prev.find((a) => a.id === id);
                                if (hit?.previewUrl) {
                                  URL.revokeObjectURL(hit.previewUrl);
                                }
                                return prev.filter((a) => a.id !== id);
                              })
                            }
                          >
                            Удалить
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="mt-3 rounded-xl border border-dashed border-[var(--line)] bg-white/60 py-6 text-center text-xs text-muted-foreground">
                    Файлы не выбраны — нажмите «Обзор…», чтобы добавить вложения.
                  </p>
                )}
              </div>
            </section>

            {/* Прогнозные данные — справа на lg; на мобиле после блока 2 */}
            <aside className="min-w-0 rounded-3xl border border-[var(--line)] bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.07)] lg:sticky lg:top-4 lg:col-start-2 lg:row-start-1 lg:row-span-3 lg:self-start">
              <SectionTitle>Прогнозные данные</SectionTitle>
              <div className="text-xs text-muted-foreground">
                Сводный калькулятор по выбранным операциям и сроку действия тарифа.
              </div>

              <div className="my-4 rounded-2xl border border-[var(--total-border)] bg-[var(--total-bg)] p-4">
                <div className="text-xs text-muted-foreground">
                  Прогноз доходности с учетом скидки (по выбранным)
                </div>
                <div className="mt-1 text-3xl font-extrabold text-brand-green-dark">
                  {formatMoneyRu(b2.sumForecast)}
                </div>
              </div>

              <CalcRow label="Себестоимость на весь срок" value={formatMoneyRu(b2.sumCost)} />
              <CalcRow
                label="Стандартный тариф / текущий доход"
                value={formatMoneyRu(b2.sumIncome)}
              />
              <CalcRow
                label="Запрашиваемый тариф (прогноз)"
                value={formatMoneyRu(b2.sumForecast)}
              />
              <CalcRow label="Прогноз недополученного дохода" value={formatMoneyRu(b2.lost)} />
              <CalcRow
                label="Прогноз рентабельности"
                value={`${b2.profit > 0 ? "+" : ""}${formatMoneyRu(b2.profit)}`}
                tone={profitTone}
              />
              <CalcRow label="Статус рентабельности РКО" value={profitStatus} tone={profitTone} />

              <div className="mt-4 rounded-2xl border border-dashed border-[var(--line)] bg-white p-4">
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

            {/* Блок 3. Обоснование */}
            <section className="min-w-0 rounded-3xl border border-[var(--line)] bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.04)] lg:col-start-1 lg:row-start-3">
              <SectionTitle>Блок 3. Обоснование</SectionTitle>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Краткое обоснование">
                  <Textarea
                    placeholder="Опишите цель, экономический эффект, значимость клиента и причину запрашиваемого отклонения от базовых тарифов"
                    value={briefJustification}
                    onChange={(e) => setBriefJustification(e.target.value)}
                    rows={6}
                  />
                </Field>
                <div>
                  <Field label="Проект решения ТК">
                    <Textarea
                      ref={projectDecisionRef}
                      placeholder="Текст проекта решения"
                      value={projectDecision}
                      onChange={(e) => setProjectDecision(e.target.value)}
                      rows={8}
                    />
                  </Field>
                  <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      PDF формируется в браузере из полей блока 3 и открывается как загрузка по
                      временной ссылке (blob).
                    </p>
                    <button
                      type="button"
                      onClick={handleDownloadProjectPdf}
                      className="shrink-0 text-left text-sm font-semibold text-brand-green-dark underline decoration-2 underline-offset-4 hover:opacity-90"
                    >
                      Скачать PDF «Проект решения ТК»
                    </button>
                  </div>
                  <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Field label="Дата мониторинга">
                      <Input
                        placeholder="Не более 12 месяцев"
                        value={monitoringDate}
                        onChange={(e) => setMonitoringDate(e.target.value)}
                      />
                    </Field>
                    <Field label="Визирующий">
                      <Select
                        value={approver}
                        onChange={(e) => setApprover(e.target.value)}
                      >
                        <option value="">Выбрать согласующего</option>
                        <option value="Заместитель директора филиала">Заместитель директора филиала</option>
                        <option value="Начальник управления РКО">Начальник управления РКО</option>
                        <option value="Директор департамента корпоративного бизнеса">
                          Директор департамента корпоративного бизнеса
                        </option>
                      </Select>
                    </Field>
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-[oklch(0.85_0.08_85)] bg-[oklch(0.99_0.03_85)] p-3.5 text-sm leading-relaxed text-foreground">
                <strong>Маршрут согласования:</strong> руководитель инициатора → секретарь Комитета
                → члены Тарифного комитета. На этапе голосования доступны действия: «За», «Против»,
                «Запросить доп. информацию». При запросе доп. информации создается подзадача
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
        </div>
      </div>
    </div>
  );
}
