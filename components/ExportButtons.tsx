"use client";

import { useState } from "react";
import { FileDown, FileSpreadsheet } from "lucide-react";
import { exportExcel, exportPdf, type ExportDocument } from "@/lib/export";
import { Button } from "@/components/ui";

/** Botões "PDF" e "Excel". `build` monta o conteúdo no clique, com os dados e filtros atuais. */
export default function ExportButtons({ build, disabled }: { build: () => ExportDocument; disabled?: boolean }) {
  const [busy, setBusy] = useState<"pdf" | "excel" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(kind: "pdf" | "excel") {
    setBusy(kind);
    setError(null);
    try {
      await (kind === "pdf" ? exportPdf : exportExcel)(build());
    } catch (err) {
      console.error(err);
      setError("Não foi possível gerar o arquivo.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-2">
        <Button variant="secondary" loading={busy === "pdf"} disabled={disabled || busy !== null} onClick={() => run("pdf")}>
          {busy !== "pdf" && <FileDown className="size-4" />} PDF
        </Button>
        <Button variant="secondary" loading={busy === "excel"} disabled={disabled || busy !== null} onClick={() => run("excel")}>
          {busy !== "excel" && <FileSpreadsheet className="size-4" />} Excel
        </Button>
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
