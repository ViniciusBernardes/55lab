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
