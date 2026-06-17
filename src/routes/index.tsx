import { createFileRoute } from "@tanstack/react-router";
import { forwardRef, useEffect, useId, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

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
  netProductIncome: string;
  rko: string;
  doc: string;
  credits: string;
  dealing: string;
  acquiring: string;
  deposits: string;
  currentAccounts: string;
  groupProfit: string;
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
    netProductIncome: "6 590 000 ₸",
    rko: "1 240 000 ₸ / 8.4 млрд ₸",
    doc: "320 000 ₸ / 12 операций",
    credits: "4 200 000 ₸ / 1.8 млрд ₸",
    dealing: "180 000 ₸ / 320 млн ₸",
    acquiring: "—",
    deposits: "1 850 000 ₸",
    currentAccounts: "4.2 млрд ₸",
    groupProfit: "2 430 000 ₸",
    profitability: "38,4%",
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
    netProductIncome: "1 524 000 ₸",
    rko: "320 000 ₸ / 1.2 млрд ₸",
    doc: "—",
    credits: "180 000 ₸ / 80 млн ₸",
    dealing: "—",
    acquiring: "240 000 ₸ / 380 млн ₸",
    deposits: "120 000 ₸",
    currentAccounts: "280 млн ₸",
    groupProfit: "884 000 ₸",
    profitability: "22,7%",
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
  netProductIncome: "",
  rko: "",
  doc: "",
  credits: "",
  dealing: "",
  acquiring: "",
  deposits: "",
  currentAccounts: "",
  groupProfit: "—",
  profitability: "—",
};

// ========================= APP FLOW =========================
type Screen = "reviewQuestion" | "iin" | "form";
type ApprovalFlowStage =
  | "initiator"
  | "manager"
  | "secretary"
  | "committee"
  | "committeeInPerson"
  | "extraInfoRequest"
  | "clientApproval"
  | "opsSetup"
  | "applicationTimeline";
type ApproveAction = "initiator" | "manager" | "secretary" | "committee" | "clientApproval";

const APPROVAL_FLOW_STAGES: { id: ApprovalFlowStage; label: string }[] = [
  { id: "initiator", label: "Инициатор" },
  { id: "manager", label: "Руководитель инициатора" },
  { id: "secretary", label: "Секретарь Комитета" },
  { id: "committee", label: "Член ТК" },
  { id: "extraInfoRequest", label: "Запрос доп. сведений" },
  { id: "clientApproval", label: "Согласование с клиентом" },
  { id: "opsSetup", label: "Установка тарифов" },
  { id: "applicationTimeline", label: "История заявки" },
  { id: "committeeInPerson", label: "Очное рассмотрение" },
];

/** Вопрос, для которого в прототипе включён полный маршрут ТК (текущий прототип). */
const INITIATOR_NEW_PROTOTYPE_QUESTION =
  "Установление индивидуального тарифа комиссионного вознаграждения";

const INITIATOR_REVIEW_QUESTION_OPTIONS: { value: string; label: string }[] = [
  {
    value:
      "Внесение изменений в действующие (в сетку) тарифы на банковское обслуживание ( ЮЛ, ФЛ и др.)",
    label:
      "Внесение изменений в действующие (в сетку) тарифы на банковское обслуживание ( ЮЛ, ФЛ и др.)",
  },
  { value: INITIATOR_NEW_PROTOTYPE_QUESTION, label: INITIATOR_NEW_PROTOTYPE_QUESTION },
  {
    value: "Возврат/списание/аннулирование комиссии клиентам Банка",
    label: "Возврат/списание/аннулирование комиссии клиентам Банка",
  },
  {
    value: "ЮЛ Мониторинговый отчет по установленным тарифам",
    label: "ЮЛ Мониторинговый отчет по установленным тарифам",
  },
  {
    value: "Прочие вопросы ТК, не вошедшие в основной перечень",
    label: "Прочие вопросы ТК, не вошедшие в основной перечень",
  },
];

/** Демо ФИО для автозаполнения списка членов ТК на этапе секретаря */
const DEMO_COMMITTEE_MEMBER_FIOS = [
  "Нурланов А.Р.",
  "Серикова Д.Е.",
  "Алдабергенов К.С.",
  "Ибраева М.Н.",
  "Омаров Т.Б.",
  "Жумабекова Г.Д.",
  "Касымов Е.Л.",
  "Бектаева А.У.",
  "Тулегенов Н.К.",
  "Жолдасбаев С.Т.",
] as const;

function randomCommitteeMemberFios(count: number): string[] {
  const pool = [...DEMO_COMMITTEE_MEMBER_FIOS];
  const out: string[] = [];
  for (let i = 0; i < count && pool.length > 0; i++) {
    const j = Math.floor(Math.random() * pool.length);
    out.push(pool.splice(j, 1)[0]!);
  }
  while (out.length < count) {
    out.push(`Член ТК — ${out.length + 1}`);
  }
  return out;
}

function GlobalFlowStageBar({
  screen,
  iinStepApplicable,
  flowStage,
  setFlowStage,
  onGoQuestion,
  onGoIin,
  onFormBack,
  onLogout,
}: {
  screen: "reviewQuestion" | "iin" | "form";
  iinStepApplicable: boolean;
  flowStage: ApprovalFlowStage;
  setFlowStage: (s: ApprovalFlowStage) => void;
  onGoQuestion: () => void;
  onGoIin: () => void;
  onFormBack: () => void;
  onLogout: () => void;
}) {
  const pill = (active: boolean, disabled?: boolean) =>
    `rounded-xl border px-3 py-1.5 text-xs shadow-sm transition-colors ${
      disabled
        ? "cursor-not-allowed border-[var(--line)] bg-muted text-muted-foreground opacity-55"
        : active
          ? "border-brand-green bg-brand-green text-white"
          : "border-[var(--line)] bg-white text-foreground hover:bg-surface-soft"
    }`;

  const approvalLocked = screen !== "form";

  return (
    <div className="sticky top-0 z-40 border-b border-[var(--line)] bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex min-h-0 max-w-[1440px] flex-wrap items-center justify-between gap-2 px-6 py-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onGoQuestion}
            className={pill(screen === "reviewQuestion")}
          >
            Вопрос
          </button>
          <button
            type="button"
            disabled={!iinStepApplicable}
            onClick={() => iinStepApplicable && onGoIin()}
            className={pill(screen === "iin", !iinStepApplicable)}
          >
            ИИН / БИН
          </button>
          <span className="mx-0.5 hidden h-5 w-px shrink-0 bg-[var(--line)] sm:block" aria-hidden />
          {APPROVAL_FLOW_STAGES.map((stage) => {
            const active = screen === "form" && flowStage === stage.id;
            return (
              <button
                key={stage.id}
                type="button"
                disabled={approvalLocked}
                onClick={() => !approvalLocked && setFlowStage(stage.id)}
                className={pill(active, approvalLocked)}
              >
                {stage.label}
              </button>
            );
          })}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {screen === "form" && (
            <button
              type="button"
              onClick={onFormBack}
              className="rounded-xl border border-[var(--line)] bg-white px-3 py-1.5 text-xs text-foreground shadow-sm transition-colors hover:bg-surface-soft"
            >
              ← Назад
            </button>
          )}
          <button
            type="button"
            onClick={onLogout}
            className="rounded-xl border border-[var(--line)] bg-white px-3 py-1.5 text-xs text-muted-foreground shadow-sm transition-colors hover:bg-surface-soft"
          >
            Выйти
          </button>
        </div>
      </div>
    </div>
  );
}

function AppFlow() {
  const [screen, setScreen] = useState<Screen>("reviewQuestion");
  const [client, setClient] = useState<ClientData>(EMPTY_CLIENT);
  const [readOnly, setReadOnly] = useState(false);
  const [chosenReviewQuestion, setChosenReviewQuestion] = useState("");
  const [formEntryPath, setFormEntryPath] = useState<"iin" | "question" | null>(null);
  const [flowStage, setFlowStage] = useState<ApprovalFlowStage>("initiator");
  const [iinStepApplicable, setIinStepApplicable] = useState(false);

  const handleReviewQuestionContinue = (question: string) => {
    setChosenReviewQuestion(question);
    setFlowStage("initiator");
    if (question === INITIATOR_NEW_PROTOTYPE_QUESTION) {
      setIinStepApplicable(true);
      setFormEntryPath("iin");
      setClient(EMPTY_CLIENT);
      setReadOnly(false);
      setScreen("iin");
    } else {
      setIinStepApplicable(false);
      setFormEntryPath("question");
      setClient(EMPTY_CLIENT);
      setReadOnly(false);
      setScreen("form");
    }
  };

  const handleIinSubmit = (iin: string) => {
    const found = MOCK_CLIENTS[iin];
    if (found) {
      setClient(found);
      setReadOnly(true);
    } else {
      setClient({ ...EMPTY_CLIENT, iinBin: iin, category: "new" });
      setReadOnly(false);
    }
    setFormEntryPath("iin");
    setScreen("form");
  };

  const handleLogout = () => {
    setScreen("reviewQuestion");
    setClient(EMPTY_CLIENT);
    setReadOnly(false);
    setChosenReviewQuestion("");
    setFormEntryPath(null);
    setFlowStage("initiator");
    setIinStepApplicable(false);
  };

  const handleTopGoQuestion = () => {
    setClient(EMPTY_CLIENT);
    setReadOnly(false);
    setChosenReviewQuestion("");
    setFormEntryPath(null);
    setFlowStage("initiator");
    setIinStepApplicable(false);
    setScreen("reviewQuestion");
  };

  const handleTopGoIin = () => {
    if (!iinStepApplicable) return;
    if (screen === "iin") return;
    setScreen("iin");
  };

  const handleBackFromForm = () => {
    if (formEntryPath === "iin") {
      setClient(EMPTY_CLIENT);
      setReadOnly(false);
      setChosenReviewQuestion("");
      setFormEntryPath(null);
      setScreen("iin");
    } else {
      setClient(EMPTY_CLIENT);
      setReadOnly(false);
      setChosenReviewQuestion("");
      setFormEntryPath(null);
      setIinStepApplicable(false);
      setScreen("reviewQuestion");
    }
  };

  const handleBackToQuestionFromIin = () => {
    setClient(EMPTY_CLIENT);
    setReadOnly(false);
    setChosenReviewQuestion("");
    setFormEntryPath(null);
    setIinStepApplicable(false);
    setScreen("reviewQuestion");
  };

  const flowBarScreen: "reviewQuestion" | "iin" | "form" =
    screen === "reviewQuestion" ? "reviewQuestion" : screen === "iin" ? "iin" : "form";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {screen !== "reviewQuestion" && (
        <GlobalFlowStageBar
          screen={flowBarScreen}
          iinStepApplicable={iinStepApplicable}
          flowStage={flowStage}
          setFlowStage={setFlowStage}
          onGoQuestion={handleTopGoQuestion}
          onGoIin={handleTopGoIin}
          onFormBack={handleBackFromForm}
          onLogout={handleLogout}
        />
      )}
      <div className="flex min-h-0 flex-1 flex-col">
        {screen === "reviewQuestion" && (
          <ReviewQuestionScreen onContinue={handleReviewQuestionContinue} />
        )}
        {screen === "iin" && (
          <IinScreen onSubmit={handleIinSubmit} onBackToQuestion={handleBackToQuestionFromIin} />
        )}
        {screen === "form" && (
          <TariffRequestPage
            client={client}
            readOnly={readOnly}
            initialReviewQuestion={chosenReviewQuestion}
            flowStage={flowStage}
            setFlowStage={setFlowStage}
          />
        )}
      </div>
    </div>
  );
}

/** Демо-реквизиты заявки на главном экране выбора вопроса */
const REVIEW_QUESTION_LANDING_INITIATOR_FIO = "Карманова Альбина";
const REVIEW_QUESTION_LANDING_REQUEST_NO = "9001561977378";
const REVIEW_QUESTION_LANDING_LAUNCH_AT = "14.05.2026, 10:15";

function ReviewLandingStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--line)]/80 bg-white/90 px-5 py-4 text-left shadow-[0_8px_30px_rgba(15,23,42,0.06)] backdrop-blur-sm transition-shadow hover:shadow-[0_12px_36px_rgba(15,23,42,0.08)]">
      <div className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-2 break-words text-lg font-semibold leading-snug tracking-tight text-foreground">
        {value}
      </div>
    </div>
  );
}

