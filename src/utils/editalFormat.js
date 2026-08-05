const CALENDAR_DATE_RE =
  /^(\d{4})-(\d{2})-(\d{2})(?:T00:00:00(?:\.0+)?Z?)?$/;

const toLocalCalendarDate = (value) => {
  if (value === null || value === undefined || value === "") return null;

  const str = String(value).trim();
  const calendarMatch = str.match(CALENDAR_DATE_RE);
  if (calendarMatch) {
    const [, year, month, day] = calendarMatch;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const formatDate = (value) => {
  const date = toLocalCalendarDate(value);
  if (!date) return null;
  return date.toLocaleDateString("pt-BR");
};

export const formatDateTime = (value) => {
  if (!value) return null;
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatCurrency = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const amount = Number(value);
  if (Number.isNaN(amount)) return String(value);
  return amount.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
};

export const formatTime = (value) => {
  if (value === null || value === undefined || value === "") return null;

  const str = String(value).trim();
  const match = str.match(/^(\d{1,2}):(\d{2})/);
  if (match) {
    return `${match[1].padStart(2, "0")}:${match[2]}`;
  }

  return str;
};

export const formatPrazo = (edital) => {
  const abertura = formatDate(edital?.data_abertura);
  const hora = formatTime(edital?.hora_abertura);
  const encerramento = formatDate(edital?.data_encerramento);
  const aberturaComHora =
    abertura && hora ? `${abertura} às ${hora}` : abertura;

  if (aberturaComHora && encerramento) {
    return `${aberturaComHora} — ${encerramento}`;
  }
  if (encerramento) return `Encerra em ${encerramento}`;
  if (aberturaComHora) return `Abertura ${aberturaComHora}`;
  return "Sem prazo";
};

/**
 * Relative urgency for closing date (or opening as fallback).
 * @returns {{ label: string, tone: 'ok'|'soon'|'today'|'late'|'none', days: number|null, date: string|null }}
 */
export const formatPrazoRelativo = (edital, today = new Date()) => {
  const raw = edital?.data_encerramento || edital?.data_abertura;
  const date = toLocalCalendarDate(raw);
  if (!date) {
    return { label: "Sem prazo", tone: "none", days: null, date: null };
  }

  const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diffMs = date.getTime() - startToday.getTime();
  const days = Math.round(diffMs / 86400000);
  const formatted = formatDate(raw);

  if (days < 0) {
    const n = Math.abs(days);
    return {
      label: n === 1 ? "Atrasado 1 dia" : `Atrasado ${n} dias`,
      tone: "late",
      days,
      date: formatted,
    };
  }
  if (days === 0) {
    return { label: "Encerra hoje", tone: "today", days, date: formatted };
  }
  if (days === 1) {
    return { label: "Encerra amanhã", tone: "soon", days, date: formatted };
  }
  if (days <= 2) {
    return { label: `Em ${days} dias`, tone: "soon", days, date: formatted };
  }
  return { label: `Em ${days} dias`, tone: "ok", days, date: formatted };
};

export const SEGMENTO_LABELS = {
  software: "Software",
  protocolo: "Protocolo",
  gestao_educacional: "Gestão educacional",
  cesta_de_preco: "Cesta de preço",
};

export const segmentoLabel = (key) => SEGMENTO_LABELS[key] || key || "—";

export const truncateText = (text, max = 72) => {
  if (!text) return "";
  if (text.length <= max) return text;
  return `${text.slice(0, max).trim()}…`;
};

export const formatFileSize = (bytes) => {
  if (!bytes) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const formatMimeType = (mime) => {
  if (!mime) return null;
  const map = {
    "application/pdf": "PDF",
    "text/plain": "Texto",
  };
  return map[mime] || mime.split("/").pop()?.toUpperCase() || mime;
};
