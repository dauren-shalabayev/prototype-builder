import pdfMake from "pdfmake/build/pdfmake";
import vfsFonts from "pdfmake/build/vfs_fonts";
import type { TDocumentDefinitions } from "pdfmake/interfaces";

// vfs_fonts: при импорте в Vite может быть либо сам объект vfs, либо { default: vfs }
const raw = vfsFonts as { default?: Record<string, string> } & Record<string, string>;
const vfs = raw.default ?? raw;
pdfMake.vfs = vfs;

export type TariffCommitteePdfPayload = {
  clientFullName: string;
  iinBin: string;
  briefJustification: string;
  projectDecision: string;
  monitoringDate: string;
  approver: string;
  selectedTariffs: Array<{
    code: string;
    operation: string;
    discount: string;
    approvedTariff: string;
    forecast: string;
  }>;
};

function fileStamp(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;
}

/** Нормализация переносов; содержимое для PDF не обрезаем по краям, кроме проверки «пусто». */
function normalizeNewlines(s: string): string {
  return s.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

function bodyOrDash(s: string): string {
  const n = normalizeNewlines(s);
  return n.trim() === "" ? "—" : n;
}

function buildDocDef(p: TariffCommitteePdfPayload): TDocumentDefinitions {
  const now = new Date().toLocaleString("ru-RU");
  const projectText = bodyOrDash(p.projectDecision);
  const briefText = bodyOrDash(p.briefJustification);
  const tariffRows =
    p.selectedTariffs.length > 0
      ? p.selectedTariffs.map((t) => [t.code || "—", t.operation || "—", t.discount || "—", t.approvedTariff || "—", t.forecast || "—"])
      : [["—", "Нет выбранных тарифов", "—", "—", "—"]];
  return {
    pageSize: "A4",
    pageMargins: [48, 48, 48, 48],
    defaultStyle: {
      font: "Roboto",
      fontSize: 10,
      lineHeight: 1.25,
    },
    content: [
      {
        columns: [
          {
            width: 170,
            stack: [
              { text: "ТАРИФ КОМИТЕТ\nТАРИФНЫЙ КОМИТЕТ", alignment: "center", bold: true, fontSize: 9 },
              { text: "08 апр. 2026", alignment: "center", margin: [0, 12, 0, 0], bold: true },
            ],
            margin: [0, 0, 14, 0],
            style: "stampBox",
          },
          {
            width: "*",
            stack: [
              { text: "РЕШЕНИЕ", style: "docCenterTitle", margin: [0, 12, 0, 2] },
              { text: "ТАРИФНОГО КОМИТЕТА № 416", style: "docCenterTitle", margin: [0, 0, 0, 2] },
              { text: "по результатам заочного голосования", alignment: "center", fontSize: 10 },
              { text: "от «08» апреля 2026 года", alignment: "center", fontSize: 10, margin: [0, 2, 0, 0] },
            ],
          },
        ],
        margin: [0, 0, 0, 14],
      },
      {
        columns: [
          { width: 220, text: "В голосовании приняли участие:", bold: true },
          { width: "*", text: "" },
        ],
      },
      {
        columns: [
          { width: 220, text: "Председатель:" },
          { width: "*", text: "Саимов Е.И." },
        ],
      },
      {
        columns: [
          { width: 220, text: "Заместитель Председателя:" },
          { width: "*", text: "Талгатова Д.С." },
        ],
      },
      {
        columns: [
          { width: 220, text: "Члены Тарифного комитета:" },
          {
            width: "*",
            ul: ["Дунапов Г.С.", "Кожамяберов Е.С.", "Турген Е.А.", "Мамбетова Н.Д.", "Тлесов С.Г."],
          },
        ],
        margin: [0, 0, 0, 8],
      },
      {
        columns: [
          { width: 220, text: "Инициатор вопроса:" },
          { width: "*", text: p.clientFullName || "—" },
        ],
      },
      {
        columns: [
          { width: 220, text: "Секретарь Тарифного комитета:" },
          { width: "*", text: p.approver.trim() || "—" },
        ],
        margin: [0, 0, 0, 12],
      },
      { text: "ВОПРОС, ПОСТАВЛЕННЫЙ НА ГОЛОСОВАНИЕ:", style: "sectionCenterTitle" },
      {
        text: briefText,
        margin: [0, 4, 0, 12],
      },
      { text: "РЕШЕНИЕ ТАРИФНОГО КОМИТЕТА:", style: "sectionCenterTitle" },
      {
        text: projectText,
        fontSize: 10.5,
        lineHeight: 1.35,
        margin: [0, 4, 0, 10],
      },
      {
        text: `ИИН/БИН клиента: ${p.iinBin || "—"}\nДата мониторинга: ${p.monitoringDate.trim() || "—"}\nДокумент сформирован: ${now}`,
        style: "muted",
        margin: [0, 8, 0, 0],
      },
      {
        columns: [
          { width: "*", text: "" },
          {
            width: 170,
            table: {
              widths: ["*"],
              body: [
                [
                  {
                    text: "ЭЛЕКТРОННАЯ ПЕЧАТЬ\nТАРИФНЫЙ КОМИТЕТ\nАО «НАРОДНЫЙ БАНК КАЗАХСТАНА»\nДЕЙСТВИТЕЛЬНО",
                    alignment: "center",
                    bold: true,
                    fontSize: 8,
                    lineHeight: 1.2,
                    margin: [4, 8, 4, 8],
                    color: "#1e3a8a",
                  },
                ],
              ],
            },
            layout: {
              hLineColor: () => "#1e3a8a",
              vLineColor: () => "#1e3a8a",
              hLineWidth: () => 1,
              vLineWidth: () => 1,
              paddingLeft: () => 0,
              paddingRight: () => 0,
              paddingTop: () => 0,
              paddingBottom: () => 0,
            },
          },
        ],
        margin: [0, 10, 0, 0],
      },
      { text: "", pageBreak: "before", margin: [0, 0, 0, 0] },
      { text: "Выбранные тарифы", style: "h2", margin: [0, 0, 0, 6] },
      {
        table: {
          headerRows: 1,
          widths: [42, "*", 52, 110, 80],
          body: [
            ["Код", "Операция", "Скидка", "Утвержденный тариф", "Прогноз"],
            ...tariffRows,
          ],
        },
        layout: "lightHorizontalLines",
        margin: [0, 0, 0, 14],
      },
      { text: "Дополнительно", style: "h2" },
      {
        text: [
          { text: "Дата мониторинга: ", bold: true },
          { text: p.monitoringDate.trim() || "—" },
        ],
        margin: [0, 0, 0, 4],
      },
      {
        text: [{ text: "Визирующий: ", bold: true }, { text: p.approver.trim() || "—" }],
      },
      {
        text: "Настоящий документ сформирован в прототипе заявки и не имеет юридической силы.",
        style: "muted",
        margin: [0, 24, 0, 0],
      },
    ],
    styles: {
      title: { fontSize: 16, bold: true },
      h2: { fontSize: 11, bold: true, color: "#1e293b" },
      muted: { fontSize: 9, color: "#64748b" },
      docCenterTitle: { fontSize: 13, bold: true, alignment: "center" },
      sectionCenterTitle: { fontSize: 11, bold: true, alignment: "center" },
      stampBox: { margin: [0, 0, 0, 0] },
    },
  };
}

/**
 * Скачивание PDF. В pdfmake 0.3+ `getBlob()` возвращает Promise (старый колбэк не работает).
 * Сохраняем через `<a download>` + blob — стабильнее, чем внутренний file-saver в части браузеров.
 */
export async function downloadTariffCommitteePdf(p: TariffCommitteePdfPayload): Promise<void> {
  const doc = buildDocDef(p);
  const filename = `proekt-resheniya-tk-${fileStamp(new Date())}.pdf`;
  const blob = await pdfMake.createPdf(doc).getBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  requestAnimationFrame(() => {
    a.remove();
    URL.revokeObjectURL(url);
  });
}