// ========================= SCREEN: QUESTION (before initiator / BIN) =========================
function ReviewQuestionScreen({ onContinue }: { onContinue: (question: string) => void }) {
  const [question, setQuestion] = useState("");

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background">
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 py-8 md:py-12">
        <div className="overflow-hidden rounded-3xl border border-[var(--line)] bg-white shadow-[0_24px_56px_rgba(15,23,42,0.1)]">
          <div className="relative overflow-hidden bg-gradient-to-br from-[oklch(0.995_0.02_145)] via-white to-[oklch(0.96_0.035_155)] px-6 pb-10 pt-10 md:px-10 md:pb-12 md:pt-12">
            <div
              className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-brand-green/12 blur-3xl"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -bottom-16 -left-12 h-48 w-48 rounded-full bg-[oklch(0.92_0.06_200)]/25 blur-2xl"
              aria-hidden
            />
            <div className="relative text-center">
              <h1 className="text-[clamp(1.75rem,5vw,3.25rem)] font-black uppercase leading-[1.05] tracking-[0.06em] text-foreground">
                Тарифный комитет
              </h1>
              <div className="mx-auto mt-6 h-1 w-24 rounded-full bg-brand-green" aria-hidden />
              <div className="mx-auto mt-8 grid max-w-3xl grid-cols-1 gap-4 text-left sm:grid-cols-3 sm:gap-5">
                <ReviewLandingStat label="ФИО инициатора" value={REVIEW_QUESTION_LANDING_INITIATOR_FIO} />
                <ReviewLandingStat
                  label="Номер сгенерированной заявки"
                  value={REVIEW_QUESTION_LANDING_REQUEST_NO}
                />
                <ReviewLandingStat label="Дата запуска заявки" value={REVIEW_QUESTION_LANDING_LAUNCH_AT} />
              </div>
            </div>
          </div>

          <div className="border-t border-[var(--line)] bg-white px-6 py-8 md:px-10 md:py-9">
            <div className="mb-6 flex items-start gap-3">
              <BlockHeadingAccent size="screen" />
              <p className="min-w-0 text-sm leading-relaxed text-muted-foreground">
                Если выбрано «{INITIATOR_NEW_PROTOTYPE_QUESTION}», далее укажите ИИН/БИН — для
                действующего клиента данные подтянутся на этапе инициатора. Для остальных вопросов
                откроется классический сценарий без ввода БИН на этом шаге.
              </p>
            </div>
            <Field
              label="Вопрос на рассмотрение"
              labelClassName="mb-2 text-sm font-semibold text-foreground"
            >
              <Select value={question} onChange={(e) => setQuestion(e.target.value)}>
                <option value="">Выберите вопрос</option>
                {INITIATOR_REVIEW_QUESTION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="mt-8 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                disabled={!question.trim()}
                onClick={() => onContinue(question.trim())}
                className="min-w-[200px] rounded-2xl border-none bg-brand-green px-6 py-3.5 text-[15px] font-bold text-white shadow-[0_8px_24px_rgba(22,101,52,0.35)] transition-[opacity,transform] hover:opacity-95 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none"
              >
                Продолжить
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ========================= SCREEN: IIN =========================
function IinScreen({
  onSubmit,
  onBackToQuestion,
}: {
  onSubmit: (iin: string) => void;
  onBackToQuestion?: () => void;
}) {
  const myMockRequests = [
    {
      id: "100347604082",
      client: "ТОО Яблочко",
      iinBin: "123456789012",
      stage: "Член ТК",
      createdAt: "10.03.2026",
      amount: "2 500 000 ₸",
    },
    {
      id: "100347604091",
      client: "ИП Саматова А.Б.",
      iinBin: "987654321098",
      stage: "Согласование с клиентом",
      createdAt: "14.03.2026",
      amount: "780 000 ₸",
    },
    {
      id: "100347604109",
      client: "ТОО TechImport",
      iinBin: "554433221100",
      stage: "Установка тарифов",
      createdAt: "18.03.2026",
      amount: "1 200 000 ₸",
    },
  ] as const;
  const [iin, setIin] = useState("");
  const [error, setError] = useState("");
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [activeIinPage, setActiveIinPage] = useState<"search" | "requests" | "requestDetails">("search");
  const selectedRequest = myMockRequests.find((item) => item.id === selectedRequestId) ?? null;

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
    <div className="flex min-h-0 flex-1 flex-col bg-background">
      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-64 shrink-0 border-r border-[var(--line)] bg-white px-4 py-5 md:block">
          <div className="mb-8 flex items-center gap-3">
            <div className="h-10 w-10 shrink-0 rounded-xl bg-brand-green" />
            <div className="text-sm font-semibold text-foreground">Тарифный комитет</div>
          </div>
          <nav>
            <button
              type="button"
              onClick={() => setActiveIinPage("requests")}
              className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm font-semibold transition-colors ${
                activeIinPage === "requests"
                  ? "border-[var(--line)] bg-surface-soft text-foreground"
                  : "border-[var(--line)] bg-white text-muted-foreground hover:bg-surface-soft"
              }`}
            >
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-md border border-[var(--line)] bg-white text-[11px] leading-none">
                📄
              </span>
              <span>Мои заявки</span>
            </button>
          </nav>
          {onBackToQuestion && (
            <button
              type="button"
              onClick={onBackToQuestion}
              className="mt-3 w-full rounded-xl border border-dashed border-[var(--line)] bg-white px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-surface-soft"
            >
              К выбору вопроса
            </button>
          )}
        </aside>

        <main className="flex min-w-0 flex-1 items-center justify-center px-4 py-8 md:px-8">
          <div
            className={`w-full rounded-3xl border border-[var(--line)] bg-white p-8 shadow-[0_20px_48px_rgba(15,23,42,0.08)] ${
              activeIinPage === "requests" ? "max-w-[860px]" : "max-w-[520px]"
            }`}
          >
            {activeIinPage === "search" ? (
              <>
                <div className="mb-6 flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <BlockHeadingAccent size="screen" />
                    <div className="h-12 w-12 shrink-0 rounded-2xl bg-brand-green" />
                    <div className="min-w-0">
                      <div className="text-[20px] font-semibold leading-tight">Поиск клиента</div>
                      <div className="text-xs text-muted-foreground">
                        Введите ИИН / БИН. Для действующего клиента в базе данные подтянутся на этапе
                        инициатора.
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5 self-start sm:flex-row sm:items-center">
                    {onBackToQuestion && (
                      <button
                        type="button"
                        onClick={onBackToQuestion}
                        className="rounded-xl border border-dashed border-[var(--line)] bg-white px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-surface-soft md:hidden"
                      >
                        К вопросу
                      </button>
                    )}
                  </div>
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
              </>
            ) : activeIinPage === "requests" ? (
              <>
                <div className="mb-6 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <BlockHeadingAccent size="screen" />
                    <div className="min-w-0">
                      <div className="text-[20px] font-semibold leading-tight">Мои заявки</div>
                      <div className="text-xs text-muted-foreground">Выберите заявку для просмотра деталей</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveIinPage("search")}
                    className="rounded-xl border border-[var(--line)] bg-white px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-surface-soft"
                  >
                    К поиску
                  </button>
                </div>
                <div className="space-y-2.5">
                  {myMockRequests.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setSelectedRequestId(item.id);
                        setActiveIinPage("requestDetails");
                      }}
                      className="w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-left transition-colors hover:bg-surface-soft"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="text-sm font-semibold text-foreground">№ {item.id}</div>
                        <div className="text-xs text-muted-foreground">{item.createdAt}</div>
                      </div>
                      <div className="mt-1 text-sm text-foreground">{item.client}</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        ИИН/БИН: {item.iinBin} · Этап: {item.stage}
                      </div>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="mb-6 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <BlockHeadingAccent size="screen" />
                    <div className="min-w-0">
                      <div className="text-[20px] font-semibold leading-tight">Детальная страница заявки</div>
                      <div className="text-xs text-muted-foreground">№ {selectedRequest?.id ?? "—"}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveIinPage("requests")}
                    className="rounded-xl border border-[var(--line)] bg-white px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-surface-soft"
                  >
                    К списку
                  </button>
                </div>
                {selectedRequest && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div className="rounded-xl border border-[var(--line)] bg-muted px-3 py-2.5">
                        <div className="text-xs text-muted-foreground">Клиент</div>
                        <div className="text-sm font-semibold text-foreground">{selectedRequest.client}</div>
                      </div>
                      <div className="rounded-xl border border-[var(--line)] bg-muted px-3 py-2.5">
                        <div className="text-xs text-muted-foreground">ИИН / БИН</div>
                        <div className="font-mono text-sm text-foreground">{selectedRequest.iinBin}</div>
                      </div>
                      <div className="rounded-xl border border-[var(--line)] bg-muted px-3 py-2.5">
                        <div className="text-xs text-muted-foreground">Текущий этап</div>
                        <div className="text-sm font-semibold text-foreground">{selectedRequest.stage}</div>
                      </div>
                      <div className="rounded-xl border border-[var(--line)] bg-muted px-3 py-2.5">
                        <div className="text-xs text-muted-foreground">Сумма запроса</div>
                        <div className="text-sm font-semibold text-foreground">{selectedRequest.amount}</div>
                      </div>
                      <div className="rounded-xl border border-[var(--line)] bg-muted px-3 py-2.5 md:col-span-2">
                        <div className="text-xs text-muted-foreground">Дата создания</div>
                        <div className="text-sm font-semibold text-foreground">{selectedRequest.createdAt}</div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-[var(--line)] bg-white p-4">
                      <div className="mb-3 text-sm font-semibold text-foreground">Отчет заявки</div>
                      <div className="overflow-hidden rounded-xl border border-[var(--line)]">
                        <table className="w-full border-collapse text-sm">
                          <thead className="bg-muted text-foreground">
                            <tr>
                              <th className="border-b border-[var(--line)] px-3 py-2 text-left font-semibold">
                                Операция
                              </th>
                              <th className="border-b border-[var(--line)] px-3 py-2 text-left font-semibold">
                                Базовый тариф
                              </th>
                              <th className="border-b border-[var(--line)] px-3 py-2 text-left font-semibold">
                                Запрошенный тариф
                              </th>
                              <th className="border-b border-[var(--line)] px-3 py-2 text-left font-semibold">
                                Статус
                              </th>
                              <th className="border-b border-[var(--line)] px-3 py-2 text-left font-semibold">
                                Комментарий
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="bg-white">
                              <td className="border-b border-[var(--line)] px-3 py-2">РКО абонплата</td>
                              <td className="border-b border-[var(--line)] px-3 py-2">350 000 ₸</td>
                              <td className="border-b border-[var(--line)] px-3 py-2">250 000 ₸</td>
                              <td className="border-b border-[var(--line)] px-3 py-2">Согласовано</td>
                              <td className="border-b border-[var(--line)] px-3 py-2">
                                Утверждено по решению ТК
                              </td>
                            </tr>
                            <tr className="bg-white">
                              <td className="border-b border-[var(--line)] px-3 py-2">Переводы KZT</td>
                              <td className="border-b border-[var(--line)] px-3 py-2">0.20%</td>
                              <td className="border-b border-[var(--line)] px-3 py-2">0.15%</td>
                              <td className="border-b border-[var(--line)] px-3 py-2">На установке</td>
                              <td className="border-b border-[var(--line)] px-3 py-2">
                                Передано в Операционный департамент
                              </td>
                            </tr>
                            <tr className="bg-white">
                              <td className="px-3 py-2">Обслуживание POS</td>
                              <td className="px-3 py-2">1.8%</td>
                              <td className="px-3 py-2">1.6%</td>
                              <td className="px-3 py-2">Согласовано</td>
                              <td className="px-3 py-2">Срок действия 12 месяцев</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
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

function Field({
  label,
  children,
  className,
  labelClassName,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
  labelClassName?: string;
}) {
  return (
    <div className={className}>
      <label className={`mb-2 block text-xs text-muted-foreground ${labelClassName ?? ""}`}>{label}</label>
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

/** Первая часть строки ФИО — для сортировки и акцента на фамилию */
function fioSurnameAndRest(fio: string): { surname: string; rest: string } {
  const t = fio.trim().replace(/\s+/g, " ");
  if (!t) return { surname: "", rest: "" };
  const i = t.indexOf(" ");
  if (i === -1) return { surname: t, rest: "" };
  return { surname: t.slice(0, i), rest: t.slice(i) };
}

function SearchTagField({
  values,
  onChange,
  options,
  placeholder,
  description,
  selectedCaption,
}: {
  values: string[];
  onChange: (next: string[]) => void;
  options: string[];
  placeholder: string;
  description?: string;
  selectedCaption?: string;
}) {
  const [query, setQuery] = useState("");

  const availableSorted = useMemo(
    () =>
      [...options]
        .filter((o) => !values.includes(o))
        .sort((a, b) =>
          fioSurnameAndRest(a).surname.localeCompare(fioSurnameAndRest(b).surname, "ru", {
            sensitivity: "base",
          }),
        ),
    [options, values],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return availableSorted.filter((opt) => opt.toLowerCase().includes(q));
  }, [availableSorted, query]);

  const queryTrim = query.trim();
  const showSearchHints = queryTrim.length > 0;

  return (
    <div className="space-y-3">
      {description ? (
        <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
      ) : null}

      <div>
        <label className="mb-2 block text-xs font-medium text-foreground">
          Поиск по фамилии или полному ФИО
        </label>
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          aria-label="Поиск сотрудника по фамилии или ФИО"
        />
      </div>

      {!showSearchHints ? (
        <p className="text-sm text-muted-foreground">
          Начните вводить фамилию или имя — ниже появятся подходящие сотрудники из справочника.
        </p>
      ) : filtered.length > 0 ? (
        <div>
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Совпадения по запросу
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {filtered.map((opt) => {
              const { surname, rest } = fioSurnameAndRest(opt);
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    onChange([...values, opt]);
                    setQuery("");
                  }}
                  className="rounded-xl border border-[var(--line)] bg-white px-3.5 py-2.5 text-left text-sm shadow-sm transition-colors hover:border-brand-green hover:bg-[oklch(0.99_0.02_145)]"
                >
                  <span className="font-bold text-foreground">{surname}</span>
                  {rest ? <span className="text-muted-foreground">{rest}</span> : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-[var(--line)] bg-surface-soft px-3 py-2.5 text-sm text-muted-foreground">
          По запросу «{queryTrim}» никого не найдено. Проверьте написание или введите другую фамилию.
        </p>
      )}

      {availableSorted.length === 0 && values.length > 0 ? (
        <p className="text-sm text-muted-foreground">Все сотрудники из справочника уже добавлены.</p>
      ) : null}

      {values.length > 0 ? (
        <div>
          {selectedCaption ? (
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {selectedCaption}
            </div>
          ) : null}
          <div className="flex flex-wrap gap-2">
            {values.map((v) => {
              const { surname, rest } = fioSurnameAndRest(v);
              return (
                <span
                  key={v}
                  className="inline-flex items-center gap-2 rounded-xl border border-[oklch(0.85_0.06_145)] bg-[oklch(0.97_0.02_145)] px-3 py-1.5 text-sm text-foreground"
                >
                  <span>
                    <span className="font-bold">{surname}</span>
                    {rest ? <span className="text-muted-foreground">{rest}</span> : null}
                  </span>
                  <button
                    type="button"
                    onClick={() => onChange(values.filter((x) => x !== v))}
                    className="rounded-md px-1 text-muted-foreground hover:bg-white/80 hover:text-foreground"
                    aria-label={`Убрать ${v}`}
                  >
                    ×
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
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

/** Демо-текст колонки «текущий тариф» на этапе инициатора (по базовой ячейке категории) */
function initiatorCurrentTariffCell(r: Block2RowComputed): string {
  if (r.row.isSection) return "";
  const base = r.baseStr.trim();
  if (!base || base === "—") return "—";
  return `${base} (действующий по договору)`;
}

/** Пустое или нечисловое поле при расчёте трактуем как минимум 1% */
function parseDiscountPercentInput(raw: string): number {
  const t = raw.trim().replace(",", ".");
  if (t === "") return 1;
  const n = Number(t);
  if (!Number.isFinite(n)) return 20;
  const clamped = Math.min(100, Math.max(1, n));
  return Math.round(clamped * 100) / 100;
}

function computeBlock2TariffState(
  tariffCategory: TariffCategory,
  validityMonths: 3 | 6 | 12,
  discountInput: string,
  selected: Record<string, boolean>,
  rowDiscountInputs: Record<string, string>,
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
      const rowDiscountRaw = rowDiscountInputs[row.rowKey] ?? "";
      const rowDiscount = rowDiscountRaw.trim() === "" ? clampedDiscount : parseDiscountPercentInput(rowDiscountRaw);
      discountCol = `${rowDiscount}%`;
      if (cellForMath) {
        const d = applyDiscountToTariff(cellForMath, rowDiscount);
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
      forecastNum = Math.round((row.incomeTenge * (100 - rowDiscount)) / 100);
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
  initialReviewQuestion,
  flowStage,
  setFlowStage,
}: {
  client: ClientData;
  readOnly: boolean;
  initialReviewQuestion: string;
  flowStage: ApprovalFlowStage;
  setFlowStage: (s: ApprovalFlowStage) => void;
}) {
  const [tariffCategory, setTariffCategory] = useState<TariffCategory>("A");
  const [validityMonths, setValidityMonths] = useState<3 | 6 | 12>(12);
  const [discountInput, setDiscountInput] = useState("");
  const [rowDiscountInputs, setRowDiscountInputs] = useState<Record<string, string>>({});
  const [collapsedTariffSections, setCollapsedTariffSections] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      STANDARD_TARIFF_ROWS.filter((row) => row.isSection).map((row, idx) => [row.rowKey, idx !== 0]),
    ),
  );
  const [selected, setSelected] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(TARIFF_SELECTABLE_ROW_KEYS.map((k) => [k, false])),
  );
  const [isInitiatorSubmitted, setIsInitiatorSubmitted] = useState(false);
  const [approveAction, setApproveAction] = useState<ApproveAction | null>(null);
  const [showManagerReworkModal, setShowManagerReworkModal] = useState(false);
  const [managerReworkReason, setManagerReworkReason] = useState("");
  const [showExtraInfoModal, setShowExtraInfoModal] = useState(false);
  const [showInPersonReviewModal, setShowInPersonReviewModal] = useState(false);
  const [extraInfoReason, setExtraInfoReason] = useState("");
  const [extraInfoResponseText, setExtraInfoResponseText] = useState("");
  const [lastCommitteeRequestText, setLastCommitteeRequestText] = useState("");
  const [clientNegotiationComment, setClientNegotiationComment] = useState("");
  const [reviewQuestion] = useState(initialReviewQuestion);
  const initiatorAppMode = useMemo<"new" | "legacy">(
    () => (reviewQuestion.trim() === INITIATOR_NEW_PROTOTYPE_QUESTION ? "new" : "legacy"),
    [reviewQuestion],
  );
  const [briefJustification, setBriefJustification] = useState("");
  const [tariffManualValues, setTariffManualValues] = useState<
    Record<string, { fix?: string; pct?: string; min?: string; max?: string }>
  >({});
  const [projectDecision, setProjectDecision] = useState("");
  const [monitoringDate, setMonitoringDate] = useState("");
  const [responsibleAssignees, setResponsibleAssignees] = useState<string[]>([]);
  const [signatoryVisa, setSignatoryVisa] = useState("");
  const [secretaryChair, setSecretaryChair] = useState("");
  const [secretaryDeputyChair, setSecretaryDeputyChair] = useState("");
  const [secretaryCommitteeMembers, setSecretaryCommitteeMembers] = useState<string[]>(Array(6).fill(""));
  const [secretaryCommitteePanelOpen, setSecretaryCommitteePanelOpen] = useState(false);
  const secretaryCommitteeRandomizedRef = useRef(false);
  const attachmentInputId = useId();
  const [attachments, setAttachments] = useState<{ id: string; file: File; previewUrl?: string }[]>(
    [],
  );
  const foundClientToastIinRef = useRef<string | null>(null);
  const attachmentsRef = useRef(attachments);
  attachmentsRef.current = attachments;

  // === New: Group companies / branches (initiator step) ===
  const [groupCompaniesEnabled, setGroupCompaniesEnabled] = useState(false);
  const [groupCompanies, setGroupCompanies] = useState<
    {
      id: string;
      name: string;
      iinBin: string;
      payroll?: string;
      rko?: string;
      doc?: string;
      credits?: string;
      dealing?: string;
      acquiring?: string;
      deposits?: string;
      currentAccounts?: string;
    }[]
  >([]);

  const addGroupCompany = () => {
    if (groupCompanies.length >= 500) {
      toast.error("Достигнут лимит добавленных компаний (500)");
      return;
    }
    setGroupCompanies((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: "",
        iinBin: "",
      },
    ]);
  };

  const removeGroupCompany = (id: string) => {
    setGroupCompanies((prev) => prev.filter((c) => c.id !== id));
  };

  // Calculate total income for group companies/branches
  const groupCompaniesTotalIncome = useMemo(() => {
    if (!groupCompaniesEnabled || groupCompanies.length === 0) return 0;
    
    const parseIncome = (val?: string): number => {
      if (!val || val.trim() === "" || val === "—") return 0;
      // Extract first number from string like "1 240 000 ₸ / 8.4 млрд ₸" or "92 000 ₸"
      const match = val.match(/[\d\s]+/);
      if (!match) return 0;
      const numStr = match[0].replace(/\s/g, "");
      const num = parseFloat(numStr);
      return isNaN(num) ? 0 : num;
    };

    let total = 0;
    for (const company of groupCompanies) {
      total += parseIncome(company.rko);
      total += parseIncome(company.doc);
      total += parseIncome(company.credits);
      total += parseIncome(company.dealing);
      total += parseIncome(company.acquiring);
      total += parseIncome(company.deposits);
    }
    return total;
  }, [groupCompaniesEnabled, groupCompanies]);

  useEffect(() => {
    return () => {
      for (const a of attachmentsRef.current) {
        if (a.previewUrl) URL.revokeObjectURL(a.previewUrl);
      }
    };
  }, []);

  useEffect(() => {
    if (flowStage !== "secretary" || !secretaryCommitteePanelOpen) return;
    if (secretaryCommitteeRandomizedRef.current) return;
    secretaryCommitteeRandomizedRef.current = true;
    setSecretaryCommitteeMembers(randomCommitteeMemberFios(6));
  }, [flowStage, secretaryCommitteePanelOpen]);

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

  useEffect(() => {
    setRowDiscountInputs((prev) =>
      Object.fromEntries(
        Object.entries(prev).filter(([rowKey, value]) => (selected[rowKey] ?? false) && value.trim() !== ""),
      ),
    );
  }, [selected]);

  useEffect(() => {
    if (readOnly && client.iinBin && foundClientToastIinRef.current !== client.iinBin) {
      foundClientToastIinRef.current = client.iinBin;
      toast.success("Клиент найден в базе", {
        description:
          "Данные подтянуты автоматически из карточки клиента и недоступны для редактирования.",
      });
    }
    if (!readOnly) {
      foundClientToastIinRef.current = null;
    }
  }, [readOnly, client.iinBin]);

  const b2 = useMemo(
    () =>
      computeBlock2TariffState(tariffCategory, validityMonths, discountInput, selected, rowDiscountInputs),
    [tariffCategory, validityMonths, discountInput, selected, rowDiscountInputs],
  );
  const isInitiatorLikeStage =
    flowStage === "initiator" ||
    flowStage === "committeeInPerson" ||
    flowStage === "extraInfoRequest";
  /** Редактирование строк тарифа и скидок по строкам — как на этапе инициатора */
  const block2TariffRowEditLikeInitiator =
    flowStage === "initiator" || flowStage === "extraInfoRequest";
  const isApproverStage = !isInitiatorLikeStage;
  /** Блок 2: обоснование, категория, срок, скидка — только просмотр для согласующих после инициатора */
  const block2InitiatorMetaReadOnly =
    flowStage === "manager" || flowStage === "secretary" || flowStage === "committee";
  const rowsForCurrentStage = useMemo(
    () =>
      isApproverStage
        ? b2.rowsOut.filter((r) => !r.row.isSection && r.sel)
        : b2.rowsOut,
    [isApproverStage, b2.rowsOut],
  );
  const rowsForDisplay = useMemo(() => {
    if (isApproverStage) return rowsForCurrentStage;
    const out: typeof rowsForCurrentStage = [];
    let currentSectionKey: string | null = null;
    let sectionItemIndex = 0;
    for (const r of rowsForCurrentStage) {
      if (r.row.isSection) {
        currentSectionKey = r.row.rowKey;
        sectionItemIndex = 0;
        out.push(r);
        continue;
      }
      sectionItemIndex += 1;
      if (currentSectionKey && collapsedTariffSections[currentSectionKey] && sectionItemIndex > 0) continue;
      out.push(r);
    }
    return out;
  }, [isApproverStage, rowsForCurrentStage, collapsedTariffSections]);
  const hideMainContent = flowStage === "initiator" && isInitiatorSubmitted;
  const isLegacyInitiator =
    (flowStage === "initiator" || flowStage === "extraInfoRequest") && initiatorAppMode === "legacy";
  /** Колонка «Текущий тариф» — как у инициатора в новом процессе; на запросе доп. сведений тоже */
  const showInitiatorCurrentTariffColumn =
    flowStage === "extraInfoRequest" ||
    (flowStage === "initiator" && initiatorAppMode === "new");
  /** Полная форма «Запрашиваемые условия» (категория, срок, скидка, таблица) как у инициатора в новом процессе; на запросе доп. сведений всегда для корректировки */
  const block2FullRequestedConditionsLikeInitiatorNew =
    initiatorAppMode === "new" || flowStage === "extraInfoRequest";

  const profitTone: "pos" | "neg" | undefined =
    b2.profit > 0 ? "pos" : b2.profit < 0 ? "neg" : undefined;
  const profitStatus =
    b2.profit > 0 ? "Положительная" : b2.profit < 0 ? "Отрицательная" : "Нулевая";
  const profitabilityPct = b2.sumForecast !== 0 ? (b2.profit / b2.sumForecast) * 100 : 0;
  const profitabilityPctDisplay = `${profitabilityPct > 0 ? "+" : ""}${formatPctRu(profitabilityPct)}%`;
  const monitoringPlusOneYearRu = (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toLocaleDateString("ru-RU");
  })();
  const hasCommitteeCorrespondence = Boolean(
    lastCommitteeRequestText.trim() || extraInfoResponseText.trim(),
  );

  const handleDownloadProjectPdf = () => {
    void (async () => {
      try {
        const selectedTariffs = b2.rowsOut
          .filter((r) => !r.row.isSection && r.sel)
          .map((r) => ({
            code: r.row.code || "—",
            operation: r.row.name,
            discount: r.discountCol,
            approvedTariff: r.pctStr !== "—" ? `${r.pctStr}${r.minStr !== "—" ? `, мин. ${r.minStr}` : ""}` : r.baseStr,
            forecast: r.forecastStr,
          }));
        await downloadTariffCommitteePdf({
          clientFullName: client.fullName,
          iinBin: client.iinBin,
          briefJustification,
          projectDecision,
          monitoringDate,
          approver: "",
          selectedTariffs,
        });
      } catch (err) {
        console.error(err);
        window.alert("Не удалось сформировать PDF. Проверьте данные и попробуйте снова.");
      }
    })();
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleSecretaryCommitteePanel = () => {
    setSecretaryCommitteePanelOpen((open) => !open);
  };
  const approveActionMeta: Record<ApproveAction, { title: string; description: string }> = {
    initiator: {
      title: "Отправка на согласование",
      description: "Вы уверены, что готовы отправить заявку на согласование?",
    },
    manager: {
      title: "Согласование руководителем инициатора",
      description: "Подтвердите согласование и передачу заявки секретарю Комитета.",
    },
    secretary: {
      title: "Согласование секретарем Комитета",
      description: "Подтвердите согласование и передачу заявки члену Тарифного комитета.",
    },
    committee: {
      title: "Голосование члена ТК",
      description: "Подтвердите решение «За» по данной заявке.",
    },
    clientApproval: {
      title: "Согласование утвержденных условий с клиентом",
      description: "Подтвердите завершение согласования утвержденных условий с клиентом.",
    },
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background">
      <div className="mx-auto min-w-0 max-w-[1440px] flex-1 px-6 pb-6 pt-3">
        {/* Topbar */}
        <header className="flex flex-col items-start justify-between gap-6 rounded-3xl border border-[var(--line)] bg-white px-7 py-6 shadow-[0_8px_24px_rgba(15,23,42,0.05)] lg:flex-row">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 shrink-0 rounded-full bg-[oklch(0.88_0.04_25)]" />
            <div className="min-w-0">
              <h1 className="m-0 text-[30px] font-semibold leading-tight tracking-tight sm:text-[33px]">
                Тарифный комитет
              </h1>
              <div className="text-sm text-muted-foreground sm:text-bold font-semibold">
                <h3>Заочное рассмотрение вопроса</h3>
              </div>
            </div>
          </div>
          <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:w-auto lg:min-w-[620px] lg:grid-cols-3">
            <MetaCard label="ФИО / Табельный номер" value="Тестов Тест Тестович / 00011111" />
            <MetaCard label="Номер заявки" value="100347604082" />
            <MetaCard label="Дата заявки" value="10.03.2026" />
          </div>
        </header>


        {!hideMainContent && !readOnly && client.iinBin && (
          <div className="mt-4 flex items-center gap-2.5 rounded-2xl border border-[oklch(0.85_0.08_85)] bg-[oklch(0.99_0.03_85)] px-4 py-3 text-sm text-foreground">
            <span className="text-lg">⚠</span>
            Клиент не найден в базе. Заполните данные нового клиента вручную.
          </div>
        )}
        {!hideMainContent && (
          <div
            className={`mt-6 grid min-w-0 grid-cols-1 gap-6 lg:items-start ${
              flowStage === "committeeInPerson" ||
              (flowStage === "initiator" && initiatorAppMode === "legacy")
                ? "lg:grid-cols-1"
                : "lg:grid-cols-[minmax(0,1fr)_min(340px,32vw)]"
            }`}
          >
            {/* Block 1 */}
            {flowStage !== "clientApproval" &&
              flowStage !== "opsSetup" &&
              flowStage !== "applicationTimeline" && (
            <section className="min-w-0 rounded-3xl border border-[var(--line)] bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.04)] lg:col-start-1 lg:row-start-1">
              <SectionTitle>Блок 1. Информация о клиенте</SectionTitle>
              <p className="-mt-1.5 mb-4 text-[13px] text-muted-foreground">
                Для действующего клиента данные подтягиваются автоматически из карточки клиента. Для
                нового клиента доступны для ручного ввода.
              </p>

              <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-2">
                <Field label="ИИН / БИН">
                  <Input
                    placeholder="Введите ИИН/БИН"
                    defaultValue={client.iinBin}
                    disabled={readOnly}
                  />
                </Field>
                <Field label="Текущая тарифная категория">
                  <Input
                    readOnly
                    disabled={readOnly}
                    defaultValue="Тарифная категория D"
                    aria-label="Текущая тарифная категория"
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

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
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
                <Field label="Обслуживающая страховая компания">
                  <Input
                    placeholder="Выбрать из справочника"
                    defaultValue={client.insurance}
                    disabled={readOnly}
                  />
                </Field>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Field label="Чистый доход по продуктам">
                  <Input
                    placeholder="Доход / объем"
                    defaultValue={client.netProductIncome}
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
                <Field label="Депозиты">
                  <Input
                    placeholder="Доход"
                    defaultValue={client.deposits}
                    disabled={readOnly}
                  />
                </Field>
                <Field label="Остатки на текущих счетах">
                  <Input
                    placeholder="Остаток"
                    defaultValue={client.currentAccounts}
                    disabled={readOnly}
                  />
                </Field>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <InfoBox k="Доходность по группе" v={client.groupProfit} />
                <InfoBox
                  k="Рентабельность клиента"
                  v={client.profitability}
                  tone={
                    client.profitability !== "—" && !client.profitability.startsWith("-")
                      ? "pos"
                      : client.profitability.startsWith("-")
                        ? "neg"
                        : undefined
                  }
                />
              </div>

              {/* New: Group companies / branches control (инициатор) */}
              <div className="mt-6 border-t pt-4">
                <Field label="Группа компаний / филиалов">
                  <div className="flex items-center gap-3">
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="radio"
                        name="groupCompanies"
                        checked={!groupCompaniesEnabled}
                        onChange={() => setGroupCompaniesEnabled(false)}
                        className="h-4 w-4"
                      />
                      <span className="text-sm text-foreground">Нет</span>
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="radio"
                        name="groupCompanies"
                        checked={groupCompaniesEnabled}
                        onChange={() => setGroupCompaniesEnabled(true)}
                        className="h-4 w-4"
                      />
                      <span className="text-sm text-foreground">Да</span>
                    </label>
                  </div>
                </Field>

                {groupCompaniesEnabled && (
                  <div className="mt-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">Добавьте компании или филиалы вручную</div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={addGroupCompany}
                          disabled={groupCompanies.length >= 500}
                          className="rounded-full border border-[var(--line)] bg-white px-3 py-1.5 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-surface-soft"
                          title="Добавить компанию / филиал"
                        >
                          +
                        </button>
                        <div className="text-xs text-muted-foreground">{groupCompanies.length} / 500</div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {groupCompanies.map((c, idx) => (
                        <div key={c.id} className="rounded-2xl border border-[var(--line)] bg-white p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="mb-2 text-xs text-muted-foreground">Компания / Филиал #{idx + 1}</div>
                              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                                <Input
                                  placeholder="Наименование"
                                  value={c.name}
                                  onChange={(e) =>
                                    setGroupCompanies((prev) => prev.map((p) => (p.id === c.id ? { ...p, name: e.target.value } : p)))
                                  }
                                />
                                <Input
                                  placeholder="ИИН/БИН"
                                  value={c.iinBin}
                                  onChange={(e) =>
                                    setGroupCompanies((prev) => prev.map((p) => (p.id === c.id ? { ...p, iinBin: e.target.value.replace(/\D/g, "").slice(0, 12) } : p)))
                                  }
                                />
                                <div className="flex items-center justify-end md:justify-start">
                                  <button
                                    type="button"
                                    onClick={() => removeGroupCompany(c.id)}
                                    className="rounded-md px-2 py-1 text-sm text-muted-foreground hover:bg-surface-soft"
                                  >
                                    Удалить
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                            <Input
                              placeholder="Ежемесячный фонд заработной платы"
                              value={c.payroll ?? ""}
                              onChange={(e) =>
                                setGroupCompanies((prev) => prev.map((p) => (p.id === c.id ? { ...p, payroll: e.target.value } : p)))
                              }
                            />
                            <Input
                              placeholder="РКО (Доход / объем)"
                              value={c.rko ?? ""}
                              onChange={(e) =>
                                setGroupCompanies((prev) => prev.map((p) => (p.id === c.id ? { ...p, rko: e.target.value } : p)))
                              }
                            />
                            <Input
                              placeholder="Документарные операции"
                              value={c.doc ?? ""}
                              onChange={(e) =>
                                setGroupCompanies((prev) => prev.map((p) => (p.id === c.id ? { ...p, doc: e.target.value } : p)))
                              }
                            />
                          </div>

                          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                            <Input
                              placeholder="Кредиты"
                              value={c.credits ?? ""}
                              onChange={(e) =>
                                setGroupCompanies((prev) => prev.map((p) => (p.id === c.id ? { ...p, credits: e.target.value } : p)))
                              }
                            />
                            <Input
                              placeholder="Дилинг"
                              value={c.dealing ?? ""}
                              onChange={(e) =>
                                setGroupCompanies((prev) => prev.map((p) => (p.id === c.id ? { ...p, dealing: e.target.value } : p)))
                              }
                            />
                            <Input
                              placeholder="Эквайринг"
                              value={c.acquiring ?? ""}
                              onChange={(e) =>
                                setGroupCompanies((prev) => prev.map((p) => (p.id === c.id ? { ...p, acquiring: e.target.value } : p)))
                              }
                            />
                          </div>

                          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                            <Input
                              placeholder="Депозиты"
                              value={c.deposits ?? ""}
                              onChange={(e) =>
                                setGroupCompanies((prev) => prev.map((p) => (p.id === c.id ? { ...p, deposits: e.target.value } : p)))
                              }
                            />
                            <Input
                              placeholder="Остатки на текущих счетах"
                              value={c.currentAccounts ?? ""}
                              onChange={(e) =>
                                setGroupCompanies((prev) => prev.map((p) => (p.id === c.id ? { ...p, currentAccounts: e.target.value } : p)))
                              }
                            />
                            <div />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}              </div>
            </section>
            )}

            {flowStage === "committeeInPerson" && (
              <section className="min-w-0 rounded-3xl border border-[var(--line)] bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.04)] lg:col-start-1 lg:row-start-2">
                <SectionTitle>Решение Тарифного комитета</SectionTitle>
                <div className="mt-4 rounded-2xl border border-brand-green/35 bg-brand-green/12 px-5 py-4">
                  <p className="text-xl font-medium leading-relaxed text-brand-green-dark">
                    Тарифным коммитетом принято решение об очном рассмотрении вопроса.
                  </p>
                </div>
              </section>
            )}

            {/* Block 2 */}
            {flowStage !== "clientApproval" &&
              flowStage !== "opsSetup" &&
              flowStage !== "applicationTimeline" &&
              flowStage !== "committeeInPerson" && (
            <section className="min-w-0 rounded-3xl border border-[var(--line)] bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.04)] lg:col-start-1 lg:row-start-2">
              <>
                  <SectionTitle>Блок 2. Запрашиваемые условия</SectionTitle>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Field label="Обоснование" className="md:col-span-2">
                      <Textarea
                        placeholder="Опишите цель, экономический эффект, значимость клиента и причину запрашиваемого отклонения от базовых тарифов"
                        value={briefJustification}
                        onChange={(e) => setBriefJustification(e.target.value)}
                        rows={6}
                        disabled={block2InitiatorMetaReadOnly}
                      />
                    </Field>
                    {block2FullRequestedConditionsLikeInitiatorNew && (
                      <>
                        <Field label="Выберите категорию тарифа (одна категория)">
                          <Select
                            value={tariffCategory}
                            onChange={(e) => setTariffCategory(e.target.value as TariffCategory)}
                            disabled={block2InitiatorMetaReadOnly}
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
                            disabled={block2InitiatorMetaReadOnly}
                          >
                            <option value="3">3 месяца</option>
                            <option value="6">6 месяцев</option>
                            <option value="12">12 месяцев</option>
                          </Select>
                        </Field>
                      </>
                    )}
                  </div>
                  {block2FullRequestedConditionsLikeInitiatorNew && (
                    <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                      <Field label="Размер скидки, % (от 1 до 100)">
                        <Input
                          type="text"
                          inputMode="numeric"
                          autoComplete="off"
                          disabled={block2InitiatorMetaReadOnly}
                          value={discountInput}
                          onChange={(e) => {
                            const v = e.target.value
                              .replace(",", ".")
                              .replace(/[^0-9.]/g, "")
                              .replace(/(\..*)\./g, "$1");
                            if (v.length <= 6) setDiscountInput(v);
                          }}
                          onBlur={() => {
                            const t = discountInput.trim();
                            if (t === "") return;
                            const n = Number(t.replace(",", "."));
                            if (!Number.isFinite(n) || n < 1) setDiscountInput("1");
                            else setDiscountInput(String(parseDiscountPercentInput(t)));
                          }}
                        />
                      </Field>
                    </div>
                  )}
                </>
              {isLegacyInitiator && flowStage !== "extraInfoRequest" && (
                <p className="mt-4 rounded-xl border border-dashed border-[var(--line)] bg-surface-soft px-4 py-3 text-sm leading-relaxed text-muted-foreground">
                  Классический процесс: таблица тарифов, расчёт скидки и блок «Прогнозные данные» в этом
                  прототипе не используются. Дальнейшее оформление выполняется по прежним правилам.
                </p>
              )}

              {block2FullRequestedConditionsLikeInitiatorNew && (
              <>
              <div className="mt-[18px] min-w-0">
                {!isApproverStage && (
                  <div className="mb-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() =>
                        setCollapsedTariffSections((prev) => {
                          const hasExpanded = Object.values(prev).some((v) => !v);
                          return Object.fromEntries(
                            Object.keys(prev).map((key) => [key, hasExpanded]),
                          );
                        })
                      }
                      className="rounded-lg border border-[var(--line)] bg-white px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-surface-soft"
                    >
                      {Object.values(collapsedTariffSections).some((v) => !v)
                        ? "Свернуть все"
                        : "Развернуть все"}
                    </button>
                  </div>
                )}
                <table className="w-full table-fixed border-separate border-spacing-0 overflow-hidden rounded-2xl border border-[var(--line)] text-sm leading-normal [&_thead_th]:border-r [&_thead_th]:border-white/15 [&_thead_th:last-child]:border-r-0">
                  <colgroup>
                    <col style={{ width: "5%" }} />
                    <col style={{ width: "5%" }} />
                    <col style={{ width: showInitiatorCurrentTariffColumn ? "16%" : "18%" }} />
                    <col style={{ width: showInitiatorCurrentTariffColumn ? "8%" : "9%" }} />
                    {showInitiatorCurrentTariffColumn ? <col style={{ width: "9%" }} /> : null}
                    <col style={{ width: "8%" }} />
                    <col style={{ width: "8%" }} />
                    <col style={{ width: "7%" }} />
                    <col style={{ width: "8%" }} />
                    <col style={{ width: "7%" }} />
                    <col style={{ width: "7%" }} />
                    <col style={{ width: "7%" }} />
                    <col style={{ width: showInitiatorCurrentTariffColumn ? "10%" : "11%" }} />
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
                      {showInitiatorCurrentTariffColumn ? (
                        <th className="min-w-0 bg-[var(--table-head)] px-1.5 py-2 text-left align-middle text-sm font-bold leading-tight text-white whitespace-normal break-words hyphens-auto">
                          Текущий тариф
                        </th>
                      ) : null}
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
                      {showInitiatorCurrentTariffColumn ? (
                        <th className="min-w-0 bg-[var(--table-sub)] px-1.5 py-2 text-left text-[11px] font-semibold leading-tight text-white/90 whitespace-normal break-words">
                          по карточке клиента
                        </th>
                      ) : null}
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
                    {rowsForDisplay.map((r) =>
                      r.row.isSection ? (
                        <tr key={r.row.rowKey} className="font-bold">
                          <td className="border-t border-r border-[var(--line)] bg-[var(--section-row)] px-2.5 py-2.5" />
                          <td className="border-t border-r border-[var(--line)] bg-[var(--section-row)] px-2.5 py-2.5" />
                          <td
                            colSpan={showInitiatorCurrentTariffColumn ? 11 : 10}
                            className="border-t border-[var(--line)] bg-[var(--section-row)] px-2.5 py-2.5 text-sm font-bold leading-snug break-words last:border-r-0"
                          >
                            <button
                              type="button"
                              onClick={() =>
                                setCollapsedTariffSections((prev) => ({
                                  ...prev,
                                  [r.row.rowKey]: !prev[r.row.rowKey],
                                }))
                              }
                              className="flex w-full items-center gap-2 text-left"
                            >
                              <span
                                className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-[var(--line)] bg-white text-sm leading-none text-muted-foreground"
                                aria-label={
                                  collapsedTariffSections[r.row.rowKey]
                                    ? "Развернуть текущую секцию"
                                    : "Свернуть текущую секцию"
                                }
                                title={
                                  collapsedTariffSections[r.row.rowKey]
                                    ? "Развернуть текущую секцию"
                                    : "Свернуть текущую секцию"
                                }
                              >
                                {collapsedTariffSections[r.row.rowKey] ? "+" : "−"}
                              </span>
                              <span>{r.row.name}</span>
                            </button>
                          </td>
                        </tr>
                      ) : (
                        <tr key={r.row.rowKey} className="bg-white">
                          <td className="border-t border-r border-[var(--line)] bg-white px-2.5 py-2.5 text-center align-top">
                            <input
                              type="checkbox"
                              checked={r.sel}
                              onChange={() => {
                                const willSelect = !r.sel;
                                setSelected((s) => ({
                                  ...s,
                                  [r.row.rowKey]: willSelect,
                                }));
                                if (willSelect && (rowDiscountInputs[r.row.rowKey] ?? "").trim() === "") {
                                  const preparedDiscount = discountInput.trim();
                                  if (preparedDiscount !== "") {
                                    setRowDiscountInputs((s) => ({
                                      ...s,
                                      [r.row.rowKey]: String(parseDiscountPercentInput(preparedDiscount)),
                                    }));
                                  }
                                }
                              }}
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
                          {showInitiatorCurrentTariffColumn ? (
                            <td className="border-t border-r border-[var(--line)] bg-[oklch(0.98_0.02_145)] px-2.5 py-2.5 align-top text-sm leading-snug break-words text-foreground last:border-r-0">
                              {initiatorCurrentTariffCell(r)}
                            </td>
                          ) : null}
                          <td className="border-t border-r border-[var(--line)] bg-white px-2.5 py-2.5 align-top text-sm leading-snug break-words last:border-r-0">
                            {r.costStr}
                          </td>
                          <td className="border-t border-r border-[var(--line)] bg-white px-2.5 py-2.5 align-top text-sm leading-snug break-words last:border-r-0">
                            {r.incomeStr}
                          </td>
                          <td className="border-t border-r border-[var(--line)] bg-white px-2.5 py-2.5 align-top text-sm leading-snug break-words last:border-r-0">
                            {block2TariffRowEditLikeInitiator ? (
                              <Input
                                type="text"
                                inputMode="numeric"
                                autoComplete="off"
                                value={
                                  rowDiscountInputs[r.row.rowKey] ??
                                  (r.sel && discountInput.trim() !== ""
                                    ? String(parseDiscountPercentInput(discountInput))
                                    : "")
                                }
                                onChange={(e) => {
                                  const v = e.target.value
                                    .replace(",", ".")
                                    .replace(/[^0-9.]/g, "")
                                    .replace(/(\..*)\./g, "$1");
                                  if (v.length <= 6) {
                                    setRowDiscountInputs((s) => ({ ...s, [r.row.rowKey]: v }));
                                  }
                                }}
                                onBlur={() => {
                                  const raw = rowDiscountInputs[r.row.rowKey] ?? "";
                                  if (raw.trim() === "") return;
                                  const normalized = parseDiscountPercentInput(raw);
                                  setRowDiscountInputs((s) => ({
                                    ...s,
                                    [r.row.rowKey]: String(normalized),
                                  }));
                                }}
                                disabled={!r.sel}
                              />
                            ) : (
                              r.discountCol
                            )}
                          </td>
                          <td className="border-t border-r border-[var(--line)] bg-white px-2 py-2 align-top text-sm last:border-r-0">
                            <Input
                              value={tariffManualValues[r.row.rowKey]?.fix ?? ""}
                              onChange={(e) =>
                                setTariffManualValues((prev) => ({
                                  ...prev,
                                  [r.row.rowKey]: {
                                    ...prev[r.row.rowKey],
                                    fix: e.target.value,
                                  },
                                }))
                              }
                              placeholder={r.fixStr}
                            />
                          </td>
                          <td className="border-t border-r border-[var(--line)] bg-white px-2 py-2 align-top text-sm last:border-r-0">
                            <Input
                              value={tariffManualValues[r.row.rowKey]?.pct ?? ""}
                              onChange={(e) =>
                                setTariffManualValues((prev) => ({
                                  ...prev,
                                  [r.row.rowKey]: {
                                    ...prev[r.row.rowKey],
                                    pct: e.target.value,
                                  },
                                }))
                              }
                              placeholder={r.pctStr}
                            />
                          </td>
                          <td className="border-t border-r border-[var(--line)] bg-white px-2 py-2 align-top text-sm last:border-r-0">
                            <Input
                              value={tariffManualValues[r.row.rowKey]?.min ?? ""}
                              onChange={(e) =>
                                setTariffManualValues((prev) => ({
                                  ...prev,
                                  [r.row.rowKey]: {
                                    ...prev[r.row.rowKey],
                                    min: e.target.value,
                                  },
                                }))
                              }
                              placeholder={r.minStr}
                            />
                          </td>
                          <td className="border-t border-r border-[var(--line)] bg-white px-2 py-2 align-top text-sm last:border-r-0">
                            <Input
                              value={tariffManualValues[r.row.rowKey]?.max ?? ""}
                              onChange={(e) =>
                                setTariffManualValues((prev) => ({
                                  ...prev,
                                  [r.row.rowKey]: {
                                    ...prev[r.row.rowKey],
                                    max: e.target.value,
                                  },
                                }))
                              }
                              placeholder={r.maxStr}
                            />
                          </td>
                          <td className="border-t border-r border-[var(--line)] bg-white px-2.5 py-2.5 align-top text-sm font-medium leading-snug break-words last:border-r-0">
                            {r.forecastStr}
                          </td>
                        </tr>
                      ),
                    )}
                    {isApproverStage && rowsForCurrentStage.length === 0 && (
                      <tr>
                        <td
                          colSpan={showInitiatorCurrentTariffColumn ? 13 : 12}
                          className="border-t border-[var(--line)] bg-white px-3 py-3 text-sm text-muted-foreground"
                        >
                          Нет отмеченных пунктов тарифа для отображения на этом этапе.
                        </td>
                      </tr>
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
                      {showInitiatorCurrentTariffColumn ? (
                        <td className="border-t-2 border-t-[var(--line)] border-r border-[var(--line)] bg-[oklch(0.98_0.02_145)] px-2.5 py-2.5 align-top break-words last:border-r-0">
                          <div className="font-normal text-muted-foreground">Текущий тариф</div>
                          <div className="mt-1 text-xs font-normal font-medium leading-snug text-foreground">
                            Данные по действующему договору (демо: совпадение с базовой ячейкой
                            категории + пометка).
                          </div>
                        </td>
                      ) : null}
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
                скидки подставляется числовой справочник по коду операции. На этапах инициатора и
                запроса доп. сведений добавлена колонка «Текущий тариф»: справочное отображение
                действующих условий по карточке клиента (в прототипе — от базовой ячейки с пометкой).
                «Себестоимость» и «Текущий доход» в прототипе демонстрационные. «Запрашиваемый тариф»
                и «Скидка (%)» считаются там, где из текста тарифа удаётся извлечь проценты и минимумы;
                иначе в колонках %/min показывается «—». Неотмеченные операции после отправки заявки не
                отображаются следующим участникам маршрута.
              </p>
              </>
              )}

              {flowStage !== "manager" &&
                flowStage !== "secretary" &&
                flowStage !== "committee" && (
                <div className="relative mt-3 rounded-2xl border border-dashed border-[var(--line)] bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <strong className="text-foreground">
                    Прикрепить документ{" "}
                    <span className="font-normal text-muted-foreground">
                      {flowStage === "extraInfoRequest"
                        ? "(В рамках дополнительного запроса по клиенту)"
                        : "(При необходимости)"}
                    </span>
                  </strong>
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
                  Вложите оборотно-сальдовую ведомость, выписку по счету или иные подтверждающие
                  документы. Кнопка «Обзор…» открывает выбор файлов; ниже показывается краткий обзор
                  вложений.
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
              )}
              {flowStage === "extraInfoRequest" && (
                <>
                  <div className="mt-5 rounded-2xl border border-[oklch(0.82_0.08_85)] bg-[oklch(0.99_0.03_85)] px-4 py-3 text-sm text-foreground">
                    <div className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                      Запрос дополнительных сведений от члена Тарифного комитета
                    </div>
                    <p className="mt-2 whitespace-pre-wrap leading-relaxed text-foreground">
                      {(extraInfoReason || lastCommitteeRequestText).trim() ||
                        "Текст запроса появится здесь после того, как член ТК отправит запрос инициатору."}
                    </p>
                  </div>
                  <div className="mt-4">
                    <Field label="Текст ответа по запросу члена ТК">
                      <Textarea
                        placeholder="Укажите ответ по дополнительному запросу"
                        value={extraInfoResponseText}
                        onChange={(e) => setExtraInfoResponseText(e.target.value)}
                        rows={4}
                      />
                    </Field>
                  </div>
                  <div className="mt-4 flex flex-wrap justify-start gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        toast.success("Черновик сохранён", {
                          description: "Ответ по запросу сохранён без отправки.",
                        });
                      }}
                      className="rounded-xl border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-surface-soft"
                    >
                      Сохранить черновик
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const response = extraInfoResponseText.trim();
                        if (!response) {
                          toast.error("Укажите текст ответа по запросу члена ТК");
                          return;
                        }
                        setFlowStage("committee");
                        toast.success("Ответ направлен члену Тарифного комитета", {
                          description: "Заявка возвращена на рассмотрение члену ТК.",
                        });
                        scrollToTop();
                      }}
                      className="rounded-xl border-none bg-brand-green px-4 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90"
                    >
                      Отправить ответ члену ТК
                    </button>
                  </div>
                </>
              )}
            </section>
            )}

            {/* Прогнозные данные — справа на lg; на мобиле после блока 2 */}
            {flowStage !== "clientApproval" &&
              flowStage !== "opsSetup" &&
              flowStage !== "applicationTimeline" &&
              flowStage !== "committeeInPerson" &&
              !(flowStage === "initiator" && initiatorAppMode === "legacy") && (
            <aside className="min-w-0 rounded-3xl border border-[var(--line)] bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.07)] lg:sticky lg:top-4 lg:col-start-2 lg:row-start-1 lg:row-span-3 lg:self-start">
              <SectionTitle>Прогнозные данные</SectionTitle>
              {flowStage === "committee" && (
                <div className="-mt-2 mb-3">
                  <a
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    className="text-sm font-semibold text-brand-green-dark underline decoration-2 underline-offset-4 hover:opacity-90"
                  >
                    Дашборд - Детальный анализ клиента
                  </a>
                </div>
              )}
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
                value={profitabilityPctDisplay}
                tone={profitTone}
              />
              <CalcRow label="Статус рентабельности РКО" value={profitStatus} tone={profitTone} />

              {/* Прогнозные данные по группе компаний/филиалов */}
              {groupCompaniesEnabled && groupCompanies.length > 0 && (
                <div className="mt-6 border-t border-dashed border-[var(--line)] pt-6">
                  <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-foreground">
                    <BlockHeadingAccent size="section" />
                    Прогнозные данные по группе
                  </h3>
                  <div className="text-xs text-muted-foreground mb-3">
                    Данные по {groupCompanies.length} компаниям/филиалам в группе.
                  </div>

                  <div className="rounded-2xl border border-[var(--line)] bg-muted px-4 py-3">
                    <div className="text-xs text-muted-foreground">Общий доход по кошельку группы</div>
                    <div className="mt-1 text-lg font-semibold text-foreground">
                      {formatMoneyRu(groupCompaniesTotalIncome)}
                    </div>
                  </div>

                  <div className="my-4 rounded-2xl border border-[var(--total-border)] bg-[var(--total-bg)] p-4">
                    <div className="text-xs text-muted-foreground">
                      Прогноз доходности группы с учетом скидки
                    </div>
                    <div className="mt-1 text-3xl font-extrabold text-brand-green-dark">
                      {formatMoneyRu(groupCompaniesTotalIncome + b2.sumForecast)}
                    </div>
                  </div>

                  <CalcRow label="Доход основной компании (прогноз)" value={formatMoneyRu(b2.sumForecast)} />
                  <CalcRow label="Доход группы компаний/филиалов" value={formatMoneyRu(groupCompaniesTotalIncome)} />
                  <CalcRow 
                    label="Общий прогноз доходности" 
                    value={formatMoneyRu(groupCompaniesTotalIncome + b2.sumForecast)}
                    tone="pos"
                  />

                  <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                    Расчет на основе данных по доходам всех компаний и филиалов в группе.
                  </p>
                </div>
              )}

            </aside>
            )}

            {(flowStage === "initiator" || flowStage === "extraInfoRequest") &&
              block2FullRequestedConditionsLikeInitiatorNew && (
              <section className="min-w-0 rounded-3xl border border-[var(--line)] bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.04)] lg:col-start-1 lg:row-start-3">
                <SectionTitle>Назначение ответственных за исполнение решения</SectionTitle>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Укажите сотрудников, которые будут ставить задачи и контролировать исполнение после
                  решения ТК. Добавьте их через поиск по фамилии или ФИО.
                </p>
                <div className="mt-4 rounded-2xl border border-[var(--line)] bg-[oklch(0.995_0.005_145)] p-4 sm:p-5">
                  <SearchTagField
                    values={responsibleAssignees}
                    onChange={setResponsibleAssignees}
                    options={[
                      "Ахметов Н.С.",
                      "Иванов И.И.",
                      "Ким Д.В.",
                      "Петров П.П.",
                      "Сидорова А.К.",
                      "Тлеубердиева М.Е.",
                    ]}
                    placeholder="Начните вводить фамилию, например: Иванов"
                    description="Демо-справочник: можно добавить несколько человек; уже выбранные в подсказках не показываются."
                    selectedCaption="Уже в списке ответственных"
                  />
                </div>
              </section>
            )}
            {flowStage === "secretary" && (
              <section className="min-w-0 rounded-3xl border border-[var(--line)] bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.04)] lg:col-start-1 lg:row-start-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <SectionTitle>Выбор членов комитета</SectionTitle>
                  </div>
                  <button
                    type="button"
                    onClick={toggleSecretaryCommitteePanel}
                    className="shrink-0 rounded-xl border border-[var(--line)] bg-white px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm transition-colors hover:bg-surface-soft"
                  >
                    {secretaryCommitteePanelOpen ? "Свернуть" : "Развернуть"}
                  </button>
                </div>

                {!secretaryCommitteePanelOpen && (
                  <div className="mt-3 rounded-2xl border border-dashed border-[var(--line)] bg-surface-soft px-4 py-3 text-sm leading-relaxed text-muted-foreground">
                    <p>
                      Состав комитета скрыт. Нажмите «Развернуть» — ФИО шести членов ТК подставятся
                      автоматически (случайный набор из демо-справочника), их можно изменить вручную.
                    </p>
                    <div className="mt-2 text-xs text-foreground">
                      <span className="text-muted-foreground">Председатель:</span>{" "}
                      {secretaryChair.trim() || "—"} ·{" "}
                      <span className="text-muted-foreground">Зам. председателя:</span>{" "}
                      {secretaryDeputyChair.trim() || "—"}
                    </div>
                    {secretaryCommitteeMembers.some((m) => m.trim()) && (
                      <div className="mt-2 text-xs">
                        <span className="text-muted-foreground">Члены ТК:</span>{" "}
                        {secretaryCommitteeMembers
                          .map((m) => m.trim())
                          .filter(Boolean)
                          .join(", ")}
                      </div>
                    )}
                  </div>
                )}

                {secretaryCommitteePanelOpen && (
                  <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Field label="Председатель ТК">
                      <Select value={secretaryChair} onChange={(e) => setSecretaryChair(e.target.value)}>
                        <option value="">Выбрать</option>
                        <option value="Саимов Е.И.">Саимов Е.И.</option>
                        <option value="Иванов И.И.">Иванов И.И.</option>
                        <option value="Кожамяберов Е.С.">Кожамяберов Е.С.</option>
                      </Select>
                    </Field>
                    <Field label="Зам. Председателя">
                      <Select
                        value={secretaryDeputyChair}
                        onChange={(e) => setSecretaryDeputyChair(e.target.value)}
                      >
                        <option value="">Выбрать</option>
                        <option value="Талгатова Д.С.">Талгатова Д.С.</option>
                        <option value="Сидорова А.К.">Сидорова А.К.</option>
                        <option value="Турген Е.А.">Турген Е.А.</option>
                      </Select>
                    </Field>
                    {secretaryCommitteeMembers.map((member, idx) => (
                      <Field key={`member-${idx}`} label={`Член ТК — ${idx + 1} (ФИО)`}>
                        <Input
                          value={member}
                          onChange={(e) =>
                            setSecretaryCommitteeMembers((prev) =>
                              prev.map((m, i) => (i === idx ? e.target.value : m)),
                            )
                          }
                          placeholder="Фамилия И.О."
                          autoComplete="off"
                        />
                      </Field>
                    ))}
                  </div>
                )}
              </section>
            )}
            {flowStage !== "clientApproval" &&
              flowStage !== "opsSetup" &&
              flowStage !== "applicationTimeline" &&
              flowStage !== "committeeInPerson" && (
            <section className="min-w-0 rounded-3xl border border-[var(--line)] bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.04)] lg:col-start-1 lg:row-start-4">
              <div className="mt-4">
                <SectionTitle>Блок 3. Проект решения ТК</SectionTitle>
                {isLegacyInitiator ? (
                  <>
                    <p className="mt-2 rounded-xl border border-dashed border-[var(--line)] bg-surface-soft px-4 py-3 text-sm leading-relaxed text-muted-foreground">
                      В классическом процессе текст проекта решения и сопутствующие поля оформляются в
                      учётной системе вне данного прототипа. Ниже доступны действия по маршруту
                      согласования.
                    </p>
                    {flowStage === "initiator" && (
                      <div className="mt-6 rounded-2xl border border-[var(--line)] bg-[oklch(0.99_0.02_150)] p-4 md:p-5">
                        <h3 className="mb-3 text-base font-semibold text-foreground">
                          Выбор подписанта (визирующего)
                        </h3>
                        <Field label="Подписант (визирующий)">
                          <Select value={signatoryVisa} onChange={(e) => setSignatoryVisa(e.target.value)}>
                            <option value="">Выберите подписанта</option>
                            <option value="Саимов Е.И.">Саимов Е.И. — директор департамента</option>
                            <option value="Кожамяберов Е.С.">Кожамяберов Е.С. — зам. директора</option>
                            <option value="Талгатова Д.С.">Талгатова Д.С. — начальник управления</option>
                            <option value="Турген Е.А.">Турген Е.А. — зам. начальника управления</option>
                            <option value="Иванов И.И.">Иванов И.И. — ведущий менеджер</option>
                          </Select>
                        </Field>
                        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                          Укажите подписанта, визирующего пакет документов перед отправкой заявки на
                          согласование руководителю инициатора.
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                <Textarea
                  placeholder="Пример решения:
Принимая во внимание ходатайство Департамента по работе с корпоративными клиентами №2, установить клиенту Банка ТОО «Яблочко» БИН 00000000000 индивидуальные тарифы согласно тарифной категории DZERD (не включая документарные операции) в виде годовой абонентской платы в размере 2 500 000 тенге сроком на 12 месяцев.
1) Тарифы ввести с даты подписания заявления на подключение пакетного предложения «Безлимит». Остальные тарифы комиссионного вознаграждения установить согласно тарифной категории DZERD;
2) Управление №1 Департамента по работе с корпоративными клиентами №2:
довести о принятом решении до сведения ответственных и заинтересованных подразделений Банка;
довести о принятом Решении до сведения клиента;
в срок до 20.03.2027 года предоставить на рассмотрение Тарифного комитета мониторинговый отчет об экономической эффективности установленных тарифов по состоянию на 01.03.2027 года.
3) Внесение изменений в тарифы поручить: Управлению кассового обслуживания Операционного Департамента;"
                  value={projectDecision}
                  onChange={(e) => setProjectDecision(e.target.value)}
                  rows={7}
                />
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
                </div>
                {flowStage === "initiator" && (
                  <div className="mt-6 rounded-2xl border border-[var(--line)] bg-[oklch(0.99_0.02_150)] p-4 md:p-5">
                    <h3 className="mb-3 text-base font-semibold text-foreground">
                      Выбор подписанта (визирующего)
                    </h3>
                    <Field label="Подписант (визирующий)">
                      <Select value={signatoryVisa} onChange={(e) => setSignatoryVisa(e.target.value)}>
                        <option value="">Выберите подписанта</option>
                        <option value="Саимов Е.И.">Саимов Е.И. — директор департамента</option>
                        <option value="Кожамяберов Е.С.">Кожамяберов Е.С. — зам. директора</option>
                        <option value="Талгатова Д.С.">Талгатова Д.С. — начальник управления</option>
                        <option value="Турген Е.А.">Турген Е.А. — зам. начальника управления</option>
                        <option value="Иванов И.И.">Иванов И.И. — ведущий менеджер</option>
                      </Select>
                    </Field>
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                      Укажите подписанта, визирующего пакет документов перед отправкой заявки на согласование
                      руководителю инициатора.
                    </p>
                  </div>
                )}
                  </>
                )}
                {(flowStage === "initiator" || flowStage === "committeeInPerson") && (
                  <div className="mt-4 flex flex-wrap gap-3.5">
                  <button
                    type="button"
                    onClick={() => setApproveAction("initiator")}
                    className="cursor-pointer rounded-2xl border-none bg-brand-green px-5 py-3.5 text-[15px] font-bold text-white transition-opacity hover:opacity-90"
                  >
                    Отправить на согласование
                  </button>
                  <button className="min-w-[250px] cursor-pointer rounded-2xl border border-[var(--line)] bg-white px-5 py-3.5 text-center text-[15px] font-bold text-foreground transition-colors hover:bg-surface-soft">
                    Сохранить
                  </button>
                </div>
                )}
              </div>
              {flowStage === "manager" && (
                <div className="mt-4 flex flex-wrap gap-3.5">
                  <button
                    type="button"
                    onClick={() => setApproveAction("manager")}
                    className="cursor-pointer rounded-2xl border-none bg-brand-green px-5 py-3.5 text-[15px] font-bold text-white transition-opacity hover:opacity-90"
                  >
                    Согласовать
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowManagerReworkModal(true)}
                    className="cursor-pointer rounded-2xl border border-[var(--line)] bg-white px-5 py-3.5 text-[15px] font-bold text-foreground transition-colors hover:bg-surface-soft"
                  >
                    Вернуть на доработку
                  </button>
                </div>
              )}
              {flowStage === "secretary" && (
                <div className="mt-4 flex flex-wrap gap-3.5">
                  <button
                    type="button"
                    onClick={() => setApproveAction("secretary")}
                    className="cursor-pointer rounded-2xl border-none bg-brand-green px-5 py-3.5 text-[15px] font-bold text-white transition-opacity hover:opacity-90"
                  >
                    Отправить на голосование
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowManagerReworkModal(true)}
                    className="cursor-pointer rounded-2xl border border-[var(--line)] bg-white px-5 py-3.5 text-[15px] font-bold text-foreground transition-colors hover:bg-surface-soft"
                  >
                    Вернуть на доработку
                  </button>
                </div>
              )}
              {flowStage === "committee" && (
                <div className="mt-4 flex flex-wrap gap-3.5">
                  <button
                    type="button"
                    onClick={() => setApproveAction("committee")}
                    className="cursor-pointer rounded-2xl border-none bg-brand-green px-5 py-3.5 text-[15px] font-bold text-white transition-opacity hover:opacity-90"
                  >
                    За
                  </button>
                  <button className="cursor-pointer rounded-2xl border border-[var(--line)] bg-white px-5 py-3.5 text-[15px] font-bold text-foreground transition-colors hover:bg-surface-soft">
                    Против
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowInPersonReviewModal(true)}
                    className="cursor-pointer rounded-2xl border border-dashed border-[var(--line)] bg-surface-soft px-5 py-3.5 text-[15px] font-bold text-foreground transition-colors hover:bg-white"
                  >
                    Очное рассмотрение
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowExtraInfoModal(true);
                    }}
                    className="cursor-pointer rounded-2xl border border-dashed border-[var(--line)] bg-surface-soft px-5 py-3.5 text-[15px] font-bold text-foreground transition-colors hover:bg-white"
                  >
                    Запросить доп. информацию
                  </button>
                </div>
              )}
            </section>
            )}
            {flowStage === "clientApproval" && (
              <section className="min-w-0 rounded-3xl border border-[var(--line)] bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.04)] lg:col-start-1 lg:col-span-2 lg:row-start-1">
                <SectionTitle>Согласование утвержденных условий с клиентом</SectionTitle>
                <div className="rounded-xl border border-[oklch(0.88_0.04_220)] bg-[oklch(0.98_0.02_220)] px-4 py-2.5 text-sm text-foreground">
                  Все члены ТК проголосовали «За». Инициатору необходимо согласовать утвержденные
                  условия с клиентом.
                </div>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <InfoBox k="Статус" v="Ожидает клиента" />
                  <InfoBox k="Решение ТК" v="Утверждено" tone="pos" />
                  <InfoBox k="Срок условий" v={`${validityMonths} мес.`} />
                  <InfoBox k="Дата мониторинга" v={monitoringPlusOneYearRu} />
                </div>
                <div className="mt-4 overflow-hidden rounded-2xl border border-[var(--line)]">
                  <table className="w-full border-collapse text-sm">
                    <thead className="bg-[var(--table-head)] text-white">
                      <tr>
                        <th className="px-3 py-2 text-left">№</th>
                        <th className="px-3 py-2 text-left">Операция</th>
                        <th className="px-3 py-2 text-left">Утвержденный тариф</th>
                        <th className="px-3 py-2 text-left">Срок действия</th>
                        <th className="px-3 py-2 text-left">Примечание</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rowsForCurrentStage.length === 0 ? (
                        <tr className="bg-white">
                          <td colSpan={5} className="px-3 py-3 text-muted-foreground">
                            Нет утвержденных условий для согласования с клиентом.
                          </td>
                        </tr>
                      ) : (
                        rowsForCurrentStage.map((r) => (
                          <tr key={`client-approval-${r.row.rowKey}`} className="bg-white">
                            <td className="border-t border-[var(--line)] px-3 py-2">{r.row.code || "—"}</td>
                            <td className="border-t border-[var(--line)] px-3 py-2">{r.row.name}</td>
                            <td className="border-t border-[var(--line)] px-3 py-2">
                              {r.pctStr !== "—" ? `${r.pctStr}${r.minStr !== "—" ? `, мин. ${r.minStr}` : ""}` : r.baseStr}
                            </td>
                            <td className="border-t border-[var(--line)] px-3 py-2">{validityMonths} месяцев</td>
                            <td className="border-t border-[var(--line)] px-3 py-2">Индивидуальные условия</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4">
                  <Field label="Комментарий по итогам переговоров с клиентом">
                    <Textarea
                      placeholder="Зафиксируйте результат согласования условий с клиентом"
                      value={clientNegotiationComment}
                      onChange={(e) => setClientNegotiationComment(e.target.value)}
                      rows={4}
                    />
                  </Field>
                  <div className="mt-3 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setFlowStage("opsSetup");
                        toast.success("Клиент согласовал условия", {
                          description: "Заявка передана в Операционный департамент.",
                        });
                        scrollToTop();
                      }}
                      className="rounded-xl border-none bg-brand-green px-4 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90"
                    >
                      Клиент согласен
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsInitiatorSubmitted(false);
                        setFlowStage("initiator");
                        toast.error("Клиент не согласовал условия", {
                          description: "Заявка возвращена инициатору на доработку.",
                        });
                        scrollToTop();
                      }}
                      className="rounded-xl border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-surface-soft"
                    >
                      Клиент не согласен
                    </button>
                  </div>
                </div>
              </section>
            )}
            {flowStage === "opsSetup" && (
              <section className="min-w-0 rounded-3xl border border-[var(--line)] bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.04)] lg:col-start-1 lg:col-span-2 lg:row-start-1">
                <SectionTitle>Установка тарифов по утвержденному решению</SectionTitle>
                <div className="rounded-xl border border-[oklch(0.88_0.04_220)] bg-[oklch(0.98_0.02_220)] px-4 py-2.5 text-sm text-foreground">
                  Клиент согласовал условия. Заявка передана в Операционный департамент для настройки
                  тарифов.
                </div>
                <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-3">
                  <div className="rounded-2xl border border-[var(--line)] bg-white p-3.5">
                    <div className="text-sm font-semibold text-foreground">1. Проверить решение ТК</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Номер дела, срок действия, перечень операций и утвержденные значения.
                    </div>
                  </div>
                  <div className="rounded-2xl border border-[var(--line)] bg-white p-3.5">
                    <div className="text-sm font-semibold text-foreground">2. Установить тарифы</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Настроить в учетной системе согласно утвержденным условиям.
                    </div>
                  </div>
                  <div className="rounded-2xl border border-[var(--line)] bg-white p-3.5">
                    <div className="text-sm font-semibold text-foreground">3. Подтвердить исполнение</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      После установки приложить комментарий и завершить операционный этап.
                    </div>
                  </div>
                </div>
                <div className="mt-4 overflow-hidden rounded-2xl border border-[var(--line)]">
                  <table className="w-full border-collapse text-sm">
                    <thead className="bg-[var(--table-head)] text-white">
                      <tr>
                        <th className="px-3 py-2 text-left">Операция</th>
                        <th className="px-3 py-2 text-left">Значение для установки</th>
                        <th className="px-3 py-2 text-left">Дата начала</th>
                        <th className="px-3 py-2 text-left">Дата окончания</th>
                        <th className="px-3 py-2 text-left">Статус установки</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rowsForCurrentStage.length === 0 ? (
                        <tr className="bg-white">
                          <td colSpan={5} className="px-3 py-3 text-muted-foreground">
                            Нет условий для установки.
                          </td>
                        </tr>
                      ) : (
                        rowsForCurrentStage.map((r) => (
                          <tr key={`ops-setup-${r.row.rowKey}`} className="bg-white">
                            <td className="border-t border-[var(--line)] px-3 py-2">
                              {(r.row.code ? `${r.row.code} ` : "") + r.row.name}
                            </td>
                            <td className="border-t border-[var(--line)] px-3 py-2">
                              {r.pctStr !== "—" ? `${r.pctStr}${r.minStr !== "—" ? `, мин. ${r.minStr}` : ""}` : r.baseStr}
                            </td>
                            <td className="border-t border-[var(--line)] px-3 py-2">12.03.2026</td>
                            <td className="border-t border-[var(--line)] px-3 py-2">11.03.2027</td>
                            <td className="border-t border-[var(--line)] px-3 py-2">Ожидает установки</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4">
                  <Field label="Комментарий Операционного департамента">
                    <Textarea placeholder="Укажите дату и подтверждение установки тарифов" rows={4} />
                  </Field>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={handleDownloadProjectPdf}
                      className="rounded-xl border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-surface-soft"
                    >
                      Скачать PDF «Проект решения ТК»
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFlowStage("applicationTimeline");
                        toast.success("Установка тарифов завершена", {
                          description: "Открыт экран истории заявки.",
                        });
                        scrollToTop();
                      }}
                      className="rounded-xl border-none bg-brand-green px-4 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90"
                    >
                      Выполнено
                    </button>
                  </div>
                </div>
              </section>
            )}
            {flowStage === "applicationTimeline" && (
              <section className="min-w-0 rounded-3xl border border-[var(--line)] bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.04)] lg:col-start-1 lg:col-span-2 lg:row-start-1">
                <SectionTitle>История заявки</SectionTitle>
                <div className="-mt-1 mb-3 inline-flex items-center rounded-xl border border-[var(--line)] bg-surface-soft px-3 py-1.5 text-sm font-semibold text-foreground">
                  Номер заявки: 100347604082
                </div>
                <div className="mt-4 rounded-2xl border border-[var(--line)] bg-white p-4">
                  <div className="relative">
                    <span className="absolute bottom-0 left-[5px] top-1.5 w-px bg-[var(--line)]" />
                    <ul className="space-y-3">
                    <li className="relative pl-6">
                      <span className="absolute left-0 top-1.5 h-3 w-3 rounded-full bg-brand-green" />
                      <div className="text-sm font-semibold text-foreground">Создание заявки инициатором</div>
                      <div className="text-xs text-muted-foreground">10.03.2026 09:15 · Заявка зарегистрирована в системе</div>
                    </li>

                    <li className="relative pl-6">
                      <span className="absolute left-0 top-1.5 h-3 w-3 rounded-full bg-brand-green" />
                      <div className="text-sm font-semibold text-foreground">Согласование руководителем</div>
                      <div className="text-xs text-muted-foreground">10.03.2026 14:20 · Передано секретарю Комитета</div>
                    </li>

                    <li className="relative pl-6">
                      <span className="absolute left-0 top-1.5 h-3 w-3 rounded-full bg-brand-green" />
                      <div className="text-sm font-semibold text-foreground">Рассмотрение секретарем</div>
                      <div className="text-xs text-muted-foreground">11.03.2026 10:05 · Направлено члену ТК</div>
                    </li>

                    <li className="relative pl-6">
                      <span className="absolute left-0 top-1.5 h-3 w-3 rounded-full bg-brand-green" />
                      <div className="text-sm font-semibold text-foreground">Голосование члена ТК</div>
                      <div className="text-xs text-muted-foreground">
                        11.03.2026 16:40 · Решение «За» зафиксировано
                      </div>
                    </li>

                    <li className="relative pl-6">
                      <span className="absolute left-0 top-1.5 h-3 w-3 rounded-full bg-brand-green" />
                      <div className="text-sm font-semibold text-foreground">Согласование с клиентом</div>
                      <div className="text-xs text-muted-foreground">
                        12.03.2026 11:30 · Клиент подтвердил условия
                      </div>
                    </li>

                    <li className="relative pl-6">
                      <span className="absolute left-0 top-1.5 h-3 w-3 rounded-full bg-muted-foreground/60" />
                      <div className="text-sm font-semibold text-muted-foreground">Установка тарифов</div>
                      <div className="text-xs text-muted-foreground/90">
                        12.03.2026 15:10 · Операционный этап завершен
                      </div>
                    </li>
                    </ul>
                  </div>
                </div>
              </section>
            )}
            {flowStage === "committee" && hasCommitteeCorrespondence && (
              <section className="min-w-0 rounded-3xl border border-[var(--line)] bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.04)] lg:col-start-1 lg:row-start-5">
                <SectionTitle>Переписка по дополнительному запросу</SectionTitle>
                <div className="mt-3 space-y-3">
                  <div className="rounded-2xl border border-[oklch(0.84_0.07_160)] bg-[oklch(0.97_0.02_160)] px-4 py-3 text-sm text-foreground">
                    <div className="font-semibold">Запрос отправлен членом ТК</div>
                    <div className="mt-1 whitespace-pre-wrap text-muted-foreground">
                      {lastCommitteeRequestText.trim() || "Текст запроса отсутствует."}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-[var(--line)] bg-surface-soft px-4 py-3 text-sm text-foreground">
                    <div className="font-semibold">Ответ по запросу</div>
                    <div className="mt-1 whitespace-pre-wrap">
                      {extraInfoResponseText.trim() || "Ответ по дополнительному запросу пока не заполнен."}
                    </div>
                  </div>
                </div>
              </section>
            )}
            {flowStage === "committee" && (
              <section className="min-w-0 rounded-3xl border border-[var(--line)] bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.04)] lg:col-start-1 lg:row-start-6">
                <div>
                  <h3 className="text-base font-semibold text-foreground">История голосования</h3>
                  <div className="mt-3 overflow-hidden rounded-2xl border border-[var(--line)]">
                    <table className="w-full border-collapse text-sm">
                      <thead className="bg-muted text-foreground">
                        <tr>
                          <th className="border-b border-[var(--line)] px-3 py-2 text-left font-semibold">
                            Участник
                          </th>
                          <th className="border-b border-[var(--line)] px-3 py-2 text-left font-semibold">
                            Голос
                          </th>
                          <th className="border-b border-[var(--line)] px-3 py-2 text-left font-semibold">
                            Доп. информация
                          </th>
                          <th className="border-b border-[var(--line)] px-3 py-2 text-left font-semibold">
                            Комментарий
                          </th>
                          <th className="border-b border-[var(--line)] px-3 py-2 text-left font-semibold">
                            Статус
                          </th>
                          <th className="border-b border-[var(--line)] px-3 py-2 text-left font-semibold">
                            Дата/время
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {lastCommitteeRequestText.trim() && (
                          <tr className="bg-[oklch(0.97_0.02_160)]">
                            <td className="border-b border-[var(--line)] px-3 py-2">Член ТК</td>
                            <td className="border-b border-[var(--line)] px-3 py-2">Запрос доп. информации</td>
                            <td className="border-b border-[var(--line)] px-3 py-2">
                              {extraInfoResponseText.trim() ? "Ответ получен" : "Ожидается ответ"}
                            </td>
                            <td className="border-b border-[var(--line)] px-3 py-2">
                              {lastCommitteeRequestText}
                            </td>
                            <td className="border-b border-[var(--line)] px-3 py-2">
                              {extraInfoResponseText.trim() ? "Исполнено" : "На рассмотрении"}
                            </td>
                            <td className="border-b border-[var(--line)] px-3 py-2">
                              {new Date().toLocaleString("ru-RU", { dateStyle: "short", timeStyle: "short" })}
                            </td>
                          </tr>
                        )}
                        <tr className="bg-white">
                          <td className="border-b border-[var(--line)] px-3 py-2">Иванов И.И.</td>
                          <td className="border-b border-[var(--line)] px-3 py-2">За</td>
                          <td className="border-b border-[var(--line)] px-3 py-2">Нет</td>
                          <td className="border-b border-[var(--line)] px-3 py-2">
                            Поддерживаю при условии контроля доходности по итогам периода.
                          </td>
                          <td className="border-b border-[var(--line)] px-3 py-2">Согласовано</td>
                          <td className="border-b border-[var(--line)] px-3 py-2">28.04.2026 14:30</td>
                        </tr>
                        <tr className="bg-white">
                          <td className="border-b border-[var(--line)] px-3 py-2">Сидорова А.К.</td>
                          <td className="border-b border-[var(--line)] px-3 py-2">За</td>
                          <td className="border-b border-[var(--line)] px-3 py-2">Нет</td>
                          <td className="border-b border-[var(--line)] px-3 py-2">
                            Согласовано, отклонений по расчету не выявлено.
                          </td>
                          <td className="border-b border-[var(--line)] px-3 py-2">Согласовано</td>
                          <td className="border-b border-[var(--line)] px-3 py-2">28.04.2026 14:35</td>
                        </tr>
                        <tr className="bg-white">
                          <td className="px-3 py-2">Петров Н.С.</td>
                          <td className="px-3 py-2">За</td>
                          <td className="px-3 py-2">Нет</td>
                          <td className="px-3 py-2">Поддержано.</td>
                          <td className="px-3 py-2">На рассмотрении</td>
                          <td className="px-3 py-2">28.04.2026 14:38</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            )}
          </div>
        )}
      </div>
      {approveAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-[460px] rounded-3xl border border-[var(--line)] bg-white p-6 shadow-[0_20px_48px_rgba(15,23,42,0.28)]">
            <h3 className="text-lg font-semibold leading-tight text-foreground">
              {approveActionMeta[approveAction].title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {approveActionMeta[approveAction].description}
            </p>
            <div className="mt-5 flex flex-wrap justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setApproveAction(null)}
                className="rounded-xl border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-surface-soft"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={() => {
                  if (approveAction === "initiator") {
                    setIsInitiatorSubmitted(true);
                    setFlowStage("manager");
                    toast.success("Заявка отправлена на согласование", {
                      description: "Маршрут согласования запущен.",
                    });
                  } else if (approveAction === "manager") {
                    setFlowStage("secretary");
                    toast.success("Заявка согласована", {
                      description: "Заявка передана секретарю Комитета.",
                    });
                  } else if (approveAction === "secretary") {
                    setFlowStage("committee");
                    toast.success("Заявка согласована", {
                      description: "Заявка передана члену Тарифного комитета.",
                    });
                  } else if (approveAction === "committee") {
                    setFlowStage("clientApproval");
                    toast.success("Решение зафиксировано", {
                      description: "Голос «За» успешно сохранен.",
                    });
                  } else {
                    toast.success("Согласование с клиентом завершено", {
                      description: "Утвержденные условия подтверждены клиентом.",
                    });
                  }
                  setApproveAction(null);
                  scrollToTop();
                }}
                className="rounded-xl border-none bg-brand-green px-4 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90"
              >
                Подтвердить
              </button>
            </div>
          </div>
        </div>
      )}
      {showExtraInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-[560px] rounded-3xl border border-[var(--line)] bg-white p-6 shadow-[0_20px_48px_rgba(15,23,42,0.28)]">
            <h3 className="text-lg font-semibold leading-tight text-foreground">Запрос доп. информации</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Укажите текст запроса. После отправки откроется отдельный экран обработки запроса.
            </p>
            <div className="mt-4">
              <Textarea
                placeholder="Текст запроса доп. информации"
                value={extraInfoReason}
                onChange={(e) => setExtraInfoReason(e.target.value)}
                rows={6}
              />
            </div>
            <div className="mt-5 flex flex-wrap justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setShowExtraInfoModal(false);
                  setExtraInfoReason("");
                }}
                className="rounded-xl border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-surface-soft"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={() => {
                  const reason = extraInfoReason.trim();
                  if (!reason) {
                    toast.error("Укажите текст запроса доп. информации");
                    return;
                  }
                  setShowExtraInfoModal(false);
                  setLastCommitteeRequestText(reason);
                  setFlowStage("extraInfoRequest");
                  scrollToTop();
                }}
                className="rounded-xl border-none bg-brand-green px-4 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90"
              >
                Отправить
              </button>
            </div>
          </div>
        </div>
      )}
      {showInPersonReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-[460px] rounded-3xl border border-[var(--line)] bg-white p-6 shadow-[0_20px_48px_rgba(15,23,42,0.28)]">
            <h3 className="text-lg font-semibold leading-tight text-foreground">Очное рассмотрение</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Подтвердите переход на экран очного рассмотрения.
            </p>
            <div className="mt-5 flex flex-wrap justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowInPersonReviewModal(false)}
                className="rounded-xl border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-surface-soft"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowInPersonReviewModal(false);
                  setFlowStage("committeeInPerson");
                  toast.success("Переход выполнен", {
                    description: "Открыт экран очного рассмотрения.",
                  });
                  scrollToTop();
                }}
                className="rounded-xl border-none bg-brand-green px-4 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90"
              >
                Подтвердить
              </button>
            </div>
          </div>
        </div>
      )}
      {showManagerReworkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-[560px] rounded-3xl border border-[var(--line)] bg-white p-6 shadow-[0_20px_48px_rgba(15,23,42,0.28)]">
            <h3 className="text-lg font-semibold leading-tight text-foreground">Возврат на доработку</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Укажите причину возврата заявки на доработку.
            </p>
            <div className="mt-4">
              <Textarea
                placeholder="Причина возврата на доработку"
                value={managerReworkReason}
                onChange={(e) => setManagerReworkReason(e.target.value)}
                rows={5}
              />
            </div>
            <div className="mt-5 flex flex-wrap justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setShowManagerReworkModal(false);
                  setManagerReworkReason("");
                }}
                className="rounded-xl border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-surface-soft"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={() => {
                  const reason = managerReworkReason.trim();
                  if (!reason) {
                    toast.error("Укажите причину возврата на доработку");
                    return;
                  }
                  setShowManagerReworkModal(false);
                  setManagerReworkReason("");
                  setIsInitiatorSubmitted(false);
                  setFlowStage("initiator");
                  toast.success("Заявка возвращена на доработку", {
                    description: `Причина: ${reason}`,
                  });
                }}
                className="rounded-xl border-none bg-brand-green px-4 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90"
              >
                Отправить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
