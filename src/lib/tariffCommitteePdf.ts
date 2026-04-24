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
  return {
    pageSize: "A4",
    pageMargins: [48, 48, 48, 48],
    defaultStyle: {
      font: "Roboto",
      fontSize: 10,
      lineHeight: 1.25,
    },
    content: [
      { text: "Проект решения ТК", style: "title" },
      {
        text: `Документ сформирован: ${now}`,
        style: "muted",
        margin: [0, 4, 0, 14],
      },
      {
        text: "Текст проекта решения",
        style: "h2",
        margin: [0, 4, 0, 6],
      },
      {
        text: projectText,
        fontSize: 11,
        lineHeight: 1.35,
        margin: [0, 0, 0, 18],
      },
      { text: "Клиент", style: "h2", margin: [0, 6, 0, 0] },
      {
        text: [{ text: "ФИО / наименование: ", bold: true }, { text: p.clientFullName || "—" }],
        margin: [0, 0, 0, 4],
      },
      {
        text: [{ text: "ИИН / БИН: ", bold: true }, { text: p.iinBin || "—" }],
        margin: [0, 0, 0, 14],
      },
      { text: "Краткое обоснование", style: "h2" },
      {
        text: briefText,
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
