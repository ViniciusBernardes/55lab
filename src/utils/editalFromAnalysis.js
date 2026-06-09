const toInputDate = (value) => {
  if (!value) return "";
  return String(value).split("T")[0];
};

const toInputTime = (value) => {
  if (!value) return "";
  const match = String(value).trim().match(/^(\d{1,2}):(\d{2})/);
  if (!match) return "";
  return `${match[1].padStart(2, "0")}:${match[2]}`;
};

const parseHorarioFromAnalysis = (value) => {
  if (!value) return "";
  const normalized = toInputTime(value);
  if (normalized) return normalized;

  const brMatch = String(value).trim().match(/(\d{1,2})\s*h(?:\s*(\d{2}))?/i);
  if (!brMatch) return "";

  const hour = brMatch[1].padStart(2, "0");
  const minute = (brMatch[2] || "00").padStart(2, "0");
  return `${hour}:${minute}`;
};

export const parseMoneyFromAnalysis = (value) => {
  if (value === null || value === undefined || value === "") return "";
  if (typeof value === "number") return value;

  const clean = String(value).replace(/[^\d,.-]/g, "");
  if (!clean) return "";

  let normalized = clean;
  if (clean.includes(",") && clean.includes(".")) {
    normalized = clean.replace(/\./g, "").replace(",", ".");
  } else if (clean.includes(",")) {
    normalized = clean.replace(",", ".");
  }

  const amount = Number(normalized);
  return Number.isNaN(amount) ? "" : amount;
};

export const mapEditalToForm = (edital) => ({
  titulo: edital?.titulo || "",
  numero: edital?.numero || "",
  orgao: edital?.orgao || "",
  modalidade: edital?.modalidade || "",
  objeto: edital?.objeto || "",
  valor_estimado: edital?.valor_estimado ?? "",
  data_abertura: toInputDate(edital?.data_abertura),
  hora_abertura: toInputTime(edital?.hora_abertura),
  data_encerramento: toInputDate(edital?.data_encerramento),
  status: edital?.status || "rascunho",
  observacoes: edital?.observacoes || "",
});

export const mapAnalysisToForm = (edital, snapshot) => {
  const raw = snapshot?.raw || snapshot || {};
  const completa = raw.analise_completa || {};
  const resumoExecutivo = completa.resumo_executivo || {};
  const current = mapEditalToForm(edital);

  const objeto =
    raw.objeto || resumoExecutivo.objeto_contratacao || current.objeto || "";

  const valorIa = parseMoneyFromAnalysis(
    raw.valor_estimado || resumoExecutivo.valor_estimado,
  );

  return {
    titulo: (objeto ? String(objeto).slice(0, 255) : "") || current.titulo,
    numero: current.numero,
    orgao:
      raw.orgao_responsavel ||
      resumoExecutivo.orgao_contratante ||
      current.orgao,
    modalidade:
      raw.tipo_licitacao ||
      resumoExecutivo.modalidade_licitacao ||
      current.modalidade,
    objeto,
    valor_estimado: valorIa !== "" ? valorIa : current.valor_estimado,
    data_abertura: toInputDate(raw.data_licitacao) || current.data_abertura,
    hora_abertura:
      parseHorarioFromAnalysis(raw.horario_licitacao) || current.hora_abertura,
    data_encerramento: current.data_encerramento,
    status: current.status === "rascunho" ? "publicado" : current.status,
    observacoes: raw.resumo || current.observacoes,
  };
};

export const hasAnalysisFormData = (snapshot) => {
  const raw = snapshot?.raw || snapshot || {};
  return Boolean(
    raw.objeto ||
      raw.orgao_responsavel ||
      raw.tipo_licitacao ||
      raw.valor_estimado ||
      raw.data_licitacao ||
      raw.horario_licitacao ||
      raw.resumo ||
      raw.analise_completa,
  );
};
