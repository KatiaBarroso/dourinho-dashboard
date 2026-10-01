// Exportação de tabelas para PDF e Excel, feita no navegador.
// As bibliotecas são carregadas só no clique, para não pesar no carregamento das páginas.

export type ExportColumn = { header: string; numeric?: boolean; width?: number };

export type ExportSection = {
  title: string;
  columns: ExportColumn[];
  rows: (string | number)[][];
};

export type ExportDocument = {
  title: string;
  /** Linha abaixo do título, ex.: filtros aplicados. */
  subtitle?: string;
  fileName: string;
  sections: ExportSection[];
};

const PRIMARY_RGB: [number, number, number] = [2, 83, 160]; // --color-primary

function download(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function generatedAt() {
  return `Gerado em ${new Date().toLocaleString("pt-BR")}`;
}

export async function exportPdf(doc: ExportDocument) {
  const [{ jsPDF }, { autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const margin = 40;

  pdf.setFontSize(16);
  pdf.text(doc.title, margin, 48);
  pdf.setFontSize(9);
  pdf.setTextColor(107, 114, 128);
  pdf.text([doc.subtitle, generatedAt()].filter(Boolean).join(" · "), margin, 64);
  pdf.setTextColor(31, 41, 55);

  let y = 84;
  for (const section of doc.sections) {
    pdf.setFontSize(12);
    pdf.text(section.title, margin, y + 12);
    autoTable(pdf, {
      startY: y + 20,
      margin: { left: margin, right: margin },
      head: [section.columns.map((c) => c.header)],
      body: section.rows.map((row) => row.map((cell) => (typeof cell === "number" ? cell.toLocaleString("pt-BR") : cell))),
      headStyles: { fillColor: PRIMARY_RGB },
      styles: { fontSize: 9 },
      columnStyles: Object.fromEntries(
        section.columns.flatMap((c, i) => (c.numeric ? [[i, { halign: "right" as const }]] : [])),
      ),
    });
    y = (pdf as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 24;
  }

  download(pdf.output("blob"), `${doc.fileName}.pdf`);
}

export async function exportExcel(doc: ExportDocument) {
  const { default: ExcelJS } = await import("exceljs");
  const workbook = new ExcelJS.Workbook();

  for (const section of doc.sections) {
    // Nome da aba: até 31 caracteres e sem os caracteres proibidos pelo Excel.
    const sheet = workbook.addWorksheet(section.title.replace(/[\\/?*[\]:]/g, " ").slice(0, 31));
    sheet.addRow([doc.title]).font = { bold: true, size: 14 };
    sheet.addRow([[doc.subtitle, generatedAt()].filter(Boolean).join(" · ")]).font = { italic: true, color: { argb: "FF6B7280" } };
    sheet.addRow([]);

    const header = sheet.addRow(section.columns.map((c) => c.header));
    header.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0253A0" } };
    });
    sheet.addRows(section.rows);

    section.columns.forEach((c, i) => {
      const column = sheet.getColumn(i + 1);
      column.width = c.width ?? (c.numeric ? 14 : 30);
      if (c.numeric) column.alignment = { horizontal: "right" };
    });
    sheet.views = [{ state: "frozen", ySplit: header.number }];
  }

  const buffer = await workbook.xlsx.writeBuffer();
  download(
    new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
    `${doc.fileName}.xlsx`,
  );
}

/** Data de hoje no formato AAAA-MM-DD, para compor nomes de arquivo. */
export function today() {
  return new Date().toLocaleDateString("sv-SE");
}

/** Converte AAAA-MM-DD (ou um timestamp ISO, no fuso local) em DD/MM/AAAA. */
export function formatDate(value: string) {
  if (value.length > 10) return new Date(value).toLocaleDateString("pt-BR");
  const [y, m, d] = value.split("-");
  return `${d}/${m}/${y}`;
}

/** Descreve o período filtrado, ex.: "Período: 01/09/2026 a 30/09/2026". */
export function periodLabel(from: string, to: string) {
  if (from && to) return `Período: ${formatDate(from)} a ${formatDate(to)}`;
  if (from) return `A partir de ${formatDate(from)}`;
  if (to) return `Até ${formatDate(to)}`;
  return "Todo o período";
}
